-- ==========================================================
-- TEFA DKV — FINANCIAL INTEGRITY PATCH (Migration 007)
-- ==========================================================

-- 1. ADD CONSTRAINTS TO SAFEGUARD AGAINST INVALID DATA
DO $$ 
BEGIN
  -- We assume existing data is clean, but if there's any invalid method, this will catch it
  -- or we could skip validating existing by NOT VALID but we want it valid.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_payment_method_check'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check 
    CHECK (payment_method IN ('Cash', 'QRIS', 'Transfer Bank'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_amount_check'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_amount_check 
    CHECK (amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'refunds_amount_check'
  ) THEN
    ALTER TABLE refunds ADD CONSTRAINT refunds_amount_check 
    CHECK (amount > 0);
  END IF;
END $$;


-- ==========================================================
-- RPC: record_payment
-- ==========================================================
CREATE OR REPLACE FUNCTION record_payment(
  p_order_id uuid,
  p_amount numeric,
  p_method text,
  p_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_operator text DEFAULT 'Admin'
)
RETURNS jsonb AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_total_paid numeric;
  v_total_refunded numeric;
  v_new_paid numeric;
  v_new_balance numeric;
  v_new_status text;
  v_payment_id uuid;
  v_cogs numeric;
  v_profit numeric;
BEGIN
  -- Strict validation of inputs before any database locking
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nominal pembayaran harus lebih besar dari 0');
  END IF;

  IF p_method NOT IN ('Cash', 'QRIS', 'Transfer Bank') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Metode pembayaran tidak valid');
  END IF;

  -- Lock the order row to prevent race conditions
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order tidak ditemukan');
  END IF;

  -- Calculate current totals from source of truth
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid FROM payments WHERE order_id = p_order_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_total_refunded FROM refunds WHERE order_id = p_order_id AND status = 'Completed';

  -- Check remaining balance
  IF (v_order.total_amount - v_total_paid) <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order sudah lunas, tidak ada sisa tagihan');
  END IF;

  -- Strictly reject overpayment
  IF p_amount > (v_order.total_amount - v_total_paid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nominal pembayaran melebihi sisa tagihan (' || (v_order.total_amount - v_total_paid) || ')');
  END IF;

  -- Insert payment
  v_payment_id := gen_random_uuid();
  INSERT INTO payments (id, order_id, amount, payment_method, reference, created_by, notes)
  VALUES (v_payment_id, p_order_id, p_amount, p_method, p_reference, auth.uid(), p_notes);

  -- Calculate new totals
  v_new_paid := v_total_paid + p_amount;
  v_new_balance := GREATEST(0, v_order.total_amount - v_new_paid);

  -- Determine payment status
  IF v_total_refunded > 0 AND v_total_refunded >= v_new_paid THEN
    v_new_status := 'REFUNDED';
  ELSIF v_total_refunded > 0 THEN
    v_new_status := 'PARTIALLY_REFUNDED';
  ELSIF v_new_paid >= v_order.total_amount THEN
    v_new_status := 'Lunas';
  ELSIF v_new_paid > 0 THEN
    v_new_status := 'DP';
  ELSE
    v_new_status := 'Belum Bayar';
  END IF;

  -- Update cached order fields
  UPDATE orders SET
    paid_amount = v_new_paid,
    balance_due = v_new_balance,
    payment_status = v_new_status
  WHERE id = p_order_id;

  -- Calculate COGS allocation for this payment
  v_cogs := CASE WHEN v_order.total_amount > 0
    THEN round(v_order.total_hpp * (p_amount / v_order.total_amount))
    ELSE 0 END;
  v_profit := p_amount - v_cogs;

  -- Create finance transaction
  INSERT INTO finance_transactions (
    trans_no, type, amount, cogs_amount, profit_amount,
    ref_order_no, payment_id, category, description, payment_method, operator
  ) VALUES (
    generate_trans_no('TRX'),
    'Pemasukan',
    p_amount, v_cogs, v_profit,
    v_order.order_no, v_payment_id,
    'Pelunasan / Angsuran',
    'Pembayaran Order No ' || v_order.order_no || ' (' || v_order.customer_name || ')',
    p_method, p_operator
  );

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'amount', p_amount,
    'new_paid', v_new_paid,
    'new_balance', v_new_balance,
    'payment_status', v_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================================
-- RPC: process_refund
-- ==========================================================
CREATE OR REPLACE FUNCTION process_refund(
  p_order_id uuid,
  p_amount numeric,
  p_reason text,
  p_payment_id uuid DEFAULT NULL,
  p_operator text DEFAULT 'Admin'
)
RETURNS jsonb AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_total_paid numeric;
  v_total_refunded numeric;
  v_refundable numeric;
  v_refund_id uuid;
  v_new_refunded numeric;
  v_new_status text;
  v_cogs numeric;
  v_profit numeric;
BEGIN
  -- Strict validation of inputs before locking
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Jumlah refund harus lebih besar dari 0');
  END IF;

  -- Lock order to prevent concurrent duplicate refunds
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order tidak ditemukan');
  END IF;

  -- Calculate from source of truth
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid FROM payments WHERE order_id = p_order_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_total_refunded FROM refunds WHERE order_id = p_order_id AND status = 'Completed';

  v_refundable := v_total_paid - v_total_refunded;

  -- Reject over refund securely
  IF p_amount > v_refundable THEN
    RETURN jsonb_build_object('success', false, 'error', 'Jumlah refund (' || p_amount || ') melebihi batas tersedia (' || v_refundable || ')');
  END IF;

  -- Insert refund
  v_refund_id := gen_random_uuid();
  INSERT INTO refunds (id, order_id, payment_id, amount, reason, created_by, status)
  VALUES (v_refund_id, p_order_id, p_payment_id, p_amount, p_reason, auth.uid(), 'Completed');

  -- Calculate new totals
  v_new_refunded := v_total_refunded + p_amount;

  IF v_new_refunded >= v_total_paid THEN
    v_new_status := 'REFUNDED';
  ELSE
    v_new_status := 'PARTIALLY_REFUNDED';
  END IF;

  -- Update cached order fields
  UPDATE orders SET
    refunded_amount = v_new_refunded,
    payment_status = v_new_status
  WHERE id = p_order_id;

  -- COGS allocation for refund
  v_cogs := CASE WHEN v_order.total_amount > 0
    THEN round(v_order.total_hpp * (p_amount / v_order.total_amount))
    ELSE 0 END;
  v_profit := p_amount - v_cogs;

  -- Finance transaction (Pengeluaran)
  INSERT INTO finance_transactions (
    trans_no, type, amount, cogs_amount, profit_amount,
    ref_order_no, refund_id, category, description, payment_method, operator
  ) VALUES (
    generate_trans_no('RFD'),
    'Pengeluaran',
    p_amount, v_cogs, v_profit,
    v_order.order_no, v_refund_id,
    'Lain-lain',
    'Refund (' || p_reason || ') Order No ' || v_order.order_no,
    v_order.payment_method, p_operator
  );

  RETURN jsonb_build_object(
    'success', true,
    'refund_id', v_refund_id,
    'amount', p_amount,
    'new_refunded', v_new_refunded,
    'payment_status', v_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

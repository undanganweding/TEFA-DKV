-- ==========================================================
-- TEFA DKV — DATABASE FUNCTIONS / RPC
-- ==========================================================
-- Execute in Supabase Dashboard > SQL Editor
-- ==========================================================

-- ==========================================================
-- FUNCTION: generate_order_no
-- ==========================================================
CREATE OR REPLACE FUNCTION generate_order_no(prefix text DEFAULT 'POS')
RETURNS text AS $$
DECLARE
  seq_val bigint;
  year_str text;
BEGIN
  seq_val := nextval('order_no_seq');
  year_str := to_char(now(), 'YYYY');
  RETURN prefix || '-' || year_str || '-' || lpad(seq_val::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ==========================================================
-- FUNCTION: generate_trans_no
-- ==========================================================
CREATE OR REPLACE FUNCTION generate_trans_no(prefix text DEFAULT 'TRX')
RETURNS text AS $$
DECLARE
  seq_val bigint;
  date_str text;
BEGIN
  seq_val := nextval('trans_no_seq');
  date_str := to_char(now(), 'YYYYMMDD');
  RETURN prefix || '-' || date_str || '-' || lpad(seq_val::text, 2, '0');
END;
$$ LANGUAGE plpgsql;

-- ==========================================================
-- RPC: create_order
-- Creates an order with items, snapshots prices, calculates totals
-- ==========================================================
CREATE OR REPLACE FUNCTION create_order(order_data jsonb)
RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
  v_order_no text;
  v_subtotal numeric := 0;
  v_total_hpp numeric := 0;
  v_discount numeric;
  v_total_amount numeric;
  v_paid_amount numeric;
  v_balance_due numeric;
  v_payment_status text;
  v_item jsonb;
  v_item_total numeric;
  v_item_hpp numeric;
BEGIN
  -- Generate order number
  v_order_no := generate_order_no(COALESCE(order_data->>'prefix', 'POS'));
  v_order_id := gen_random_uuid();
  v_discount := COALESCE((order_data->>'discount')::numeric, 0);
  v_paid_amount := COALESCE((order_data->>'paid_amount')::numeric, 0);

  -- Calculate totals from items
  FOR v_item IN SELECT * FROM jsonb_array_elements(order_data->'items')
  LOOP
    v_item_total := COALESCE((v_item->>'total_price')::numeric, 0);
    v_item_hpp := COALESCE((v_item->>'cost_price')::numeric, 0) * COALESCE((v_item->>'qty')::numeric, 1);
    v_subtotal := v_subtotal + v_item_total;
    v_total_hpp := v_total_hpp + v_item_hpp;
  END LOOP;

  v_total_amount := GREATEST(0, v_subtotal - v_discount);

  -- Cap paid amount
  IF v_paid_amount > v_total_amount THEN
    v_paid_amount := v_total_amount;
  END IF;

  v_balance_due := GREATEST(0, v_total_amount - v_paid_amount);

  -- Determine payment status
  IF v_paid_amount >= v_total_amount AND v_total_amount > 0 THEN
    v_payment_status := 'Lunas';
  ELSIF v_paid_amount > 0 THEN
    v_payment_status := 'DP';
  ELSE
    v_payment_status := 'Belum Bayar';
  END IF;

  -- Insert order
  INSERT INTO orders (
    id, order_no, created_by, customer_name, customer_phone, customer_email,
    institution, order_date, due_date, status, payment_status, payment_method,
    subtotal, discount, tax_amount, total_amount, total_hpp,
    paid_amount, balance_due, refunded_amount,
    operator_name, priority, notes, design_notes, finishing_notes
  ) VALUES (
    v_order_id, v_order_no,
    CASE WHEN order_data->>'created_by' IS NOT NULL THEN (order_data->>'created_by')::uuid ELSE auth.uid() END,
    order_data->>'customer_name',
    order_data->>'customer_phone',
    order_data->>'customer_email',
    order_data->>'institution',
    COALESCE((order_data->>'order_date')::date, CURRENT_DATE),
    order_data->>'due_date',
    COALESCE(order_data->>'status', 'Menunggu Admin'),
    v_payment_status,
    order_data->>'payment_method',
    v_subtotal, v_discount, 0, v_total_amount, v_total_hpp,
    v_paid_amount, v_balance_due, 0,
    order_data->>'operator_name',
    COALESCE(order_data->>'priority', 'Normal'),
    order_data->>'notes',
    order_data->>'design_notes',
    order_data->>'finishing_notes'
  );

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(order_data->'items')
  LOOP
    INSERT INTO order_items (
      order_id, product_id, product_name, unit_price, cost_price, qty, unit,
      length_meters, width_meters, calculated_area, total_price,
      notes, is_custom_order, custom_description, file_url, file_name
    ) VALUES (
      v_order_id,
      CASE WHEN v_item->>'product_id' IS NOT NULL AND v_item->>'product_id' != '' THEN (v_item->>'product_id')::uuid ELSE NULL END,
      v_item->>'product_name',
      COALESCE((v_item->>'unit_price')::numeric, 0),
      COALESCE((v_item->>'cost_price')::numeric, 0),
      COALESCE((v_item->>'qty')::numeric, 1),
      COALESCE(v_item->>'unit', 'pcs'),
      (v_item->>'length_meters')::numeric,
      (v_item->>'width_meters')::numeric,
      (v_item->>'calculated_area')::numeric,
      COALESCE((v_item->>'total_price')::numeric, 0),
      v_item->>'notes',
      COALESCE((v_item->>'is_custom_order')::boolean, false),
      v_item->>'custom_description',
      v_item->>'file_url',
      v_item->>'file_name'
    );
  END LOOP;

  -- Insert initial status history
  INSERT INTO order_status_history (order_id, status, updated_by, note)
  VALUES (v_order_id, COALESCE(order_data->>'status', 'Menunggu Admin'),
          COALESCE(order_data->>'operator_name', 'System'),
          'Order dibuat');

  -- Create payment record if paid
  IF v_paid_amount > 0 THEN
    INSERT INTO payments (order_id, amount, payment_method, created_by)
    VALUES (
      v_order_id,
      v_paid_amount,
      COALESCE(order_data->>'payment_method', 'Cash'),
      auth.uid()
    );

    -- Create finance transaction for the payment
    INSERT INTO finance_transactions (
      trans_no, type, amount, cogs_amount, profit_amount,
      ref_order_no, category, description, payment_method, operator
    ) VALUES (
      generate_trans_no('TRX'),
      'Pemasukan',
      v_paid_amount,
      CASE WHEN v_total_amount > 0 THEN round(v_total_hpp * (v_paid_amount::numeric / v_total_amount)) ELSE 0 END,
      v_paid_amount - CASE WHEN v_total_amount > 0 THEN round(v_total_hpp * (v_paid_amount::numeric / v_total_amount)) ELSE 0 END,
      v_order_no,
      'Penjualan Cetak',
      'Pembayaran ' || v_payment_status || ' Order No ' || v_order_no,
      COALESCE(order_data->>'payment_method', 'Cash'),
      order_data->>'operator_name'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_no', v_order_no,
    'total_amount', v_total_amount,
    'paid_amount', v_paid_amount,
    'payment_status', v_payment_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================
-- RPC: create_guest_order
-- Creates an order for unauthenticated guests
-- ==========================================================
CREATE OR REPLACE FUNCTION create_guest_order(order_data jsonb)
RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
  v_order_no text;
  v_guest_token uuid;
  v_subtotal numeric := 0;
  v_total_hpp numeric := 0;
  v_total_amount numeric;
  v_item jsonb;
  v_item_total numeric;
  v_item_hpp numeric;
BEGIN
  v_order_no := generate_order_no('GUEST');
  v_order_id := gen_random_uuid();
  v_guest_token := gen_random_uuid();

  -- Calculate totals
  FOR v_item IN SELECT * FROM jsonb_array_elements(order_data->'items')
  LOOP
    v_item_total := COALESCE((v_item->>'total_price')::numeric, 0);
    v_item_hpp := COALESCE((v_item->>'cost_price')::numeric, 0) * COALESCE((v_item->>'qty')::numeric, 1);
    v_subtotal := v_subtotal + v_item_total;
    v_total_hpp := v_total_hpp + v_item_hpp;
  END LOOP;

  v_total_amount := v_subtotal;

  -- Insert order (no created_by for guest)
  INSERT INTO orders (
    id, order_no, created_by, guest_access_token,
    customer_name, customer_phone, customer_email,
    status, payment_status, subtotal, total_amount, total_hpp,
    balance_due, operator_name, priority, notes
  ) VALUES (
    v_order_id, v_order_no, NULL, v_guest_token,
    order_data->>'customer_name',
    order_data->>'customer_phone',
    order_data->>'customer_email',
    'Menunggu Admin', 'Belum Bayar',
    v_subtotal, v_total_amount, v_total_hpp,
    v_total_amount, 'Guest Order', 'Normal',
    order_data->>'notes'
  );

  -- Insert items
  FOR v_item IN SELECT * FROM jsonb_array_elements(order_data->'items')
  LOOP
    INSERT INTO order_items (
      order_id, product_id, product_name, unit_price, cost_price, qty, unit,
      length_meters, width_meters, calculated_area, total_price,
      notes, is_custom_order, custom_description, file_url, file_name
    ) VALUES (
      v_order_id,
      CASE WHEN v_item->>'product_id' IS NOT NULL AND v_item->>'product_id' != '' THEN (v_item->>'product_id')::uuid ELSE NULL END,
      v_item->>'product_name',
      COALESCE((v_item->>'unit_price')::numeric, 0),
      COALESCE((v_item->>'cost_price')::numeric, 0),
      COALESCE((v_item->>'qty')::numeric, 1),
      COALESCE(v_item->>'unit', 'pcs'),
      (v_item->>'length_meters')::numeric,
      (v_item->>'width_meters')::numeric,
      (v_item->>'calculated_area')::numeric,
      COALESCE((v_item->>'total_price')::numeric, 0),
      v_item->>'notes',
      COALESCE((v_item->>'is_custom_order')::boolean, false),
      v_item->>'custom_description',
      v_item->>'file_url',
      v_item->>'file_name'
    );
  END LOOP;

  -- Status history
  INSERT INTO order_status_history (order_id, status, updated_by, note)
  VALUES (v_order_id, 'Menunggu Admin', 'Guest', 'Order guest dibuat');

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_no', v_order_no,
    'guest_access_token', v_guest_token,
    'total_amount', v_total_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  v_actual_amount numeric;
  v_new_paid numeric;
  v_new_balance numeric;
  v_new_status text;
  v_payment_id uuid;
  v_cogs numeric;
  v_profit numeric;
BEGIN
  -- Lock the order row
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order tidak ditemukan');
  END IF;

  -- Calculate current totals from source of truth
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid FROM payments WHERE order_id = p_order_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_total_refunded FROM refunds WHERE order_id = p_order_id AND status = 'Completed';

  -- Cap payment to remaining balance
  v_actual_amount := LEAST(p_amount, GREATEST(0, v_order.total_amount - v_total_paid));
  IF v_actual_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tidak ada sisa tagihan untuk dibayar');
  END IF;

  -- Insert payment
  v_payment_id := gen_random_uuid();
  INSERT INTO payments (id, order_id, amount, payment_method, reference, created_by, notes)
  VALUES (v_payment_id, p_order_id, v_actual_amount, p_method, p_reference, auth.uid(), p_notes);

  -- Calculate new totals
  v_new_paid := v_total_paid + v_actual_amount;
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
    THEN round(v_order.total_hpp * (v_actual_amount / v_order.total_amount))
    ELSE 0 END;
  v_profit := v_actual_amount - v_cogs;

  -- Create finance transaction
  INSERT INTO finance_transactions (
    trans_no, type, amount, cogs_amount, profit_amount,
    ref_order_no, payment_id, category, description, payment_method, operator
  ) VALUES (
    generate_trans_no('TRX'),
    'Pemasukan',
    v_actual_amount, v_cogs, v_profit,
    v_order.order_no, v_payment_id,
    'Pelunasan / Angsuran',
    'Pembayaran Order No ' || v_order.order_no || ' (' || v_order.customer_name || ')',
    p_method, p_operator
  );

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'amount', v_actual_amount,
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
  -- Lock order
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order tidak ditemukan');
  END IF;

  -- Calculate from source of truth
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid FROM payments WHERE order_id = p_order_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_total_refunded FROM refunds WHERE order_id = p_order_id AND status = 'Completed';

  v_refundable := v_total_paid - v_total_refunded;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Jumlah refund harus lebih besar dari 0');
  END IF;

  IF p_amount > v_refundable THEN
    RETURN jsonb_build_object('success', false, 'error', 'Jumlah refund melebihi batas tersedia (' || v_refundable || ')');
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

-- ==========================================================
-- RPC: process_order_to_production
-- Deducts stock via BOM/recipe when order moves to Diproses
-- ==========================================================
CREATE OR REPLACE FUNCTION process_order_to_production(
  p_order_id uuid,
  p_operator text DEFAULT 'Admin'
)
RETURNS jsonb AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_item RECORD;
  v_recipe RECORD;
  v_material materials%ROWTYPE;
  v_qty_to_deduct numeric;
  v_new_stock numeric;
  v_new_status text;
BEGIN
  -- Lock order
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order tidak ditemukan');
  END IF;

  -- Check if already deducted
  IF v_order.stock_deducted THEN
    RETURN jsonb_build_object('success', false, 'error', 'Stok sudah dideduct untuk order ini');
  END IF;

  -- Validate stock availability first
  FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id
  LOOP
    IF v_item.product_id IS NOT NULL THEN
      FOR v_recipe IN SELECT * FROM product_recipes WHERE product_id = v_item.product_id
      LOOP
        v_qty_to_deduct := v_recipe.qty_required * v_item.qty;
        SELECT * INTO v_material FROM materials WHERE id = v_recipe.material_id FOR UPDATE;
        IF FOUND AND v_material.current_stock < v_qty_to_deduct THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'Stok bahan "' || v_material.name || '" tidak cukup. Dibutuhkan: ' || v_qty_to_deduct || ' ' || v_material.unit || ', tersedia: ' || v_material.current_stock
          );
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- Deduct stock
  FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id
  LOOP
    IF v_item.product_id IS NOT NULL THEN
      FOR v_recipe IN SELECT * FROM product_recipes WHERE product_id = v_item.product_id
      LOOP
        v_qty_to_deduct := v_recipe.qty_required * v_item.qty;
        SELECT * INTO v_material FROM materials WHERE id = v_recipe.material_id FOR UPDATE;
        IF FOUND THEN
          v_new_stock := GREATEST(0, round((v_material.current_stock - v_qty_to_deduct)::numeric, 4));

          -- Determine new status
          IF v_new_stock <= v_material.min_stock * 0.5 THEN
            v_new_status := 'Kritis';
          ELSIF v_new_stock <= v_material.min_stock THEN
            v_new_status := 'Menipis';
          ELSE
            v_new_status := 'Aman';
          END IF;

          -- Update material
          UPDATE materials SET current_stock = v_new_stock, status = v_new_status WHERE id = v_material.id;

          -- Log stock movement
          INSERT INTO stock_movements (
            material_id, material_name, type, quantity,
            before_stock, after_stock, reference_type, reference_id,
            unit, unit_cost, total_value, notes, operator
          ) VALUES (
            v_material.id, v_material.name, 'Keluar', -v_qty_to_deduct,
            v_material.current_stock, v_new_stock, 'ORDER', v_order.order_no,
            v_material.unit, v_material.unit_price, round(v_qty_to_deduct * v_material.unit_price),
            'Pemakaian produksi Order No ' || v_order.order_no, p_operator
          );
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- Update order status
  UPDATE orders SET status = 'Diproses', stock_deducted = true WHERE id = p_order_id;

  -- Add status history
  INSERT INTO order_status_history (order_id, status, updated_by, note)
  VALUES (p_order_id, 'Diproses', p_operator, 'Status diperbarui menjadi Diproses - Stok dideduct');

  RETURN jsonb_build_object('success', true, 'message', 'Order berhasil diproses dan stok dideduct');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================
-- RPC: cancel_order
-- Cancels order and reverses stock if previously deducted
-- ==========================================================
CREATE OR REPLACE FUNCTION cancel_order(
  p_order_id uuid,
  p_operator text DEFAULT 'Admin'
)
RETURNS jsonb AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_item RECORD;
  v_recipe RECORD;
  v_material materials%ROWTYPE;
  v_qty_to_restore numeric;
  v_new_stock numeric;
  v_new_status text;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order tidak ditemukan');
  END IF;

  -- Validate transition
  IF v_order.status IN ('Diterima', 'Dibatalkan') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order tidak dapat dibatalkan dari status ' || v_order.status);
  END IF;

  -- Reverse stock if deducted
  IF v_order.stock_deducted THEN
    FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id
    LOOP
      IF v_item.product_id IS NOT NULL THEN
        FOR v_recipe IN SELECT * FROM product_recipes WHERE product_id = v_item.product_id
        LOOP
          v_qty_to_restore := v_recipe.qty_required * v_item.qty;
          SELECT * INTO v_material FROM materials WHERE id = v_recipe.material_id FOR UPDATE;
          IF FOUND THEN
            v_new_stock := round((v_material.current_stock + v_qty_to_restore)::numeric, 4);

            IF v_new_stock <= v_material.min_stock * 0.5 THEN
              v_new_status := 'Kritis';
            ELSIF v_new_stock <= v_material.min_stock THEN
              v_new_status := 'Menipis';
            ELSE
              v_new_status := 'Aman';
            END IF;

            UPDATE materials SET current_stock = v_new_stock, status = v_new_status WHERE id = v_material.id;

            INSERT INTO stock_movements (
              material_id, material_name, type, quantity,
              before_stock, after_stock, reference_type, reference_id,
              unit, unit_cost, total_value, notes, operator
            ) VALUES (
              v_material.id, v_material.name, 'REVERSAL', v_qty_to_restore,
              v_material.current_stock, v_new_stock, 'ORDER', v_order.order_no,
              v_material.unit, v_material.unit_price, round(v_qty_to_restore * v_material.unit_price),
              'REVERSAL pembatalan Order No ' || v_order.order_no, p_operator
            );
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- Update order
  UPDATE orders SET status = 'Dibatalkan', stock_deducted = false WHERE id = p_order_id;

  INSERT INTO order_status_history (order_id, status, updated_by, note)
  VALUES (p_order_id, 'Dibatalkan', p_operator, 'Order dibatalkan' || CASE WHEN v_order.stock_deducted THEN ' - Stok dikembalikan' ELSE '' END);

  RETURN jsonb_build_object('success', true, 'message', 'Order berhasil dibatalkan', 'stock_reversed', v_order.stock_deducted);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================
-- RPC: update_order_status
-- Generic status transition with validation
-- ==========================================================
CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_operator text DEFAULT 'Admin',
  p_note text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_valid boolean := false;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order tidak ditemukan');
  END IF;

  -- Validate state transition
  CASE v_order.status
    WHEN 'Draft' THEN v_valid := p_new_status IN ('Menunggu Admin');
    WHEN 'Menunggu Admin' THEN v_valid := p_new_status IN ('Diproses', 'Dibatalkan', 'Ditolak');
    WHEN 'Diproses' THEN v_valid := p_new_status IN ('Selesai', 'Dibatalkan');
    WHEN 'Selesai' THEN v_valid := p_new_status IN ('Diterima');
    WHEN 'Diterima' THEN v_valid := false;
    WHEN 'Dibatalkan' THEN v_valid := false;
    WHEN 'Ditolak' THEN v_valid := false;
    ELSE v_valid := false;
  END CASE;

  IF NOT v_valid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transisi status dari "' || v_order.status || '" ke "' || p_new_status || '" tidak diizinkan');
  END IF;

  -- For Diproses, use process_order_to_production instead
  IF p_new_status = 'Diproses' THEN
    RETURN process_order_to_production(p_order_id, p_operator);
  END IF;

  -- For Dibatalkan, use cancel_order instead
  IF p_new_status = 'Dibatalkan' OR p_new_status = 'Ditolak' THEN
    RETURN cancel_order(p_order_id, p_operator);
  END IF;

  -- Direct status update for others
  UPDATE orders SET status = p_new_status WHERE id = p_order_id;

  INSERT INTO order_status_history (order_id, status, updated_by, note)
  VALUES (p_order_id, p_new_status, p_operator, COALESCE(p_note, 'Status diperbarui menjadi ' || p_new_status));

  RETURN jsonb_build_object('success', true, 'message', 'Status berhasil diperbarui', 'new_status', p_new_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================
-- RPC: get_guest_order
-- Allows guests to query their order by access token
-- ==========================================================
CREATE OR REPLACE FUNCTION get_guest_order(p_token uuid)
RETURNS jsonb AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_items jsonb;
  v_history jsonb;
BEGIN
  SELECT * INTO v_order FROM orders WHERE guest_access_token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order tidak ditemukan');
  END IF;

  SELECT jsonb_agg(row_to_json(oi)) INTO v_items
  FROM order_items oi WHERE oi.order_id = v_order.id;

  SELECT jsonb_agg(row_to_json(sh) ORDER BY sh.timestamp) INTO v_history
  FROM order_status_history sh WHERE sh.order_id = v_order.id;

  RETURN jsonb_build_object(
    'success', true,
    'order', row_to_json(v_order),
    'items', COALESCE(v_items, '[]'::jsonb),
    'status_history', COALESCE(v_history, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

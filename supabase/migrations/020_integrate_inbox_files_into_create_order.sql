-- ==========================================================
-- MIGRATION 020: INTEGRATE INBOX_FILES CREATION INTO CREATE_ORDER RPC
-- ==========================================================
-- File: supabase/migrations/020_integrate_inbox_files_into_create_order.sql
-- Goal: Safely create inbox_files records inside SECURITY DEFINER create_order RPC
-- preventing 403 RLS Forbidden errors for Students uploading design files.
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
  v_created_by uuid;
  v_inbox_file jsonb;
BEGIN
  -- Handle Idempotency early
  IF (order_data->>'idempotency_key') IS NOT NULL AND order_data->>'idempotency_key' != '' THEN
    SELECT id, order_no, paid_amount, total_amount, payment_status
    INTO v_order_id, v_order_no, v_paid_amount, v_total_amount, v_payment_status
    FROM orders
    WHERE idempotency_key = order_data->>'idempotency_key';

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_no', v_order_no,
        'total_amount', v_total_amount,
        'paid_amount', v_paid_amount,
        'payment_status', v_payment_status,
        'message', 'Idempotent request returned existing order'
      );
    END IF;
  END IF;

  -- Generate order number
  v_order_no := generate_order_no(COALESCE(order_data->>'prefix', 'POS'));
  v_order_id := gen_random_uuid();
  v_discount := COALESCE((order_data->>'discount')::numeric, 0);
  v_paid_amount := COALESCE((order_data->>'paid_amount')::numeric, 0);
  
  -- Determine user ID (authenticated user or passed created_by)
  IF order_data->>'created_by' IS NOT NULL AND order_data->>'created_by' != '' THEN
    v_created_by := (order_data->>'created_by')::uuid;
  ELSE
    v_created_by := auth.uid();
  END IF;

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
    operator_name, priority, notes, design_notes, finishing_notes, idempotency_key
  ) VALUES (
    v_order_id, v_order_no,
    v_created_by,
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
    order_data->>'finishing_notes',
    order_data->>'idempotency_key'
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
      v_created_by
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

  -- Insert inbox_files if inbox_file data is provided in payload
  IF order_data->'inbox_file' IS NOT NULL AND order_data->'inbox_file' != 'null'::jsonb THEN
    v_inbox_file := order_data->'inbox_file';
    INSERT INTO inbox_files (
      upload_date, customer_name, class_grade, major, phone,
      service_type, print_size, qty, notes, file_name,
      file_type, file_size, preview_url, storage_path, folder_path,
      status, linked_order_no
    ) VALUES (
      COALESCE(v_inbox_file->>'upload_date', to_char(now(), 'DD Mon YYYY HH24:MI')),
      COALESCE(v_inbox_file->>'customer_name', order_data->>'customer_name'),
      v_inbox_file->>'class_grade',
      v_inbox_file->>'major',
      COALESCE(v_inbox_file->>'phone', order_data->>'customer_phone'),
      v_inbox_file->>'service_type',
      v_inbox_file->>'print_size',
      COALESCE((v_inbox_file->>'qty')::integer, 1),
      v_inbox_file->>'notes',
      v_inbox_file->>'file_name',
      v_inbox_file->>'file_type',
      v_inbox_file->>'file_size',
      v_inbox_file->>'preview_url',
      v_inbox_file->>'storage_path',
      COALESCE(v_inbox_file->>'folder_path', '/TEFA_FILES/STUDENTS/' || v_order_no),
      'Menunggu Pemeriksaan',
      v_order_no
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

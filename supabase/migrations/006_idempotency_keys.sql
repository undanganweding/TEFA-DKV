-- Migration: 006_idempotency_keys.sql

-- Tambahkan kolom idempotency_key pada tabel orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;

-- Perbarui RPC create_guest_order
CREATE OR REPLACE FUNCTION public.create_guest_order(order_data jsonb)
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
  -- Handle Idempotency early
  IF (order_data->>'idempotency_key') IS NOT NULL THEN
    SELECT id, order_no, guest_access_token, total_amount
    INTO v_order_id, v_order_no, v_guest_token, v_total_amount
    FROM orders
    WHERE idempotency_key = order_data->>'idempotency_key';

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_no', v_order_no,
        'guest_access_token', v_guest_token,
        'total_amount', v_total_amount,
        'message', 'Idempotent request returned existing order'
      );
    END IF;
  END IF;

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

  -- Insert order
  INSERT INTO orders (
    id, order_no, created_by, guest_access_token,
    customer_name, customer_phone, customer_email,
    status, payment_status, subtotal, total_amount, total_hpp,
    balance_due, operator_name, priority, notes, idempotency_key
  ) VALUES (
    v_order_id, v_order_no, NULL, v_guest_token,
    order_data->>'customer_name',
    order_data->>'customer_phone',
    order_data->>'customer_email',
    'Menunggu Admin', 'Belum Bayar',
    v_subtotal, v_total_amount, v_total_hpp,
    v_total_amount, 'Guest Order', 'Normal',
    order_data->>'notes',
    order_data->>'idempotency_key'
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

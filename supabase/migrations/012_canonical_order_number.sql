-- Migration: 012_canonical_order_number.sql

-- ==========================================================
-- 1. ENFORCE CANONICAL GENERATOR FOR GUEST ORDERS
-- ==========================================================
-- Ensure that the generator ALWAYS uses 'TEFA' explicitly for canonical order numbers.
-- This effectively replaces any old migration that hardcoded 'GUEST'.
CREATE OR REPLACE FUNCTION generate_order_no(prefix text DEFAULT 'TEFA')
RETURNS text AS $$
DECLARE
  seq_val bigint;
  date_str text;
BEGIN
  seq_val := nextval('order_no_seq');
  date_str := to_char(now(), 'YYYYMMDD');
  
  -- Force 'TEFA' as the prefix for all generated canonical order numbers
  -- if somehow an old system passes 'GUEST' or 'POS'.
  IF prefix = 'GUEST' OR prefix = 'POS' THEN
    prefix := 'TEFA';
  END IF;

  RETURN prefix || '-' || date_str || '-' || lpad(seq_val::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Make sure create_guest_order explicitly relies on the canonical TEFA string.
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

  -- ENFORCE CANONICAL PREFIX
  v_order_no := generate_order_no('TEFA');
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
    CASE WHEN v_total_amount = 0 THEN 'Menunggu Konfirmasi' ELSE 'Menunggu Admin' END, 
    'Belum Bayar',
    v_subtotal, v_total_amount, v_total_hpp,
    v_total_amount, 'Guest Order', 'Normal',
    order_data->>'notes',
    order_data->>'idempotency_key'
  );

  -- Insert items
  FOR v_item IN SELECT * FROM jsonb_array_elements(order_data->'items')
  LOOP
    INSERT INTO order_items (
      order_id, product_id, product_name, variant_id, variant_name, unit_price, cost_price, qty, unit,
      length_meters, width_meters, calculated_area, total_price,
      notes, is_custom_order, custom_description, file_url, file_name
    ) VALUES (
      v_order_id,
      CASE WHEN v_item->>'product_id' IS NOT NULL AND v_item->>'product_id' != '' THEN (v_item->>'product_id')::uuid ELSE NULL END,
      v_item->>'product_name',
      CASE WHEN v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' != '' THEN (v_item->>'variant_id')::uuid ELSE NULL END,
      v_item->>'variant_name',
      COALESCE((v_item->>'unit_price')::numeric, 0),
      COALESCE((v_item->>'cost_price')::numeric, 0),
      COALESCE((v_item->>'qty')::numeric, 1),
      v_item->>'unit',
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
  VALUES (v_order_id, COALESCE(order_data->>'status', 'Menunggu Admin'), COALESCE(order_data->>'operator_name', 'System'), 'Pesanan dibuat');

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
-- 2. MIGRATE EXISTING GUEST ORDERS SAFELY
-- ==========================================================
-- Find all old orders matching 'GUEST-%' and safely convert them to 'TEFA-%'
-- while retaining the identical numeric identifier at the end, mapping it 
-- effectively without breaking UUID relations.
-- E.g. GUEST-2026-1051 -> TEFA-20260813-001051
DO $$
DECLARE
  rec RECORD;
  new_order_no text;
  old_date_part text;
  old_seq_part text;
BEGIN
  FOR rec IN
    SELECT id, order_no, created_at
    FROM orders
    WHERE order_no LIKE 'GUEST-%'
  LOOP
    -- Extract the sequence part from something like GUEST-2026-1051 -> 1051
    old_seq_part := split_part(rec.order_no, '-', 3);
    
    -- If it didn't have 3 parts, fallback to a raw sequence.
    IF old_seq_part = '' OR old_seq_part IS NULL THEN
      old_seq_part := lpad((floor(random() * 900000) + 100000)::text, 6, '0');
    ELSE
      old_seq_part := lpad(old_seq_part, 6, '0');
    END IF;

    -- Use the created_at date for the YYYYMMDD string to maintain history accuracy
    old_date_part := to_char(rec.created_at, 'YYYYMMDD');

    -- Assemble the new canonical format
    new_order_no := 'TEFA-' || old_date_part || '-' || old_seq_part;

    -- Only update if it doesn't collide
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_no = new_order_no) THEN
      UPDATE orders SET order_no = new_order_no WHERE id = rec.id;
    ELSE
      -- Fallback if exact collision exists (highly unlikely since sequence was sequential)
      new_order_no := 'TEFA-' || old_date_part || '-' || lpad((floor(random() * 900000) + 100000)::text, 6, '0');
      UPDATE orders SET order_no = new_order_no WHERE id = rec.id;
    END IF;
  END LOOP;
END;
$$;

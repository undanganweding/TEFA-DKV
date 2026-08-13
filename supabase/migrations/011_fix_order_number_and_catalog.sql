-- Migration: 011_fix_order_number_and_catalog.sql

-- ==========================================================
-- 1. UPDATE ORDER ID GENERATION
-- ==========================================================
-- The Order ID must follow canonical format: TEFA-YYYYMMDD-XXXXXX
CREATE OR REPLACE FUNCTION generate_order_no(prefix text DEFAULT 'TEFA')
RETURNS text AS $$
DECLARE
  seq_val bigint;
  date_str text;
BEGIN
  seq_val := nextval('order_no_seq');
  date_str := to_char(now(), 'YYYYMMDD');
  RETURN prefix || '-' || date_str || '-' || lpad(seq_val::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Update create_guest_order to pass 'TEFA' explicitly
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
  VALUES (v_order_id, CASE WHEN v_total_amount = 0 THEN 'Menunggu Konfirmasi' ELSE 'Menunggu Admin' END, 'System (Guest)', 'Pesanan baru dibuat oleh Guest');

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_no', v_order_no,
    'guest_access_token', v_guest_token,
    'total_amount', v_total_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Update create_order to pass 'TEFA' explicitly
CREATE OR REPLACE FUNCTION public.create_order(order_data jsonb)
RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
  v_order_no text;
  v_subtotal numeric := 0;
  v_total_hpp numeric := 0;
  v_total_amount numeric;
  v_item jsonb;
  v_item_total numeric;
  v_item_hpp numeric;
BEGIN
  v_order_no := generate_order_no('TEFA');
  v_order_id := gen_random_uuid();

  -- Calculate totals
  FOR v_item IN SELECT * FROM jsonb_array_elements(order_data->'items')
  LOOP
    v_item_total := COALESCE((v_item->>'total_price')::numeric, 0);
    v_item_hpp := COALESCE((v_item->>'cost_price')::numeric, 0) * COALESCE((v_item->>'qty')::numeric, 1);
    v_subtotal := v_subtotal + v_item_total;
    v_total_hpp := v_total_hpp + v_item_hpp;
  END LOOP;

  v_total_amount := v_subtotal - COALESCE((order_data->>'discount')::numeric, 0);

  -- Insert order
  INSERT INTO orders (
    id, order_no, created_by,
    customer_name, customer_phone,
    status, payment_status, payment_method,
    subtotal, discount, total_amount, total_hpp,
    paid_amount, balance_due, operator_name, priority, notes
  ) VALUES (
    v_order_id, v_order_no, (order_data->>'created_by')::uuid,
    order_data->>'customer_name', order_data->>'customer_phone',
    COALESCE(order_data->>'status', 'Menunggu Admin'),
    CASE WHEN COALESCE((order_data->>'paid_amount')::numeric, 0) >= v_total_amount THEN 'Lunas'
         WHEN COALESCE((order_data->>'paid_amount')::numeric, 0) > 0 THEN 'DP'
         ELSE 'Belum Bayar' END,
    order_data->>'payment_method',
    v_subtotal, COALESCE((order_data->>'discount')::numeric, 0), v_total_amount, v_total_hpp,
    COALESCE((order_data->>'paid_amount')::numeric, 0),
    v_total_amount - COALESCE((order_data->>'paid_amount')::numeric, 0),
    order_data->>'operator_name',
    COALESCE(order_data->>'priority', 'Normal'),
    order_data->>'notes'
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
  VALUES (v_order_id, COALESCE(order_data->>'status', 'Menunggu Admin'), COALESCE(order_data->>'operator_name', 'System'), 'Pesanan dibuat');

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_no', v_order_no
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================================
-- 2. SEED CATALOG (CETAK DOKUMEN & FOTO)
-- ==========================================================

-- A. Cetak Dokumen
DO $$
DECLARE
  v_prod_hvs_a4 uuid := gen_random_uuid();
  v_prod_hvs_a3 uuid := gen_random_uuid();
  v_prod_gls_a4 uuid := gen_random_uuid();
  v_prod_gls_a3 uuid := gen_random_uuid();
  v_prod_art_a4 uuid := gen_random_uuid();
  v_prod_art_a3 uuid := gen_random_uuid();
  
  v_prod_foto_2r uuid := gen_random_uuid();
  v_prod_foto_3r uuid := gen_random_uuid();
  v_prod_foto_4r uuid := gen_random_uuid();
  v_prod_foto_5r uuid := gen_random_uuid();
  v_prod_foto_8r uuid := gen_random_uuid();
  v_prod_foto_10r uuid := gen_random_uuid();
  v_prod_foto_a4 uuid := gen_random_uuid();
BEGIN
  -- Insert Document Products
  INSERT INTO products (id, code, name, category, unit, base_price, cost_price, min_qty, description, is_custom_dimension, status, show_in_customer_platform) VALUES
    (v_prod_hvs_a4, 'CD-HVS-A4', 'Cetak Dokumen HVS A4', 'Cetak Indoor / A3+', 'lembar', 500, 150, 1, 'Cetak Dokumen HVS A4', false, 'Aktif', true),
    (v_prod_hvs_a3, 'CD-HVS-A3', 'Cetak Dokumen HVS A3', 'Cetak Indoor / A3+', 'lembar', 1000, 300, 1, 'Cetak Dokumen HVS A3', false, 'Aktif', true),
    (v_prod_gls_a4, 'CD-GLOSSY-A4', 'Cetak Dokumen Glossy A4', 'Cetak Indoor / A3+', 'lembar', 3000, 1000, 1, 'Cetak Dokumen Kertas Mengkilap A4', false, 'Aktif', true),
    (v_prod_gls_a3, 'CD-GLOSSY-A3', 'Cetak Dokumen Glossy A3', 'Cetak Indoor / A3+', 'lembar', 6000, 2000, 1, 'Cetak Dokumen Kertas Mengkilap A3', false, 'Aktif', true),
    (v_prod_art_a4, 'CD-ART-A4', 'Cetak Dokumen Art Paper A4', 'Cetak Indoor / A3+', 'lembar', 2500, 800, 1, 'Cetak Dokumen Kertas Art Paper A4', false, 'Aktif', true),
    (v_prod_art_a3, 'CD-ART-A3', 'Cetak Dokumen Art Paper A3', 'Cetak Indoor / A3+', 'lembar', 5000, 1500, 1, 'Cetak Dokumen Kertas Art Paper A3', false, 'Aktif', true);

  -- Insert Document Variants
  INSERT INTO product_variants (product_id, name, code, unit, base_price, is_active) VALUES
    (v_prod_hvs_a4, 'Hitam Putih (B/W)', 'CD-HVS-A4-BW', 'lembar', 500, true),
    (v_prod_hvs_a4, 'Warna (Color)', 'CD-HVS-A4-COL', 'lembar', 1000, true),
    (v_prod_hvs_a3, 'Hitam Putih (B/W)', 'CD-HVS-A3-BW', 'lembar', 1000, true),
    (v_prod_hvs_a3, 'Warna (Color)', 'CD-HVS-A3-COL', 'lembar', 2000, true),
    (v_prod_gls_a4, 'Standar Warna', 'CD-GLS-A4-STD', 'lembar', 3000, true),
    (v_prod_gls_a3, 'Standar Warna', 'CD-GLS-A3-STD', 'lembar', 6000, true),
    (v_prod_art_a4, 'Standar Warna', 'CD-ART-A4-STD', 'lembar', 2500, true),
    (v_prod_art_a3, 'Standar Warna', 'CD-ART-A3-STD', 'lembar', 5000, true);

  -- Insert Photo Products
  INSERT INTO products (id, code, name, category, unit, base_price, cost_price, min_qty, description, is_custom_dimension, status, show_in_customer_platform) VALUES
    (v_prod_foto_2r, 'PHOTO-2R', 'Cetak Foto 2R (6x9 cm)', 'Cetak Indoor / A3+', 'lembar', 1500, 500, 1, 'Cetak Foto Kualitas Studio', false, 'Aktif', true),
    (v_prod_foto_3r, 'PHOTO-3R', 'Cetak Foto 3R (9x13 cm)', 'Cetak Indoor / A3+', 'lembar', 2000, 700, 1, 'Cetak Foto Kualitas Studio', false, 'Aktif', true),
    (v_prod_foto_4r, 'PHOTO-4R', 'Cetak Foto 4R (10x15 cm)', 'Cetak Indoor / A3+', 'lembar', 2500, 800, 1, 'Cetak Foto Kualitas Studio', false, 'Aktif', true),
    (v_prod_foto_5r, 'PHOTO-5R', 'Cetak Foto 5R (13x18 cm)', 'Cetak Indoor / A3+', 'lembar', 4000, 1500, 1, 'Cetak Foto Kualitas Studio', false, 'Aktif', true),
    (v_prod_foto_8r, 'PHOTO-8R', 'Cetak Foto 8R (20x25 cm)', 'Cetak Indoor / A3+', 'lembar', 10000, 3500, 1, 'Cetak Foto Kualitas Studio', false, 'Aktif', true),
    (v_prod_foto_10r, 'PHOTO-10R', 'Cetak Foto 10R (25x30 cm)', 'Cetak Indoor / A3+', 'lembar', 15000, 5000, 1, 'Cetak Foto Kualitas Studio', false, 'Aktif', true),
    (v_prod_foto_a4, 'PHOTO-A4', 'Cetak Foto A4 (21x29.7 cm)', 'Cetak Indoor / A3+', 'lembar', 12000, 4000, 1, 'Cetak Foto Kualitas Studio', false, 'Aktif', true);

  -- Insert Photo Variants (Glossy and Matte for each)
  INSERT INTO product_variants (product_id, name, code, unit, base_price, is_active) VALUES
    (v_prod_foto_2r, 'Glossy Photo Paper', 'PHOTO-2R-GLS', 'lembar', 1500, true),
    (v_prod_foto_2r, 'Matte / Doff', 'PHOTO-2R-MAT', 'lembar', 1800, true),
    
    (v_prod_foto_3r, 'Glossy Photo Paper', 'PHOTO-3R-GLS', 'lembar', 2000, true),
    (v_prod_foto_3r, 'Matte / Doff', 'PHOTO-3R-MAT', 'lembar', 2300, true),
    
    (v_prod_foto_4r, 'Glossy Photo Paper', 'PHOTO-4R-GLS', 'lembar', 2500, true),
    (v_prod_foto_4r, 'Matte / Doff', 'PHOTO-4R-MAT', 'lembar', 3000, true),
    
    (v_prod_foto_5r, 'Glossy Photo Paper', 'PHOTO-5R-GLS', 'lembar', 4000, true),
    (v_prod_foto_5r, 'Matte / Doff', 'PHOTO-5R-MAT', 'lembar', 4500, true),
    
    (v_prod_foto_8r, 'Glossy Photo Paper', 'PHOTO-8R-GLS', 'lembar', 10000, true),
    (v_prod_foto_8r, 'Matte / Doff', 'PHOTO-8R-MAT', 'lembar', 11000, true),

    (v_prod_foto_10r, 'Glossy Photo Paper', 'PHOTO-10R-GLS', 'lembar', 15000, true),
    (v_prod_foto_10r, 'Matte / Doff', 'PHOTO-10R-MAT', 'lembar', 16000, true),
    
    (v_prod_foto_a4, 'Glossy Photo Paper', 'PHOTO-A4-GLS', 'lembar', 12000, true),
    (v_prod_foto_a4, 'Matte / Doff', 'PHOTO-A4-MAT', 'lembar', 13000, true);

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error seeding products: %', SQLERRM;
END $$;

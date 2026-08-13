-- Migration: 009_product_variants_and_rejects.sql

-- 1. Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NULL,
  unit text NOT NULL DEFAULT 'pcs',
  base_price numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

CREATE TRIGGER tr_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS for product_variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon can read active variants" ON product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can do all on variants" ON product_variants FOR ALL USING (is_admin());

-- 2. Alter order_items and orders
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name text NULL;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejected_at timestamptz NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejection_reason text NULL;

-- 3. Update orders status check constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN ('Draft', 'Menunggu Konfirmasi', 'Menunggu Admin', 'Dikonfirmasi', 'Menunggu Pembayaran / DP', 'Diproses', 'Produksi', 'Siap Diambil / Dikirim', 'Selesai', 'Diterima', 'Ditolak', 'Dibatalkan')
);

-- 4. Seed default variants for existing products (to prevent breaking legacy data)
INSERT INTO product_variants (product_id, name, code, unit, base_price, is_active)
SELECT id, 'Standar', code || '-STD', unit, base_price, true
FROM products
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants WHERE product_variants.product_id = products.id
);

-- 5. Update create_guest_order RPC
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

  -- Insert order (Status will be 'Menunggu Konfirmasi' if total is 0, else 'Menunggu Admin')
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

-- 6. Update track_guest_order RPC
CREATE OR REPLACE FUNCTION public.track_guest_order(
  p_order_no text,
  p_phone text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_order record;
  v_items jsonb;
  v_history jsonb;
BEGIN
  -- Find order by order_no (and optionally phone for extra verification)
  SELECT * INTO v_order
  FROM orders
  WHERE order_no = p_order_no
  AND (p_phone IS NULL OR customer_phone = p_phone)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order not found'
    );
  END IF;

  -- Get order items
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', oi.id,
    'product_name', oi.product_name,
    'variant_name', oi.variant_name,
    'qty', oi.qty,
    'unit', oi.unit,
    'unit_price', oi.unit_price,
    'total_price', oi.total_price,
    'notes', oi.notes
  )), '[]'::jsonb)
  INTO v_items
  FROM order_items oi
  WHERE oi.order_id = v_order.id;

  -- Get status history
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'status', sh.status,
    'timestamp', sh.timestamp,
    'updated_by', sh.updated_by,
    'note', sh.note
  ) ORDER BY sh.timestamp ASC), '[]'::jsonb)
  INTO v_history
  FROM order_status_history sh
  WHERE sh.order_id = v_order.id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'order_no', v_order.order_no,
    'customer_name', v_order.customer_name,
    'customer_phone', v_order.customer_phone,
    'status', v_order.status,
    'payment_status', v_order.payment_status,
    'total_amount', v_order.total_amount,
    'paid_amount', v_order.paid_amount,
    'balance_due', v_order.balance_due,
    'order_date', v_order.order_date,
    'rejection_reason', v_order.rejection_reason,
    'items', v_items,
    'status_history', v_history
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================
-- TEFA DKV — SUPABASE MIGRATION: INITIAL SCHEMA
-- ==========================================================
-- Execute this SQL in Supabase Dashboard > SQL Editor
-- This creates all tables, indexes, constraints, and triggers
-- ==========================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- HELPER: Auto-update updated_at timestamp trigger
-- ==========================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================================
-- TABLE: profiles
-- ==========================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('Admin', 'Student')),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Rejected')),
  school_class text NULL,
  phone text NULL,
  address text NULL,
  avatar_path text NULL,
  nis text NULL,
  major text NULL,
  whatsapp text NULL,
  position text NULL,
  nip text NULL,
  employee_id text NULL,
  reject_reason text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- TABLE: products
-- ==========================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  base_price numeric NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL DEFAULT 0,
  image text NULL,
  description text NULL,
  visibility boolean DEFAULT true,
  is_archived boolean DEFAULT false,
  is_custom_dimension boolean DEFAULT false,
  min_qty integer NOT NULL DEFAULT 1,
  stock integer NULL,
  show_in_customer_platform boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_visibility ON products(visibility);
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON products(is_archived);

CREATE TRIGGER tr_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- TABLE: materials
-- ==========================================================
CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  current_stock numeric NOT NULL DEFAULT 0,
  min_stock numeric NOT NULL DEFAULT 0,
  unit text NOT NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL DEFAULT 0,
  selling_ref_price numeric NULL,
  supplier text NULL,
  location text NULL,
  status text NOT NULL DEFAULT 'Aman' CHECK (status IN ('Aman', 'Menipis', 'Kritis')),
  last_restocked text NULL,
  image text NULL,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(code);
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
CREATE INDEX IF NOT EXISTS idx_materials_is_archived ON materials(is_archived);

CREATE TRIGGER tr_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- TABLE: product_recipes (BOM)
-- ==========================================================
CREATE TABLE IF NOT EXISTS product_recipes (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  qty_required numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (product_id, material_id)
);

CREATE TRIGGER tr_product_recipes_updated_at
  BEFORE UPDATE ON product_recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- TABLE: inventory_assets
-- ==========================================================
CREATE TABLE IF NOT EXISTS inventory_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  brand text NULL,
  model text NULL,
  serial_number text NULL,
  specifications text NULL,
  condition text NOT NULL DEFAULT 'Baik',
  location text NULL,
  status text NOT NULL DEFAULT 'Tersedia',
  purchase_date text NULL,
  purchase_price numeric NULL,
  last_maintenance text NULL,
  pic_name text NULL,
  image_path text NULL,
  notes text NULL,
  created_by uuid NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_archived boolean DEFAULT false
);

CREATE TRIGGER tr_inventory_assets_updated_at
  BEFORE UPDATE ON inventory_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- TABLE: orders
-- ==========================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no text UNIQUE NOT NULL,
  created_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  guest_access_token uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NULL,
  customer_email text NULL,
  institution text NULL,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date text NULL,
  status text NOT NULL CHECK (status IN ('Draft', 'Menunggu Admin', 'Diproses', 'Selesai', 'Diterima', 'Ditolak', 'Dibatalkan')),
  payment_status text NOT NULL CHECK (payment_status IN ('Belum Bayar', 'DP', 'Lunas', 'PARTIALLY_REFUNDED', 'REFUNDED')),
  payment_method text NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  total_hpp numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  balance_due numeric NOT NULL DEFAULT 0,
  refunded_amount numeric NOT NULL DEFAULT 0,
  stock_deducted boolean DEFAULT false,
  operator_name text NULL,
  priority text NOT NULL DEFAULT 'Normal',
  notes text NULL,
  design_notes text NULL,
  finishing_notes text NULL,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_guest_access_token ON orders(guest_access_token);

CREATE TRIGGER tr_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- TABLE: order_items
-- ==========================================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NULL REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price numeric NOT NULL,
  cost_price numeric NOT NULL DEFAULT 0,
  qty numeric NOT NULL,
  unit text NOT NULL DEFAULT 'pcs',
  length_meters numeric NULL,
  width_meters numeric NULL,
  calculated_area numeric NULL,
  total_price numeric NOT NULL,
  notes text NULL,
  is_custom_order boolean DEFAULT false,
  custom_description text NULL,
  file_url text NULL,
  file_name text NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ==========================================================
-- TABLE: order_status_history
-- ==========================================================
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  updated_by text NOT NULL,
  note text NULL
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

-- ==========================================================
-- TABLE: payments
-- ==========================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('Cash', 'QRIS', 'Transfer Bank')),
  payment_date timestamptz DEFAULT now(),
  reference text NULL,
  created_by uuid NULL REFERENCES profiles(id),
  notes text NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- ==========================================================
-- TABLE: refunds
-- ==========================================================
CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_id uuid NULL REFERENCES payments(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  reason text NOT NULL,
  refund_date timestamptz DEFAULT now(),
  created_by uuid NULL REFERENCES profiles(id),
  reference text NULL,
  status text NOT NULL DEFAULT 'Completed' CHECK (status IN ('Pending', 'Completed', 'Rejected'))
);

CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_refund_date ON refunds(refund_date);

-- ==========================================================
-- TABLE: finance_transactions
-- ==========================================================
CREATE TABLE IF NOT EXISTS finance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trans_no text UNIQUE NOT NULL,
  date timestamptz DEFAULT now(),
  type text NOT NULL CHECK (type IN ('Pemasukan', 'Pengeluaran')),
  amount numeric NOT NULL,
  cogs_amount numeric NOT NULL DEFAULT 0,
  profit_amount numeric NOT NULL DEFAULT 0,
  ref_order_no text NULL,
  payment_id uuid NULL REFERENCES payments(id) ON DELETE SET NULL,
  refund_id uuid NULL REFERENCES refunds(id) ON DELETE SET NULL,
  category text NOT NULL,
  description text NULL,
  payment_method text NULL,
  operator text NULL,
  status text NOT NULL DEFAULT 'Berhasil',
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions(date);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_ref_order_no ON finance_transactions(ref_order_no);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_payment_id ON finance_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_refund_id ON finance_transactions(refund_id);

-- ==========================================================
-- TABLE: stock_movements
-- ==========================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  material_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('Masuk', 'Keluar', 'Penyesuaian', 'REVERSAL')),
  quantity numeric NOT NULL,
  before_stock numeric NOT NULL,
  after_stock numeric NOT NULL,
  reference_type text NULL,
  reference_id text NULL,
  unit text NOT NULL,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_value numeric NOT NULL DEFAULT 0,
  supplier text NULL,
  notes text NULL,
  created_by uuid NULL REFERENCES profiles(id),
  operator text NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_material_id ON stock_movements(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference_id ON stock_movements(reference_id);

-- ==========================================================
-- TABLE: annual_procurements
-- ==========================================================
CREATE TABLE IF NOT EXISTS annual_procurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year text NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  target_item text NOT NULL,
  qty numeric NOT NULL DEFAULT 1,
  estimated_unit_price numeric NOT NULL,
  budget numeric NOT NULL,
  actual_cost numeric NULL,
  status text NOT NULL CHECK (status IN ('Diusulkan', 'Dalam Review', 'Disetujui', 'Direalisasikan')),
  priority text NOT NULL,
  justification text NULL,
  requested_by text NULL,
  created_by uuid NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_archived boolean DEFAULT false
);

CREATE TRIGGER tr_annual_procurements_updated_at
  BEFORE UPDATE ON annual_procurements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- TABLE: inbox_files
-- ==========================================================
CREATE TABLE IF NOT EXISTS inbox_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_date text NOT NULL DEFAULT to_char(now(), 'DD Mon YYYY HH24:MI'),
  customer_name text NOT NULL,
  class_grade text NOT NULL,
  major text NULL,
  phone text NOT NULL,
  service_type text NOT NULL,
  print_size text NULL,
  qty integer NOT NULL DEFAULT 1,
  notes text NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size text NOT NULL,
  preview_url text NULL,
  storage_path text NULL,
  folder_path text NOT NULL,
  status text NOT NULL DEFAULT 'Menunggu Pemeriksaan',
  linked_order_no text NULL,
  is_archived boolean DEFAULT false,
  archived_at timestamptz NULL,
  archived_by text NULL,
  created_at timestamptz DEFAULT now()
);

-- ==========================================================
-- TABLE: customer_files (folder-level records)
-- ==========================================================
CREATE TABLE IF NOT EXISTS customer_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text NULL,
  category text NOT NULL,
  total_orders_count integer DEFAULT 0,
  folder_path text NOT NULL,
  last_updated text NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD'),
  is_archived boolean DEFAULT false,
  archived_at timestamptz NULL,
  archived_by text NULL,
  created_at timestamptz DEFAULT now()
);

-- ==========================================================
-- TABLE: customer_file_items (individual files within folders)
-- ==========================================================
CREATE TABLE IF NOT EXISTS customer_file_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_file_id uuid NOT NULL REFERENCES customer_files(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size text NOT NULL,
  file_type text NOT NULL,
  upload_date text NOT NULL,
  order_no text NULL,
  download_url text NULL,
  thumbnail_url text NULL
);

-- ==========================================================
-- TABLE: files (generic file metadata for Storage)
-- ==========================================================
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  order_id uuid NULL REFERENCES orders(id) ON DELETE CASCADE,
  file_type text NOT NULL CHECK (file_type IN ('PROFILE_PHOTO', 'PRODUCT_IMAGE', 'MATERIAL_IMAGE', 'INVENTORY_IMAGE', 'STUDENT_DESIGN', 'GUEST_DESIGN')),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NULL,
  file_size integer NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_files_owner_id ON files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_order_id ON files(order_id);
CREATE INDEX IF NOT EXISTS idx_files_file_type ON files(file_type);

-- ==========================================================
-- TABLE: notifications
-- ==========================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  reference_type text NULL,
  reference_id text NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ==========================================================
-- TABLE: activity_logs
-- ==========================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  description text NULL,
  metadata jsonb NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id ON activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- ==========================================================
-- SEQUENCE: order number generation
-- ==========================================================
CREATE SEQUENCE IF NOT EXISTS order_no_seq START WITH 1000;

-- ==========================================================
-- SEQUENCE: transaction number generation
-- ==========================================================
CREATE SEQUENCE IF NOT EXISTS trans_no_seq START WITH 100;

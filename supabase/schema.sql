-- =============================================
-- TEFA DKV Database Schema for Supabase
-- Run this SQL in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: settings
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_name TEXT NOT NULL DEFAULT 'SMK NU MA''ARIF 1',
  tefa_name TEXT DEFAULT 'TEFA DKV',
  address TEXT,
  phone TEXT,
  email TEXT,
  tax_percent NUMERIC DEFAULT 0,
  receipt_footer_text TEXT,
  auto_print_receipt BOOLEAN DEFAULT true,
  active_academic_year TEXT DEFAULT '2025/2026',
  active_shift_operator TEXT,
  current_user_role TEXT DEFAULT 'Admin Utama / Kepala TEFA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: products
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Cetak Outdoor', 'Cetak Indoor / A3+', 'Merchandise', 'Desain & Creative', 'Finishing & Jilid')),
  subcategory TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  base_price BIGINT NOT NULL DEFAULT 0,
  min_qty INTEGER DEFAULT 1,
  description TEXT,
  is_custom_dimension BOOLEAN DEFAULT false,
  stock INTEGER,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
  image TEXT,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: orders
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  institution TEXT,
  order_date DATE NOT NULL,
  due_date TEXT,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Antrian', 'Proses Desain', 'Cetak/Produksi', 'Finishing', 'Siap Ambil', 'Selesai', 'Dibatalkan')),
  payment_status TEXT DEFAULT 'Belum Bayar' CHECK (payment_status IN ('Belum Bayar', 'DP', 'Lunas')),
  payment_method TEXT CHECK (payment_method IN ('Cash', 'QRIS', 'Transfer Bank', 'DP / Piutang')),
  subtotal BIGINT DEFAULT 0,
  discount BIGINT DEFAULT 0,
  tax_amount BIGINT DEFAULT 0,
  total_amount BIGINT DEFAULT 0,
  paid_amount BIGINT DEFAULT 0,
  balance_due BIGINT DEFAULT 0,
  operator_name TEXT,
  priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Mendesak', 'Prioritas Tinggi')),
  design_notes TEXT,
  finishing_notes TEXT,
  status_history JSONB DEFAULT '[]',
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: order_items
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  category TEXT,
  unit TEXT,
  unit_price BIGINT DEFAULT 0,
  qty INTEGER DEFAULT 1,
  length_meters NUMERIC(10,2),
  width_meters NUMERIC(10,2),
  calculated_area NUMERIC(10,2),
  notes TEXT,
  total_price BIGINT DEFAULT 0,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: order_artwork_files
CREATE TABLE IF NOT EXISTS order_artwork_files (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size TEXT,
  type TEXT,
  url TEXT,
  upload_date TEXT
);

-- =============================================
-- TABLE: custom_orders
-- =============================================
CREATE TABLE IF NOT EXISTS custom_orders (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_class TEXT,
  customer_major TEXT,
  institution TEXT,
  order_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('Printing', 'Design Service', 'Merchandise', 'Advertising', 'Lainnya')),
  description TEXT,
  qty INTEGER DEFAULT 1,
  unit TEXT DEFAULT 'pcs' CHECK (unit IN ('pcs', 'lembar', 'meter', 'paket', 'set', 'roll', 'box')),
  cost_price BIGINT DEFAULT 0,
  selling_price BIGINT DEFAULT 0,
  profit BIGINT DEFAULT 0,
  status TEXT DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Disetujui', 'Proses Produksi', 'Quality Check', 'Selesai', 'Sudah Diambil')),
  deadline TEXT,
  production_notes TEXT,
  reference_file JSONB,
  order_date TEXT NOT NULL,
  operator_name TEXT,
  status_history JSONB DEFAULT '[]',
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: transactions (Keuangan)
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  trans_no TEXT UNIQUE NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Pemasukan', 'Pengeluaran')),
  category TEXT NOT NULL CHECK (category IN ('Penjualan Cetak', 'Jasa Desain', 'Pembelian Bahan', 'Perawatan Alat', 'Operasional & Listrik', 'Lain-lain')),
  description TEXT,
  amount BIGINT NOT NULL,
  ref_order_no TEXT,
  payment_method TEXT CHECK (payment_method IN ('Cash', 'QRIS', 'Transfer Bank', 'DP / Piutang')),
  operator TEXT,
  status TEXT DEFAULT 'Berhasil' CHECK (status IN ('Berhasil', 'Pending')),
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: inbox_files (File Masuk Siswa)
-- =============================================
CREATE TABLE IF NOT EXISTS inbox_files (
  id TEXT PRIMARY KEY,
  upload_date TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  class_grade TEXT,
  major TEXT,
  phone TEXT,
  service_type TEXT,
  print_size TEXT,
  qty INTEGER DEFAULT 1,
  notes TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('JPG', 'PNG', 'PDF', 'PSD', 'AI', 'CDR', 'ZIP')),
  file_size TEXT,
  preview_url TEXT,
  folder_path TEXT,
  status TEXT DEFAULT 'Menunggu Pemeriksaan' CHECK (status IN ('Menunggu Pemeriksaan', 'File Dicek', 'Diterima', 'Ditolak', 'Menjadi Order')),
  linked_order_no TEXT,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: materials (Stok Bahan)
-- =============================================
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Kertas & Stiker', 'Bahan Banner & Cloth', 'Tinta & Solvent', 'Bahan Sublim & Merchandise', 'Aksesoris Finishing')),
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  unit TEXT NOT NULL CHECK (unit IN ('roll', 'pack', 'rim', 'liter', 'pcs', 'box')),
  unit_price BIGINT DEFAULT 0,
  supplier TEXT,
  location TEXT,
  status TEXT DEFAULT 'Aman' CHECK (status IN ('Aman', 'Menipis', 'Kritis')),
  last_restocked TEXT,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: tools (Inventaris Alat)
-- =============================================
CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Mesin Cetak Utama', 'Mesin Finishing', 'Peralatan Fotografi', 'Hardware Komputer', 'Alat Pendukung')),
  location TEXT CHECK (location IN ('Lab Cetak 1', 'Lab Desain 2', 'Studio Foto', 'Ruang Finishing', 'Gudang Utama')),
  condition TEXT DEFAULT 'Baik' CHECK (condition IN ('Sangat Baik', 'Baik', 'Perlu Perbaikan', 'Rusak')),
  status TEXT DEFAULT 'Tersedia' CHECK (status IN ('Tersedia', 'Digunakan', 'Dalam Perbaikan')),
  serial_number TEXT,
  purchase_date TEXT,
  last_maintenance TEXT,
  pic_name TEXT,
  specification TEXT,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: procurements (Pengadaan Tahunan)
-- =============================================
CREATE TABLE IF NOT EXISTS procurements (
  id TEXT PRIMARY KEY,
  year TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('Pengembangan Lab', 'Peremajaan Mesin', 'Lisensi Software', 'Peralatan Tambahan')),
  target_item TEXT,
  qty INTEGER DEFAULT 1,
  estimated_unit_price BIGINT DEFAULT 0,
  total_budget BIGINT DEFAULT 0,
  priority TEXT DEFAULT 'Penting' CHECK (priority IN ('Sangat Penting', 'Penting', 'Sekunder')),
  status TEXT DEFAULT 'Diusulkan' CHECK (status IN ('Diusulkan', 'Dalam Review', 'Disetujui', 'Direalisasikan')),
  requested_by TEXT,
  justification TEXT,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: customer_folders (File Customer)
-- =============================================
CREATE TABLE IF NOT EXISTS customer_folders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  category TEXT CHECK (category IN ('Siswa / Guru', 'Instansi NU', 'Masyarakat Umum', 'Perusahaan / UMKM')),
  total_orders_count INTEGER DEFAULT 0,
  folder_path TEXT,
  last_updated TEXT,
  files JSONB DEFAULT '[]',
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Enable Row Level Security
-- =============================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_artwork_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_folders ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (adjust for production)
CREATE POLICY "Allow public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow public update settings" ON settings FOR UPDATE USING (true);

CREATE POLICY "Allow public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public all products" ON products FOR ALL USING (true);

CREATE POLICY "Allow public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public all orders" ON orders FOR ALL USING (true);

CREATE POLICY "Allow public all order_items" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow public all order_artwork_files" ON order_artwork_files FOR ALL USING (true);

CREATE POLICY "Allow public read custom_orders" ON custom_orders FOR SELECT USING (true);
CREATE POLICY "Allow public all custom_orders" ON custom_orders FOR ALL USING (true);

CREATE POLICY "Allow public read transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public all transactions" ON transactions FOR ALL USING (true);

CREATE POLICY "Allow public read inbox_files" ON inbox_files FOR SELECT USING (true);
CREATE POLICY "Allow public all inbox_files" ON inbox_files FOR ALL USING (true);

CREATE POLICY "Allow public read materials" ON materials FOR SELECT USING (true);
CREATE POLICY "Allow public all materials" ON materials FOR ALL USING (true);

CREATE POLICY "Allow public read tools" ON tools FOR SELECT USING (true);
CREATE POLICY "Allow public all tools" ON tools FOR ALL USING (true);

CREATE POLICY "Allow public read procurements" ON procurements FOR SELECT USING (true);
CREATE POLICY "Allow public all procurements" ON procurements FOR ALL USING (true);

CREATE POLICY "Allow public read customer_folders" ON customer_folders FOR SELECT USING (true);
CREATE POLICY "Allow public all customer_folders" ON customer_folders FOR ALL USING (true);

-- =============================================
-- Enable Realtime
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE custom_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE inbox_files;
ALTER PUBLICATION supabase_realtime ADD TABLE materials;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE settings;

-- =============================================
-- INSERT DEFAULT SETTINGS
-- =============================================
INSERT INTO settings (school_name, tefa_name, address, phone, email, tax_percent, receipt_footer_text, auto_print_receipt, active_academic_year, active_shift_operator, current_user_role)
VALUES (
  'SMK NU MA''ARIF 1',
  'TEFA DKV (Teaching Factory Design & Creative)',
  'Jl. Pendidikan No. 45, Kompleks NU Center, Kota Semarang',
  '(024) 7654-3210 / WA: 0812-3456-7890',
  'tefa.dkv@smknu-semarang.sch.id',
  0,
  'Terima Kasih Atas Kepercayaan Anda pada TEFA DKV SMK NU! Hasil karya siswa berbakat untuk kemajuan industri kreatif.',
  true,
  '2025/2026',
  'M. Rizky (XI DKV 1)',
  'Admin Utama / Kepala TEFA'
) ON CONFLICT DO NOTHING;

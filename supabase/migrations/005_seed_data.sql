-- ==========================================================
-- TEFA DKV — SEED DATA
-- ==========================================================
-- Execute AFTER schema, storage, RLS, and functions migrations
-- This seeds initial product catalog, materials, tools, etc.
-- ==========================================================

-- ==========================================================
-- SEED: Products
-- ==========================================================
INSERT INTO products (id, code, name, category, unit, base_price, cost_price, min_qty, description, is_custom_dimension, image, visibility, show_in_customer_platform) VALUES
  (gen_random_uuid(), 'OUT-FLX280', 'Cetak Banner Flexi Standard 280gr', 'Cetak Outdoor', 'm2', 18000, 5000, 1, 'Bahan banner standar spanduk/baliho luar ruang, tinta anti air & tahan panas.', true, 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300&q=80', true, true),
  (gen_random_uuid(), 'OUT-FLX340', 'Cetak Banner Flexi High Res 340gr', 'Cetak Outdoor', 'm2', 25000, 8000, 1, 'Bahan tebal serat halus, cetak warna lebih tajam untuk backdrop & panggung.', true, 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=300&q=80', true, true),
  (gen_random_uuid(), 'IND-STKVINYL', 'Stiker Vinyl Glossy/Doff A3+', 'Cetak Indoor / A3+', 'lembar', 12000, 3800, 1, 'Bahan sintetis tahan air, tidak mudah robek, termasuk kiss cut potong pola.', false, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80', true, true),
  (gen_random_uuid(), 'IND-STKCHROMO', 'Stiker Chromo A3+ (Label Kemasan)', 'Cetak Indoor / A3+', 'lembar', 8500, 2000, 1, 'Stiker kertas ekonomis cocok untuk label toples, snack, & kemasan UMKM.', false, 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&q=80', true, true),
  (gen_random_uuid(), 'IND-KARTUNAMA', 'Kartu Nama Art Paper 260gr (Box / 100 lbr)', 'Cetak Indoor / A3+', 'box', 35000, 10000, 1, 'Cetak 2 sisi high resolution + box transparan akrilik. Laminasi pilihan Doff/Glossy.', false, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&q=80', true, true),
  (gen_random_uuid(), 'IND-BROSURA4', 'Brosur / Flyer A4 Art Paper 150gr (1 Sisi)', 'Cetak Indoor / A3+', 'lembar', 2500, 600, 10, 'Kertas mengkilap halus, tajam untuk katalog promosi, pendaftaran sekolah & event.', false, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80', true, true),
  (gen_random_uuid(), 'MER-MUGSUBLIM', 'Mug Custom Putih Sublimasi', 'Merchandise', 'pcs', 28000, 12500, 1, 'Mug keramik SNI warna putih jernih + cetak full color anti luntur + dus souvenir.', false, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80', true, true),
  (gen_random_uuid(), 'MER-PIN44', 'Pin Bros Custom 44mm / 58mm', 'Merchandise', 'pcs', 4500, 1500, 10, 'Pin gantungan/bros dengan mika pelindung anti gores.', false, 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300&q=80', true, true),
  (gen_random_uuid(), 'MER-IDCARD', 'ID Card PVC Card Standar ATM', 'Merchandise', 'pcs', 8000, 2500, 1, 'Bahan PVC keras tahan lama + cetak 2 sisi tajam + Tali Lanyard polos.', false, 'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=300&q=80', true, true),
  (gen_random_uuid(), 'DES-LOGO', 'Jasa Desain Logo & Branding Package', 'Desain & Creative', 'paket', 150000, 0, 1, 'Konsep logo modern 3 opsi, file master (AI, CDR, PDF, PNG Transparan) & Brand Guidelines.', false, 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=300&q=80', true, true),
  (gen_random_uuid(), 'DES-SETTING', 'Jasa Layout & Setting File Siap Cetak', 'Desain & Creative', 'paket', 15000, 0, 1, 'Bantuan merapikan ukuran, tracing vektor, dan penyelarasan warna CMYK.', false, 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=300&q=80', true, true)
ON CONFLICT (code) DO NOTHING;

-- ==========================================================
-- SEED: Materials
-- ==========================================================
INSERT INTO materials (id, code, name, category, current_stock, min_stock, unit, unit_price, cost_price, selling_ref_price, supplier, location, status, last_restocked) VALUES
  (gen_random_uuid(), 'MAT-FLX280', 'Bahan Banner Flexi Frontlit 280gr (Roll 3.2m x 50m)', 'Bahan Banner & Cloth', 4, 2, 'roll', 1250000, 1250000, 1750000, 'PT. Laju Grafika Indonesia', 'Gudang Bahan A-1', 'Aman', '2025-07-25'),
  (gen_random_uuid(), 'MAT-STKVINYL', 'Kertas Stiker Vinyl Glossy A3+ (Pack 100 lembar)', 'Kertas & Stiker', 3, 5, 'pack', 380000, 380000, 550000, 'CV. Paper Nusantara', 'Rak Bahan B-2', 'Menipis', '2025-07-10'),
  (gen_random_uuid(), 'MAT-TINTASOLVENT', 'Tinta Eco-Solvent High Quality Cyan / Magenta / Yellow / Black', 'Tinta & Solvent', 1, 2, 'liter', 420000, 420000, 600000, 'PT. Laju Grafika Indonesia', 'Lemari Tinta Kunci', 'Kritis', '2025-06-18'),
  (gen_random_uuid(), 'MAT-MUGBLANK', 'Mug Putih Polos Coating Sublim (Dus 36 Pcs)', 'Bahan Sublim & Merchandise', 5, 2, 'box', 450000, 450000, 650000, 'Grosir Sublim ID', 'Gudang Bahan C-3', 'Aman', '2025-08-02'),
  (gen_random_uuid(), 'MAT-ART260', 'Kertas Art Paper 260gr A3+ (Pack 100 lembar)', 'Kertas & Stiker', 8, 3, 'pack', 110000, 110000, 175000, 'CV. Paper Nusantara', 'Rak Bahan B-1', 'Aman', '2025-08-01'),
  (gen_random_uuid(), 'MAT-PINBLANK', 'Bahan Blank Pin Bros 58mm + Mika (Pack 100 set)', 'Bahan Sublim & Merchandise', 6, 3, 'pack', 95000, 95000, 150000, 'Grosir Sublim ID', 'Gudang Bahan C-1', 'Aman', '2025-07-28')
ON CONFLICT (code) DO NOTHING;

-- ==========================================================
-- SEED: Product Recipes (BOM) - link products to materials
-- Must be run AFTER products and materials are inserted
-- ==========================================================
INSERT INTO product_recipes (product_id, material_id, qty_required)
SELECT p.id, m.id, 0.02
FROM products p, materials m
WHERE p.code = 'OUT-FLX280' AND m.code = 'MAT-FLX280'
ON CONFLICT DO NOTHING;

INSERT INTO product_recipes (product_id, material_id, qty_required)
SELECT p.id, m.id, 0.02
FROM products p, materials m
WHERE p.code = 'OUT-FLX340' AND m.code = 'MAT-FLX280'
ON CONFLICT DO NOTHING;

INSERT INTO product_recipes (product_id, material_id, qty_required)
SELECT p.id, m.id, 0.01
FROM products p, materials m
WHERE p.code = 'IND-STKVINYL' AND m.code = 'MAT-STKVINYL'
ON CONFLICT DO NOTHING;

INSERT INTO product_recipes (product_id, material_id, qty_required)
SELECT p.id, m.id, 0.01
FROM products p, materials m
WHERE p.code = 'IND-STKCHROMO' AND m.code = 'MAT-STKVINYL'
ON CONFLICT DO NOTHING;

INSERT INTO product_recipes (product_id, material_id, qty_required)
SELECT p.id, m.id, 0.1
FROM products p, materials m
WHERE p.code = 'IND-KARTUNAMA' AND m.code = 'MAT-ART260'
ON CONFLICT DO NOTHING;

INSERT INTO product_recipes (product_id, material_id, qty_required)
SELECT p.id, m.id, 0.005
FROM products p, materials m
WHERE p.code = 'IND-BROSURA4' AND m.code = 'MAT-ART260'
ON CONFLICT DO NOTHING;

INSERT INTO product_recipes (product_id, material_id, qty_required)
SELECT p.id, m.id, 0.0278
FROM products p, materials m
WHERE p.code = 'MER-MUGSUBLIM' AND m.code = 'MAT-MUGBLANK'
ON CONFLICT DO NOTHING;

INSERT INTO product_recipes (product_id, material_id, qty_required)
SELECT p.id, m.id, 0.01
FROM products p, materials m
WHERE p.code = 'MER-PIN44' AND m.code = 'MAT-PINBLANK'
ON CONFLICT DO NOTHING;

INSERT INTO product_recipes (product_id, material_id, qty_required)
SELECT p.id, m.id, 0.01
FROM products p, materials m
WHERE p.code = 'MER-IDCARD' AND m.code = 'MAT-PINBLANK'
ON CONFLICT DO NOTHING;

-- ==========================================================
-- SEED: Inventory Assets
-- ==========================================================
INSERT INTO inventory_assets (asset_code, name, category, location, condition, status, serial_number, purchase_date, last_maintenance, pic_name, specifications) VALUES
  ('MES-OUT-01', 'Mesin Large Format Outdoor Roland FJ-740 (3.2m)', 'Mesin Cetak Utama', 'Lab Cetak 1', 'Baik', 'Digunakan', 'RLD-2021-99812', '2021-04-12', '2025-07-15', 'Ahmad Fajar (Koor Lab)', 'Printhead Epson DX5 Dual, Tinta Eco-Solvent 4 Warna, Max Lebar Cetak 320cm.'),
  ('MES-IND-01', 'Digital Press A3+ Konica Minolta Bizhub C1070', 'Mesin Cetak Utama', 'Lab Cetak 1', 'Sangat Baik', 'Tersedia', 'KM-C1070-8812', '2022-11-05', '2025-08-01', 'Bagas Prasetyo', 'Kapasitas 70 ppm, Gramatur kertas 60 - 350 gsm, duplex otomatis, rekalibrasi warna berkala.'),
  ('MES-FIN-01', 'Mesin Press Mug Heavy Duty Dual Station', 'Mesin Finishing', 'Ruang Finishing', 'Baik', 'Tersedia', 'MUG-PRESS-441', '2023-02-18', '2025-06-20', 'Siti Khadijah', 'Suhu maks 220°C, timer digital otomatis, 2 elemen pemanas mug sekaligus.'),
  ('MES-FIN-02', 'Cutting Plotter Jinka Gold XL 721', 'Mesin Finishing', 'Lab Cetak 1', 'Perlu Perbaikan', 'Dalam Perbaikan', 'JNK-721-0021', '2020-09-10', '2025-08-04', 'Ahmad Fajar', 'Mata pisau Roland 45 degree, butuh penggantian jarum pemotong & kalibrasi ulang sensor contour.'),
  ('CAM-DSLR-01', 'Kamera DSLR Canon EOS 80D + Lensa 18-135mm IS USM', 'Peralatan Fotografi', 'Studio Foto', 'Sangat Baik', 'Tersedia', 'CNN-80D-77123', '2022-05-14', '2025-07-10', 'M. Rizky', 'Sensor 24.2 MP APS-C, Dual Pixel CMOS AF, Full HD 60fps, include battery grip & SD Card 64GB.'),
  ('PC-DESAIN-01', 'PC Desain Render Spec Intel Core i7 13700K + RTX 3060 12GB (10 Unit)', 'Hardware Komputer', 'Lab Desain 2', 'Sangat Baik', 'Digunakan', 'PC-LAB2-01-10', '2023-08-20', '2025-07-28', 'M. Rizky', 'RAM 32GB DDR5, SSD NVMe 1TB, Monitor LG 27 inch IPS 99% sRGB.')
ON CONFLICT (asset_code) DO NOTHING;

-- ==========================================================
-- SEED: Annual Procurements
-- ==========================================================
INSERT INTO annual_procurements (year, title, category, target_item, qty, estimated_unit_price, budget, actual_cost, priority, status, requested_by, justification) VALUES
  ('2025/2026', 'Pengadaan Mesin Direct-to-Film (DTF) Sablon Digital Kaos', 'Pengembangan Lab', 'Mesin DTF A3 Dual Head i1600 + Shake Powder Oven Auto', 1, 38000000, 38000000, 35500000, 'Sangat Penting', 'Disetujui', 'Ahmad Fajar (Kaprogli DKV)', 'Meningkatkan unit bisnis sablon kaos TEFA agar siswa menguasai teknologi sablon DTF industri terkini.'),
  ('2025/2026', 'Peremajaan Pen Tablet Wacom Intuos Pro untuk Studio Ilustrasi', 'Peralatan Tambahan', 'Wacom Intuos Pro Medium PTH-660', 10, 5200000, 52000000, NULL, 'Penting', 'Dalam Review', 'M. Rizky (Guru Produktif DKV)', 'Mendukung mata pelajaran Ilustrasi Digital & Character Design kompetensi siswa kelas XI.'),
  ('2025/2026', 'Langganan Lisensi Software Adobe Creative Cloud All Apps (1 Tahun)', 'Lisensi Software', 'Adobe Creative Cloud Teams Education License', 30, 1800000, 54000000, NULL, 'Sangat Penting', 'Diusulkan', 'Tim Kurikulum DKV', 'Legalitas penggunaan software Photoshop, Illustrator, Premiere Pro, & After Effects di seluruh PC Lab.');

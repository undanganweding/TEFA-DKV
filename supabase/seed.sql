-- =============================================
-- SEED DATA untuk TEFA DKV
-- Complete data from mockData.ts
-- =============================================

-- 1. Products
INSERT INTO products (id, code, name, category, unit, base_price, min_qty, description, is_custom_dimension, stock, status, image) VALUES
('PRD-001', 'OUT-FLX280', 'Cetak Banner Flexi Standard 280gr', 'Cetak Outdoor', 'm2', 18000, 1, 'Bahan banner standar spanduk/baliho luar ruang, tinta anti air & tahan panas.', true, NULL, 'Aktif', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300&q=80'),
('PRD-002', 'OUT-FLX340', 'Cetak Banner Flexi High Res 340gr', 'Cetak Outdoor', 'm2', 25000, 1, 'Bahan tebal serat halus, cetak warna lebih tajam untuk backdrop & panggung.', true, NULL, 'Aktif', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=300&q=80'),
('PRD-003', 'IND-STKVINYL', 'Stiker Vinyl Glossy/Doff A3+', 'Cetak Indoor / A3+', 'lembar', 12000, 1, 'Bahan sintetis tahan air, tidak mudah robek, termasuk kiss cut potong pola.', false, NULL, 'Aktif', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80'),
('PRD-004', 'IND-STKCHROMO', 'Stiker Chromo A3+ (Label Kemasan)', 'Cetak Indoor / A3+', 'lembar', 8500, 1, 'Stiker kertas ekonomis cocok untuk label toples, snack, & kemasan UMKM.', false, NULL, 'Aktif', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&q=80'),
('PRD-005', 'IND-KARTUNAMA', 'Kartu Nama Art Paper 260gr (Box / 100 lbr)', 'Cetak Indoor / A3+', 'box', 35000, 1, 'Cetak 2 sisi high resolution + box transparan akrilik. Laminasi pilihan Doff/Glossy.', false, NULL, 'Aktif', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&q=80'),
('PRD-006', 'IND-BROSURA4', 'Brosur / Flyer A4 Art Paper 150gr (1 Sisi)', 'Cetak Indoor / A3+', 'lembar', 2500, 10, 'Kertas mengkilap halus, tajam untuk katalog promosi, pendaftaran sekolah & event.', false, NULL, 'Aktif', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80'),
('PRD-007', 'MER-MUGSUBLIM', 'Mug Custom Putih Sublimasi', 'Merchandise', 'pcs', 28000, 1, 'Mug keramik SNI warna putih jernih + cetak full color anti luntur + dus souvenir.', false, 45, 'Aktif', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80'),
('PRD-008', 'MER-PIN44', 'Pin Bros Custom 44mm / 58mm', 'Merchandise', 'pcs', 4500, 10, 'Pin gantungan/bros dengan mika pelindung anti gores.', false, 120, 'Aktif', 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300&q=80'),
('PRD-009', 'MER-IDCARD', 'ID Card PVC Card Standar ATM', 'Merchandise', 'pcs', 8000, 1, 'Bahan PVC keras tahan lama + cetak 2 sisi tajam + Tali Lanyard polos.', false, 80, 'Aktif', 'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=300&q=80'),
('PRD-010', 'DES-LOGO', 'Jasa Desain Logo & Branding Package', 'Desain & Creative', 'paket', 150000, 1, 'Konsep logo modern 3 opsi, file master (AI, CDR, PDF, PNG Transparan) & Brand Guidelines.', false, NULL, 'Aktif', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=300&q=80'),
('PRD-011', 'DES-SETTING', 'Jasa Layout & Setting File Siap Cetak', 'Desain & Creative', 'paket', 15000, 1, 'Bantuan merapikan ukuran, tracing vektor, dan penyelarasan warna CMYK.', false, NULL, 'Aktif', 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=300&q=80')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  base_price = EXCLUDED.base_price,
  description = EXCLUDED.description;

-- 2. Orders (Pesanan)
INSERT INTO orders (id, order_no, customer_name, customer_phone, institution, order_date, due_date, status, payment_status, payment_method, subtotal, discount, tax_amount, total_amount, paid_amount, balance_due, operator_name, priority, design_notes, status_history) VALUES
('ORD-20250807-001', 'POS-2025-0891', 'H. Ahmad Subhan (Panitia Harlah NU)', '0813-8899-7711', 'PCNU Kota Semarang', '2025-08-07', '2025-08-08 15:00', 'Proses Desain', 'DP', 'Transfer Bank', 666000, 16000, 0, 650000, 300000, 350000, 'Ahmad Fajar (Koor Produksi)', 'Mendesak', 'Gunakan font resmi Harlah, tambahkan logo NU & Banom di bagian pojok kanan.', '[{"status":"Draft","timestamp":"2025-08-07 09:00","updatedBy":"Kasir TEFA"},{"status":"Antrian","timestamp":"2025-08-07 09:15","updatedBy":"Kasir TEFA","note":"DP dikonfirmasi Rp 300.000 via BRI"},{"status":"Proses Desain","timestamp":"2025-08-07 10:00","updatedBy":"M. Rizky (Desainer)"}]'),
('ORD-20250807-002', 'POS-2025-0892', 'Siti Rahmawati (OSIS SMK NU)', '0857-1122-3344', 'OSIS SMK NU Ma''arif 1', '2025-08-07', '2025-08-07 16:00', 'Cetak/Produksi', 'Lunas', 'QRIS', 405000, 5000, 0, 400000, 400000, 0, 'Bagas Prasetyo', 'Normal', 'File sudah ready cetak dari OSIS (Cetak di Konica Minolta A3+).', '[{"status":"Draft","timestamp":"2025-08-07 10:10","updatedBy":"Kasir TEFA"},{"status":"Antrian","timestamp":"2025-08-07 10:15","updatedBy":"Kasir TEFA"},{"status":"Cetak/Produksi","timestamp":"2025-08-07 11:00","updatedBy":"Operator Cetak A3+"}]'),
('ORD-20250806-003', 'POS-2025-0888', 'CV. Karya Mandiri Utama', '0812-9988-7766', 'UMKM Kuliner Semarang', '2025-08-06', '2025-08-07 12:00', 'Siap Ambil', 'Lunas', 'Cash', 455000, 15000, 0, 440000, 440000, 0, 'Siti Khadijah', 'Normal', NULL, '[{"status":"Draft","timestamp":"2025-08-06 13:00","updatedBy":"Kasir TEFA"},{"status":"Cetak/Produksi","timestamp":"2025-08-06 14:30","updatedBy":"Tim Sublim"},{"status":"Finishing","timestamp":"2025-08-06 16:30","updatedBy":"Tim Quality Control"},{"status":"Siap Ambil","timestamp":"2025-08-07 08:00","updatedBy":"Admin TEFA","note":"Sudah di-packing rapi di Rak A-02"}]'),
('ORD-20250805-004', 'POS-2025-0880', 'Drs. Supriyanto, M.Pd (Kepala Sekolah)', '0811-2233-4455', 'SMK NU Ma''arif 1', '2025-08-05', '2025-08-06 10:00', 'Selesai', 'Lunas', 'Transfer Bank', 960000, 60000, 0, 900000, 900000, 0, 'M. Rizky', 'Normal', NULL, '[{"status":"Selesai","timestamp":"2025-08-06 10:00","updatedBy":"Kasir TEFA","note":"Pesanan diambil dan diserahterimakan ke Kurikulum"}]')
ON CONFLICT (order_no) DO UPDATE SET
  status = EXCLUDED.status,
  paid_amount = EXCLUDED.paid_amount;

-- 3. Order Items
INSERT INTO order_items (id, order_id, product_id, product_name, category, unit, unit_price, qty, length_meters, width_meters, calculated_area, notes, total_price) VALUES
('ITEM-101', 'ORD-20250807-001', 'PRD-002', 'Cetak Banner Flexi High Res 340gr', 'Cetak Outdoor', 'm2', 25000, 1, 6, 3, 18, 'Backdrop Utama Harlah NU - Tambah mata ayam 6 titik di atas & bawah.', 450000),
('ITEM-102', 'ORD-20250807-001', 'PRD-001', 'Cetak Banner Flexi Standard 280gr', 'Cetak Outdoor', 'm2', 18000, 4, 3, 1, 3, 'Spanduk Selamat Datang Tamu Undangan (4 Pcs).', 216000),
('ITEM-103', 'ORD-20250807-002', 'PRD-003', 'Stiker Vinyl Glossy/Doff A3+', 'Cetak Indoor / A3+', 'lembar', 12000, 15, NULL, NULL, NULL, 'Stiker Event Classmeeting - Kiss Cut Bentuk Lingkaran Diameter 5cm.', 180000),
('ITEM-104', 'ORD-20250807-002', 'PRD-008', 'Pin Bros Custom 44mm / 58mm', 'Merchandise', 'pcs', 4500, 50, NULL, NULL, NULL, 'PinPanitia Classmeeting 58mm Laminasi Doff.', 225000),
('ITEM-105', 'ORD-20250806-003', 'PRD-005', 'Kartu Nama Art Paper 260gr (Box / 100 lbr)', 'Cetak Indoor / A3+', 'box', 35000, 5, NULL, NULL, NULL, 'Laminasi Doff 2 Sisi + Box Akrilik.', 175000),
('ITEM-106', 'ORD-20250806-003', 'PRD-007', 'Mug Custom Putih Sublimasi', 'Merchandise', 'pcs', 28000, 10, NULL, NULL, NULL, 'Souvenir Direksi - Box Cokelat Tali.', 280000),
('ITEM-107', 'ORD-20250805-004', 'PRD-009', 'ID Card PVC Card Standar ATM', 'Merchandise', 'pcs', 8000, 120, NULL, NULL, NULL, 'Kartu Pelajar Siswa Baru TA 2025/2026 + Barcode + Lanyard Biru NU.', 960000)
ON CONFLICT (id) DO UPDATE SET
  total_price = EXCLUDED.total_price;

-- 4. Order Artwork Files
INSERT INTO order_artwork_files (id, order_id, name, size, type, url, upload_date) VALUES
('FILE-001', 'ORD-20250807-001', 'Draft_Backdrop_Harlah_NU_6x3m.pdf', '14.2 MB', 'pdf', '#', '2025-08-07 09:30'),
('FILE-002', 'ORD-20250807-002', 'Stiker_Classmeeting_ReadyCetak.cdr', '8.5 MB', 'cdr', '#', '2025-08-07 10:15')
ON CONFLICT (id) DO NOTHING;

-- 5. Transactions (Keuangan)
INSERT INTO transactions (id, trans_no, date, type, category, description, amount, ref_order_no, payment_method, operator, status) VALUES
('TRX-001', 'TRX-20250807-01', '2025-08-07 09:15', 'Pemasukan', 'Penjualan Cetak', 'Pembayaran DP (50%) Pesanan Banner Harlah NU - POS-2025-0891', 300000, 'POS-2025-0891', 'Transfer Bank', 'Kasir TEFA', 'Berhasil'),
('TRX-002', 'TRX-20250807-02', '2025-08-07 10:15', 'Pemasukan', 'Penjualan Cetak', 'Pelunasan Stiker & Pin Classmeeting OSIS - POS-2025-0892', 400000, 'POS-2025-0892', 'QRIS', 'Kasir TEFA', 'Berhasil'),
('TRX-003', 'TRX-20250806-01', '2025-08-06 15:30', 'Pemasukan', 'Penjualan Cetak', 'Pelunasan Cetak Kartu Nama & Mug Souvenir - POS-2025-0888', 440000, 'POS-2025-0888', 'Cash', 'Kasir TEFA', 'Berhasil'),
('TRX-004', 'TRX-20250804-01', '2025-08-04 11:00', 'Pengeluaran', 'Pembelian Bahan', 'Pembelian Tinta Eco-Solvent & Kertas Stiker Vinyl', 800000, NULL, 'Transfer Bank', 'Bendahara TEFA', 'Berhasil'),
('TRX-005', 'TRX-20250801-01', '2025-08-01 14:00', 'Pengeluaran', 'Perawatan Alat', 'Service rutin & Kalibrasi Mesin Konica Minolta A3+', 350000, NULL, 'Cash', 'Bendahara TEFA', 'Berhasil')
ON CONFLICT (trans_no) DO UPDATE SET
  amount = EXCLUDED.amount;

-- 6. Materials (Stok Bahan)
INSERT INTO materials (id, code, name, category, current_stock, min_stock, unit, unit_price, supplier, location, status, last_restocked) VALUES
('MAT-001', 'MAT-FLX280', 'Bahan Banner Flexi Frontlit 280gr (Roll 3.2m x 50m)', 'Bahan Banner & Cloth', 4, 2, 'roll', 1250000, 'PT. Laju Grafika Indonesia', 'Gudang Bahan A-1', 'Aman', '2025-07-25'),
('MAT-002', 'MAT-STKVINYL', 'Kertas Stiker Vinyl Glossy A3+ (Pack 100 lembar)', 'Kertas & Stiker', 3, 5, 'pack', 380000, 'CV. Paper Nusantara', 'Rak Bahan B-2', 'Menipis', '2025-07-10'),
('MAT-003', 'MAT-TINTASOLVENT', 'Tinta Eco-Solvent High Quality CMYK', 'Tinta & Solvent', 1, 2, 'liter', 420000, 'PT. Laju Grafika Indonesia', 'Lemari Tinta Kunci', 'Kritis', '2025-06-18'),
('MAT-004', 'MAT-MUGBLANK', 'Mug Putih Polos Coating Sublim (Dus 36 Pcs)', 'Bahan Sublim & Merchandise', 5, 2, 'box', 450000, 'Grosir Sublim ID', 'Gudang Bahan C-3', 'Aman', '2025-08-02'),
('MAT-005', 'MAT-ART260', 'Kertas Art Paper 260gr A3+ (Pack 100 lembar)', 'Kertas & Stiker', 8, 3, 'pack', 110000, 'CV. Paper Nusantara', 'Rak Bahan B-1', 'Aman', '2025-08-01'),
('MAT-006', 'MAT-PINBLANK', 'Bahan Blank Pin Bros 58mm + Mika (Pack 100 set)', 'Bahan Sublim & Merchandise', 6, 3, 'pack', 95000, 'Grosir Sublim ID', 'Gudang Bahan C-1', 'Aman', '2025-07-28')
ON CONFLICT (code) DO UPDATE SET
  current_stock = EXCLUDED.current_stock;

-- 7. Tools (Inventaris)
INSERT INTO tools (id, code, name, category, location, condition, status, serial_number, purchase_date, last_maintenance, pic_name, specification) VALUES
('TL-001', 'MES-OUT-01', 'Mesin Large Format Outdoor Roland FJ-740 (3.2m)', 'Mesin Cetak Utama', 'Lab Cetak 1', 'Baik', 'Digunakan', 'RLD-2021-99812', '2021-04-12', '2025-07-15', 'Ahmad Fajar (Koor Lab)', 'Printhead Epson DX5 Dual, Tinta Eco-Solvent 4 Warna, Max Lebar Cetak 320cm.'),
('TL-002', 'MES-IND-01', 'Digital Press A3+ Konica Minolta Bizhub C1070', 'Mesin Cetak Utama', 'Lab Cetak 1', 'Sangat Baik', 'Tersedia', 'KM-C1070-8812', '2022-11-05', '2025-08-01', 'Bagas Prasetyo', 'Kapasitas 70 ppm, Gramatur kertas 60 - 350 gsm, duplex otomatis, rekalibrasi warna berkala.'),
('TL-003', 'MES-FIN-01', 'Mesin Press Mug Heavy Duty Dual Station', 'Mesin Finishing', 'Ruang Finishing', 'Baik', 'Tersedia', 'MUG-PRESS-441', '2023-02-18', '2025-06-20', 'Siti Khadijah', 'Suhu maks 220°C, timer digital otomatis, 2 elemen pemanas mug sekaligus.'),
('TL-004', 'MES-FIN-02', 'Cutting Plotter Jinka Gold XL 721', 'Mesin Finishing', 'Lab Cetak 1', 'Perlu Perbaikan', 'Dalam Perbaikan', 'JNK-721-0021', '2020-09-10', '2025-08-04', 'Ahmad Fajar', 'Mata pisau Roland 45 degree, butuh penggantian jarum pemotong & kalibrasi ulang sensor contour.'),
('TL-005', 'CAM-DSLR-01', 'Kamera DSLR Canon EOS 80D + Lensa 18-135mm IS USM', 'Peralatan Fotografi', 'Studio Foto', 'Sangat Baik', 'Tersedia', 'CNN-80D-77123', '2022-05-14', '2025-07-10', 'M. Rizky', 'Sensor 24.2 MP APS-C, Dual Pixel CMOS AF, Full HD 60fps, include battery grip & SD Card 64GB.'),
('TL-006', 'PC-DESAIN-01', 'PC Desain Render Spec Intel Core i7 13700K + RTX 3060 12GB (10 Unit)', 'Hardware Komputer', 'Lab Desain 2', 'Sangat Baik', 'Digunakan', 'PC-LAB2-01-10', '2023-08-20', '2025-07-28', 'M. Rizky', 'RAM 32GB DDR5, SSD NVMe 1TB, Monitor LG 27 inch IPS 99% sRGB.')
ON CONFLICT (code) DO UPDATE SET
  condition = EXCLUDED.condition;

-- 8. Procurements (Pengadaan Tahunan)
INSERT INTO procurements (id, year, title, category, target_item, qty, estimated_unit_price, total_budget, priority, status, requested_by, justification) VALUES
('PRC-2025-01', '2025/2026', 'Pengadaan Mesin Direct-to-Film (DTF) Sablon Digital Kaos', 'Pengembangan Lab', 'Mesin DTF A3 Dual Head i1600 + Shake Powder Oven Auto', 1, 38000000, 38000000, 'Sangat Penting', 'Disetujui', 'Ahmad Fajar (Kaprogli DKV)', 'Meningkatkan unit bisnis sablon kaos TEFA agar siswa menguasai teknologi sablon DTF industri terkini.'),
('PRC-2025-02', '2025/2026', 'Peremajaan Pen Tablet Wacom Intuos Pro untuk Studio Ilustrasi', 'Peralatan Tambahan', 'Wacom Intuos Pro Medium PTH-660', 10, 5200000, 52000000, 'Penting', 'Dalam Review', 'M. Rizky (Guru Produktif DKV)', 'Mendukung mata pelajaran Ilustrasi Digital & Character Design kompetensi siswa kelas XI.'),
('PRC-2025-03', '2025/2026', 'Langganan Lisensi Software Adobe Creative Cloud All Apps (1 Tahun)', 'Lisensi Software', 'Adobe Creative Cloud Teams Education License', 30, 1800000, 54000000, 'Sangat Penting', 'Diusulkan', 'Tim Kurikulum DKV', 'Legalitas penggunaan software Photoshop, Illustrator, Premiere Pro, & After Effects di seluruh PC Lab.')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;

-- 9. Custom Orders
INSERT INTO custom_orders (id, order_no, customer_name, customer_phone, customer_class, customer_major, institution, order_name, category, description, qty, unit, cost_price, selling_price, profit, status, deadline, production_notes, order_date, operator_name, status_history) VALUES
('CO-20260808-0001', 'CO-20260808-0001', 'H. Abdul Rahman', '081234567890', 'XII IPS 1', 'IPS', NULL, 'Banner Madrasah 4x2 Meter', 'Advertising', 'Banner selamat datang dengan desain modern, bahan flexi 280gsm, lubang mata ayam 4 sudut', 1, 'pcs', 350000, 550000, 200000, 'Proses Produksi', '2026-08-10', 'Pakai warna resmi NU, logo di pojok kanan atas', '2026-08-08', 'Admin TEFA', '[{"status":"Menunggu","timestamp":"08 Agu 2026 08:30","updatedBy":"Admin TEFA","note":"Order dibuat"},{"status":"Disetujui","timestamp":"08 Agu 2026 09:00","updatedBy":"Admin TEFA","note":"DP diterima Rp 300.000"},{"status":"Proses Produksi","timestamp":"08 Agu 2026 10:00","updatedBy":"Operator Cetak"}]'),
('CO-20260808-0002', 'CO-20260808-0002', 'Siti Aminah', '085712345678', 'Guru BK', NULL, NULL, 'Spanduk PPDB 2026-2027', 'Advertising', 'Spanduk promosi PPDB dengan desain menarik, bahan flexi premium', 2, 'pcs', 180000, 300000, 240000, 'Menunggu', '2026-08-12', NULL, '2026-08-08', 'Admin TEFA', '[{"status":"Menunggu","timestamp":"08 Agu 2026 09:15","updatedBy":"Admin TEFA","note":"Menunggu persetujuan"}]'),
('CO-20260807-0003', 'CO-20260807-0003', 'Budi Santoso', '081398765432', 'X DKV 1', 'DKV', NULL, 'Logo Klub Fotografi', 'Design Service', 'Desain logo untuk klub fotografi sekolah dengan 3 opsi konsep warna', 1, 'paket', 75000, 150000, 75000, 'Quality Check', '2026-08-09', NULL, '2026-08-07', 'Admin TEFA', '[{"status":"Menunggu","timestamp":"07 Agu 2026 14:00","updatedBy":"Admin TEFA"},{"status":"Disetujui","timestamp":"07 Agu 2026 14:30","updatedBy":"Admin TEFA"},{"status":"Proses Produksi","timestamp":"07 Agu 2026 15:00","updatedBy":"Desainer"},{"status":"Quality Check","timestamp":"08 Agu 2026 08:00","updatedBy":"QC Team"}]'),
('CO-20260806-0004', 'CO-20260806-0004', 'PCNU Kota Semarang', '0241234567', NULL, NULL, 'PCNU', 'Sertifikat Kader 3 Variasi', 'Printing', 'Cetak sertifikat untuk 100 orang kader NU dengan 3 desain variasi', 100, 'pcs', 8000, 15000, 700000, 'Selesai', '2026-08-07', NULL, '2026-08-06', 'Admin TEFA', '[{"status":"Menunggu","timestamp":"06 Agu 2026 10:00","updatedBy":"Admin TEFA"},{"status":"Disetujui","timestamp":"06 Agu 2026 10:30","updatedBy":"Admin TEFA"},{"status":"Proses Produksi","timestamp":"06 Agu 2026 11:00","updatedBy":"Operator Cetak"},{"status":"Quality Check","timestamp":"06 Agu 2026 15:00","updatedBy":"QC Team"},{"status":"Selesai","timestamp":"06 Agu 2026 16:00","updatedBy":"Admin TEFA","note":"Siap diambil"}]')
ON CONFLICT (order_no) DO UPDATE SET
  status = EXCLUDED.status;

-- 10. Inbox Files (File Masuk Siswa)
INSERT INTO inbox_files (id, upload_date, customer_name, class_grade, major, phone, service_type, print_size, qty, notes, file_name, file_type, file_size, preview_url, folder_path, status) VALUES
('TEFA-FILE-001', '08 Agu 2026 08:30', 'Ahmad Fauzi', 'XI DKV 2', 'DKV', '081234567890', 'Cetak Foto A4', 'A4', 5, 'Tolong dicetak warna cerah glossy, untuk tugas pameran kelas.', 'foto_kegiatan_LDKS.jpg', 'JPG', '5.2 MB', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80', '/TEFA_FILES/2026/08/TEFA-FILE-001/foto_kegiatan_LDKS.jpg', 'Menunggu Pemeriksaan'),
('TEFA-FILE-002', '08 Agu 2026 09:15', 'Siti Nurhaliza', 'X DKV 1', 'DKV', '085712345678', 'Poster', 'A3+', 10, 'Cetak art paper 260gr, desain poster event classmeeting.', 'poster_classmeeting_v2.ai', 'AI', '42.8 MB', 'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=600&q=80', '/TEFA_FILES/2026/08/TEFA-FILE-002/poster_classmeeting_v2.ai', 'File Dicek'),
('TEFA-FILE-003', '08 Agu 2026 09:40', 'Budi Santoso', 'XI DKV 1', 'DKV', '081398765432', 'Mug Custom', 'Standard Mug', 12, 'Souvenir kado wali kelas, gambar bolak-balik.', 'desain_mug_pak_guru.png', 'PNG', '8.4 MB', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80', '/TEFA_FILES/2026/08/TEFA-FILE-003/desain_mug_pak_guru.png', 'Diterima'),
('TEFA-FILE-004', '07 Agu 2026 14:20', 'Rizki Maulana', 'XII DKV 2', 'DKV', '082134567811', 'Banner', '3x1 meter', 1, 'Banner Pentas Seni OSIS, pakai lubang mata ayam 4 sudut.', 'banner_pensi_2026_final.cdr', 'CDR', '105.0 MB', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80', '/TEFA_FILES/2026/08/TEFA-FILE-004/banner_pensi_2026_final.cdr', 'Menjadi Order'),
('TEFA-FILE-005', '07 Agu 2026 11:00', 'Dewi Anggraini', 'Guru DKV', 'Pengajar', '081223344556', 'Cetak Dokumen', 'A4', 50, 'Modul Praktikum Desain Grafis Komputer.', 'modul_praktek_dkv_2026.pdf', 'PDF', '18.2 MB', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80', '/TEFA_FILES/2026/08/TEFA-FILE-005/modul_praktek_dkv_2026.pdf', 'Diterima'),
('TEFA-FILE-006', '06 Agu 2026 16:10', 'Faris Gunawan', 'X TKJ 2', 'TKJ', '085899001122', 'Desain', 'Custom', 1, 'Resolusi gambar terlalu kecil (di bawah 100dpi) mohon re-export.', 'logo_squad_lowres.jpg', 'JPG', '0.8 MB', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80', '/TEFA_FILES/2026/08/TEFA-FILE-006/logo_squad_lowres.jpg', 'Ditolak')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;

-- 11. Customer Folders
INSERT INTO customer_folders (id, customer_name, phone, email, category, total_orders_count, folder_path, last_updated, files) VALUES
('CUST-001', 'PCNU Kota Semarang', '0813-8899-7711', 'info@pcnusemarang.or.id', 'Instansi NU', 14, '/DRIVE_TEFA/INSTANSI_NU/PCNU_SEMARANG/', '2025-08-07', '[{"id":"FL-001","fileName":"Master_Logo_NU_HighRes_CMYK.ai","fileSize":"24.5 MB","fileType":"ai","uploadDate":"2025-08-07","orderNo":"POS-2025-0891"},{"id":"FL-002","fileName":"Backdrop_Harlah_NU_6x3m_Ready.pdf","fileSize":"14.2 MB","fileType":"pdf","uploadDate":"2025-08-07","orderNo":"POS-2025-0891"},{"id":"FL-003","fileName":"Sertifikat_Pelatihan_Kader.cdr","fileSize":"18.1 MB","fileType":"cdr","uploadDate":"2025-07-20"}]'),
('CUST-002', 'OSIS SMK NU Ma''arif 1', '0857-1122-3344', 'osis.smknu@gmail.com', 'Siswa / Guru', 8, '/DRIVE_TEFA/INTERNAL_SEKOLAH/OSIS/', '2025-08-07', '[{"id":"FL-004","fileName":"Stiker_Classmeeting_2025.cdr","fileSize":"8.5 MB","fileType":"cdr","uploadDate":"2025-08-07","orderNo":"POS-2025-0892"},{"id":"FL-005","fileName":"Desain_Pin_Panitia.psd","fileSize":"42.0 MB","fileType":"psd","uploadDate":"2025-08-07","orderNo":"POS-2025-0892"}]'),
('CUST-003', 'CV. Karya Mandiri Utama', '0812-9988-7766', 'admin@karyamandiri.co.id', 'Perusahaan / UMKM', 5, '/DRIVE_TEFA/UMKM_CLIENTS/KARYA_MANDIRI/', '2025-08-06', '[{"id":"FL-006","fileName":"KartuNama_Direksi_2025.pdf","fileSize":"4.2 MB","fileType":"pdf","uploadDate":"2025-08-06","orderNo":"POS-2025-0888"},{"id":"FL-007","fileName":"Mockup_Mug_Souvenir.png","fileSize":"3.1 MB","fileType":"png","uploadDate":"2025-08-06","orderNo":"POS-2025-0888"}]')
ON CONFLICT (id) DO UPDATE SET
  total_orders_count = EXCLUDED.total_orders_count;

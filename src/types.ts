export type PageId =
  | 'dashboard'
  | 'kasir'
  | 'manajemen_user'
  | 'file_inbox'
  | 'pesanan'
  | 'produk'
  | 'customer_file'
  | 'inventaris_alat'
  | 'stok_bahan'
  | 'keuangan'
  | 'laporan'
  | 'pengadaan'
  | 'pengaturan'
  | 'public_upload'
  | 'profile';

export type UserRole = 'Kepala TEFA' | 'Admin TEFA' | 'Guru / Operator' | 'Admin' | 'Siswa' | 'Guest';

export interface UserNotifications {
  orderNotif: boolean;
  fileInboxNotif: boolean;
  productionNotif: boolean;
  stockNotif: boolean;
}

export interface InstitutionProfile {
  schoolName: string;
  tefaName: string;
  logoUrl: string;
  address: string;
  contactPhone: string;
  schoolEmail: string;
  website: string;
  description: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  avatar: string;
  defaultPage: PageId;
  statusAkun: 'Pending' | 'Approved' | 'Active' | 'Aktif' | 'Menunggu Verifikasi' | 'Rejected' | 'Inactive' | 'Nonaktif';
  rejectReason?: string;
  phone: string;
  address?: string;
  birthDate?: string;
  // Kepala TEFA / Staff
  position?: string;
  nip?: string;
  schoolEmail?: string;
  expertise?: string;
  subject?: string;
  employeeId?: string;
  // Siswa
  nis?: string;
  studentClass?: string;
  major?: string;
  whatsapp?: string;
  // Admin / System
  adminId?: string;
  unitAccess?: string;
  // Auth & Security
  passwordHash?: string;
  createdAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  // Preferences
  theme: 'light' | 'dark';
  notifications: UserNotifications;
}

export type InboxFileStatus =
  | 'Menunggu Pemeriksaan'
  | 'File Dicek'
  | 'Diterima'
  | 'Ditolak'
  | 'Menjadi Order';

export interface InboxFile {
  id: string; // e.g. 'TEFA-FILE-001'
  uploadDate: string; // e.g. '12 Agr 2026'
  customerName: string;
  classGrade: string; // e.g. 'XI DKV 2'
  major?: string;
  phone: string;
  serviceType: string;
  printSize?: string;
  qty: number;
  notes?: string;
  fileName: string;
  fileType: 'JPG' | 'PNG' | 'PDF' | 'PSD' | 'AI' | 'CDR' | 'ZIP';
  fileSize: string;
  previewUrl?: string;
  folderPath: string;
  status: InboxFileStatus;
  linkedOrderNo?: string;
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
}

export type OrderStatus =
  | 'Draft'
  | 'Antrian'
  | 'Proses Desain'
  | 'Cetak/Produksi'
  | 'Finishing'
  | 'Siap Ambil'
  | 'Selesai'
  | 'Dibatalkan';

export type PaymentStatus = 'Belum Bayar' | 'DP' | 'Lunas';

export type PaymentMethod = 'Cash' | 'QRIS' | 'Transfer Bank' | 'DP / Piutang';

export interface Product {
  id: string;
  code: string;
  name: string;
  category: 'Cetak Outdoor' | 'Cetak Indoor / A3+' | 'Merchandise' | 'Desain & Creative' | 'Finishing & Jilid';
  subcategory?: string;
  unit: 'm2' | 'lembar' | 'pcs' | 'paket' | 'meter' | 'set' | 'box';
  basePrice: number; // Harga per unit
  minQty: number;
  description: string;
  isCustomDimension?: boolean; // e.g. Flexi banner (Panjang x Lebar)
  stock?: number; // Optional for physical goods like Mug / Blank Pin
  status: 'Aktif' | 'Nonaktif';
  image?: string;
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  unit: string;
  unitPrice: number;
  qty: number;
  // Custom dimensions if banner
  lengthMeters?: number;
  widthMeters?: number;
  calculatedArea?: number; // length * width
  notes?: string;
  totalPrice: number;
  fileUrl?: string;
  fileName?: string;
  isCustomOrder?: boolean;
  customSizeSpec?: string;
  customDescription?: string;
}

export interface ProductionOrder {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  institution?: string;
  orderDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD HH:mm
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  items: CartItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  operatorName: string;
  priority: 'Normal' | 'Mendesak' | 'Prioritas Tinggi';
  notes?: string;
  designNotes?: string;
  finishingNotes?: string;
  artworkFiles?: Array<{
    id: string;
    name: string;
    size: string;
    type: string;
    url: string;
    uploadDate: string;
  }>;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: string;
    updatedBy: string;
    note?: string;
  }>;
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
}

export interface CustomerFile {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  category: 'Siswa / Guru' | 'Instansi NU' | 'Masyarakat Umum' | 'Perusahaan / UMKM';
  totalOrdersCount: number;
  folderPath: string;
  lastUpdated: string;
  files: Array<{
    id: string;
    fileName: string;
    fileSize: string;
    fileType: 'pdf' | 'cdr' | 'psd' | 'ai' | 'png' | 'jpg' | 'zip';
    uploadDate: string;
    orderNo?: string;
    downloadUrl?: string;
    thumbnailUrl?: string;
  }>;
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
}

export interface ToolInventory {
  id: string;
  code: string;
  name: string;
  category: 'Mesin Cetak Utama' | 'Mesin Finishing' | 'Peralatan Fotografi' | 'Hardware Komputer' | 'Alat Pendukung';
  location: 'Lab Cetak 1' | 'Lab Desain 2' | 'Studio Foto' | 'Ruang Finishing' | 'Gudang Utama';
  condition: 'Sangat Baik' | 'Baik' | 'Perlu Perbaikan' | 'Rusak';
  status: 'Tersedia' | 'Digunakan' | 'Dalam Perbaikan';
  serialNumber: string;
  purchaseDate: string;
  lastMaintenance: string;
  picName: string;
  specification?: string;
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
}

export interface MaterialStock {
  id: string;
  code: string;
  name: string;
  category: 'Kertas & Stiker' | 'Bahan Banner & Cloth' | 'Tinta & Solvent' | 'Bahan Sublim & Merchandise' | 'Aksesoris Finishing';
  currentStock: number;
  minStock: number;
  unit: 'roll' | 'pack' | 'rim' | 'liter' | 'pcs' | 'box' | 'lembar' | 'm2' | string;
  unitPrice: number; // Cost Price / Modal
  costPrice?: number; // Modal unit price
  sellingRefPrice?: number; // Reference selling price per unit
  supplier: string;
  location: string;
  status: 'Aman' | 'Menipis' | 'Kritis';
  lastRestocked: string;
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
}

export interface StockMovement {
  id: string;
  materialId: string;
  materialName: string;
  date: string;
  type: 'Masuk' | 'Keluar' | 'Penyesuaian'; // Incoming, Production Usage, Stock Adjustment
  quantity: number;
  unit: string;
  unitCost: number;
  totalValue: number;
  supplier?: string;
  purchaseDate?: string;
  notes?: string;
  operator?: string;
}

export interface FinanceTransaction {
  id: string;
  transNo: string;
  date: string;
  type: 'Pemasukan' | 'Pengeluaran';
  category: 'Penjualan Cetak' | 'Jasa Desain' | 'Pelunasan / Angsuran' | 'Pembelian Bahan' | 'Perawatan Alat' | 'Operasional & Listrik' | 'Lain-lain';
  description: string;
  amount: number;
  refOrderNo?: string;
  paymentMethod: PaymentMethod;
  operator: string;
  status: 'Berhasil' | 'Pending';
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
}

export interface AnnualProcurement {
  id: string;
  year: string;
  title: string;
  category: 'Pengembangan Lab' | 'Peremajaan Mesin' | 'Lisensi Software' | 'Peralatan Tambahan';
  targetItem: string;
  qty: number;
  estimatedUnitPrice: number;
  totalBudget: number;
  priority: 'Sangat Penting' | 'Penting' | 'Sekunder';
  status: 'Diusulkan' | 'Dalam Review' | 'Disetujui' | 'Direalisasikan';
  requestedBy: string;
  justification: string;
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
}

export interface SystemSettings {
  schoolName: string;
  tefaName: string;
  address: string;
  phone: string;
  email: string;
  taxPercent: number;
  receiptFooterText: string;
  autoPrintReceipt: boolean;
  activeAcademicYear: string;
  activeShiftOperator: string;
  currentUserRole?: 'Admin Utama / Kepala TEFA' | 'Operator / Staff';
}

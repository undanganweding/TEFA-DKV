import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductionOrder, Product } from '../../types';
import { trackGuestOrder } from '../../services/orderService';

interface GuestPlatformViewProps {
  products?: Product[];
  orders: ProductionOrder[];
  onAddOrder: (order: ProductionOrder, attachedFile?: File) => Promise<{ success: boolean; orderNo?: string; guestAccessToken?: string }>;
  onSwitchToAdmin?: () => void;
  onLogout?: () => void;
}


type GuestPage = 'landing' | 'order' | 'tracking' | 'product_order';

interface ProductItem {
  id: string;
  name: string;
  price: string;
  unit: string;
  img: string;
  desc: string;
  specs: string[];
  variants?: any[];
}

const services = [
  { id: 'cetak_dokumen', name: 'Cetak Dokumen', icon: 'description', desc: 'Poster, Brosur, Banner, Buku Kenangan' },
  { id: 'cetak_foto', name: 'Cetak Foto', icon: 'photo_library', desc: 'Cetak foto Resolusi Tinggi & Bingkai' },
  { id: 'merchandise', name: 'Merchandise', icon: 'redeem', desc: 'Gantungan Kunci, Pin Bros, Mug, Stiker Custom' },
  { id: 'custom', name: 'Custom Design & Studio', icon: 'design_services', desc: 'Desain Logo, Feed IG, Foto Studio & Video' },
];

const fallbackProducts: ProductItem[] = [
  {
    id: 'cetak_dokumen',
    name: 'Cetak Banner Flexi 280gr',
    price: 'Rp 18.000 / m²',
    unit: 'm2',
    img: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=400&q=80',
    desc: 'Cetak banner luar ruangan berkualitas tinggi menggunakan mesin cetak solvent modern dengan bahan Flexi Tiongkok 280gr. Tahan segala cuaca, warna pekat tahan lama, ideal untuk media promosi outdoor.',
    specs: ['Bahan: Flexi Frontlite Tiongkok 280gr', 'Lebar Maksimal: 3.2 meter (tanpa sambungan)', 'Resolusi Cetak: Standard Outdoor Resolution', 'Finishing: Mata ayam (ring besi) di sudut / Selongsong kayu / Lipat kelim lem'],
  },
  {
    id: 'merchandise',
    name: 'Stiker Vinyl Glossy A3+',
    price: 'Rp 12.000 / lembar',
    unit: 'lembar',
    img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
    desc: 'Stiker lembaran berbahan dasar plastik vinyl putih susu dengan permukaan mengkilap (glossy). Tahan air (waterproof), perekat sangat kuat, tidak mudah sobek, cocok sekali untuk label kemasan produk makanan/minuman.',
    specs: ['Bahan: Vinyl Glossy White Premium', 'Ukuran Lembar: A3+ (area cetak 31 x 47 cm)', 'Tinta: Toner Laser anti-luntur', 'Finishing: Kiss-Cut (setengah putus siap tempel) / Die-Cut (putus)'],
  },
  {
    id: 'merchandise',
    name: 'Pin Bros Custom DKV',
    price: 'Rp 4.500 / pcs',
    unit: 'pcs',
    img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80',
    desc: 'Pin bros berbentuk bulat peniti custom untuk aksesoris identitas, tanda panitia acara sekolah/kampus, souvenir pernikahan, merchandise wisuda, atau branding logo komunitas.',
    specs: ['Ukuran: Diameter Standar 44mm / 58mm', 'Laminasi Atas: Glossy Mengkilap / Doff Halus', 'Bahan Peniti: Plastik Putih/Hitam kokoh anti-karat', 'Desain: Bebas custom foto / tulisan'],
  },
  {
    id: 'cetak_dokumen',
    name: 'Kartu Nama Exclusive Box',
    price: 'Rp 35.000 / box',
    unit: 'pcs',
    img: 'https://images.unsplash.com/photo-1542744094-3a31b272c390?w=400&q=80',
    desc: 'Kartu nama cetak dua sisi dengan bahan kertas tebal berkualitas tinggi. Sudah dikemas menggunakan kotak plastik mika transparan eksklusif agar tetap bersih dan rapi saat dibagikan ke klien penting.',
    specs: ['Bahan: Art Carton 260gr / 310gr tebal', 'Isi per Box: 100 lembar kartu nama presisi', 'Ukuran Potong: Standar 90mm x 55mm', 'Pilihan Cetak: 1 Sisi (Single) / 2 Sisi (Bolak-balik)'],
  },
];

const galleryItems = [
  { title: 'Project Branding Coffee Shop', category: 'Creative Design', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80' },
  { title: 'Poster Event Kebudayaan', category: 'Cetak Poster', img: 'https://images.unsplash.com/photo-1542744094-3a31b272c390?w=600&q=80' },
  { title: 'Merchandise Event Sekolah', category: 'Pin & Mug', img: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=600&q=80' },
  { title: 'Foto Studio Kelulusan (Wisuda)', category: 'Studio Portrait', img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80' },
  { title: 'Stiker Branding Botol Kemasan', category: 'Vinyl Print', img: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&q=80' },
  { title: 'Buku Kenangan Siswa DKV', category: 'Cetak Buku', img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80' },
];

export const GuestPlatformView: React.FC<GuestPlatformViewProps> = ({
  products: adminProducts = [],
  orders,
  onAddOrder,
  onSwitchToAdmin,
  onLogout,
}) => {
  const [currentPage, setCurrentPage] = useState<GuestPage>('landing');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Map admin products to Guest ProductItem format if available
  const displayProducts: ProductItem[] = adminProducts.length > 0
    ? adminProducts.filter(p => p.showInCustomerPlatform !== false).map(p => ({
        id: p.id,
        name: p.name,
        price: `Rp ${p.basePrice.toLocaleString('id-ID')} / ${p.unit}`,
        unit: p.unit,
        img: p.coverImage || p.images?.[0] || p.image || 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=400&q=80',
        desc: p.description,
        specs: [
          `Kategori: ${p.category}`,
          `Satuan: ${p.unit}`,
          `Status: ${p.status}`,
          p.isCustomDimension ? 'Mendukung Ukuran Kustom' : 'Ukuran Standar'
        ],
        variants: p.variants || []
      }))
    : fallbackProducts;

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);

  // Order Form State
  const [orderForm, setOrderForm] = useState({
    name: '',
    whatsapp: '',
    email: '',
    service: '',
    notes: '',
  });
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [selectedOrderProduct, setSelectedOrderProduct] = useState<ProductItem | null>(null);
  const [productQty, setProductQty] = useState<number>(1);
  const [orderSuccessData, setOrderSuccessData] = useState<{
    orderNo: string;
    productName: string;
    qty: number;
    totalPrice: string;
  } | null>(null);

  // Tracking State
  const [trackInput, setTrackInput] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file: File) => {
    setFileError(null);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedExtensions = /(\.pdf|\.jpg|\.jpeg|\.png|\.cdr|\.ai)$/i;

    if (file.size > maxSize) {
      setFileError('Ukuran berkas melebihi batas maksimal 10MB!');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!allowedExtensions.exec(file.name)) {
      setFileError('Tipe berkas tidak didukung! Gunakan format PDF, JPG, PNG, CDR, atau AI.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const productRequiresFile = (prod: ProductItem) => {
    const nameLower = prod.name.toLowerCase();
    const descLower = prod.desc.toLowerCase();
    return (
      nameLower.includes('cetak') ||
      nameLower.includes('print') ||
      nameLower.includes('foto') ||
      nameLower.includes('stiker') ||
      nameLower.includes('banner') ||
      descLower.includes('cetak') ||
      descLower.includes('print') ||
      descLower.includes('file') ||
      descLower.includes('desain')
    );
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!orderForm.name.trim() || !orderForm.whatsapp.trim()) {
      alert('Nama dan Nomor WhatsApp wajib diisi!');
      return;
    }

    setIsSubmitting(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const idempotencyKey = `GUEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      let productName = '';
      let unitPrice = 0;
    let qty = 1;
    let subtotal = 0;

    if (selectedOrderProduct) {
      if (productRequiresFile(selectedOrderProduct) && !selectedFile) {
        setFileError('Produk ini memerlukan file desain! Silakan upload file desain Anda.');
        return;
      }
      if (selectedOrderProduct.variants && selectedOrderProduct.variants.length > 0 && !selectedVariant && selectedOrderProduct.id !== 'custom') {
        alert('Mohon pilih varian produk!');
        return;
      }

      if (selectedOrderProduct.id === 'custom') {
        productName = 'Layanan Cetak Custom - ' + (services.find((s) => s.id === orderForm.service)?.name || '');
        unitPrice = 0;
        qty = productQty || 1;
        subtotal = 0;
      } else {
        productName = selectedOrderProduct.name;
        unitPrice = selectedVariant ? Number(selectedVariant.basePrice) : (parseInt(selectedOrderProduct.price.replace(/[^\d]/g, ''), 10) || 0);
        qty = productQty || 1;
        subtotal = unitPrice * qty;
      }
    } else {
      // Legacy fallback
      if (!orderForm.service) {
        alert('Mohon pilih jenis layanan!');
        return;
      }
      const serviceName = services.find((s) => s.id === orderForm.service)?.name || 'Layanan Cetak Custom';
      productName = serviceName;
      unitPrice = 0;
      qty = 1;
      subtotal = 0;
    }

    const artworkFiles = selectedFile
      ? [
          {
            id: 'FILE-' + Date.now(),
            name: selectedFile.name,
            size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
            type: selectedFile.type,
            url: '#',
            uploadDate: todayStr,
          },
        ]
      : [];

      const newOrder: ProductionOrder = {
        id: 'ORD-GUEST-' + Date.now(),
        orderNo: '', // Backend assigns this
        customerName: orderForm.name.trim(),
        customerPhone: orderForm.whatsapp.trim(),
        customerEmail: orderForm.email.trim() || undefined,
        orderDate: todayStr,
        dueDate: todayStr + ' 16:00',
        status: 'Menunggu Admin',
        paymentStatus: 'Belum Bayar',
        items: [
          {
            id: 'ITEM-' + Date.now(),
            productId: (() => {
              const pId = selectedOrderProduct ? selectedOrderProduct.id : orderForm.service;
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
              return uuidRegex.test(pId) ? pId : undefined;
            })(),
            productName: productName,
            variantId: selectedVariant ? selectedVariant.id : undefined,
            variantName: selectedVariant ? selectedVariant.name : undefined,
            category: 'Cetak',
            unit: selectedOrderProduct ? selectedOrderProduct.unit : 'pcs',
            unitPrice: unitPrice,
            qty: qty,
            totalPrice: subtotal,
            notes: orderForm.notes || undefined,
          },
        ],
        subtotal: subtotal,
        discount: 0,
        taxAmount: 0,
        totalAmount: subtotal,
        paidAmount: 0,
        balanceDue: subtotal,
        operatorName: 'Guest Customer',
        priority: 'Normal',
        notes: orderForm.notes || undefined,
        artworkFiles: artworkFiles.length > 0 ? artworkFiles : undefined,
        idempotency_key: idempotencyKey,
        guest_access_token: '00000000-0000-0000-0000-000000000000', // Mock token for types if needed, the actual token is generated by backend
        statusHistory: [
          {
            status: 'Menunggu Admin',
            timestamp: new Date().toLocaleString('id-ID'),
            updatedBy: 'System',
            note: 'Pesanan dibuat oleh Guest Customer',
          },
        ],
      };

      const res = await onAddOrder(newOrder, selectedFile || undefined);
      if (res && res.success && res.orderNo) {
        setOrderSuccess(res.orderNo);
        setOrderSuccessData({
          orderNo: res.orderNo,
          productName: productName,
          qty: qty,
          totalPrice: subtotal > 0 ? `Rp ${subtotal.toLocaleString('id-ID')}` : 'Akan dihitung oleh Admin',
        });
      } else {
        throw new Error('Gagal mendapatkan nomor pesanan dari server.');
      }

      // Reset forms
      setOrderForm({ name: '', whatsapp: '', email: '', service: '', notes: '' });
      setSelectedFile(null);
    } catch (err: any) {
      alert('Gagal mengirim pesanan: ' + err.message);
      setIsSubmitting(false);
    }
  };

  const handleTrack = async () => {
    if (!trackInput.trim()) {
      alert('Masukkan Order ID atau Nomor WhatsApp Anda!');
      return;
    }

    const query = trackInput.trim();

    // 1. First try in-memory orders (from state / localStorage)
    const matchedOrders = orders.filter(
      (o) => o.orderNo.toLowerCase() === query.toLowerCase() || o.customerPhone === query
    );

    if (matchedOrders.length > 0) {
      const found = matchedOrders[0];
      setTrackResult({
        orderId: found.orderNo,
        product: found.items.map((i: any) => `${i.productName}${i.variantName ? ` - ${i.variantName}` : ''}`).join(', '),
        date: found.orderDate,
        status: found.status,
        statusHistory: found.statusHistory || [],
        totalAmount: found.totalAmount,
        items: found.items
      });
      return;
    }

    // 2. Fallback: query database via RPC (works for any guest order)
    try {
      const result = await trackGuestOrder(query, undefined, window.sessionStorage.getItem(`guest_token_${query}`) || undefined);
      if (result && result.success) {
        const items = (result.items || []) as Array<{ product_name: string; variant_name?: string; qty: number; unit: string; total_price: number; notes?: string }>;
        const history = (result.statusHistory || []) as Array<{ status: string; timestamp: string; updated_by: string; note?: string }>;
        setTrackResult({
          orderId: result.orderNo || query,
          product: items.map((i: any) => `${i.product_name}${i.variant_name ? ` - ${i.variant_name}` : ''}`).join(', '),
          date: result.orderDate || '',
          status: result.status || 'Menunggu Admin',
          statusHistory: history.map((h: any) => ({
            status: h.status,
            timestamp: h.timestamp,
            updatedBy: h.updated_by,
            note: h.note,
          })),
          totalAmount: result.totalAmount || 0,
          items: items.map(i => ({ productName: i.product_name, variantName: i.variant_name, qty: i.qty, unit: i.unit, totalPrice: i.total_price }))
        });
      } else {
        alert('Data pesanan tidak ditemukan. Cek kembali Order ID atau WhatsApp Anda.');
        setTrackResult(null);
      }
    } catch {
      alert('Data pesanan tidak ditemukan. Cek kembali Order ID atau WhatsApp Anda.');
      setTrackResult(null);
    }
  };

  const handleProductOrderClick = (product: ProductItem) => {
    setSelectedOrderProduct(product);
    setProductQty(1);
    setOrderForm({
      name: '',
      whatsapp: '',
      email: '',
      service: product.id,
      notes: '',
    });
    setSelectedProduct(null);
    setOrderSuccess(null);
    setOrderSuccessData(null);
    setSelectedFile(null);
    setFileError(null);
    setCurrentPage('product_order');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between selection:bg-[#5B4BFF]/20 selection:text-[#5B4BFF] relative">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              setCurrentPage('landing');
              setTrackResult(null);
            }}
            className="flex items-center gap-3 cursor-pointer text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shadow-purple-500/5 overflow-hidden">
              <img src="/src/assets/logo_smknu.png" alt="Logo SMK NU Ungaran" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 text-base leading-tight tracking-tight">TEFA DKV</h1>
              <p className="text-[9px] text-[#5B4BFF] font-extrabold uppercase tracking-widest">SMK NU UNGARAN</p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentPage('order');
                setOrderSuccess(null);
              }}
              className="px-4 py-2.5 bg-[#5B4BFF] hover:bg-[#4a3ce0] text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-500/10 hover:shadow-lg transition-all cursor-pointer"
            >
              Buat Pesanan
            </button>
            <button
              onClick={onSwitchToAdmin}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer border border-slate-200/60"
            >
              Login Admin / Siswa
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* LANDING PAGE */}
        {currentPage === 'landing' && (
          <div className="animate-fade-in">
            {/* Hero Section (Navy/Purple Theme) */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0F1322] via-[#141933] to-[#251A4D] text-white py-24 px-6">
              {/* Decorative Blur Orbs */}
              <div className="absolute top-0 -left-20 w-80 h-80 bg-[#5B4BFF]/25 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

              <div className="max-w-4xl mx-auto text-center relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/10 rounded-full text-[11px] font-extrabold mb-6 backdrop-blur-md border border-white/10 tracking-wider uppercase text-purple-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Teaching Factory Desain Komunikasi Visual
                  </span>
                  <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
                    Pesan Layanan Kreatif
                    <br />
                    <span className="bg-gradient-to-r from-[#5B4BFF] via-purple-400 to-cyan-300 bg-clip-text text-transparent">
                      TEFA DKV SMK NU Ungaran
                    </span>
                  </h1>
                  <p className="text-sm md:text-base text-slate-300 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
                    Solusi cetak cepat dan kebutuhan studio kreatif profesional. Diproduksi langsung oleh siswa bertalenta di bawah supervisi praktisi industri.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      onClick={() => {
                        setCurrentPage('order');
                        setOrderSuccess(null);
                      }}
                      className="w-full sm:w-auto px-8 py-4 bg-[#5B4BFF] hover:bg-[#4a3ce0] text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                      Buat Pesanan Cepat
                    </button>
                    <button
                      onClick={() => {
                        setCurrentPage('tracking');
                        setTrackResult(null);
                      }}
                      className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/15 text-white font-extrabold text-sm rounded-2xl backdrop-blur-md border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">search</span>
                      Cek Status Pesanan
                    </button>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Services Section (70% White / Light background) */}
            <section className="py-20 px-6 bg-white border-b border-slate-100">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Layanan Kreatif Studio</h2>
                  <p className="text-sm text-slate-500 font-bold mt-2">Pilih kategori layanan TEFA DKV sesuai kebutuhan Anda</p>
                  <div className="w-12 h-1 bg-[#5B4BFF] mx-auto mt-4 rounded-full" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {services.map((service, idx) => (
                    <motion.div
                      key={service.id}
                      whileHover={{ y: -6, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)' }}
                      onClick={() => {
                        setOrderForm((prev) => ({ ...prev, service: service.id }));
                        setCurrentPage('order');
                        setOrderSuccess(null);
                      }}
                      className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200/60 text-center cursor-pointer transition-all hover:bg-white hover:border-[#5B4BFF]/30 group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5B4BFF]/10 to-purple-600/10 flex items-center justify-center mx-auto mb-5 group-hover:from-[#5B4BFF] group-hover:to-purple-600 transition-all">
                        <span className="material-symbols-outlined text-[#5B4BFF] text-2xl group-hover:text-white transition-all">
                          {service.icon}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-sm mb-2 group-hover:text-[#5B4BFF] transition-all">
                        {service.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-bold leading-relaxed">{service.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Products Section */}
            <section className="py-20 px-6 bg-slate-50 border-b border-slate-100">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Produk Unggulan</h2>
                  <p className="text-sm text-slate-500 font-bold mt-2">Daftar harga cetak cepat terpopuler (Klik untuk melihat detail & pesan)</p>
                  <div className="w-12 h-1 bg-[#5B4BFF] mx-auto mt-4 rounded-full" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {displayProducts.map((product, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedProduct(product);
                        setSelectedVariant(null);
                      }}
                      className="bg-white p-4 rounded-3xl border border-slate-200/80 hover:shadow-xl transition-all group flex flex-col justify-between cursor-pointer hover:border-[#5B4BFF]/35"
                    >
                      <div>
                        <div className="w-full h-36 bg-slate-100 rounded-2xl mb-4 overflow-hidden relative">
                          <img
                            src={product.img}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                          />
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-xs mb-1.5 leading-tight group-hover:text-[#5B4BFF] transition-colors">{product.name}</h3>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                        <span className="text-[#5B4BFF] font-black text-xs">{product.price}</span>
                        <span className="text-[9px] bg-purple-50 text-[#5B4BFF] font-bold px-2 py-0.5 rounded-full">
                          Detail Info
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Galeri Hasil Karya */}
            <section className="py-20 px-6 bg-white border-b border-slate-100">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Galeri Hasil Karya DKV</h2>
                  <p className="text-sm text-slate-500 font-bold mt-2">Portofolio produksi & karya nyata studio kami</p>
                  <div className="w-12 h-1 bg-[#5B4BFF] mx-auto mt-4 rounded-full" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {galleryItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-200/60 hover:shadow-lg transition-all group"
                    >
                      <div className="w-full h-48 overflow-hidden relative">
                        <img
                          src={item.img}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="text-[10px] bg-white/95 text-slate-800 font-extrabold px-3 py-1 rounded-full shadow-xs backdrop-blur-xs">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h4 className="font-extrabold text-slate-850 text-sm leading-snug">{item.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section className="py-20 px-6 bg-gradient-to-br from-[#0F1322] to-[#171C35] text-white">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-2xl font-black mb-2">Informasi & Hubungi Kami</h2>
                  <p className="text-slate-400 text-xs font-bold">Kami siap menyambut dan memproses pesanan industri Anda</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-md">
                    <span className="material-symbols-outlined text-[#5B4BFF] text-3xl mb-3">phone</span>
                    <h4 className="font-extrabold text-sm mb-1">WhatsApp Customer</h4>
                    <p className="text-xs text-slate-300 font-bold">0812-3456-7890</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-md">
                    <span className="material-symbols-outlined text-[#5B4BFF] text-3xl mb-3">location_on</span>
                    <h4 className="font-extrabold text-sm mb-1">Lokasi Studio</h4>
                    <p className="text-xs text-slate-300 font-bold">Lab DKV, SMK NU Ungaran</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-md">
                    <span className="material-symbols-outlined text-[#5B4BFF] text-3xl mb-3">mail</span>
                    <h4 className="font-extrabold text-sm mb-1">E-mail Studio</h4>
                    <p className="text-xs text-slate-300 font-bold">tefa.dkv@smknuungaran.sch.id</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ORDER PAGE */}
        {currentPage === 'order' && (
          <div className="max-w-2xl mx-auto py-10 px-6 animate-fade-in">
            <button
              onClick={() => {
                setCurrentPage('landing');
                setSelectedFile(null);
                setFileError(null);
                setSelectedOrderProduct(null);
                setSelectedVariant(null);
                setProductQty(1);
              }}
              className="flex items-center gap-2 text-slate-655 hover:text-slate-900 font-extrabold text-xs mb-6 transition-colors cursor-pointer focus:outline-none"
            >
              <span className="material-symbols-outlined text-sm font-black">arrow_back</span>
              Kembali Ke Beranda
            </button>

            <div className="bg-white rounded-[32px] p-8 shadow-md border border-slate-200/80">
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-purple-600 flex items-center justify-center mx-auto mb-4 text-white shadow-md shadow-purple-500/10">
                  <span className="material-symbols-outlined text-white text-2xl">flash_on</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Form Pemesanan Cepat</h2>
                <p className="text-slate-500 text-xs font-bold mt-1">Pesan langsung tanpa ribet dengan pilihan dinamis</p>
              </div>

              {/* Success Result */}
              {orderSuccess && orderSuccessData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#E6F4EA] border border-[#B7E1CD] rounded-[24px] p-6 mb-4 text-center space-y-4"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-3xl text-emerald-600">check_circle</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-emerald-800 mb-1">Pesanan Berhasil Dibuat!</h3>
                    <p className="text-emerald-600 text-xs font-bold">
                      Berikut rincian pesanan instan Anda:
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2.5 font-sans">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Order ID:</span>
                      <span className="text-slate-900 font-black">{orderSuccessData.orderNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Produk:</span>
                      <span className="text-slate-900 font-extrabold text-right max-w-[200px] truncate">{orderSuccessData.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Quantity:</span>
                      <span className="text-slate-900 font-extrabold">{orderSuccessData.qty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Total:</span>
                      <span className="text-[#5B4BFF] font-black">{orderSuccessData.totalPrice}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100 items-center">
                      <span className="text-slate-500 font-bold">Status Awal:</span>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-[10px] font-black">
                        Menunggu Konfirmasi
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 justify-center pt-2">
                    <button
                      onClick={() => {
                        setTrackInput(orderSuccess);
                        setCurrentPage('tracking');
                        setTimeout(handleTrack, 100);
                        setOrderSuccess(null);
                        setOrderSuccessData(null);
                      }}
                      className="px-5 py-2.5 bg-[#5B4BFF] hover:bg-[#4a3ce0] text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-500/10 transition-all cursor-pointer"
                    >
                      Lacak Pesanan
                    </button>
                    <button
                      onClick={() => {
                        setOrderSuccess(null);
                        setOrderSuccessData(null);
                        setCurrentPage('landing');
                      }}
                      className="px-5 py-2.5 bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Kembali ke Beranda
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Order Form */}
              {!orderSuccess && (
                <form onSubmit={handleSubmitOrder} className="space-y-6">
                  {/* Step 1: Customer Data */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                    <h3 className="font-black text-sm text-slate-800 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px]">1</span>
                      Informasi Pemesan
                    </h3>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                        Nama Customer <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        value={orderForm.name}
                        onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                        placeholder="Nama lengkap Anda"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/20 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                        Nomor WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        autoComplete="tel"
                        value={orderForm.whatsapp}
                        onChange={(e) => setOrderForm({ ...orderForm, whatsapp: e.target.value })}
                        placeholder="Contoh: 08123456789"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/20 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                        Email <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        autoComplete="email"
                        value={orderForm.email}
                        onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                        placeholder="email@anda.com"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/20 bg-white"
                      />
                    </div>
                  </div>

                  {/* Step 2: Category & Product */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                    <h3 className="font-black text-sm text-slate-800 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px]">2</span>
                      Pilihan Layanan & Produk
                    </h3>
                    
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-2">
                        Kategori Layanan <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {services.map((service) => (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => {
                              setOrderForm({ ...orderForm, service: service.id });
                              setSelectedOrderProduct(null);
                              setSelectedVariant(null);
                            }}
                            className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                              orderForm.service === service.id
                                ? 'border-[#5B4BFF] bg-[#5B4BFF]/5'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <span className={`material-symbols-outlined text-lg ${orderForm.service === service.id ? 'text-[#5B4BFF]' : 'text-slate-400'}`}>
                              {service.icon}
                            </span>
                            <span className={`font-black text-[11px] ${orderForm.service === service.id ? 'text-[#5B4BFF]' : 'text-slate-700'}`}>
                              {service.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {orderForm.service && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <label className="block text-xs font-extrabold text-slate-700 mt-4 mb-2">
                          Pilih Produk <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/20 bg-white"
                          value={selectedOrderProduct ? selectedOrderProduct.id : ''}
                          onChange={(e) => {
                            const pId = e.target.value;
                            if (pId === 'custom') {
                                setSelectedOrderProduct({
                                    id: 'custom',
                                    name: 'Order Custom (Harga Menunggu Konfirmasi)',
                                    price: 'Menunggu Konfirmasi',
                                    unit: 'pcs',
                                    img: '',
                                    desc: 'Pesanan custom yang tidak ada di daftar',
                                    specs: [],
                                    variants: []
                                });
                                setSelectedVariant(null);
                            } else {
                                const prod = displayProducts.find(p => p.id === pId) || null;
                                setSelectedOrderProduct(prod);
                                setSelectedVariant(null);
                            }
                            setProductQty(1);
                          }}
                          required
                        >
                          <option value="" disabled>-- Pilih Produk --</option>
                          {displayProducts
                            .filter((p) => {
                                const n = p.name.toLowerCase();
                                if (orderForm.service === 'cetak_dokumen') return n.includes('brosur') || n.includes('kartu') || n.includes('dokumen') || n.includes('banner');
                                if (orderForm.service === 'cetak_foto') return n.includes('foto') || n.includes('photo');
                                if (orderForm.service === 'merchandise') return n.includes('mug') || n.includes('pin') || n.includes('id card') || n.includes('stiker');
                                if (orderForm.service === 'custom') return n.includes('desain') || n.includes('layout');
                                return true;
                            })
                            .map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                          <option value="custom">Produk Lain / Custom Size (Harga Admin)</option>
                        </select>
                      </motion.div>
                    )}

                    {selectedOrderProduct && selectedOrderProduct.variants && selectedOrderProduct.variants.length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <label className="block text-xs font-extrabold text-slate-700 mt-4 mb-2">
                          Varian / Ukuran <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/20 bg-white"
                          value={selectedVariant ? selectedVariant.id : ''}
                          onChange={(e) => {
                            const variant = selectedOrderProduct.variants?.find(v => v.id === e.target.value) || null;
                            setSelectedVariant(variant);
                          }}
                          required
                        >
                          <option value="" disabled>-- Pilih Varian --</option>
                          {selectedOrderProduct.variants.map((v: any) => (
                            <option key={v.id} value={v.id}>{v.name} - Rp {Number(v.basePrice).toLocaleString('id-ID')}</option>
                          ))}
                        </select>
                      </motion.div>
                    )}

                    {selectedOrderProduct && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200/50">
                        <label className="block text-xs font-extrabold text-slate-700">
                          Jumlah (Quantity)
                        </label>
                        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-1 w-fit">
                          <button
                            type="button"
                            onClick={() => setProductQty(q => Math.max(1, q - 1))}
                            className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-black text-slate-900">{productQty}</span>
                          <button
                            type="button"
                            onClick={() => setProductQty(q => q + 1)}
                            className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                          >
                            +
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Step 3: Subtotal & Upload */}
                  {selectedOrderProduct && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                      <h3 className="font-black text-sm text-slate-800 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px]">3</span>
                        Detail Akhir
                      </h3>
                      
                      <div className="bg-white border border-[#5B4BFF]/20 rounded-xl p-4 flex justify-between items-center text-xs shadow-xs">
                        <span className="text-slate-600 font-extrabold">Subtotal Pembayaran:</span>
                        <span className="text-[#5B4BFF] font-black text-sm">
                          {selectedOrderProduct.id === 'custom' 
                            ? 'Menunggu Konfirmasi' 
                            : `Rp ${((selectedVariant ? Number(selectedVariant.basePrice) : (parseInt(selectedOrderProduct.price.replace(/[^\d]/g, ''), 10) || 0)) * productQty).toLocaleString('id-ID')}`
                          }
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center justify-between">
                          <span>Upload File Desain {productRequiresFile(selectedOrderProduct) && <span className="text-red-500">*</span>}</span>
                          <span className="text-[9px] text-slate-400 font-medium">Maks: 10MB</span>
                        </label>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".pdf,.jpg,.jpeg,.png,.cdr,.ai"
                          className="hidden"
                        />
                        <div
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer bg-white ${
                            selectedFile
                              ? 'border-emerald-400 bg-emerald-50/20'
                              : fileError
                              ? 'border-red-400 bg-red-50/10'
                              : 'border-slate-300 hover:border-[#5B4BFF]'
                          }`}
                        >
                          {selectedFile ? (
                            <div className="flex flex-col items-center">
                              <span className="material-symbols-outlined text-2xl text-emerald-500 mb-1">check_circle</span>
                              <p className="text-xs text-slate-800 font-black truncate max-w-[200px]">{selectedFile.name}</p>
                              <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="mt-2 px-3 py-1 bg-red-50 text-red-650 font-extrabold text-[10px] rounded-md"
                              >
                                Hapus File
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="material-symbols-outlined text-2xl text-slate-300 mb-1">upload_file</span>
                              <p className="text-[11px] text-slate-500 font-bold">Klik / Seret file desain Anda</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                          Spesifikasi / Catatan Khusus
                        </label>
                        <textarea
                          value={orderForm.notes}
                          onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                          placeholder="Misal: Tolong cetak landscape, ukuran 2x3 meter, bahan tebal..."
                          rows={2}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/20 bg-white resize-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedOrderProduct || (selectedOrderProduct.variants && selectedOrderProduct.variants.length > 0 && !selectedVariant)}
                    className="w-full py-4 bg-[#5B4BFF] hover:bg-[#4a3ce0] text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-500/20 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Memproses...' : 'Kirim Pesanan Sekarang'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
        {/* PRODUCT ORDER PAGE */}
        {currentPage === 'product_order' && selectedOrderProduct && (
          <div className="max-w-xl mx-auto py-10 px-6 animate-fade-in">
            <button
              onClick={() => {
                setCurrentPage('landing');
                setSelectedFile(null);
                setFileError(null);
              }}
              className="flex items-center gap-2 text-slate-655 hover:text-slate-900 font-extrabold text-xs mb-6 transition-colors cursor-pointer focus:outline-none"
            >
              <span className="material-symbols-outlined text-sm font-black">arrow_back</span>
              Kembali Ke Beranda
            </button>

            <div className="bg-white rounded-[32px] p-8 shadow-md border border-slate-200/80">
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-purple-600 flex items-center justify-center mx-auto mb-4 text-white shadow-md shadow-purple-500/10">
                  <span className="material-symbols-outlined text-white text-2xl">shopping_cart</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Form Pemesanan Produk</h2>
                <p className="text-slate-500 text-xs font-bold mt-1">Isi formulir berikut untuk melakukan pemesanan</p>
              </div>

              {/* Success Result */}
              {orderSuccess && orderSuccessData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 mb-4 text-center space-y-4"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-3xl text-emerald-600">check_circle</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-emerald-800 mb-1">Pesanan Berhasil Dibuat!</h3>
                    <p className="text-emerald-600 text-xs font-bold">
                      Berikut rincian pesanan instan Anda:
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2.5 font-sans">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Order ID:</span>
                      <span className="text-slate-900 font-black">{orderSuccessData.orderNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Produk:</span>
                      <span className="text-slate-900 font-extrabold text-right max-w-[200px] truncate">{orderSuccessData.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Quantity:</span>
                      <span className="text-slate-900 font-extrabold">{orderSuccessData.qty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Total:</span>
                      <span className="text-[#5B4BFF] font-black">{orderSuccessData.totalPrice}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100 items-center">
                      <span className="text-slate-500 font-bold">Status Awal:</span>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-[10px] font-black">
                        Menunggu Konfirmasi
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 justify-center pt-2">
                    <button
                      onClick={() => {
                        setTrackInput(orderSuccess);
                        setCurrentPage('tracking');
                        setTimeout(handleTrack, 100);
                        setOrderSuccess(null);
                        setOrderSuccessData(null);
                      }}
                      className="px-5 py-2.5 bg-[#5B4BFF] hover:bg-[#4a3ce0] text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-500/10 transition-all cursor-pointer"
                    >
                      Lacak Pesanan
                    </button>
                    <button
                      onClick={() => {
                        setOrderSuccess(null);
                        setOrderSuccessData(null);
                        setCurrentPage('landing');
                      }}
                      className="px-5 py-2.5 bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Kembali ke Beranda
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Order Form */}
              {!orderSuccess && (
                <form onSubmit={handleSubmitOrder} className="space-y-5">
                  {/* Selected Product Card Details */}
                  <div className="bg-slate-50/70 border border-slate-200 p-4 rounded-2xl flex gap-3 text-left">
                    <div className="w-16 h-16 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                      <img src={selectedOrderProduct.img} alt={selectedOrderProduct.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-purple-650 font-extrabold uppercase tracking-wide">
                        Produk Terpilih
                      </p>
                      <h4 className="font-extrabold text-slate-800 text-xs truncate mt-0.5">{selectedOrderProduct.name}</h4>
                      <p className="text-slate-500 font-semibold text-[10px] mt-0.5">Tarif: {selectedOrderProduct.price}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Nama Customer <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={orderForm.name}
                      onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                      placeholder="Nama lengkap Anda"
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/5 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Nomor WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={orderForm.whatsapp}
                      onChange={(e) => setOrderForm({ ...orderForm, whatsapp: e.target.value })}
                      placeholder="Contoh: 08123456789"
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/5 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Email <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={orderForm.email}
                      onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                      placeholder="email@anda.com"
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/5 bg-slate-50/50"
                    />
                  </div>

                  {/* Varian Produk (if available) */}
                  {selectedOrderProduct.variants && selectedOrderProduct.variants.length > 0 && (
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                        Pilih Varian Produk <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/5 bg-slate-50/50"
                        value={selectedVariant ? selectedVariant.id : ''}
                        onChange={(e) => {
                          const variant = selectedOrderProduct.variants?.find(v => v.id === e.target.value) || null;
                          setSelectedVariant(variant);
                        }}
                        required
                      >
                        <option value="" disabled>-- Pilih Varian --</option>
                        {selectedOrderProduct.variants.map((v: any) => (
                          <option key={v.id} value={v.id}>{v.name} - Rp {Number(v.basePrice).toLocaleString('id-ID')}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Quantity selector with realtime calculation */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-2">
                      Jumlah Pesanan (Quantity)
                    </label>
                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-2 w-fit">
                      <button
                        type="button"
                        onClick={() => setProductQty(q => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-250 flex items-center justify-center font-bold text-slate-750 hover:bg-slate-100 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-xs font-black text-slate-900">{productQty}</span>
                      <button
                        type="button"
                        onClick={() => setProductQty(q => q + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-250 flex items-center justify-center font-bold text-slate-750 hover:bg-slate-100 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Realtime Subtotal */}
                  <div className="bg-[#5B4BFF]/5 border border-[#5B4BFF]/15 rounded-2xl p-4 flex justify-between items-center text-xs">
                    <span className="text-slate-655 font-bold">Total Pembayaran:</span>
                    <span className="text-[#5B4BFF] font-black text-sm">
                      Rp {((selectedVariant ? Number(selectedVariant.basePrice) : (parseInt(selectedOrderProduct.price.replace(/[^\d]/g, ''), 10) || 0)) * productQty).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* File Upload (Required if product requires it) */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Upload File Desain {productRequiresFile(selectedOrderProduct) && <span className="text-red-500">*</span>}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Maksimal 10MB</span>
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png,.cdr,.ai"
                      className="hidden"
                      id="guest-artwork-product-upload"
                    />
                    
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer bg-slate-50/30 ${
                        selectedFile
                          ? 'border-emerald-500 bg-emerald-50/15'
                          : fileError
                          ? 'border-red-400 bg-red-50/10'
                          : 'border-slate-300 hover:border-[#5B4BFF]'
                      }`}
                    >
                      {selectedFile ? (
                        <div className="flex flex-col items-center">
                          <span className="material-symbols-outlined text-3xl text-emerald-500 mb-2">check_circle</span>
                          <p className="text-xs text-slate-800 font-black truncate max-w-xs">{selectedFile.name}</p>
                          <p className="text-[10px] text-slate-500 font-semibold mt-1">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="mt-3 px-3 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 font-extrabold text-[10px] rounded-lg transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[12px]">delete</span>
                            Hapus File
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">upload_file</span>
                          <p className="text-xs text-slate-500 font-bold">Klik atau seret (drag & drop) berkas ke sini</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Format: PDF, JPG, PNG, CDR, AI</p>
                        </div>
                      )}
                    </div>
                    {fileError && (
                      <p className="text-[10px] text-red-550 font-bold mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] font-black">error</span>
                        {fileError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Catatan / Instruksi Tambahan <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={orderForm.notes}
                      onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                      placeholder="Tuliskan ukuran kustom, finishing, atau instruksi pengerjaan..."
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/5 bg-slate-50/50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#5B4BFF] hover:bg-[#4a3ce0] text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-500/20 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined text-base animate-spin">sync</span>
                        Mengirim Pesanan...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">send</span>
                        Kirim Pesanan
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TRACKING PAGE */}
        {currentPage === 'tracking' && (
          <div className="max-w-xl mx-auto py-10 px-6 animate-fade-in">
            <button
              onClick={() => {
                setCurrentPage('landing');
                setTrackResult(null);
              }}
              className="flex items-center gap-2 text-slate-655 hover:text-slate-900 font-extrabold text-xs mb-6 transition-colors cursor-pointer focus:outline-none"
            >
              <span className="material-symbols-outlined text-sm font-black">arrow_back</span>
              Kembali Ke Beranda
            </button>

            <div className="bg-white rounded-[32px] p-8 shadow-md border border-slate-200/80">
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-purple-600 flex items-center justify-center mx-auto mb-4 text-white shadow-md shadow-purple-500/10">
                  <span className="material-symbols-outlined text-white text-2xl">search</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Lacak Status Pesanan</h2>
                <p className="text-slate-500 text-xs font-bold mt-1">Masukkan ID Order atau Nomor WhatsApp terdaftar</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Order ID atau No. WhatsApp</label>
                  <input
                    type="text"
                    value={trackInput}
                    onChange={(e) => setTrackInput(e.target.value)}
                    placeholder="Contoh: TEFA-GUEST-2026-001 atau 0812xxxxx"
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/5 bg-slate-50/50"
                  />
                </div>

                <button
                  onClick={handleTrack}
                  className="w-full py-4 bg-[#5B4BFF] hover:bg-[#4a3ce0] text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">search</span>
                  Mulai Lacak
                </button>
              </div>

              {/* Track Result Display */}
              {trackResult && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 bg-slate-50/80 rounded-2xl p-6 border border-slate-200/50"
                >
                  <h3 className="font-extrabold text-slate-800 text-sm mb-4 pb-2 border-b border-slate-200">
                    Detail Pesanan
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-bold">Order ID</span>
                      <span className="font-black text-slate-800">{trackResult.orderId}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-bold">Layanan</span>
                      <div className="text-right">
                        {trackResult.items?.map((item: any, idx: number) => (
                          <div key={idx} className="font-extrabold text-slate-800">
                            {item.productName} {item.variantName ? `- ${item.variantName}` : ''} ({item.qty} {item.unit || 'pcs'})
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-bold">Total Tagihan</span>
                      <span className="font-black text-[#5B4BFF]">
                        {trackResult.totalAmount > 0 ? `Rp ${trackResult.totalAmount.toLocaleString('id-ID')}` : 'Menunggu Konfirmasi'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-bold">Tanggal Order</span>
                      <span className="font-extrabold text-slate-800">{trackResult.date}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-bold">Status Utama</span>
                      <span className="px-3 py-1 bg-[#5B4BFF]/10 text-[#5B4BFF] font-black rounded-full text-[10px]">
                        {trackResult.status}
                      </span>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <h4 className="font-extrabold text-slate-800 text-xs mb-5">Timeline Progress Produksi</h4>
                    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {['Menunggu Admin', 'Diproses', 'Selesai', 'Diterima'].map((step) => {
                        // Check if step is completed based on current status
                        const getStepWeight = (statusName: string) => {
                          if (statusName === 'Menunggu Admin') return 1;
                          if (statusName === 'Diproses') return 2;
                          if (statusName === 'Selesai') return 3;
                          if (statusName === 'Diterima') return 4;
                          return 0;
                        };
                        const currentWeight = getStepWeight(trackResult.status);
                        const stepWeight = getStepWeight(step);
                        const isDone = currentWeight >= stepWeight;
                        const isCurrent = currentWeight === stepWeight;

                        return (
                          <div key={step} className="relative flex items-center gap-3">
                            <div
                              className={`absolute -left-6 w-3 h-3 rounded-full border-2 transition-all ${
                                isDone
                                  ? 'bg-[#5B4BFF] border-[#5B4BFF] ring-4 ring-[#5B4BFF]/20'
                                  : 'bg-white border-slate-300'
                              }`}
                            />
                            <span
                              className={`text-xs ${
                                isCurrent
                                  ? 'text-[#5B4BFF] font-black'
                                  : isDone
                                  ? 'text-slate-800 font-bold'
                                  : 'text-slate-400 font-semibold'
                              }`}
                            >
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-[#0F1322]/80 backdrop-blur-xs"
            />
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] overflow-hidden max-w-lg w-full relative z-10 shadow-2xl border border-slate-200 flex flex-col"
            >
              {/* Product Image Header */}
              <div className="w-full h-56 relative bg-slate-100">
                <img
                  src={selectedProduct.img}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md text-slate-800 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg font-black">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[50vh]">
                <span className="text-[10px] bg-[#5B4BFF]/10 text-[#5B4BFF] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  Produk Unggulan
                </span>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-2.5 mb-1.5 leading-tight">
                  {selectedProduct.name}
                </h3>
                <p className="text-[#5B4BFF] font-black text-lg mb-4">{selectedProduct.price}</p>
                
                <h4 className="text-xs font-extrabold text-slate-800 mb-1.5">Deskripsi Produk</h4>
                <p className="text-xs text-slate-600 font-bold leading-relaxed mb-6">
                  {selectedProduct.desc}
                </p>

                <h4 className="text-xs font-extrabold text-slate-800 mb-2.5">Spesifikasi Standar</h4>
                <ul className="space-y-1.5 mb-2">
                  {selectedProduct.specs.map((spec, i) => (
                    <li key={i} className="text-xs text-slate-600 font-bold flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BFF] mt-1.5 shrink-0" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Footer */}
              <div className="p-6 border-t border-slate-150 bg-slate-50 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold">Mulai dari</span>
                  <p className="text-[#5B4BFF] font-black text-sm">{selectedProduct.price}</p>
                </div>
                <button
                  onClick={() => handleProductOrderClick(selectedProduct)}
                  className="px-6 py-3 bg-[#5B4BFF] hover:bg-[#4a3ce0] text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">shopping_cart</span>
                  Pesan Sekarang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/60 bg-white text-slate-450 text-center text-[10px] font-bold">
        <p>© 2026 TEFA DKV SMK NU Ungaran. All rights reserved.</p>
      </footer>
    </div>
  );
};

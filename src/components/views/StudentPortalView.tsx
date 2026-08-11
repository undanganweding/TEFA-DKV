import React, { useState } from 'react';
import { InboxFile, Product, ProductionOrder, UserProfile } from '../../types';

interface StudentPortalViewProps {
  products: Product[];
  orders: ProductionOrder[];
  inboxFiles: InboxFile[];
  onAddInboxFile: (file: InboxFile) => void;
  onAddOrder?: (order: ProductionOrder) => void;
  onSwitchToAdmin?: () => void;
  currentUser?: UserProfile | null;
  onUpdateProfile?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
}

export type StudentNavId =
  | 'dashboard'
  | 'produk'
  | 'buat_pesanan'
  | 'upload_file'
  | 'pesanan_saya'
  | 'file_saya'
  | 'custom_order'
  | 'riwayat_transaksi'
  | 'notifikasi'
  | 'profil_saya';

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  products = [],
  orders = [],
  inboxFiles = [],
  onAddInboxFile,
  onAddOrder,
  onSwitchToAdmin,
  currentUser,
  onUpdateProfile,
  onLogout,
}) => {
  // Navigation State
  const [activeNav, setActiveNav] = useState<StudentNavId>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [productPage, setProductPage] = useState<number>(1);
  const itemsPerPage = 6;

  // Selected Product for Detail Modal / Order Flow
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [detailQty, setDetailQty] = useState<number>(1);
  const [detailSize, setDetailSize] = useState<string>('Standard');
  const [detailMaterial, setDetailMaterial] = useState<string>('Biasa / Standar');
  const [detailNotes, setDetailNotes] = useState<string>('');
  const [detailFile, setDetailFile] = useState<{
    name: string;
    size: string;
    type: 'JPG' | 'PNG' | 'PDF' | 'PSD' | 'AI' | 'CDR' | 'ZIP';
    previewUrl?: string;
  } | null>(null);

  // Standalone File Upload / Order Form state
  const [customerName, setCustomerName] = useState<string>(currentUser?.name || 'Ahmad Fauzi');
  const [phone, setPhone] = useState<string>(currentUser?.phone || '081234567890');
  const [email, setEmail] = useState<string>(currentUser?.email || 'ahmad.fauzi@smknuungaran.sch.id');
  const [nis, setNis] = useState<string>(currentUser?.nis || '202611045');
  const [classGrade, setClassGrade] = useState<string>(currentUser?.studentClass || 'XI DKV 1');
  const [major, setMajor] = useState<string>(currentUser?.major || 'DKV');

  // Drag & drop standalone file state
  const [standaloneFile, setStandaloneFile] = useState<{
    name: string;
    size: string;
    type: 'JPG' | 'PNG' | 'PDF' | 'PSD' | 'AI' | 'CDR' | 'ZIP';
    previewUrl?: string;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<string>('Cetak Banner Flexi');
  const [standaloneQty, setStandaloneQty] = useState<number>(1);
  const [standaloneSizeSpec, setStandaloneSizeSpec] = useState<string>('');
  const [standaloneNotes, setStandaloneNotes] = useState<string>('');

  // Custom Order Form state
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDesc, setCustomDesc] = useState<string>('');
  const [customSize, setCustomSize] = useState<string>('');
  const [customQty, setCustomQty] = useState<number>(1);
  const [customDeadline, setCustomDeadline] = useState<string>('2026-08-15');
  const [customRefFile, setCustomRefFile] = useState<{ name: string; size: string } | null>(null);

  // Success Notification / Modal State
  const [submittedOrderSuccess, setSubmittedOrderSuccess] = useState<{
    orderId: string;
    productName: string;
    totalAmount: number;
  } | null>(null);

  // Notification Drawer State
  const [showNotificationDrawer, setShowNotificationDrawer] = useState<boolean>(false);
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'Order TEFA-2026-88123 Diterima', text: 'File desain kamu telah diverifikasi oleh tim operator TEFA.', time: '10 menit yang lalu', unread: true },
    { id: 'n2', title: 'Pesanan Masuk Tahap Produksi', text: 'Cetak Banner Flexi 3x1m sedang diproses pada mesin outdoor.', time: '2 jam yang lalu', unread: true },
    { id: 'n3', title: 'Pesanan Selesai!', text: 'Order TEFA-2026-77341 siap diambil di Studio TEFA DKV.', time: '1 hari yang lalu', unread: false },
  ]);

  // Profile Edit State & Avatar Upload Modal
  const [profileAvatar, setProfileAvatar] = useState<string>(
    currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'
  );
  const [showAvatarCropModal, setShowAvatarCropModal] = useState<boolean>(false);
  const [tempAvatarPreview, setTempAvatarPreview] = useState<string | null>(null);

  // Filter Active Products from Admin Database
  const activeProducts = products.filter((p) => p.status === 'Aktif' && !p.isArchived && p.showInCustomerPlatform !== false);

  // Categories Mapping
  const categoriesList = ['All', 'Printing', 'Foto', 'Sublim', 'Merchandise', 'Desain'];

  const filteredProducts = activeProducts.filter((p) => {
    // Search Filter
    if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Category Filter
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Printing') return p.category === 'Cetak Outdoor' || p.category === 'Cetak Indoor / A3+';
    if (selectedCategory === 'Foto') return p.name.toLowerCase().includes('foto') || p.category === 'Cetak Indoor / A3+';
    if (selectedCategory === 'Sublim') return p.name.toLowerCase().includes('sublim') || p.category === 'Merchandise';
    if (selectedCategory === 'Merchandise') return p.category === 'Merchandise';
    if (selectedCategory === 'Desain') return p.category === 'Desain & Creative';
    return true;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * itemsPerPage,
    productPage * itemsPerPage
  );

  // Filter Orders for Current Student (Matches name or phone or shows all active student orders)
  const myOrders = orders.filter((o) => !o.isArchived);
  const myFiles = inboxFiles.filter((f) => !f.isArchived);

  // Order Submission Helper
  const handleCreateOrderSubmit = (
    productName: string,
    unitPrice: number,
    qty: number,
    sizeSpec: string,
    material: string,
    notes: string,
    fileData?: { name: string; size: string; type: any; previewUrl?: string } | null
  ) => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderId = `TEFA-2026-${randomNum}`;
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')} Agu 2026 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const totalAmount = unitPrice * qty;

    const fileToUpload = fileData || {
      name: `file_desain_${productName.toLowerCase().replace(/\s+/g, '_')}.jpg`,
      size: '4.2 MB',
      type: 'JPG' as const,
      previewUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80',
    };

    // 1. Create File Inbox Item
    const newInboxFile: InboxFile = {
      id: orderId,
      uploadDate: formattedDate,
      customerName: customerName,
      classGrade: `${classGrade} (${major})`,
      major: major,
      phone: phone,
      serviceType: productName,
      printSize: sizeSpec || 'Standard',
      qty: qty,
      notes: notes ? `[Material: ${material}] ${notes}` : `Material: ${material}`,
      fileName: fileToUpload.name,
      fileType: fileToUpload.type,
      fileSize: fileToUpload.size,
      previewUrl: fileToUpload.previewUrl,
      folderPath: `/TEFA_FILES/2026/STUDENTS/${orderId}/${fileToUpload.name}`,
      status: 'Menunggu Pemeriksaan',
      linkedOrderNo: orderId,
    };

    onAddInboxFile(newInboxFile);

    // 2. Create Production Order for Admin
    if (onAddOrder) {
      const newProdOrder: ProductionOrder = {
        id: orderId,
        orderNo: orderId,
        customerName: customerName,
        customerPhone: phone,
        customerEmail: email,
        institution: `SMK NU Ungaran (${classGrade})`,
        orderDate: '2026-08-11',
        dueDate: '2026-08-13 15:00',
        status: 'Menunggu Admin',
        paymentStatus: 'Belum Bayar',
        items: [
          {
            id: `item-${Date.now()}`,
            productId: selectedProductForDetail?.id || 'p-gen',
            productName: productName,
            category: selectedCategory,
            unit: selectedProductForDetail?.unit || 'pcs',
            unitPrice: unitPrice,
            qty: qty,
            notes: notes ? `[Spesifikasi: ${sizeSpec}, Material: ${material}] ${notes}` : `Spesifikasi: ${sizeSpec}`,
            totalPrice: totalAmount,
            fileName: fileToUpload.name,
          },
        ],
        subtotal: totalAmount,
        discount: 0,
        taxAmount: 0,
        totalAmount: totalAmount,
        paidAmount: 0,
        balanceDue: totalAmount,
        operatorName: 'Sistem Portal Siswa',
        priority: 'Normal',
        notes: notes,
        statusHistory: [
          {
            status: 'Menunggu Admin',
            timestamp: formattedDate,
            updatedBy: customerName,
            note: 'Order dan file diunggah oleh siswa via Student TEFA Platform.',
          },
        ],
      };
      onAddOrder(newProdOrder);
    }

    // Add notification
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `Pesanan ${orderId} Berhasil Dibuat`,
        text: `Order ${productName} telah terkirim ke Admin TEFA.`,
        time: 'Baru saja',
        unread: true,
      },
      ...prev,
    ]);

    // Show success alert & popup
    setSubmittedOrderSuccess({ orderId, productName, totalAmount });
    setSelectedProductForDetail(null);
  };

  // Avatar Upload Helper
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2 MB!');
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setTempAvatarPreview(imageUrl);
      setShowAvatarCropModal(true);
    }
  };

  const handleSaveAvatar = () => {
    if (tempAvatarPreview) {
      setProfileAvatar(tempAvatarPreview);
      if (currentUser && onUpdateProfile) {
        onUpdateProfile({
          ...currentUser,
          avatar: tempAvatarPreview,
          name: customerName,
          phone: phone,
          email: email,
          nis: nis,
          studentClass: classGrade,
          major: major,
        });
      }
      setShowAvatarCropModal(false);
      alert('Foto profil berhasil diperbarui!');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1322] text-slate-100 font-sans flex flex-col justify-between selection:bg-[#5B4BFF] selection:text-white">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#151A2D]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>

            <div
              onClick={() => setActiveNav('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] via-purple-600 to-[#3BA7FF] flex items-center justify-center text-white shadow-lg shadow-purple-900/40 border border-white/20 group-hover:scale-105 transition-all">
                <span className="material-symbols-outlined text-xl">school</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-white text-base tracking-tight leading-none group-hover:text-purple-300 transition-colors">
                    TEFA DKV
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 uppercase tracking-wider">
                    STUDENT PORTAL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  SMK NU UNGARAN CREATIVE STUDIO
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk, layanan TEFA, banner, mug..."
                className="w-full bg-[#1A2035] text-slate-200 text-xs font-semibold pl-10 pr-4 py-2.5 rounded-2xl border border-slate-700/80 focus:border-[#5B4BFF] focus:outline-hidden transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Header Controls (Notifications, Profile Avatar & Admin Switcher) */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
                className="w-10 h-10 rounded-2xl bg-[#1A2035] hover:bg-[#252E4D] border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center relative transition-all active:scale-95 cursor-pointer"
                title="Notifikasi"
              >
                <span className="material-symbols-outlined text-xl">notifications</span>
                {notifications.some((n) => n.unread) && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#151A2D] animate-pulse"></span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotificationDrawer && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#1A2035] rounded-3xl border border-slate-700/90 shadow-2xl z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/70">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-400 text-lg">notifications</span>
                      <h4 className="font-extrabold text-white text-xs">Notifikasi Pesanan</h4>
                    </div>
                    <button
                      onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))}
                      className="text-[10px] text-purple-300 hover:underline font-bold"
                    >
                      Tandai Dibaca
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-2xl border text-xs transition-colors ${
                          notif.unread
                            ? 'bg-[#5B4BFF]/15 border-[#5B4BFF]/40 text-slate-200'
                            : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                        }`}
                      >
                        <p className="font-bold text-white text-xs">{notif.title}</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">{notif.text}</p>
                        <span className="text-[9px] text-slate-400 font-medium block mt-1">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Quick Link */}
            <div
              onClick={() => setActiveNav('profil_saya')}
              className="flex items-center gap-2.5 bg-[#1A2035] hover:bg-[#252E4D] p-1.5 pr-3 rounded-2xl border border-slate-700/80 cursor-pointer transition-all"
            >
              <img
                src={profileAvatar}
                alt="Student Avatar"
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-[#5B4BFF]/50"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-black text-white leading-none">{customerName.split(' ')[0]}</p>
                <p className="text-[10px] font-bold text-purple-300 mt-0.5">{classGrade}</p>
              </div>
            </div>

            {/* Switch to Admin Platform */}
            {onSwitchToAdmin && (
              <button
                onClick={onSwitchToAdmin}
                className="bg-gradient-to-r from-[#5B4BFF] to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-2xl transition-all flex items-center gap-1.5 shadow-md shadow-purple-900/30 cursor-pointer shrink-0"
                title="Buka Platform Admin TEFA"
              >
                <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                <span className="hidden lg:inline">Admin Mode</span>
              </button>
            )}

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-9 h-9 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Logout"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. BODY CONTAINER WITH SIDEBAR & WORKSPACE */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex gap-6">
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#151A2D] lg:bg-transparent border-r lg:border-r-0 border-slate-800 p-4 lg:p-0 flex flex-col shrink-0 transition-transform duration-200 ${
            isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="bg-[#151A2D] p-4 rounded-[28px] border border-slate-800/90 shadow-2xl space-y-2 sticky top-24">
            <div className="px-3 py-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              STUDENT MENU
            </div>

            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
                { id: 'produk', label: 'Produk & Layanan', icon: 'grid_view' },
                { id: 'buat_pesanan', label: 'Buat Pesanan', icon: 'shopping_bag' },
                { id: 'upload_file', label: 'Upload File', icon: 'cloud_upload' },
                { id: 'pesanan_saya', label: 'Pesanan Saya', icon: 'inventory_2', badge: myOrders.length },
                { id: 'file_saya', label: 'File Saya', icon: 'folder', badge: myFiles.length },
                { id: 'custom_order', label: 'Custom Order', icon: 'auto_awesome' },
                { id: 'riwayat_transaksi', label: 'Riwayat Transaksi', icon: 'receipt_long' },
                { id: 'notifikasi', label: 'Notifikasi', icon: 'notifications' },
                { id: 'profil_saya', label: 'Profil Saya', icon: 'account_circle' },
              ].map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveNav(item.id as StudentNavId);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#5B4BFF] to-indigo-600 text-white shadow-lg shadow-purple-900/40 translate-x-1'
                        : 'text-slate-400 hover:text-white hover:bg-[#1C233B]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-lg ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                        isActive ? 'bg-white text-[#5B4BFF]' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Student ID Badge Footer Card */}
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-b from-[#1C233B] to-[#121627] border border-slate-700/60 text-center space-y-2">
              <div className="w-12 h-12 rounded-full ring-2 ring-[#5B4BFF] p-0.5 mx-auto overflow-hidden">
                <img src={profileAvatar} alt="Profile Avatar" className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <p className="text-xs font-black text-white truncate">{customerName}</p>
                <p className="text-[10px] font-bold text-purple-300">NIS: {nis} • {classGrade}</p>
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#5B4BFF]/20 text-[#5B4BFF] border border-[#5B4BFF]/30">
                Siswa Aktif SMK NU
              </span>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden"
          ></div>
        )}

        {/* MAIN WORKSPACE CONTENT VIEW */}
        <main className="flex-1 min-w-0">
          {/* ================= PAGE 1: DASHBOARD HOME ================= */}
          {activeNav === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* HERO WELCOME SECTION */}
              <div className="bg-gradient-to-br from-[#151A2D] via-[#1C233B] to-[#252E4D] rounded-[32px] p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#5B4BFF]/25 rounded-full filter blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B4BFF]/30 border border-[#5B4BFF]/50 text-xs font-extrabold text-purple-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Teaching Factory DKV SMK NU Ungaran</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                      Selamat datang, {customerName.split(' ')[0]} 👋
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                      Kelola kebutuhan kreatif kamu melalui TEFA DKV Creative Studio. Buat pesanan cetak, unggah file tugas, minta desain khusus, dan lacak status pengerjaannya secara realtime.
                    </p>

                    <div className="pt-2 flex flex-wrap gap-2.5">
                      <button
                        onClick={() => setActiveNav('buat_pesanan')}
                        className="bg-gradient-to-r from-[#5B4BFF] to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-purple-900/40 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-lg">shopping_bag</span>
                        <span>Buat Pesanan Baru</span>
                      </button>

                      <button
                        onClick={() => setActiveNav('upload_file')}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-extrabold text-xs px-5 py-3 rounded-2xl transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg text-purple-300">cloud_upload</span>
                        <span>Upload File Desain</span>
                      </button>
                    </div>
                  </div>

                  {/* Student Card Info Widget */}
                  <div className="bg-[#151A2D]/80 backdrop-blur-md p-5 rounded-3xl border border-slate-700/80 text-center space-y-3 shrink-0 w-full md:w-64 shadow-xl">
                    <img
                      src={profileAvatar}
                      alt="Student Avatar"
                      className="w-20 h-20 rounded-2xl mx-auto object-cover ring-4 ring-[#5B4BFF]/60 shadow-md"
                    />
                    <div>
                      <h3 className="font-black text-white text-sm">{customerName}</h3>
                      <p className="text-xs font-bold text-purple-300">NIS: {nis}</p>
                      <span className="mt-1 inline-block px-3 py-1 rounded-full text-[10px] font-black bg-[#5B4BFF] text-white">
                        {classGrade} • {major}
                      </span>
                    </div>

                    {/* Quick stats badges */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                      <div>
                        <p className="font-black text-white text-sm">{myOrders.length}</p>
                        <p className="text-[9px] text-slate-400 font-bold">Total Order</p>
                      </div>
                      <div>
                        <p className="font-black text-amber-400 text-sm">
                          {myOrders.filter((o) => o.status !== 'Selesai' && o.status !== 'Dibatalkan').length}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold">Aktif</p>
                      </div>
                      <div>
                        <p className="font-black text-emerald-400 text-sm">
                          {myOrders.filter((o) => o.status === 'Selesai').length}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold">Selesai</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK ACTION AREA (4 Large Interactive Cards) */}
              <div>
                <h3 className="font-black text-white text-lg tracking-tight mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-400">bolt</span>
                  <span>Akses Cepat Student Platform</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Upload File */}
                  <div
                    onClick={() => setActiveNav('upload_file')}
                    className="bg-[#151A2D] hover:bg-[#1C233B] p-6 rounded-[28px] border border-slate-800 hover:border-[#5B4BFF]/60 transition-all cursor-pointer group shadow-xl hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#5B4BFF]/20 text-[#5B4BFF] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#5B4BFF] group-hover:text-white transition-all">
                      <span className="material-symbols-outlined text-2xl">folder</span>
                    </div>
                    <h4 className="font-black text-white text-base group-hover:text-purple-300 transition-colors">
                      Upload File
                    </h4>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Kirim file desain untuk diproses tim TEFA DKV
                    </p>
                  </div>

                  {/* Card 2: Buat Pesanan */}
                  <div
                    onClick={() => setActiveNav('buat_pesanan')}
                    className="bg-[#151A2D] hover:bg-[#1C233B] p-6 rounded-[28px] border border-slate-800 hover:border-[#5B4BFF]/60 transition-all cursor-pointer group shadow-xl hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <span className="material-symbols-outlined text-2xl">shopping_bag</span>
                    </div>
                    <h4 className="font-black text-white text-base group-hover:text-purple-300 transition-colors">
                      Buat Pesanan
                    </h4>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Pilih layanan TEFA DKV (Cetak, Foto, Merchandise)
                    </p>
                  </div>

                  {/* Card 3: Custom Order */}
                  <div
                    onClick={() => setActiveNav('custom_order')}
                    className="bg-[#151A2D] hover:bg-[#1C233B] p-6 rounded-[28px] border border-slate-800 hover:border-[#5B4BFF]/60 transition-all cursor-pointer group shadow-xl hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                      <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                    </div>
                    <h4 className="font-black text-white text-base group-hover:text-purple-300 transition-colors">
                      Custom Order
                    </h4>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Buat request desain & pengerjaan khusus
                    </p>
                  </div>

                  {/* Card 4: Tracking */}
                  <div
                    onClick={() => setActiveNav('pesanan_saya')}
                    className="bg-[#151A2D] hover:bg-[#1C233B] p-6 rounded-[28px] border border-slate-800 hover:border-[#5B4BFF]/60 transition-all cursor-pointer group shadow-xl hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                      <span className="material-symbols-outlined text-2xl">my_location</span>
                    </div>
                    <h4 className="font-black text-white text-base group-hover:text-purple-300 transition-colors">
                      Tracking Order
                    </h4>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Lihat status pengerjaan pesanan kamu
                    </p>
                  </div>
                </div>
              </div>

              {/* PRODUCT SHOWCASE ("LAYANAN TEFA") FROM REAL ADMIN PRODUCT DATABASE */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-white text-lg tracking-tight">Layanan TEFA DKV</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Pilih dari katalog produk resmi TEFA DKV SMK NU Ungaran
                    </p>
                  </div>

                  {/* Category Pills Filter */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {categoriesList.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setProductPage(1);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-[#5B4BFF] text-white shadow-md'
                            : 'bg-[#151A2D] hover:bg-[#1C233B] text-slate-400 border border-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products Grid (6 Items per page) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginatedProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-[#151A2D] rounded-[28px] border border-slate-800 hover:border-[#5B4BFF]/50 p-4 flex flex-col justify-between space-y-4 transition-all shadow-xl hover:-translate-y-1 group"
                    >
                      <div className="space-y-3">
                        {/* Product Image */}
                        <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                          <img
                            src={
                              prod.coverImage ||
                              prod.images?.[0] ||
                              prod.image ||
                              'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80'
                            }
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-[#151A2D]/80 backdrop-blur-md text-purple-300 border border-slate-700">
                            {prod.category}
                          </span>
                        </div>

                        {/* Product Info */}
                        <div>
                          <h4 className="font-black text-white text-base line-clamp-1 group-hover:text-purple-300 transition-colors">
                            {prod.name}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium line-clamp-2 mt-1">
                            {prod.description || 'Layanan cetak & kreatif berkualitas tinggi oleh TEFA DKV.'}
                          </p>
                        </div>
                      </div>

                      {/* Pricing & CTA */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block">Harga / {prod.unit}</span>
                          <span className="font-black text-purple-400 text-sm">
                            Rp {prod.basePrice.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedProductForDetail(prod)}
                          className="bg-[#5B4BFF] hover:bg-indigo-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-purple-900/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <span>Pesan Sekarang</span>
                          <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setProductPage(pageNum)}
                        className={`w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          productPage === pageNum
                            ? 'bg-[#5B4BFF] text-white shadow-lg shadow-purple-900/40'
                            : 'bg-[#151A2D] text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    {productPage < totalPages && (
                      <button
                        onClick={() => setProductPage((prev) => Math.min(prev + 1, totalPages))}
                        className="px-3 py-2 bg-[#151A2D] hover:bg-[#1C233B] text-slate-300 rounded-xl text-xs font-bold border border-slate-800 cursor-pointer"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= PAGE 2: PRODUK & LAYANAN KATALOG ================= */}
          {activeNav === 'produk' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-[#151A2D] p-6 rounded-[28px] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Katalog Produk & Layanan TEFA</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Seluruh produk dan jasa kreatif dari Admin TEFA DKV SMK NU Ungaran
                  </p>
                </div>

                {/* Search in page */}
                <div className="w-full md:w-72">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari produk..."
                    className="w-full bg-[#1A2035] text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-2xl border border-slate-700/80 focus:border-[#5B4BFF] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setProductPage(1);
                    }}
                    className={`px-4 py-2 rounded-2xl text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#5B4BFF] text-white shadow-md'
                        : 'bg-[#151A2D] hover:bg-[#1C233B] text-slate-400 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-[#151A2D] rounded-[28px] border border-slate-800 hover:border-[#5B4BFF]/50 p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all hover:-translate-y-1 group"
                  >
                    <div className="space-y-3">
                      <div className="relative h-48 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                        <img
                          src={
                            prod.image ||
                            'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80'
                          }
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black bg-[#151A2D]/80 backdrop-blur-md text-purple-300 border border-slate-700">
                          {prod.category}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-white text-base line-clamp-1">{prod.name}</h4>
                        <p className="text-xs text-slate-400 font-medium line-clamp-2 mt-1">
                          {prod.description || 'Layanan studio cetak profesional TEFA DKV.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Harga</span>
                        <span className="font-black text-purple-400 text-sm">
                          Rp {prod.basePrice.toLocaleString('id-ID')} / {prod.unit}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedProductForDetail(prod)}
                        className="bg-[#5B4BFF] hover:bg-indigo-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-purple-900/30 cursor-pointer"
                      >
                        Detail & Pesan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= PAGE 3: BUAT PESANAN (DIRECT ORDER FORM) ================= */}
          {activeNav === 'buat_pesanan' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div className="bg-[#151A2D] p-6 sm:p-8 rounded-[32px] border border-slate-800 shadow-2xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-1">
                    <span className="material-symbols-outlined text-base">shopping_bag</span>
                    <span>FORM PEMESANAN SISWA</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Buat Pesanan TEFA DKV</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Pilih produk layanan TEFA, isi jumlah & spesifikasi, serta sertakan file desain Anda.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const pObj = activeProducts.find((p) => p.name === selectedService) || activeProducts[0];
                    handleCreateOrderSubmit(
                      selectedService,
                      pObj ? pObj.basePrice : 15000,
                      standaloneQty,
                      standaloneSizeSpec,
                      'Standar',
                      standaloneNotes,
                      standaloneFile
                    );
                  }}
                  className="space-y-6"
                >
                  {/* Service Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">Pilih Layanan TEFA *</label>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full px-4 py-3 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-bold text-white focus:border-[#5B4BFF] focus:outline-hidden"
                    >
                      {activeProducts.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} — Rp {p.basePrice.toLocaleString('id-ID')} / {p.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity & Size Specs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">Jumlah (Qty) *</label>
                      <input
                        type="number"
                        min={1}
                        value={standaloneQty}
                        onChange={(e) => setStandaloneQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-bold text-white focus:border-[#5B4BFF] focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">Spesifikasi Ukuran</label>
                      <input
                        type="text"
                        value={standaloneSizeSpec}
                        onChange={(e) => setStandaloneSizeSpec(e.target.value)}
                        placeholder="Contoh: 3x1m / A4 Glossy..."
                        className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-semibold text-white focus:border-[#5B4BFF] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Drag & Drop File */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">File Desain Siap Cetak</label>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const f = e.dataTransfer.files[0];
                          setStandaloneFile({
                            name: f.name,
                            size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                            type: 'JPG',
                          });
                        }
                      }}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        isDragOver
                          ? 'border-[#5B4BFF] bg-[#5B4BFF]/10'
                          : 'border-slate-700 bg-[#1A2035] hover:bg-[#252E4D]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-3xl text-purple-400 mb-2">cloud_upload</span>
                      <h4 className="font-bold text-white text-xs">Tarik & Lepaskan File Disini</h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        Format: JPG, PNG, PDF, PSD, AI, CDR, ZIP (Maksimal 50 MB)
                      </p>

                      <input
                        type="file"
                        id="direct-order-file"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const f = e.target.files[0];
                            setStandaloneFile({
                              name: f.name,
                              size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                              type: 'JPG',
                            });
                          }
                        }}
                        className="hidden"
                      />

                      <label
                        htmlFor="direct-order-file"
                        className="mt-3 inline-block px-4 py-2 bg-[#5B4BFF] hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                      >
                        Pilih File Dari Komputer
                      </label>
                    </div>

                    {standaloneFile && (
                      <div className="p-3 bg-purple-950/40 border border-purple-800/80 rounded-2xl flex items-center justify-between text-xs font-bold text-purple-200">
                        <span className="truncate">{standaloneFile.name} ({standaloneFile.size})</span>
                        <button
                          type="button"
                          onClick={() => setStandaloneFile(null)}
                          className="text-rose-400 hover:text-rose-300 ml-2"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">Catatan Khusus</label>
                    <textarea
                      rows={2}
                      value={standaloneNotes}
                      onChange={(e) => setStandaloneNotes(e.target.value)}
                      placeholder="Instruksi tambahan, deadline khusus, lipatan, dll..."
                      className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-medium text-white focus:border-[#5B4BFF] focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#5B4BFF] to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-purple-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    <span>Submit Pesanan Ke Admin TEFA</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================= PAGE 4: UPLOAD FILE (FILE CENTER) ================= */}
          {activeNav === 'upload_file' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div className="bg-[#151A2D] p-6 sm:p-8 rounded-[32px] border border-slate-800 shadow-2xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-1">
                    <span className="material-symbols-outlined text-base">cloud_upload</span>
                    <span>FILE CENTER SISWA</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Upload File Desain Siap Cetak</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Kirim file tugas atau cetakan Anda langsung ke File Inbox Admin TEFA DKV.
                  </p>
                </div>

                {/* Drag & Drop Big Box */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const f = e.dataTransfer.files[0];
                      setStandaloneFile({
                        name: f.name,
                        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                        type: 'JPG',
                      });
                    }
                  }}
                  className={`border-2 border-dashed rounded-[28px] p-8 text-center transition-all ${
                    isDragOver
                      ? 'border-[#5B4BFF] bg-[#5B4BFF]/20'
                      : 'border-slate-700 bg-[#1A2035] hover:bg-[#252E4D]'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-[#5B4BFF]/20 text-[#5B4BFF] flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-3xl">upload_file</span>
                  </div>

                  <h3 className="font-black text-white text-base">Drag & Drop File Siap Cetak Disini</h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Mendukung format JPG, PNG, PDF, PSD, AI, CDR, ZIP (Maksimal 50 MB)
                  </p>

                  <input
                    type="file"
                    id="standalone-file-input"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const f = e.target.files[0];
                        setStandaloneFile({
                          name: f.name,
                          size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                          type: 'JPG',
                        });
                      }
                    }}
                    className="hidden"
                  />

                  <div className="mt-4 flex justify-center gap-3">
                    <label
                      htmlFor="standalone-file-input"
                      className="cursor-pointer bg-[#5B4BFF] hover:bg-indigo-600 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition-all inline-flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">folder_open</span>
                      <span>Pilih File Komputer</span>
                    </label>
                  </div>
                </div>

                {standaloneFile && (
                  <div className="p-4 bg-[#1A2035] border border-slate-700 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#5B4BFF]">insert_drive_file</span>
                        <span>{standaloneFile.name}</span>
                        <span className="text-[10px] text-purple-300 font-mono">({standaloneFile.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStandaloneFile(null)}
                        className="text-rose-400 hover:text-rose-300 text-xs"
                      >
                        Batal
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        handleCreateOrderSubmit(
                          'Upload File Mandiri',
                          10000,
                          1,
                          'Standar',
                          'Biasa',
                          'File dikirim via File Center',
                          standaloneFile
                        );
                      }}
                      className="w-full bg-[#5B4BFF] hover:bg-indigo-600 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md"
                    >
                      Kirim File Ke Admin Inbox
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= PAGE 5: PESANAN SAYA (CARD LAYOUT + TIMELINE TRACKING) ================= */}
          {activeNav === 'pesanan_saya' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-[#151A2D] p-6 rounded-[28px] border border-slate-800 shadow-2xl flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Pesanan Saya</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Daftar pesanan & timeline progress pengerjaan realtime dari studio TEFA
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#5B4BFF]/20 text-purple-300 border border-[#5B4BFF]/40">
                  {myOrders.length} Order
                </span>
              </div>

              {/* Order Cards List (No rigid tables) */}
              <div className="space-y-4">
                {myOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-[#151A2D] rounded-[28px] border border-slate-800 p-6 space-y-5 shadow-xl hover:border-purple-500/40 transition-all"
                  >
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-white text-base">{ord.orderNo}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            ord.paymentStatus === 'Lunas'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Tanggal: {ord.orderDate}</p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold text-slate-400 block">Total Biaya</span>
                        <span className="font-black text-purple-300 text-lg">
                          Rp {ord.totalAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="bg-[#1A2035] p-3 rounded-2xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-white">{item.productName}</p>
                            <p className="text-[11px] text-slate-400">{item.notes || 'Spesifikasi Standar'}</p>
                          </div>
                          <span className="font-mono font-bold text-slate-300">
                            {item.qty} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* INTERACTIVE TIMELINE STATUS TRACKING */}
                    <div className="pt-2">
                      <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
                        Timeline Produksi Realtime:
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-bold">
                        {[
                          { label: 'Order Dibuat', icon: 'check_circle', active: true },
                          { label: 'File Diterima', icon: 'description', active: ord.status !== 'Draft' },
                          { label: 'Diproses', icon: 'precision_manufacturing', active: ['Diproses'].includes(ord.status) },
                          { label: 'Selesai', icon: 'verified', active: ['Selesai', 'Diterima'].includes(ord.status) },
                          { label: 'Selesai', icon: 'task_alt', active: ord.status === 'Selesai' },
                        ].map((step, sIdx) => (
                          <div
                            key={sIdx}
                            className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                              step.active
                                ? 'bg-[#5B4BFF]/20 border-[#5B4BFF] text-white shadow-md'
                                : 'bg-[#1A2035] border-slate-800 text-slate-500'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">{step.icon}</span>
                            <span className="text-[10px]">{step.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= PAGE 6: FILE SAYA (FILE HISTORY) ================= */}
          {activeNav === 'file_saya' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-[#151A2D] p-6 rounded-[28px] border border-slate-800 shadow-2xl flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">File Saya</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Riwayat file desain yang pernah dikirimkan ke TEFA DKV
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#5B4BFF]/20 text-purple-300 border border-[#5B4BFF]/40">
                  {myFiles.length} File
                </span>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-[#151A2D] p-5 rounded-[28px] border border-slate-800 space-y-3 shadow-xl hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#5B4BFF]/20 text-[#5B4BFF] font-black text-xs flex items-center justify-center shrink-0">
                          {file.fileType}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs truncate max-w-[180px]">{file.fileName}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{file.id} • {file.fileSize}</p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        file.status === 'Menunggu Pemeriksaan'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {file.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                      <p>Layanan: <strong className="text-slate-200">{file.serviceType}</strong></p>
                      <p>Tanggal Upload: {file.uploadDate}</p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => alert(`Mengunduh file: ${file.fileName}`)}
                        className="flex-1 bg-[#1A2035] hover:bg-slate-800 text-slate-200 font-bold text-xs py-2 rounded-xl border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        <span>Download</span>
                      </button>

                      <button
                        onClick={() => setActiveNav('upload_file')}
                        className="flex-1 bg-[#5B4BFF]/20 hover:bg-[#5B4BFF] text-purple-300 hover:text-white font-extrabold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">upload</span>
                        <span>Upload Ulang</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= PAGE 7: CUSTOM ORDER PAGE ================= */}
          {activeNav === 'custom_order' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div className="bg-[#151A2D] p-6 sm:p-8 rounded-[32px] border border-slate-800 shadow-2xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    <span>REQUEST CUSTOM DESIGN & SPECIAL ORDER</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Request Custom Order</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Ajukan pesanan khusus yang tidak tersedia di katalog standar. Tim TEFA DKV akan mereview dan memberikan penawaran.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!customTitle.trim()) {
                      alert('Mohon isi nama kebutuhan pesanan.');
                      return;
                    }
                    handleCreateOrderSubmit(
                      `[Custom] ${customTitle}`,
                      25000,
                      customQty,
                      customSize,
                      'Custom Request',
                      customDesc,
                      customRefFile ? { ...customRefFile, type: 'ZIP' } : null
                    );
                    setCustomTitle('');
                    setCustomDesc('');
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">Nama Kebutuhan / Projek *</label>
                    <input
                      type="text"
                      required
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Misal: Desain Mascot Maskot Sekolah 3D & Merchandise..."
                      className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-semibold text-white focus:border-[#5B4BFF] focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">Ukuran / Spek</label>
                      <input
                        type="text"
                        value={customSize}
                        onChange={(e) => setCustomSize(e.target.value)}
                        placeholder="Contoh: A2 / Custom..."
                        className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-semibold text-white focus:border-[#5B4BFF] focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">Jumlah Qty</label>
                      <input
                        type="number"
                        min={1}
                        value={customQty}
                        onChange={(e) => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-bold text-white focus:border-[#5B4BFF] focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">Target Deadline</label>
                      <input
                        type="date"
                        value={customDeadline}
                        onChange={(e) => setCustomDeadline(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-bold text-white focus:border-[#5B4BFF] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">Deskripsi Detail Kebutuhan *</label>
                    <textarea
                      rows={4}
                      required
                      value={customDesc}
                      onChange={(e) => setCustomDesc(e.target.value)}
                      placeholder="Jelaskan kebutuhan warna, konsep desain, bahan yang diinginkan..."
                      className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-medium text-white focus:border-[#5B4BFF] focus:outline-hidden"
                    />
                  </div>

                  {/* File Referensi */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">Upload Contoh / Referensi (Opsional)</label>
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const f = e.target.files[0];
                          setCustomRefFile({
                            name: f.name,
                            size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                          });
                        }
                      }}
                      className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-[#5B4BFF] file:text-white hover:file:bg-indigo-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer"
                  >
                    Kirim Request Custom Order (Menunggu Review Admin)
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================= PAGE 8: RIWAYAT TRANSAKSI ================= */}
          {activeNav === 'riwayat_transaksi' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-[#151A2D] p-6 rounded-[28px] border border-slate-800 shadow-2xl flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Riwayat Transaksi</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Catatan seluruh pembayaran pesanan TEFA DKV Anda
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myOrders.map((ord) => (
                  <div key={ord.id} className="bg-[#151A2D] p-5 rounded-[28px] border border-slate-800 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="font-mono font-black text-white text-sm">{ord.orderNo}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        ord.paymentStatus === 'Lunas' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {ord.paymentStatus}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-slate-300 font-bold">{ord.items[0]?.productName}</p>
                      <p className="text-slate-400 text-[11px]">Tanggal: {ord.orderDate}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Total Pembayaran</span>
                      <span className="font-black text-purple-300 text-base">
                        Rp {ord.totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= PAGE 9: NOTIFIKASI ================= */}
          {activeNav === 'notifikasi' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div className="bg-[#151A2D] p-6 rounded-[28px] border border-slate-800 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Pusat Notifikasi</h2>
                    <p className="text-xs text-slate-400 font-medium mt-1">Pemberitahuan terkini status pesanan Anda</p>
                  </div>
                  <button
                    onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))}
                    className="text-xs font-extrabold text-purple-400 hover:underline cursor-pointer"
                  >
                    Tandai Semua Dibaca
                  </button>
                </div>

                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border text-xs transition-colors ${
                        notif.unread
                          ? 'bg-[#5B4BFF]/15 border-[#5B4BFF]/40 text-slate-200'
                          : 'bg-[#1A2035] border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-white text-sm">{notif.title}</h4>
                        <span className="text-[10px] text-slate-400">{notif.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{notif.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= PAGE 10: PROFIL SAYA (PROFILE EDITOR & AVATAR CROP) ================= */}
          {activeNav === 'profil_saya' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div className="bg-[#151A2D] p-6 sm:p-8 rounded-[32px] border border-slate-800 shadow-2xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-2xl font-black text-white tracking-tight">Profil Siswa</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Kelola data identitas siswa & pasfoto akun TEFA DKV Anda
                  </p>
                </div>

                {/* Avatar Banner & Change Photo */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-[#1A2035] border border-slate-700/80">
                  <div className="relative group">
                    <img
                      src={profileAvatar}
                      alt="Student Avatar"
                      className="w-24 h-24 rounded-3xl object-cover ring-4 ring-[#5B4BFF]/60 shadow-xl"
                    />
                    <label
                      htmlFor="profile-avatar-input"
                      className="absolute inset-0 bg-slate-950/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-2xl">photo_camera</span>
                    </label>
                    <input
                      type="file"
                      id="profile-avatar-input"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <h3 className="text-lg font-black text-white">{customerName}</h3>
                    <p className="text-xs font-bold text-purple-300">NIS: {nis} • {classGrade}</p>
                    <p className="text-[11px] text-slate-400">Jurusan: {major} — SMK NU Ungaran</p>

                    <div className="pt-2">
                      <label
                        htmlFor="profile-avatar-input"
                        className="inline-block px-4 py-2 bg-[#5B4BFF] hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Ganti Foto Profil (JPG, PNG, WEBP Max 2MB)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Profile Form Details */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (currentUser && onUpdateProfile) {
                      onUpdateProfile({
                        ...currentUser,
                        name: customerName,
                        phone: phone,
                        email: email,
                        nis: nis,
                        studentClass: classGrade,
                        major: major,
                        avatar: profileAvatar,
                      });
                    }
                    alert('Data profil siswa berhasil diperbarui!');
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">Nama Lengkap Siswa</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-bold text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">NIS (Nomor Induk Siswa)</label>
                      <input
                        type="text"
                        value={nis}
                        onChange={(e) => setNis(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-bold font-mono text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">Kelas</label>
                      <select
                        value={classGrade}
                        onChange={(e) => setClassGrade(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-bold text-white"
                      >
                        <option value="X DKV 1">X DKV 1</option>
                        <option value="X DKV 2">X DKV 2</option>
                        <option value="XI DKV 1">XI DKV 1</option>
                        <option value="XI DKV 2">XI DKV 2</option>
                        <option value="XII DKV 1">XII DKV 1</option>
                        <option value="XII DKV 2">XII DKV 2</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">Jurusan</label>
                      <input
                        type="text"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-bold text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">Nomor WhatsApp</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-mono font-bold text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">Email Siswa</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-bold text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#5B4BFF] hover:bg-indigo-600 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-purple-900/50 transition-all cursor-pointer"
                  >
                    Simpan Perubahan Profil
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= MODAL 1: PRODUCT DETAIL & ORDER MODAL ================= */}
      {selectedProductForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[#151A2D] border border-slate-800 rounded-[32px] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedProductForDetail(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#1A2035] hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <img
                src={selectedProductForDetail.image || 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80'}
                alt={selectedProductForDetail.name}
                className="w-full sm:w-52 h-44 object-cover rounded-2xl border border-slate-800 shrink-0"
              />

              <div className="space-y-2 flex-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#5B4BFF]/20 text-purple-300 border border-[#5B4BFF]/40">
                  {selectedProductForDetail.category}
                </span>
                <h3 className="text-xl font-black text-white">{selectedProductForDetail.name}</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  {selectedProductForDetail.description || 'Layanan studio cetak profesional TEFA DKV SMK NU Ungaran.'}
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Harga / {selectedProductForDetail.unit}</span>
                    <span className="font-black text-purple-400 text-lg">
                      Rp {selectedProductForDetail.basePrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                    Estimasi: 1-2 Hari
                  </span>
                </div>
              </div>
            </div>

            {/* Customization Controls */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Jumlah Qty ({selectedProductForDetail.unit})</label>
                  <input
                    type="number"
                    min={1}
                    value={detailQty}
                    onChange={(e) => setDetailQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-bold text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Pilihan Ukuran / Spek</label>
                  <input
                    type="text"
                    value={detailSize}
                    onChange={(e) => setDetailSize(e.target.value)}
                    placeholder="Contoh: 3x1 Meter / A4 Glossy..."
                    className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-semibold text-white"
                  />
                </div>
              </div>

              {/* Material Option */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Opsi Material / Bahan</label>
                <select
                  value={detailMaterial}
                  onChange={(e) => setDetailMaterial(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-bold text-white"
                >
                  <option value="Biasa / Standar">Biasa / Standar TEFA</option>
                  <option value="Premium Glossy / High Quality">Premium Glossy / High Quality</option>
                  <option value="Tebal / Outdoor Matte">Tebal / Outdoor Matte</option>
                </select>
              </div>

              {/* File Upload Area */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">File Desain Siap Cetak</label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      setDetailFile({
                        name: f.name,
                        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                        type: 'JPG',
                      });
                    }
                  }}
                  className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-[#5B4BFF] file:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Catatan Khusus</label>
                <input
                  type="text"
                  value={detailNotes}
                  onChange={(e) => setDetailNotes(e.target.value)}
                  placeholder="Instruksi tambahan..."
                  className="w-full px-4 py-2.5 bg-[#1A2035] border border-slate-700 rounded-2xl text-xs font-medium text-white"
                />
              </div>

              {/* Subtotal & Submit */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Total Estimasi</span>
                  <span className="font-black text-purple-300 text-xl">
                    Rp {(selectedProductForDetail.basePrice * detailQty).toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  onClick={() => {
                    handleCreateOrderSubmit(
                      selectedProductForDetail.name,
                      selectedProductForDetail.basePrice,
                      detailQty,
                      detailSize,
                      detailMaterial,
                      detailNotes,
                      detailFile
                    );
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#5B4BFF] to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-extrabold text-xs px-8 py-3.5 rounded-2xl shadow-lg shadow-purple-900/50 transition-all cursor-pointer"
                >
                  Konfirmasi Buat Pesanan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: SUCCESS ORDER SUBMISSION POPUP ================= */}
      {submittedOrderSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#151A2D] border border-slate-800 rounded-[32px] max-w-md w-full p-8 text-center space-y-5 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/30">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black bg-[#5B4BFF]/20 text-purple-300 border border-[#5B4BFF]/40">
                {submittedOrderSuccess.orderId}
              </span>
              <h3 className="text-2xl font-black text-white pt-2">Pesanan Berhasil Dibuat!</h3>
              <p className="text-xs text-slate-400 font-medium">
                Order <strong className="text-white">{submittedOrderSuccess.productName}</strong> telah berhasil dikirim ke Admin TEFA DKV SMK NU Ungaran.
              </p>
            </div>

            <div className="bg-[#1A2035] p-4 rounded-2xl border border-slate-800 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Total Biaya:</span>
                <span className="font-mono font-black text-purple-300">
                  Rp {submittedOrderSuccess.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Status Awal:</span>
                <span className="font-bold text-amber-400">Antrian Admin</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSubmittedOrderSuccess(null);
                setActiveNav('pesanan_saya');
              }}
              className="w-full bg-[#5B4BFF] hover:bg-indigo-600 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
            >
              Lihat Timeline Status Pesanan
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: AVATAR CROP / PREVIEW MODAL ================= */}
      {showAvatarCropModal && tempAvatarPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#151A2D] border border-slate-800 rounded-[32px] max-w-md w-full p-6 text-center space-y-5 shadow-2xl">
            <h3 className="text-lg font-black text-white">Preview & Potong Foto Profil</h3>

            <div className="w-40 h-40 rounded-full mx-auto overflow-hidden ring-4 ring-[#5B4BFF] shadow-2xl">
              <img src={tempAvatarPreview} alt="Preview Avatar" className="w-full h-full object-cover" />
            </div>

            <p className="text-xs text-slate-400">
              Foto ini akan ditampilkan pada Header, Dashboard, dan ID Card Siswa.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAvatarCropModal(false)}
                className="flex-1 bg-[#1A2035] hover:bg-slate-800 text-slate-300 font-bold text-xs py-3 rounded-2xl border border-slate-700 cursor-pointer"
              >
                Batal
              </button>

              <button
                onClick={handleSaveAvatar}
                className="flex-1 bg-[#5B4BFF] hover:bg-indigo-600 text-white font-extrabold text-xs py-3 rounded-2xl shadow-lg cursor-pointer"
              >
                Simpan Pasfoto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#151A2D] py-4 px-6 text-center text-xs text-slate-500 font-medium">
        © 2026 Student TEFA Platform • DKV Creative Management System • SMK NU Ungaran
      </footer>
    </div>
  );
};

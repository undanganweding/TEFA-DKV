import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  PageId,
  Product,
  ProductionOrder,
  CustomerFile,
  InboxFile,
  ToolInventory,
  CartItem,
  UserProfile,
} from '../types';
import { getInitials, getRoleGradient } from './views/ProfileView';

interface HeaderProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
  onOpenAiAssistant: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  notificationsCount?: number;
  activeOrdersCount?: number;
  lowStockCount?: number;
  inboxCount?: number;
  operatorName?: string;
  studioName?: string;
  products?: Product[];
  orders?: ProductionOrder[];
  customerFiles?: CustomerFile[];
  inboxFiles?: InboxFile[];
  tools?: ToolInventory[];
  onAddToCart?: (item: CartItem) => void;
  onOpenOrderReceipt?: (order: ProductionOrder) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onPageChange,
  onOpenAiAssistant,
  searchQuery,
  onSearchChange,
  notificationsCount = 0,
  activeOrdersCount = 0,
  lowStockCount = 0,
  inboxCount = 0,
  products = [],
  orders = [],
  customerFiles = [],
  inboxFiles = [],
  tools = [],
  onAddToCart,
  onOpenOrderReceipt,
  currentUser,
  onLogout,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [localQuery, setLocalQuery] = useState<string>(searchQuery);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Banner Flexi',
    'Stiker Vinyl',
    'Cetak A3+',
    'Mug Custom',
    'Order #ORD-2026-001',
    'Siswa DKV 1',
  ]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchModalInputRef = useRef<HTMLInputElement>(null);

  // Total notification count badge
  const totalNotifs = notificationsCount || activeOrdersCount + lowStockCount + inboxCount;

  // Auto focus input when search overlay opens
  useEffect(() => {
    if (isSearchFocused) {
      setTimeout(() => {
        searchModalInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchFocused]);

  // Debounce search query
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localQuery !== searchQuery) {
        onSearchChange(localQuery);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localQuery, searchQuery, onSearchChange]);

  // Keyboard shortcut listener (Ctrl+K or / or ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchFocused(true);
      } else if (e.key === '/' && activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchFocused(true);
      } else if (e.key === 'Escape') {
        setIsSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getPageTitle = (page: PageId): string => {
    switch (page) {
      case 'dashboard':
        return 'Creative Command Center';
      case 'kasir':
        return 'Kasir & Transaksi POS';
      case 'file_inbox':
        return 'File Inbox & Asset Library';
      case 'pesanan':
        return 'Pesanan Produksi DKV';
      case 'produk':
        return 'Katalog Produk & Tarif';
      case 'customer_file':
        return 'Direktori File Customer';
      case 'inventaris_alat':
        return 'Inventaris Alat & Mesin Studio';
      case 'stok_bahan':
        return 'Manajemen Stok Bahan';
      case 'keuangan':
        return 'Keuangan & Kas Utama';
      case 'laporan':
        return 'Laporan Business Intelligence';
      case 'pengadaan':
        return 'Pengadaan Tahunan Studio';
      case 'pengaturan':
        return 'Pengaturan & System Recycle';
      case 'kelola_login':
        return 'Kelola Konten Halaman Login';
      case 'manajemen_user':
        return 'Manajemen Pengguna & Persetujuan';
      default:
        return 'TEFA DKV Creative Platform';
    }
  };

  // Static List of Navigation Pages for Quick Access in Command Palette
  const navPages = [
    { id: 'dashboard' as PageId, title: 'Dashboard Studio', desc: 'Overview & Key Metrics', icon: 'space_dashboard', color: 'bg-indigo-100 text-indigo-700' },
    { id: 'kasir' as PageId, title: 'Kasir & Transaksi POS', desc: 'Checkout & Order POS', icon: 'point_of_sale', color: 'bg-purple-100 text-[#5B4BFF]' },
    { id: 'pesanan' as PageId, title: 'Pesanan Produksi', desc: 'Antrian Cetak & Status', icon: 'receipt_long', color: 'bg-blue-100 text-blue-700' },
    { id: 'file_inbox' as PageId, title: 'File Inbox Publik', desc: 'Berkas Masuk Siswa', icon: 'inbox', color: 'bg-sky-100 text-sky-700' },
    { id: 'produk' as PageId, title: 'Katalog Produk & Tarif', desc: 'Harga & Spesifikasi Cetak', icon: 'inventory_2', color: 'bg-amber-100 text-amber-700' },
    { id: 'customer_file' as PageId, title: 'Direktori File Customer', desc: 'Arsip Pelanggan', icon: 'folder_open', color: 'bg-purple-100 text-purple-700' },
    { id: 'inventaris_alat' as PageId, title: 'Inventaris Mesin Studio', desc: 'Mesin & Peralatan DKV', icon: 'print', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'stok_bahan' as PageId, title: 'Stok Bahan & Kertas', desc: 'Material Kertas & Tinta', icon: 'inventory', color: 'bg-[#5B4BFF]/10 text-[#5B4BFF]' },
    { id: 'keuangan' as PageId, title: 'Keuangan & Kas', desc: 'Arus Kas Pemasukan', icon: 'payments', color: 'bg-teal-100 text-teal-700' },
  ];

  // Safe Smart Search Computations (Protected against exceptions)
  const q = localQuery.trim().toLowerCase();

  const recentProducts = useMemo(() => {
    try {
      return (products || []).filter((p) => p && !p.isArchived && p.status === 'Aktif').slice(0, 3);
    } catch {
      return [];
    }
  }, [products]);

  const popularProducts = useMemo(() => {
    try {
      return (products || []).filter((p) => p && !p.isArchived && p.status === 'Aktif').slice(3, 8);
    } catch {
      return [];
    }
  }, [products]);

  const searchResults = useMemo(() => {
    try {
      if (currentPage === 'kasir') {
        const matchedProducts = (products || [])
          .filter(
            (p) =>
              p &&
              !p.isArchived &&
              p.status === 'Aktif' &&
              (p.name.toLowerCase().includes(q) ||
                p.code.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                (p.description && p.description.toLowerCase().includes(q)))
          )
          .slice(0, 8);

        const matchedOrders = (orders || [])
          .filter(
            (o) =>
              o &&
              !o.isArchived &&
              (o.orderNo.toLowerCase().includes(q) ||
                o.customerName.toLowerCase().includes(q) ||
                (o.customerPhone && o.customerPhone.includes(q)))
          )
          .slice(0, 4);

        return {
          type: 'kasir' as const,
          products: matchedProducts,
          orders: matchedOrders,
        };
      } else {
        const matchedPages = navPages
          .filter(
            (p) => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
          )
          .slice(0, 4);

        const matchedOrders = (orders || [])
          .filter(
            (o) =>
              o &&
              !o.isArchived &&
              (o.orderNo.toLowerCase().includes(q) ||
                o.customerName.toLowerCase().includes(q) ||
                (o.customerPhone && o.customerPhone.includes(q)))
          )
          .slice(0, 4);

        const matchedCustomerFiles = (customerFiles || [])
          .filter(
            (c) =>
              c &&
              !c.isArchived &&
              (c.customerName.toLowerCase().includes(q) ||
                (c.institution && c.institution.toLowerCase().includes(q)) ||
                (c.phone && c.phone.includes(q)))
          )
          .slice(0, 3);

        const matchedInboxFiles = (inboxFiles || [])
          .filter(
            (f) =>
              f &&
              !f.isArchived &&
              (f.fileName.toLowerCase().includes(q) ||
                f.customerName.toLowerCase().includes(q) ||
                f.serviceType.toLowerCase().includes(q))
          )
          .slice(0, 3);

        const matchedProducts = (products || [])
          .filter(
            (p) =>
              p &&
              !p.isArchived &&
              (p.name.toLowerCase().includes(q) ||
                p.code.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q))
          )
          .slice(0, 4);

        const matchedTools = (tools || [])
          .filter(
            (t) =>
              t &&
              !t.isArchived &&
              (t.name.toLowerCase().includes(q) ||
                t.brandModel.toLowerCase().includes(q) ||
                t.location.toLowerCase().includes(q))
          )
          .slice(0, 3);

        return {
          type: 'global' as const,
          pages: matchedPages,
          orders: matchedOrders,
          customerFiles: matchedCustomerFiles,
          inboxFiles: matchedInboxFiles,
          products: matchedProducts,
          tools: matchedTools,
        };
      }
    } catch {
      return {
        type: currentPage === 'kasir' ? ('kasir' as const) : ('global' as const),
        products: [],
        orders: [],
        pages: [],
        customerFiles: [],
        inboxFiles: [],
        tools: [],
      };
    }
  }, [q, currentPage, products, orders, customerFiles, inboxFiles, tools]);

  // Handler to add product to POS cart directly from search
  const handleAddProductToCartDirect = (prod: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onAddToCart) return;

    try {
      const newItem: CartItem = {
        id: 'CART-SEARCH-' + Date.now() + Math.random().toString(36).substring(2, 6),
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        unit: prod.unit,
        unitPrice: prod.basePrice,
        qty: 1,
        totalPrice: prod.basePrice,
      };

      onAddToCart(newItem);

      // Save to recent searches if not present
      if (!recentSearches.includes(prod.name)) {
        setRecentSearches((prev) => [prod.name, ...prev.slice(0, 5)]);
      }

      setAddedNotice(`"${prod.name}" ditambahkan ke rincian order Kasir!`);
      setTimeout(() => setAddedNotice(null), 2500);
    } catch (err) {
      console.error('Error adding product from search:', err);
    }
  };

  const handleSelectRecentSearch = (term: string) => {
    onSearchChange(term);
  };

  return (
    <>
      <header className="px-4 md:px-6 py-3 flex items-center justify-between gap-2 md:gap-4 sticky top-0 z-30 bg-[#F8FAFC]/95 backdrop-blur-xl border-b border-slate-200/80 transition-all font-sans">
        {/* 1. Page Title & Subtitle (Left) */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-900 tracking-tight leading-none truncate max-w-[160px] sm:max-w-[240px] md:max-w-none">
                {getPageTitle(currentPage)}
              </h1>
              <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-[#5B4BFF] border border-purple-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BFF] animate-pulse"></span>
                Live Studio
              </span>
            </div>
            <p className="hidden md:flex text-xs font-semibold text-slate-400 mt-1 items-center gap-1.5">
              <span>TEFA DKV Creative Platform</span>
              <span>•</span>
              <span className="text-slate-600 font-bold">SMK NU TEFA OS</span>
            </p>
          </div>
        </div>

        {/* 2. DYNAMIC EXPANDABLE CAPSULE SEARCH BUTTON (Center) */}
        <div className="flex-1 flex justify-center max-w-xs sm:max-w-md lg:max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => setIsSearchFocused(true)}
            className="group relative flex items-center gap-2 rounded-full bg-white border border-slate-200/90 hover:border-[#5B4BFF] hover:ring-3 hover:ring-purple-500/10 px-3 py-1.5 sm:px-4 sm:py-2 text-slate-500 hover:text-slate-900 transition-all duration-300 shadow-2xs hover:shadow-md cursor-pointer w-32 sm:w-48 md:w-64 lg:w-80 justify-between shrink"
            title="Buka Smart Command Search (Ctrl K)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-slate-400 group-hover:text-[#5B4BFF] text-base sm:text-lg shrink-0 transition-colors">
                search
              </span>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-700 truncate">
                {currentPage === 'kasir' ? 'Cari produk POS TEFA...' : 'Search TEFA (Ctrl K)'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <kbd className="bg-slate-100 border border-slate-200 text-slate-400 group-hover:text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* 3. Right Header Action Buttons (AI Assistant, Portal Upload, Notifications) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* AI Assistant Button */}
          <button
            type="button"
            onClick={onOpenAiAssistant}
            className="relative group bg-gradient-to-r from-[#5B4BFF] to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-extrabold text-xs p-2 sm:px-3.5 sm:py-2 rounded-full flex items-center gap-2 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all shrink-0 active:scale-95 cursor-pointer"
            title="Asisten AI Studio - Smart Copilot"
          >
            <span className="material-symbols-outlined text-base animate-pulse">auto_awesome</span>
            <span className="hidden md:inline">AI Assistant</span>
          </button>

          {/* Portal Siswa & Customer Button */}
          <button
            type="button"
            onClick={() => onPageChange('public_upload')}
            className="bg-white hover:bg-purple-50 text-slate-800 border border-slate-200/90 font-extrabold text-xs p-2 sm:px-3 sm:py-2 rounded-full flex items-center gap-1.5 shadow-2xs transition-all shrink-0 hover:border-purple-300 active:scale-95 cursor-pointer"
            title="Buka Student & Customer Platform (SMK NU Ungaran)"
          >
            <span className="material-symbols-outlined text-base text-[#5B4BFF]">school</span>
            <span className="hidden lg:inline">Portal Siswa</span>
          </button>

          {/* Notification Bell Button */}
          <div className="relative">
            <button
              id="btn-notifications-menu"
              type="button"
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full bg-white border border-slate-200/90 text-slate-600 flex items-center justify-center relative shadow-2xs hover:bg-purple-50 hover:text-[#5B4BFF] hover:border-purple-200 transition-all active:scale-95 cursor-pointer"
              title="Notifikasi Studio"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">notifications</span>
              {totalNotifs > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#5B4BFF] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs border-2 border-white">
                  {totalNotifs > 9 ? '9+' : totalNotifs}
                </span>
              )}
            </button>

            {/* Notif Dropdown Menu */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl border border-slate-200/90 p-4 z-50 animate-in fade-in zoom-in-95 duration-200 font-sans">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#5B4BFF] text-base">
                      notifications_active
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                      Notifikasi Studio
                    </h4>
                  </div>
                  <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                    {totalNotifs} Peringatan
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                  {lowStockCount > 0 && (
                    <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80 flex items-start gap-2.5 text-xs">
                      <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">
                        warning
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900">Stok Material Menipis</p>
                        <p className="text-[11px] text-amber-900/80 font-medium">
                          {lowStockCount} item bahan di rak studio memerlukan restock ulang.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeOrdersCount > 0 && (
                    <div className="bg-purple-50/80 p-3 rounded-2xl border border-purple-200/80 flex items-start gap-2.5 text-xs">
                      <span className="material-symbols-outlined text-[#5B4BFF] text-lg shrink-0 mt-0.5">
                        pending_actions
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900">Pesanan Dalam Antrian</p>
                        <p className="text-[11px] text-purple-900/80 font-medium">
                          Terdapat {activeOrdersCount} pesanan aktif yang sedang diproses studio.
                        </p>
                      </div>
                    </div>
                  )}

                  {inboxCount > 0 && (
                    <div className="bg-blue-50/80 p-3 rounded-2xl border border-blue-200/80 flex items-start gap-2.5 text-xs">
                      <span className="material-symbols-outlined text-blue-600 text-lg shrink-0 mt-0.5">
                        inbox
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900">File Inbox Baru</p>
                        <p className="text-[11px] text-blue-900/80 font-medium">
                          {inboxCount} file menunggu verifikasi teknis dari portal upload siswa.
                        </p>
                      </div>
                    </div>
                  )}

                  {totalNotifs === 0 && (
                    <p className="text-center text-slate-400 text-xs py-4">
                      Semua sistem studio berjalan lancar. Tidak ada peringatan aktif.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowNotifMenu(false)}
                  className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Tutup Notifikasi
                </button>
              </div>
            )}
          </div>

          {/* User Profile & Role Chip */}
          {currentUser && (
            <div className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200/90 pl-1.5 pr-3 py-1 rounded-full shadow-2xs transition-all cursor-pointer group">
              <button
                type="button"
                onClick={() => onPageChange('profile')}
                className="flex items-center gap-2 text-left cursor-pointer focus:outline-hidden"
                title="Buka Pengaturan Profil Akun"
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-purple-300 shrink-0"
                  />
                ) : (
                  <div
                    className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getRoleGradient(
                      currentUser.role
                    )} text-white font-black text-[10px] flex items-center justify-center shrink-0 border border-purple-300`}
                  >
                    {getInitials(currentUser.name)}
                  </div>
                )}
                <div className="hidden xl:block text-left min-w-0">
                  <p className="text-[11px] font-black text-slate-900 leading-none truncate max-w-[120px] group-hover:text-[#5B4BFF] transition-colors">
                    {currentUser.role}
                  </p>
                  <p className="text-[9px] font-bold text-[#5B4BFF] leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </p>
                </div>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 flex items-center justify-center transition-colors cursor-pointer ml-1"
                  title="Ganti Peran / Logout"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Toast Notice inside Header */}
      {addedNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-extrabold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-emerald-500 animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{addedNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING COMMAND SEARCH OVERLAY & MODAL PANEL                             */}
      {/* ========================================================================= */}
      {isSearchFocused && (
        <div className="fixed inset-0 z-50 font-sans flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4">
          {/* Backdrop Blur Layer */}
          <div
            onClick={() => setIsSearchFocused(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
          />

          {/* Floating Command Panel Card */}
          <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl rounded-[28px] overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] sm:max-h-[640px]">
            {/* Panel Top Input Bar */}
            <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-3">
              <span className="material-symbols-outlined text-[#5B4BFF] text-xl shrink-0">
                search
              </span>
              <input
                ref={searchModalInputRef}
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder={
                  currentPage === 'kasir'
                    ? 'Cari produk, jasa, atau kode produk TEFA...'
                    : 'Cari transaksi, customer, file, produk, inventaris, halaman...'
                }
                className="w-full text-sm sm:text-base font-semibold text-slate-900 focus:outline-hidden placeholder:text-slate-400 bg-transparent"
              />

              <div className="flex items-center gap-2 shrink-0">
                {localQuery ? (
                  <button
                    type="button"
                    onClick={() => { setLocalQuery(''); onSearchChange(''); }}
                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs transition-colors cursor-pointer"
                    title="Bersihkan"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                ) : null}

                <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                  ESC
                </span>
              </div>
            </div>

            {/* Mode Banner Indicator */}
            <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Mode Pencarian:
                </span>
                {currentPage === 'kasir' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-[#5B4BFF] border border-purple-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BFF]"></span>
                    Pencarian Produk Kasir POS TEFA
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    Global Studio Command Search
                  </span>
                )}
              </div>

              {currentPage === 'kasir' && (
                <span className="hidden sm:inline text-[11px] font-bold text-slate-500">
                  Klik <span className="text-[#5B4BFF]">+ Tambah</span> untuk langsung mengisi Rincian Order
                </span>
              )}
            </div>

            {/* Panel Scrollable Content Body */}
            <div className="p-4 overflow-y-auto space-y-4 max-h-[500px] no-scrollbar">
              {/* ========================================================================= */}
              {/* MODE A: KASIR POS TEFA SEARCH                                             */}
              {/* ========================================================================= */}
              {currentPage === 'kasir' && (
                <div className="space-y-4">
                  {/* If NO query typed -> Show Recent Searches, Terakhir Digunakan & Popular Products */}
                  {!q ? (
                    <>
                      {/* Recent Searches Pills */}
                      {recentSearches.length > 0 && (
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                            Pencarian Terakhir Kasir
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            {recentSearches.map((term, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleSelectRecentSearch(term)}
                                className="bg-slate-100 hover:bg-purple-100 hover:text-[#5B4BFF] text-slate-700 font-bold text-xs px-3 py-1.5 rounded-full transition-all border border-slate-200/80 cursor-pointer flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-xs">history</span>
                                <span>{term}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Produk Terakhir Digunakan */}
                      {recentProducts.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-[#5B4BFF]">
                                history
                              </span>
                              Produk Terakhir Digunakan
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">Kasir POS</span>
                          </div>
                          <div className="space-y-1.5">
                            {recentProducts.map((prod) => (
                              <div
                                key={'rec-' + prod.id}
                                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-purple-50/70 border border-slate-100 hover:border-purple-200 transition-all group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center text-slate-600">
                                    {prod.image ? (
                                      <img
                                        src={prod.image}
                                        alt={prod.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="material-symbols-outlined text-base">
                                        palette
                                      </span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-extrabold text-xs text-slate-900 group-hover:text-[#5B4BFF] truncate">
                                      {prod.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                                      <span className="bg-purple-100 text-[#5B4BFF] px-1.5 py-0.2 rounded text-[9px] font-bold">
                                        {prod.code}
                                      </span>
                                      <span>•</span>
                                      <span>{prod.category}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="font-black text-xs text-[#5B4BFF]">
                                    Rp {prod.basePrice.toLocaleString('id-ID')}
                                    <span className="text-[9px] font-normal text-slate-400">
                                      /{prod.unit}
                                    </span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleAddProductToCartDirect(prod, e)}
                                    className="bg-[#5B4BFF] hover:bg-purple-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-xs">add</span>
                                    <span>Tambah</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Produk Populer & Bestseller */}
                      {popularProducts.length > 0 && (
                        <div className="border-t border-slate-100 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-amber-500">
                                local_fire_department
                              </span>
                              Produk Populer & Bestseller TEFA
                            </span>
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Top Sales
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {popularProducts.map((prod) => (
                              <div
                                key={'pop-' + prod.id}
                                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-amber-50/60 border border-slate-100 hover:border-amber-200 transition-all group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center text-slate-600">
                                    {prod.image ? (
                                      <img
                                        src={prod.image}
                                        alt={prod.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="material-symbols-outlined text-base">
                                        print
                                      </span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-extrabold text-xs text-slate-900 group-hover:text-amber-700 truncate">
                                      {prod.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[9px] font-bold">
                                        {prod.code}
                                      </span>
                                      <span>•</span>
                                      <span>{prod.category}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="font-black text-xs text-slate-900">
                                    Rp {prod.basePrice.toLocaleString('id-ID')}
                                    <span className="text-[9px] font-normal text-slate-400">
                                      /{prod.unit}
                                    </span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleAddProductToCartDirect(prod, e)}
                                    className="bg-[#5B4BFF] hover:bg-purple-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-xs">add</span>
                                    <span>Tambah</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Realtime Product Search Query Results */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-[#5B4BFF]">
                            inventory_2
                          </span>
                          Hasil Pencarian Realtime Produk ({searchResults.products.length})
                        </span>
                      </div>

                      {searchResults.products.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          Tidak ada produk atau kode yang cocok dengan "{searchQuery}".
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {searchResults.products.map((prod) => (
                            <div
                              key={prod.id}
                              className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-purple-50/70 border border-slate-100 hover:border-purple-200 transition-all group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center text-slate-600">
                                  {prod.image ? (
                                    <img
                                      src={prod.image}
                                      alt={prod.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="material-symbols-outlined text-base">
                                      palette
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-extrabold text-xs text-slate-900 group-hover:text-[#5B4BFF] truncate">
                                    {prod.name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                                    <span className="bg-purple-100 text-[#5B4BFF] px-1.5 py-0.2 rounded text-[9px] font-bold">
                                      {prod.code}
                                    </span>
                                    <span>•</span>
                                    <span>{prod.category}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-black text-xs text-[#5B4BFF]">
                                  Rp {prod.basePrice.toLocaleString('id-ID')}
                                  <span className="text-[9px] font-normal text-slate-400">
                                    /{prod.unit}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleAddProductToCartDirect(prod, e)}
                                  className="bg-[#5B4BFF] hover:bg-purple-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-xs">add</span>
                                  <span>Tambah</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Matching Orders inside Kasir */}
                      {searchResults.orders.length > 0 && (
                        <div className="border-t border-slate-100 pt-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                            Order & Transaksi Kasir ({searchResults.orders.length})
                          </span>
                          <div className="space-y-1">
                            {searchResults.orders.map((ord) => (
                              <div
                                key={ord.id}
                                onClick={() => {
                                  if (onOpenOrderReceipt) onOpenOrderReceipt(ord);
                                  setIsSearchFocused(false);
                                }}
                                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all cursor-pointer"
                              >
                                <div>
                                  <p className="font-black text-xs text-slate-900">{ord.orderNo}</p>
                                  <p className="text-[10px] text-slate-500">
                                    {ord.customerName} • {ord.orderDate}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-[#5B4BFF]">
                                    {ord.status}
                                  </span>
                                  <p className="font-bold text-xs text-slate-800 mt-0.5">
                                    Rp {ord.totalAmount.toLocaleString('id-ID')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* MODE B: GLOBAL COMMAND SEARCH (Non-Kasir Pages)                           */}
              {/* ========================================================================= */}
              {currentPage !== 'kasir' && (
                <div className="space-y-4">
                  {/* If NO Query typed -> Quick Access Pages & Recent Searches */}
                  {!q ? (
                    <>
                      {/* Recent Searches */}
                      {recentSearches.length > 0 && (
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                            Pencarian Terakhir Studio
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            {recentSearches.map((term, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleSelectRecentSearch(term)}
                                className="bg-slate-100 hover:bg-purple-100 hover:text-[#5B4BFF] text-slate-700 font-bold text-xs px-3 py-1.5 rounded-full transition-all border border-slate-200/80 cursor-pointer flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-xs">history</span>
                                <span>{term}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Access Pages */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-[#5B4BFF]">
                              explore
                            </span>
                            Akses Cepat Halaman & Navigasi Studio
                          </span>
                          <span className="text-[10px] font-bold text-[#5B4BFF]">Command Palette</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {navPages.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                onPageChange(p.id);
                                setIsSearchFocused(false);
                              }}
                              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-purple-50/80 text-left border border-slate-100 hover:border-purple-200 transition-all cursor-pointer group"
                            >
                              <div
                                className={`w-9 h-9 rounded-xl ${p.color} flex items-center justify-center shrink-0 font-bold`}
                              >
                                <span className="material-symbols-outlined text-lg">{p.icon}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-xs text-slate-900 group-hover:text-[#5B4BFF] truncate">
                                  {p.title}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">{p.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Query Typed -> Global Realtime Results Across All Modules */
                    <div className="space-y-4">
                      {/* 1. Navigasi Halaman */}
                      {searchResults.pages && searchResults.pages.length > 0 && (
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                            Halaman System ({searchResults.pages.length})
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {searchResults.pages.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  onPageChange(p.id);
                                  setIsSearchFocused(false);
                                }}
                                className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-purple-50 text-left border border-slate-100 hover:border-purple-200 transition-all cursor-pointer group"
                              >
                                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5B4BFF] flex items-center justify-center shrink-0">
                                  <span className="material-symbols-outlined text-base">
                                    {p.icon}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <p className="font-extrabold text-xs text-slate-900 group-hover:text-[#5B4BFF] truncate">
                                    {p.title}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate">{p.desc}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. Orders & Transactions */}
                      {searchResults.orders && searchResults.orders.length > 0 && (
                        <div className="border-t border-slate-100 pt-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                            Pesanan Produksi & Transaksi ({searchResults.orders.length})
                          </span>
                          <div className="space-y-1.5">
                            {searchResults.orders.map((ord) => (
                              <div
                                key={ord.id}
                                onClick={() => {
                                  onPageChange('pesanan');
                                  if (onOpenOrderReceipt) onOpenOrderReceipt(ord);
                                  setIsSearchFocused(false);
                                }}
                                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-purple-50/60 border border-slate-100 hover:border-purple-200 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="material-symbols-outlined text-slate-400 text-lg shrink-0">
                                    receipt_long
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-black text-xs text-slate-900 group-hover:text-[#5B4BFF] truncate">
                                      {ord.orderNo} - {ord.customerName}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                      {ord.orderDate} • Operator: {ord.operatorName}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-black text-xs text-[#5B4BFF]">
                                    Rp {ord.totalAmount.toLocaleString('id-ID')}
                                  </p>
                                  <span className="text-[9px] font-extrabold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                                    {ord.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Customer Files & Inbox */}
                      {((searchResults.customerFiles && searchResults.customerFiles.length > 0) ||
                        (searchResults.inboxFiles && searchResults.inboxFiles.length > 0)) && (
                        <div className="border-t border-slate-100 pt-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                            Pelanggan & Berkas File Inbox
                          </span>
                          <div className="space-y-1.5">
                            {searchResults.customerFiles?.map((c) => (
                              <div
                                key={c.id}
                                onClick={() => {
                                  onPageChange('customer_file');
                                  setIsSearchFocused(false);
                                }}
                                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-purple-50/60 border border-slate-100 hover:border-purple-200 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="material-symbols-outlined text-purple-600 text-lg shrink-0">
                                    folder_open
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-extrabold text-xs text-slate-900 group-hover:text-[#5B4BFF] truncate">
                                      {c.customerName} {c.institution ? `(${c.institution})` : ''}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      Direktori File • {c.totalFiles} berkas
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-[#5B4BFF]">
                                  Lihat Folder
                                </span>
                              </div>
                            ))}

                            {searchResults.inboxFiles?.map((f) => (
                              <div
                                key={f.id}
                                onClick={() => {
                                  onPageChange('file_inbox');
                                  setIsSearchFocused(false);
                                }}
                                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-purple-50/60 border border-slate-100 hover:border-purple-200 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="material-symbols-outlined text-blue-600 text-lg shrink-0">
                                    file_present
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-extrabold text-xs text-slate-900 group-hover:text-[#5B4BFF] truncate">
                                      {f.fileName} ({f.customerName})
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      File Inbox • {f.serviceType}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                                  {f.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. Products & Catalog */}
                      {searchResults.products && searchResults.products.length > 0 && (
                        <div className="border-t border-slate-100 pt-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                            Katalog Produk & Tarif ({searchResults.products.length})
                          </span>
                          <div className="space-y-1.5">
                            {searchResults.products.map((p) => (
                              <div
                                key={p.id}
                                onClick={() => {
                                  onPageChange('produk');
                                  setIsSearchFocused(false);
                                }}
                                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-purple-50/60 border border-slate-100 hover:border-purple-200 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">
                                    inventory_2
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-extrabold text-xs text-slate-900 group-hover:text-[#5B4BFF] truncate">
                                      {p.name} ({p.code})
                                    </p>
                                    <p className="text-[10px] text-slate-400">{p.category}</p>
                                  </div>
                                </div>
                                <p className="font-black text-xs text-[#5B4BFF]">
                                  Rp {p.basePrice.toLocaleString('id-ID')}/{p.unit}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 5. Inventory & Tools */}
                      {searchResults.tools && searchResults.tools.length > 0 && (
                        <div className="border-t border-slate-100 pt-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                            Inventaris Mesin & Alat Studio ({searchResults.tools.length})
                          </span>
                          <div className="space-y-1.5">
                            {searchResults.tools.map((t) => (
                              <div
                                key={t.id}
                                onClick={() => {
                                  onPageChange('inventaris_alat');
                                  setIsSearchFocused(false);
                                }}
                                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-purple-50/60 border border-slate-100 hover:border-purple-200 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="material-symbols-outlined text-slate-600 text-lg shrink-0">
                                    print
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-extrabold text-xs text-slate-900 group-hover:text-[#5B4BFF] truncate">
                                      {t.name} ({t.brandModel})
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      Lokasi: {t.location}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {t.condition}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Empty Fallback State */}
                      {(!searchResults.pages || searchResults.pages.length === 0) &&
                        (!searchResults.orders || searchResults.orders.length === 0) &&
                        (!searchResults.customerFiles || searchResults.customerFiles.length === 0) &&
                        (!searchResults.inboxFiles || searchResults.inboxFiles.length === 0) &&
                        (!searchResults.products || searchResults.products.length === 0) &&
                        (!searchResults.tools || searchResults.tools.length === 0) && (
                          <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                            <span className="material-symbols-outlined text-2xl text-slate-300 block">
                              search_off
                            </span>
                            <p>Tidak ada hasil yang cocok dengan pencarian "{searchQuery}".</p>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel Bottom Footer Info */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="bg-white border border-slate-200 px-1 py-0.5 rounded text-[10px] font-mono">
                    ESC
                  </kbd>
                  <span>Tutup</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-white border border-slate-200 px-1 py-0.5 rounded text-[10px] font-mono">
                    Ctrl K
                  </kbd>
                  <span>Pintasan</span>
                </span>
              </div>
              <p className="text-[10px] font-bold text-[#5B4BFF]">TEFA DKV OS Command Center</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

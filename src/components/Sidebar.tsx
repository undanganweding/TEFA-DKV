import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, UserProfile } from '../types';
import { getInitials, getRoleGradient } from './views/ProfileView';

interface SidebarProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
  activeOrdersCount: number;
  lowStockCount: number;
  activeOperator: string;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: string;
  badge?: number;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  activeOrdersCount,
  lowStockCount,
  activeOperator,
  currentUser,
  onLogout,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const profileCardRef = useRef<HTMLDivElement | null>(null);

  // Close popup menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileCardRef.current &&
        !profileCardRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'kasir', label: 'Kasir TEFA', icon: 'point_of_sale' },
    {
      id: 'file_inbox',
      label: 'File Inbox',
      icon: 'inbox_customize',
      badge: 5,
      badgeColor: 'bg-purple-500/20 text-purple-200 border border-purple-400/30',
    },
    {
      id: 'pesanan',
      label: 'Pesanan Produksi',
      icon: 'precision_manufacturing',
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30',
    },
    { id: 'produk', label: 'Produk & Jasa', icon: 'category' },
    { id: 'inventaris_alat', label: 'Inventaris Alat', icon: 'construction' },
    {
      id: 'stok_bahan',
      label: 'Stok Bahan',
      icon: 'inventory_2',
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
    },
    { id: 'keuangan', label: 'Keuangan', icon: 'payments' },
    { id: 'laporan', label: 'Laporan', icon: 'assessment' },
    { id: 'pengadaan', label: 'Pengadaan Tahunan', icon: 'calendar_add_on' },
    { id: 'pengaturan', label: 'Pengaturan', icon: 'settings' },
    { id: 'manajemen_user', label: 'Manajemen User', icon: 'group' },
    { id: 'kelola_login', label: 'Kelola Login Page', icon: 'slideshow' },
  ];

  // Filter items according to role permissions
  const role = currentUser?.role || 'Kepala TEFA';
  const filteredNavItems = navItems.filter((item) => {
    if (role === 'Kepala TEFA' || role === 'Admin') {
      return true; // Full Access
    }
    if (role === 'Admin TEFA' || role === 'Guru / Operator') {
      // Management Access: Produk, Order (Pesanan), File (Inbox & Customer File), Produksi, Customer, Inventaris (Alat & Stok), Kasir, Dashboard, Kelola Login
      return ['dashboard', 'kasir', 'file_inbox', 'pesanan', 'produk', 'inventaris_alat', 'stok_bahan', 'kelola_login'].includes(item.id);
    }
    return true;
  });

  return (
    <aside className="p-3 sm:p-4 shrink-0 select-none z-30 font-sans">
      <div className="w-64 bg-[#151A2D] text-slate-300 flex flex-col h-[calc(100vh-2rem)] rounded-[28px] shadow-2xl border border-slate-800/80 overflow-hidden relative backdrop-blur-2xl">
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3.5 border-b border-slate-800/60">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-purple-900/10 shrink-0 border border-white/20 overflow-hidden">
            <img src="/src/assets/logo_smknu.jpg" alt="Logo SMK NU Ungaran" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-white text-base tracking-tight truncate leading-tight">
                TEFA DKV
              </h1>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-[#5B4BFF]/30 text-purple-200 border border-[#5B4BFF]/40">
                CREATIVE
              </span>
            </div>
            <p className="text-[10px] text-purple-300/70 font-bold tracking-wide truncate mt-0.5">
              Management Platform
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 no-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => onPageChange(item.id)}
                className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all duration-200 group ${
                  isActive
                    ? 'text-white font-extrabold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]'
                }`}
              >
                {/* Active Indicator Glowing Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavBackground"
                    className="absolute inset-0 rounded-2xl bg-[#5B4BFF] shadow-lg shadow-purple-600/40 border border-purple-400/30"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <span
                  className={`relative z-10 material-symbols-outlined text-xl transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'fill text-white' : 'text-purple-300/70 group-hover:text-purple-200'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="relative z-10 flex-1 text-left truncate tracking-wide">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`relative z-10 text-[10px] px-2 py-0.5 rounded-full font-black ${
                      item.badgeColor || 'bg-purple-900/60 text-purple-200 border border-purple-700/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Interactive Profile Card & SaaS Popup Menu */}
        <div ref={profileCardRef} className="p-3.5 border-t border-slate-800/80 bg-[#0F1322] relative z-40">
          {/* Animated Popup Dropdown Menu - Fully Opaque Solid Background */}
          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute bottom-full left-3.5 right-3.5 mb-3 bg-[#1C233B] border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/90 p-2 z-50 text-slate-200 space-y-1 font-sans ring-1 ring-white/10"
              >
                <div className="px-3 py-2.5 border-b border-slate-700/70 bg-[#151A2D] rounded-xl mb-1">
                  <p className="text-xs font-black text-white truncate">{currentUser?.name || 'User TEFA'}</p>
                  <p className="text-[10px] text-purple-300 font-semibold truncate">{currentUser?.email || 'user@smknuungaran.sch.id'}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onPageChange('profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-[#5B4BFF] transition-all cursor-pointer group/item"
                >
                  <span className="material-symbols-outlined text-base text-purple-300 group-hover/item:text-white">account_circle</span>
                  <span>Profil Saya</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onPageChange('profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-[#5B4BFF] transition-all cursor-pointer group/item"
                >
                  <span className="material-symbols-outlined text-base text-purple-300 group-hover/item:text-white">manage_accounts</span>
                  <span>Pengaturan Profil</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onPageChange('profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-[#5B4BFF] transition-all cursor-pointer group/item"
                >
                  <span className="material-symbols-outlined text-base text-purple-300 group-hover/item:text-white">security</span>
                  <span>Keamanan Akun</span>
                </button>

                {onLogout && (
                  <div className="pt-1 border-t border-slate-700/70">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-white hover:bg-red-600 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base text-red-400">logout</span>
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Trigger Card */}
          <div
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="bg-[#1C233B] hover:bg-[#252E4D] rounded-2xl p-2.5 border border-slate-700/50 flex items-center justify-between gap-2 shadow-inner transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser?.name || 'User'}
                    className="w-9 h-9 rounded-full object-cover border-2 border-purple-400/50 group-hover:border-purple-300 transition-colors"
                  />
                ) : (
                  <div
                    className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getRoleGradient(
                      currentUser?.role || 'Kepala TEFA'
                    )} text-white font-black text-xs flex items-center justify-center border-2 border-purple-400/50 shrink-0`}
                  >
                    {getInitials(currentUser?.name || 'Ahmad Fauzi')}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#151A2D] animate-pulse"></span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-white truncate group-hover:text-purple-200 transition-colors">
                  {currentUser?.role || 'Kepala TEFA'}
                </p>
                <p className="text-[10px] font-semibold text-purple-300/80 truncate">
                  {currentUser?.name || activeOperator || 'Operator Studio'}
                </p>
              </div>
            </div>

            <span className={`material-symbols-outlined text-base text-slate-400 group-hover:text-white transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`}>
              expand_less
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};


import React from 'react';
import { PageId } from '../types';

interface SidebarProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
  activeOrdersCount: number;
  lowStockCount: number;
  customOrdersCount?: number;
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
  customOrdersCount = 0,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'kasir', label: 'Kasir TEFA', icon: 'point_of_sale' },
    {
      id: 'custom_order',
      label: 'Custom Order',
      icon: 'add_shopping_cart',
      badge: customOrdersCount > 0 ? customOrdersCount : undefined,
      badgeColor: 'bg-purple-500 text-white',
    },
    {
      id: 'file_inbox',
      label: 'File Inbox',
      icon: 'inbox_customize',
      badge: 5,
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      id: 'pesanan',
      label: 'Pesanan Produksi',
      icon: 'precision_manufacturing',
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeColor: 'bg-emerald-500 text-white',
    },
    { id: 'produk', label: 'Produk & Jasa', icon: 'category' },
    { id: 'inventaris_alat', label: 'Inventaris Alat', icon: 'construction' },
    {
      id: 'stok_bahan',
      label: 'Stok Bahan',
      icon: 'inventory_2',
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'keuangan', label: 'Keuangan', icon: 'payments' },
    { id: 'laporan', label: 'Laporan', icon: 'assessment' },
    { id: 'pengadaan', label: 'Pengadaan Tahunan', icon: 'calendar_add_on' },
    { id: 'pengaturan', label: 'Pengaturan', icon: 'settings' },
  ];

  return (
    <aside className="w-64 bg-[#18153A] text-slate-300 flex flex-col h-screen sticky top-0 select-none z-30 shrink-0 border-r border-[#24204E]">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-900/40 shrink-0 border border-white/20">
          <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="font-black text-white text-lg tracking-tight truncate leading-tight">
            TEFA DKV
          </h1>
          <p className="text-[11px] text-indigo-300/80 font-bold tracking-wide truncate">
            SMK NU
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-2 space-y-1.5 no-scrollbar">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all duration-200 ${
                isActive
                  ? 'bg-[#5B50E6] text-white shadow-lg shadow-indigo-600/30 font-extrabold'
                  : 'hover:bg-white/10 text-indigo-200/80 hover:text-white'
              }`}
            >
              <span
                className={`material-symbols-outlined text-lg ${
                  isActive ? 'fill' : ''
                }`}
              >
                {item.icon}
              </span>
              <span className="flex-1 text-left truncate">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    item.badgeColor || 'bg-indigo-900 text-indigo-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile & Logout Box */}
      <div className="p-3.5 space-y-2 border-t border-[#252152] bg-[#141232]">
        {/* User Card */}
        <div className="bg-[#1F1B47] rounded-2xl p-3 border border-indigo-900/50 flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"
            alt="Admin"
            className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-indigo-500/40"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-white truncate">
              Kepala TEFA
            </p>
            <p className="text-[10px] font-medium text-indigo-300/80 truncate">
              Admin Utama
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => alert('Simulasi Logout Operator')}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-indigo-300/80 hover:text-white hover:bg-white/5 rounded-xl text-xs font-bold transition-colors"
        >
          <span className="material-symbols-outlined text-base">power_settings_new</span>
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
};


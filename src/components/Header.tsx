import React, { useState } from 'react';
import { PageId } from '../types';

interface HeaderProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
  onOpenAiAssistant: () => void;
  onOpenNewOrderModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  notificationsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onPageChange,
  notificationsCount,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);

  const getPageTitle = (page: PageId): string => {
    switch (page) {
      case 'dashboard':
        return 'Dashboard';
      case 'kasir':
        return 'Kasir TEFA';
      case 'file_inbox':
        return 'File Inbox Customer';
      case 'pesanan':
        return 'Pesanan Produksi';
      case 'produk':
        return 'Produk & Jasa';
      case 'customer_file':
        return 'File Customer';
      case 'inventaris_alat':
        return 'Inventaris Alat';
      case 'stok_bahan':
        return 'Stok Bahan';
      case 'keuangan':
        return 'Keuangan';
      case 'laporan':
        return 'Laporan';
      case 'pengadaan':
        return 'Pengadaan Tahunan';
      case 'pengaturan':
        return 'Pengaturan';
      default:
        return 'TEFA DKV';
    }
  };

  return (
    <header className="bg-[#F8F8FC] border-b border-slate-200/80 px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Title & Welcome Subtitle */}
      <div className="flex items-center gap-3">
        <button
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors md:hidden"
          title="Menu"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">
            {getPageTitle(currentPage)}
          </h2>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Selamat datang kembali, Kepala TEFA
          </p>
        </div>
      </div>

      {/* Right Header Controls */}
      <div className="flex items-center gap-3">
        {/* Public Upload Link Button */}
        <button
          onClick={() => onPageChange('public_upload')}
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all shrink-0"
          title="Simulasi Halaman Upload Siswa / Customer"
        >
          <span className="material-symbols-outlined text-base">upload_file</span>
          <span className="hidden sm:inline">Form Upload Siswa</span>
        </button>

        {/* Date Card Pill */}
        <div className="bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 flex items-center gap-2 shadow-2xs">
          <span className="material-symbols-outlined text-slate-400 text-base">
            calendar_today
          </span>
          <span className="text-xs font-bold text-slate-700">
            08 Agustus 2026
          </span>
        </div>

        {/* Notification Bell Button */}
        <div className="relative">
          <button
            id="btn-notifications-menu"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 text-slate-600 flex items-center justify-center relative shadow-2xs hover:bg-slate-50 transition-all"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {notificationsCount}
              </span>
            )}
          </button>

          {/* Notif Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                  Notifikasi Sistem
                </h4>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  {notificationsCount} Peringatan
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200/60 flex items-start gap-2.5 text-xs">
                  <span className="material-symbols-outlined text-indigo-600 text-lg shrink-0 mt-0.5">
                    warning
                  </span>
                  <div>
                    <p className="font-bold text-indigo-950">Stok Kertas Foto A4 Kritis</p>
                    <p className="text-[11px] text-indigo-700">Tersisa 25 lembar di rak bahan. Segera restock.</p>
                  </div>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/60 flex items-start gap-2.5 text-xs">
                  <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0 mt-0.5">
                    schedule
                  </span>
                  <div>
                    <p className="font-bold text-emerald-900">Pesanan Jatuh Tempo Hari Ini</p>
                    <p className="text-[11px] text-emerald-700">TEFA-20260808-001 harus diselesaikan jam 15:00 WIB.</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowNotifMenu(false)}
                className="w-full mt-3 py-1.5 text-center text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 rounded-lg"
              >
                Tutup Notifikasi
              </button>
            </div>
          )}
        </div>

        {/* Profile Emblem Circle */}
        <div className="w-9 h-9 rounded-full bg-[#18153A] flex items-center justify-center text-white text-xs font-black shadow-2xs border border-indigo-500/30 shrink-0">
          <span className="text-indigo-200 font-extrabold text-[11px]">TEFA</span>
        </div>
      </div>
    </header>
  );
};


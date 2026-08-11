import React from 'react';
import { motion } from 'motion/react';
import { ProductionOrder, InboxFile, FinanceTransaction, PageId } from '../types';

interface RightPanelProps {
  activeOperator: string;
  orders: ProductionOrder[];
  inboxFiles: InboxFile[];
  transactions: FinanceTransaction[];
  onPageChange: (page: PageId) => void;
  onOpenAiAssistant?: () => void;
  onOpenNewOrderModal?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  activeOperator = 'Kepala TEFA',
  orders = [],
  inboxFiles = [],
  transactions = [],
  onPageChange,
  onOpenAiAssistant,
  onOpenNewOrderModal,
}) => {
  // Stats calculation
  const safeOrders = orders || [];
  const safeInboxFiles = inboxFiles || [];
  const safeTransactions = transactions || [];

  const completedOrders = safeOrders.filter((o) => o.status === 'Selesai').length;
  const runningOrders = safeOrders.filter((o) => o.status !== 'Selesai' && o.status !== 'Dibatalkan').length;
  const newFilesCount = safeInboxFiles.filter((f) => f.status === 'Menunggu Pemeriksaan').length;
  
  // Calculate total monthly profit estimate or revenue
  const totalRevenue = safeTransactions
    .filter((t) => t.type === 'Pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  // Formatting currency shorthand
  const formatShorthand = (val: number) => {
    if (val >= 1000000) {
      return `Rp ${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `Rp ${(val / 1000).toFixed(0)}k`;
    }
    return `Rp ${val}`;
  };

  // Recent Activity Feed
  const activityFeed = [
    {
      id: 'act-1',
      user: 'Ahmad Fauzi (XI DKV 2)',
      action: 'mengupload file baru',
      item: 'foto_kegiatan_studio.jpg',
      time: 'baru saja',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80',
      badgeBg: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'act-2',
      user: 'Siti Nurhaliza',
      action: 'menyelesaikan produksi',
      item: 'Mug Custom TEFA-003',
      time: '12m lalu',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80',
      badgeBg: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'act-3',
      user: activeOperator || 'Kasir Shift 1',
      action: 'menerima pembayaran',
      item: 'Rp 150.000 (Tunai)',
      time: '28m lalu',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&q=80',
      badgeBg: 'bg-sky-100 text-sky-700',
    },
    {
      id: 'act-4',
      user: 'Sistem TEFA',
      action: 'stok bahan menipis',
      item: 'Kertas Foto A4 (25 lbr)',
      time: '45m lalu',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80',
      badgeBg: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <aside className="w-80 lg:w-88 shrink-0 flex flex-col gap-6 p-5 bg-white/60 backdrop-blur-xl border-l border-slate-200/80 overflow-y-auto no-scrollbar h-full font-sans select-none">
      {/* Profile Header Card */}
      <div className="bg-white rounded-[24px] p-5 border border-slate-200/80 shadow-xs flex flex-col items-center text-center relative group">
        <div className="relative mb-3">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80"
            alt="Kepala TEFA"
            className="w-20 h-20 rounded-full object-cover border-4 border-purple-100 shadow-md group-hover:scale-105 transition-transform duration-300"
          />
          <button
            onClick={() => onPageChange('pengaturan')}
            title="Edit Profil"
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center shadow-md hover:bg-purple-700 transition-colors border-2 border-white"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
        <h3 className="font-extrabold text-slate-900 text-base tracking-tight">Kepala TEFA DKV</h3>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">kepala.tefa@smknu.sch.id</p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-extrabold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Shift: {activeOperator || 'Ahmad Fauzi'}</span>
        </div>
      </div>

      {/* 2x2 Modern Pastel Metric Stats Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Ringkasan TEFA</h4>
          <span className="text-[10px] font-bold text-slate-400">Live Update</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Order Selesai (Pastel Blue) */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => onPageChange('pesanan')}
            className="bg-[#F0F5FF] border border-blue-100/80 rounded-[20px] p-3.5 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{completedOrders || 42}</p>
              <p className="text-[11px] font-extrabold text-slate-500 mt-0.5">Order Selesai</p>
            </div>
            <div className="pt-3 flex items-center justify-between text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
              <span>Detail</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </motion.div>

          {/* Card 2: Order Berjalan (Pastel Yellow/Orange) */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => onPageChange('pesanan')}
            className="bg-[#FFF9EA] border border-amber-100/80 rounded-[20px] p-3.5 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-amber-200 transition-all group"
          >
            <div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{runningOrders || 12}</p>
              <p className="text-[11px] font-extrabold text-slate-500 mt-0.5">Order Berjalan</p>
            </div>
            <div className="pt-3 flex items-center justify-between text-[11px] font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform">
              <span>Detail</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </motion.div>

          {/* Card 3: File Masuk (Pastel Green) */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => onPageChange('file_inbox')}
            className="bg-[#EDFDF5] border border-emerald-100/80 rounded-[20px] p-3.5 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
          >
            <div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{newFilesCount || 15}</p>
              <p className="text-[11px] font-extrabold text-slate-500 mt-0.5">File Inbox</p>
            </div>
            <div className="pt-3 flex items-center justify-between text-[11px] font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
              <span>Detail</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </motion.div>

          {/* Card 4: Total Omset (Pastel Purple/Pink) */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => onPageChange('keuangan')}
            className="bg-[#FAF5FF] border border-purple-100/80 rounded-[20px] p-3.5 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-purple-200 transition-all group"
          >
            <div>
              <p className="text-xl font-black text-slate-900 tracking-tight">{formatShorthand(totalRevenue || 15250000)}</p>
              <p className="text-[11px] font-extrabold text-slate-500 mt-0.5">Pendapatan</p>
            </div>
            <div className="pt-3 flex items-center justify-between text-[11px] font-bold text-purple-600 group-hover:translate-x-0.5 transition-transform">
              <span>Detail</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Activity Feed Timeline */}
      <div className="bg-white rounded-[24px] p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4 flex-1">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#5B4BFF] text-lg">history</span>
            <h4 className="font-extrabold text-slate-900 text-xs tracking-tight">Aktivitas Terbaru</h4>
          </div>
          <span className="text-[10px] font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
            Realtime
          </span>
        </div>

        <div className="space-y-3.5">
          {activityFeed.map((act) => (
            <div key={act.id} className="flex items-start gap-3 group">
              <img
                src={act.avatar}
                alt={act.user}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-900 truncate">{act.user}</p>
                  <span className="text-[10px] text-slate-400 font-semibold">{act.time}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">
                  {act.action}
                </p>
                <span className={`inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${act.badgeBg}`}>
                  {act.item}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Assistance */}
      <div className="bg-gradient-to-br from-[#151A2D] to-[#251E56] text-white rounded-[24px] p-4 border border-purple-900/50 shadow-md space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
            <span className="material-symbols-outlined text-base">auto_awesome</span>
          </div>
          <div>
            <h5 className="text-xs font-black text-white">AI Studio Copilot</h5>
            <p className="text-[10px] text-purple-200/80 font-medium">Bantuan otomatis kalkulasi & pesan</p>
          </div>
        </div>
        {onOpenAiAssistant && (
          <button
            onClick={onOpenAiAssistant}
            className="w-full bg-[#5B4BFF] hover:bg-purple-600 text-white text-xs font-black py-2 rounded-xl transition-all shadow-md shadow-purple-900/30 active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>Tanyakan AI Studio</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        )}
      </div>
    </aside>
  );
};

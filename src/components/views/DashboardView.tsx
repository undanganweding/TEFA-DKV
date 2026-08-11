import React from 'react';
import { motion } from 'motion/react';
import { ProductionOrder, MaterialStock, PageId, InboxFile, FinanceTransaction } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardViewProps {
  orders: ProductionOrder[];
  materials: MaterialStock[];
  inboxFiles?: InboxFile[];
  transactions?: FinanceTransaction[];
  onPageChange: (page: PageId) => void;
  onOpenOrderReceipt: (order: ProductionOrder) => void;
  onOpenNewOrderModal: () => void;
  onOpenAiAssistant?: () => void;
  activeOperator?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders = [],
  materials = [],
  inboxFiles = [],
  transactions = [],
  onPageChange,
  onOpenOrderReceipt,
  onOpenNewOrderModal,
  onOpenAiAssistant,
  activeOperator = 'Kepala TEFA',
}) => {
  // Stats calculation
  const safeOrders = orders || [];
  const safeInboxFiles = inboxFiles || [];
  const safeTransactions = transactions || [];

  const completedOrders = safeOrders.filter((o) => o.status === 'Selesai').length;
  const runningOrders = safeOrders.filter((o) => o.status !== 'Selesai' && o.status !== 'Dibatalkan').length;
  const newFilesCount = safeInboxFiles.filter((f) => f.status === 'Menunggu Pemeriksaan').length;

  const totalRevenue = safeTransactions
    .filter((t) => t.type === 'Pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  const nowTime = new Date();
  const todayStr = nowTime.getFullYear() + '-' + String(nowTime.getMonth() + 1).padStart(2, '0') + '-' + String(nowTime.getDate()).padStart(2, '0');
  const currentMonthPrefix = nowTime.getFullYear() + '-' + String(nowTime.getMonth() + 1).padStart(2, '0');

  // Transactions today
  const todayTransactions = safeTransactions.filter((t) => t.date.startsWith(todayStr));
  const todayOmzet = todayTransactions
    .filter((t) => t.type === 'Pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
  const todayHpp = todayTransactions
    .filter((t) => t.type === 'Pemasukan')
    .reduce((sum, t) => sum + (t.cogsAmount || 0), 0);
  const todayLaba = todayOmzet - todayHpp;
  const todayTrxCount = todayTransactions.length;

  // Transactions this month
  const monthTransactions = safeTransactions.filter((t) => t.date.includes(currentMonthPrefix));
  const monthOmzet = monthTransactions
    .filter((t) => t.type === 'Pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthHpp = monthTransactions
    .filter((t) => t.type === 'Pemasukan')
    .reduce((sum, t) => sum + (t.cogsAmount || 0), 0);
  const monthLaba = monthOmzet - monthHpp;

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

  // Activity Feed (Dipindahkan dari Sidebar Kanan ke Dashboard)
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

  // Bar chart revenue
  const revenueChartData = [
    { month: 'Mar', amount: 8200000, fill: '#E2E8F0' },
    { month: 'Apr', amount: 10500000, fill: '#E2E8F0' },
    { month: 'Mei', amount: 9800000, fill: '#E2E8F0' },
    { month: 'Jun', amount: 12100000, fill: '#818CF8' },
    { month: 'Jul', amount: 13900000, fill: '#818CF8' },
    { month: 'Agu', amount: totalRevenue > 0 ? totalRevenue : 15250000, fill: '#5B4BFF' },
  ];

  // Material usage chart
  const materialUsageData = [
    { name: 'Kertas Foto', value: 45, color: '#5B4BFF' },
    { name: 'Tinta Printer', value: 25, color: '#3BA7FF' },
    { name: 'Tinta Sublim', value: 15, color: '#34D399' },
    { name: 'Vinyl Sticker', value: 10, color: '#FFB020' },
    { name: 'Lainnya', value: 5, color: '#FF6B9D' },
  ];

  const recentVisualOrders = safeOrders.slice(0, 6);

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* 20% DARK NAVY HERO BANNER WITH 10% ACCENT PURPLE */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#151A2D] via-[#1E1B4B] to-[#251E56] p-6 sm:p-7 text-white shadow-2xl border border-purple-900/40"
      >
        {/* Subtle Ambient Shapes */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#5B4BFF]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/3 w-56 h-56 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-purple-200">
              <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse"></span>
              <span>Command Center Kepala TEFA DKV</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
              Dashboard Operasional TEFA Studio
            </h1>
            <p className="text-xs font-medium text-slate-300 leading-relaxed">
              Pantau performa omset, antrian produksi cetak, dan aktivitas studio secara langsung & efisien.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenNewOrderModal}
              className="bg-[#5B4BFF] hover:bg-purple-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-purple-900/40 transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>+ Order Baru</span>
            </button>
            {onOpenAiAssistant && (
              <button
                onClick={onOpenAiAssistant}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-extrabold text-xs px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-purple-300">auto_awesome</span>
                <span>Copilot AI</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* RINGKASAN TEFA (4 COMPACT KPI METRIC CARDS) - 70% WHITE/LIGHT STYLE */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5B4BFF]"></span>
            <span>Ringkasan Eksekutif TEFA</span>
          </h3>
          <span className="text-[10px] font-bold text-slate-400">Live Update Sesi Kasir</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Order Selesai */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => onPageChange('pesanan')}
            className="bg-white border border-slate-200/90 rounded-[22px] p-4 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Order Selesai
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold group-hover:bg-[#5B4BFF] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg">check_circle</span>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {completedOrders || 42} <span className="text-xs font-bold text-slate-400">Order</span>
              </h3>
              <p className="text-[11px] font-bold text-blue-600 mt-1 flex items-center gap-1">
                <span>Telah diserahkan ke pemesan</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </p>
            </div>
          </motion.div>

          {/* Card 2: Order Berjalan */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => onPageChange('pesanan')}
            className="bg-white border border-slate-200/90 rounded-[22px] p-4 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Order Berjalan
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg">precision_manufacturing</span>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {runningOrders || 12} <span className="text-xs font-bold text-slate-400">Aktif</span>
              </h3>
              <p className="text-[11px] font-bold text-amber-600 mt-1 flex items-center gap-1">
                <span>Dalam proses cetak & finishing</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </p>
            </div>
          </motion.div>

          {/* Card 3: File Inbox */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => onPageChange('file_inbox')}
            className="bg-white border border-slate-200/90 rounded-[22px] p-4 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                File Inbox
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg">inbox_customize</span>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {newFilesCount || 15} <span className="text-xs font-bold text-slate-400">File</span>
              </h3>
              <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                <span>Perlu pemeriksaan kasir</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </p>
            </div>
          </motion.div>

          {/* Card 4: Total Pendapatan */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => onPageChange('keuangan')}
            className="bg-white border border-slate-200/90 rounded-[22px] p-4 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Pendapatan Kas
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#5B4BFF] flex items-center justify-center shrink-0 font-bold group-hover:bg-[#5B4BFF] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg">payments</span>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#5B4BFF] tracking-tight">
                {formatShorthand(totalRevenue || 15250000)}
              </h3>
              <p className="text-[11px] font-bold text-purple-600 mt-1 flex items-center gap-1">
                <span>Omset dari transaksi TEFA</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* LAPORAN KEUANGAN TEFA (REALTIME FROM TRANSACTIONS) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
            <span>Kinerja Keuangan Hari Ini &amp; Bulan Ini</span>
          </h3>
          <span className="text-[10px] font-bold text-emerald-650 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            Realtime Transaction Data
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Omzet Hari Ini */}
          <div className="bg-white border border-slate-200/90 rounded-[22px] p-4 shadow-2xs space-y-2 text-left">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Omzet Hari Ini</p>
            <h3 className="text-xl font-black text-slate-900">Rp {todayOmzet.toLocaleString('id-ID')}</h3>
            <p className="text-[10px] font-semibold text-slate-400">{todayTrxCount} transaksi sukses</p>
          </div>

          {/* Card 2: HPP Hari Ini */}
          <div className="bg-white border border-slate-200/90 rounded-[22px] p-4 shadow-2xs space-y-2 text-left">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">HPP Hari Ini</p>
            <h3 className="text-xl font-black text-rose-650">Rp {todayHpp.toLocaleString('id-ID')}</h3>
            <p className="text-[10px] font-semibold text-slate-400">Modal bahan terpakai</p>
          </div>

          {/* Card 3: Laba Hari Ini */}
          <div className="bg-white border border-slate-200/90 rounded-[22px] p-4 shadow-2xs space-y-2 text-left">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Laba Hari Ini</p>
            <h3 className="text-xl font-black text-emerald-700">Rp {todayLaba.toLocaleString('id-ID')}</h3>
            <p className="text-[10px] font-semibold text-slate-400">Keuntungan bersih studio</p>
          </div>

          {/* Card 4: Kinerja Bulan Ini */}
          <div className="bg-[#151A2D] border border-slate-800 text-white rounded-[22px] p-4 shadow-md space-y-2 text-left">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Bulan Ini ({nowTime.toLocaleString('id-ID', { month: 'long' })})</p>
            <div className="space-y-1 text-[11px] font-bold text-slate-300">
              <div className="flex justify-between">
                <span>Omzet:</span>
                <span className="text-white font-black">Rp {monthOmzet.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>HPP:</span>
                <span className="text-rose-450 font-black">Rp {monthHpp.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between border-t border-slate-700/60 pt-1 mt-1">
                <span>Laba:</span>
                <span className="text-emerald-400 font-black">Rp {monthLaba.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID: REVENUE CHARTS & AKTIVITAS TERBARU FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col (2 Cols): Charts & Production Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Bar Chart */}
          <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-base">Grafik Omset Studio TEFA</h3>
                <p className="text-xs font-semibold text-slate-400">Rekapitulasi pendapatan per bulan</p>
              </div>
              <span className="text-xs font-extrabold text-[#5B4BFF] bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                Tahun Berjalan
              </span>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `${v / 1000000}M`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(91, 75, 255, 0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs font-extrabold py-2 px-3 rounded-2xl shadow-xl border border-purple-500/30">
                            {data.month} — Rp {data.amount.toLocaleString('id-ID')}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                    {revenueChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Production Orders Preview */}
          <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-base">Antrian Produksi Cetak</h3>
                <p className="text-xs font-semibold text-slate-400">Order terbaru yang sedang dikerjakan tim studio</p>
              </div>
              <button
                onClick={() => onPageChange('pesanan')}
                className="text-xs font-extrabold text-[#5B4BFF] hover:text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Kelola Pesanan</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentVisualOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  onClick={() => onOpenOrderReceipt(order)}
                  className="bg-slate-50 hover:bg-purple-50/40 p-3.5 rounded-2xl border border-slate-200/80 hover:border-purple-300 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between text-[10px] font-black">
                    <span className="text-slate-400 font-mono">{order.orderNo}</span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-0.2 rounded-md">
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-[#5B4BFF] transition-colors truncate">
                      {order.productName || (order.items && order.items[0]?.productName) || 'Order Cetak DKV'}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {order.customerName}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-black text-[#5B4BFF]">
                    <span>Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                    <span className="material-symbols-outlined text-sm">receipt</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col (1 Col): AKTIVITAS TERBARU (MOVED FROM SIDEBAR) & MATERIAL CONSUMPTION */}
        <div className="space-y-6">
          {/* AKTIVITAS TERBARU TIMELINE FEED */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5B4BFF] text-xl">history</span>
                <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">
                  Aktivitas Terbaru
                </h3>
              </div>
              <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                Realtime Feed
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

          {/* Material Consumption Donut */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm">Konsumsi Bahan Studio</h3>
              <span className="text-[10px] font-extrabold text-slate-400">Bulan Ini</span>
            </div>

            <div className="h-40 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={materialUsageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {materialUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-2 border-t border-slate-100">
              {materialUsageData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-600 truncate text-[11px]">{item.name}</span>
                  <span className="text-slate-900 font-extrabold ml-auto text-[11px]">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

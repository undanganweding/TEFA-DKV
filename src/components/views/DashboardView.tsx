import React from 'react';
import { ProductionOrder, MaterialStock, PageId, InboxFile } from '../../types';
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
  onPageChange: (page: PageId) => void;
  onOpenOrderReceipt: (order: ProductionOrder) => void;
  onOpenNewOrderModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  inboxFiles = [],
  onPageChange,
  onOpenNewOrderModal,
}) => {
  // Mock monthly revenue data for bar chart
  const revenueChartData = [
    { month: 'Mar', amount: 8200000, fill: '#C7D2FE' },
    { month: 'Apr', amount: 10500000, fill: '#C7D2FE' },
    { month: 'Mei', amount: 9800000, fill: '#C7D2FE' },
    { month: 'Jun', amount: 12100000, fill: '#C7D2FE' },
    { month: 'Jul', amount: 13900000, fill: '#C7D2FE' },
    { month: 'Agu', amount: 15250000, fill: '#4F46E5' },
  ];

  // Material usage pie chart data
  const materialUsageData = [
    { name: 'Kertas Foto', value: 45, color: '#6366F1' },
    { name: 'Tinta Printer', value: 25, color: '#06B6D4' },
    { name: 'Tinta Sublim', value: 15, color: '#10B981' },
    { name: 'Vinyl Sticker', value: 10, color: '#0284C7' },
    { name: 'Lainnya', value: 5, color: '#F59E0B' },
  ];

  // Mock list of 5 recent orders matching screenshot
  const recentOrdersList = [
    {
      id: 'TEFA-20260808-001',
      customer: 'Ahmad - XI DKV 2',
      status: 'Produksi',
      statusBg: 'bg-indigo-100 text-indigo-700',
      time: '2 jam lalu',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80',
    },
    {
      id: 'TEFA-20260808-002',
      customer: 'Siti Nurhaliza - X DKV 1',
      status: 'Menunggu',
      statusBg: 'bg-amber-100 text-amber-800',
      time: '3 jam lalu',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80',
    },
    {
      id: 'TEFA-20260808-003',
      customer: 'Budi Santoso - XI DKV 1',
      status: 'File Dicek',
      statusBg: 'bg-sky-100 text-sky-800',
      time: '4 jam lalu',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&q=80',
    },
    {
      id: 'TEFA-20260807-099',
      customer: 'Rizki Maulana - XII DKV 2',
      status: 'Selesai',
      statusBg: 'bg-emerald-100 text-emerald-800',
      time: '5 jam lalu',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
    },
    {
      id: 'TEFA-20260807-098',
      customer: 'Dewi Anggraini - Guru',
      status: 'Diambil',
      statusBg: 'bg-slate-100 text-slate-700',
      time: '6 jam lalu',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80',
    },
  ];

  // Best seller products list
  const topProducts = [
    { name: 'Cetak Foto A4', sales: 125, percentage: 85, color: 'bg-indigo-600' },
    { name: 'Cetak Foto 4R', sales: 98, percentage: 70, color: 'bg-indigo-500' },
    { name: 'Mug Custom', sales: 56, percentage: 48, color: 'bg-indigo-400' },
    { name: 'Cetak Poster A3', sales: 45, percentage: 38, color: 'bg-indigo-300' },
    { name: 'Cetak Banner', sales: 32, percentage: 28, color: 'bg-indigo-200' },
  ];

  // Today's Agenda list
  const todayAgenda = [
    {
      title: 'Cetak Foto Kegiatan',
      order: 'TEFA-20260808-001',
      time: '09:00',
      iconBg: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Cetak Poster A3',
      order: 'TEFA-20260808-002',
      time: '10:00',
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Mug Custom 5 pcs',
      order: 'TEFA-20260808-003',
      time: '11:30',
      iconBg: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Banner 2x1 m',
      order: 'TEFA-20260808-004',
      time: '15:00',
      iconBg: 'bg-sky-100 text-sky-600',
    },
  ];

  return (
    <div className="space-y-5 pb-10 font-sans text-slate-800">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pendapatan Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Pendapatan Hari Ini
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#EEEDFE] text-[#6366F1] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Rp 850.000
            </h3>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-sm">north_east</span>
                +12.5% dari kemarin
              </p>
              {/* Mini Purple Sparkline */}
              <svg className="w-16 h-6 text-indigo-500 stroke-current fill-none" viewBox="0 0 60 20" strokeWidth="2">
                <path d="M0 15 L10 12 L20 16 L30 8 L40 10 L50 4 L60 2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Pendapatan Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Pendapatan Bulan Ini
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] text-[#10B981] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Rp 15.250.000
            </h3>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-sm">north_east</span>
                +18.2% dari bulan lalu
              </p>
              {/* Mini Green Sparkline */}
              <svg className="w-16 h-6 text-emerald-500 stroke-current fill-none" viewBox="0 0 60 20" strokeWidth="2">
                <path d="M0 16 L12 14 L24 10 L36 12 L48 6 L60 3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3: Jumlah Transaksi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Jumlah Transaksi
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#F59E0B] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">shopping_cart</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              23
            </h3>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-sm">north_east</span>
                +5 transaksi hari ini
              </p>
              {/* Mini Orange Sparkline */}
              <svg className="w-16 h-6 text-amber-500 stroke-current fill-none" viewBox="0 0 60 20" strokeWidth="2">
                <path d="M0 14 L15 10 L30 13 L45 7 L60 4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 4: Pesanan Aktif */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Pesanan Aktif
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">inbox</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              12
            </h3>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] font-bold text-sky-600 flex items-center gap-0.5">
                Dalam proses produksi
              </p>
              {/* Mini Blue Sparkline */}
              <svg className="w-16 h-6 text-sky-500 stroke-current fill-none" viewBox="0 0 60 20" strokeWidth="2">
                <path d="M0 10 L15 12 L30 8 L45 11 L60 5" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 2 New Cards: File Inbox Quick Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card: File Masuk Hari Ini */}
        <div
          onClick={() => onPageChange('file_inbox')}
          className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl border border-indigo-800 shadow-2xs flex items-center justify-between cursor-pointer hover:opacity-95 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/80 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">upload_file</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">File Masuk Hari Ini</p>
              <h3 className="text-xl font-black">{inboxFiles.length || 12} File Siswa</h3>
            </div>
          </div>
          <span className="material-symbols-outlined text-indigo-300">chevron_right</span>
        </div>

        {/* Card: Menunggu Pemeriksaan */}
        <div
          onClick={() => onPageChange('file_inbox')}
          className="bg-amber-500 text-slate-950 p-4 rounded-2xl border border-amber-400 shadow-2xs flex items-center justify-between cursor-pointer hover:bg-amber-400 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 font-black">
              {inboxFiles.filter(f => f.status === 'Menunggu Pemeriksaan').length || 5}
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider">Menunggu Pemeriksaan</p>
              <h3 className="text-xl font-black">Perlu Di-Review Kepala TEFA</h3>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-950 font-black">arrow_forward</span>
        </div>
      </div>

      {/* Warning Alert Banner */}
      <div className="bg-[#EEEDFE] rounded-2xl p-4 border border-[#E0E0FE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6366F1] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-xl">notifications</span>
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm">
              Stok Hampir Habis!
            </h4>
            <p className="text-xs text-slate-600 font-medium">
              3 bahan stok hampir habis. Segera lakukan pembelian.
            </p>
          </div>
        </div>
        <button
          onClick={() => onPageChange('stok_bahan')}
          className="bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200/90 shadow-2xs transition-all shrink-0 flex items-center gap-1.5"
        >
          <span>Lihat Stok</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      {/* Main 3-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Box (Col 1): Grafik Pendapatan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Grafik Pendapatan
            </h3>
            <select className="bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600 px-2.5 py-1.5 focus:outline-hidden">
              <option>6 Bulan Terakhir</option>
              <option>3 Bulan Terakhir</option>
              <option>Tahun Ini</option>
            </select>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs font-extrabold py-1.5 px-3 rounded-xl shadow-xl">
                          {data.month} 2026 - Rp {data.amount.toLocaleString('id-ID')}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {revenueChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Middle Box (Col 2): File Customer Terbaru */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600 text-lg">folder_shared</span>
              <h3 className="font-extrabold text-slate-900 text-sm">
                File Customer Terbaru
              </h3>
            </div>
            <button
              onClick={() => onPageChange('file_inbox')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
            >
              <span>Inbox File</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[260px] no-scrollbar">
            {(inboxFiles.length > 0 ? inboxFiles.slice(0, 4) : [
              { customerName: 'Ahmad Fauzi', serviceType: 'Cetak Foto A4', classGrade: 'XI DKV 2', fileName: 'foto_kegiatan.jpg', status: 'Menunggu Pemeriksaan' },
              { customerName: 'Siti Nurhaliza', serviceType: 'Poster A3', classGrade: 'X DKV 1', fileName: 'poster_classmeeting.ai', status: 'File Dicek' },
              { customerName: 'Budi Santoso', serviceType: 'Mug Custom', classGrade: 'XI DKV 1', fileName: 'desain_mug_guru.png', status: 'Diterima' },
            ]).map((fileItem, idx) => (
              <div
                key={idx}
                onClick={() => onPageChange('file_inbox')}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                    <span className="material-symbols-outlined text-base">description</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-xs text-slate-900 truncate">
                      {fileItem.customerName} — <span className="text-indigo-600 font-bold">{fileItem.serviceType}</span>
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 truncate font-mono">
                      {fileItem.fileName} ({fileItem.classGrade})
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                    {fileItem.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Stack (Col 3): Agenda, Target, Stok Alert */}
        <div className="space-y-4">
          {/* Agenda Hari Ini */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Agenda Hari Ini
              </h3>
              <span className="material-symbols-outlined text-slate-400 text-lg">
                event
              </span>
            </div>

            <div className="space-y-2.5">
              {todayAgenda.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-sm">schedule</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{item.order}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md shrink-0">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Target Bulanan */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Target Bulanan
            </h3>

            <div className="flex items-center gap-4">
              {/* Circular Progress Ring */}
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="32" stroke="#EEEDFE" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#6366F1"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="201"
                    strokeDashoffset="64"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute font-black text-slate-900 text-xs">
                  68%
                </span>
              </div>

              {/* Numbers breakdown */}
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Target: </span>
                  <span className="font-black text-slate-800">Rp 22.500.000</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Tercapai: </span>
                  <span className="font-black text-emerald-600">Rp 15.250.000</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Sisa: </span>
                  <span className="font-black text-amber-600">Rp 7.250.000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stok Hampir Habis List */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Stok Hampir Habis
              </h3>
              <button
                onClick={() => onPageChange('stok_bahan')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                Lihat semua
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-red-50/60 border border-red-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="font-bold text-slate-800">Kertas Foto A4</span>
                </div>
                <span className="font-extrabold text-rose-600">25 lembar</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-red-50/60 border border-red-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="font-bold text-slate-800">Tinta Epson Cyan</span>
                </div>
                <span className="font-extrabold text-rose-600">1 botol</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-red-50/60 border border-red-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="font-bold text-slate-800">Mug Polos Putih</span>
                </div>
                <span className="font-extrabold text-rose-600">3 pcs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Row Grid: Produk Terlaris & Penggunaan Bahan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Produk Terlaris */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Produk Terlaris
            </h3>
            <select className="bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600 px-2.5 py-1.5 focus:outline-hidden">
              <option>Bulan Ini</option>
              <option>Bulan Lalu</option>
            </select>
          </div>

          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>{p.name}</span>
                  <span className="text-slate-500">{p.sales} transaksi</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p.color}`}
                    style={{ width: `${p.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Penggunaan Bahan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Penggunaan Bahan
            </h3>
            <select className="bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600 px-2.5 py-1.5 focus:outline-hidden">
              <option>Bulan Ini</option>
              <option>Bulan Lalu</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-1">
            {/* Donut Chart */}
            <div className="w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={materialUsageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
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

            {/* Legend Dots */}
            <div className="space-y-2 text-xs">
              {materialUsageData.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }}></span>
                  <span className="font-bold text-slate-700">{m.name}</span>
                  <span className="text-slate-400 font-semibold ml-auto">{m.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Quick Action Cards (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quick Action 1: Transaksi Baru */}
        <div
          onClick={() => onPageChange('kasir')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#EEEDFE] text-[#6366F1] flex items-center justify-center shrink-0 group-hover:bg-[#6366F1] group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
              + Transaksi Baru
            </h4>
            <p className="text-[11px] font-medium text-slate-400">
              Buat transaksi penjualan
            </p>
          </div>
        </div>

        {/* Quick Action 2: Pesanan Produksi */}
        <div
          onClick={() => onPageChange('pesanan')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#E6F4EA] text-[#10B981] flex items-center justify-center shrink-0 group-hover:bg-[#10B981] group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xl">precision_manufacturing</span>
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors">
              Pesanan Produksi
            </h4>
            <p className="text-[11px] font-medium text-slate-400">
              Lihat antrian produksi
            </p>
          </div>
        </div>

        {/* Quick Action 3: Upload File */}
        <div
          onClick={() => onPageChange('customer_file')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#FEF3C7] text-[#F59E0B] flex items-center justify-center shrink-0 group-hover:bg-[#F59E0B] group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xl">upload_file</span>
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-amber-600 transition-colors">
              Upload File
            </h4>
            <p className="text-[11px] font-medium text-slate-400">
              Terima file customer
            </p>
          </div>
        </div>

        {/* Quick Action 4: Laporan Hari Ini */}
        <div
          onClick={() => onPageChange('laporan')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0 group-hover:bg-[#0284C7] group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xl">assessment</span>
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-sky-600 transition-colors">
              Laporan Hari Ini
            </h4>
            <p className="text-[11px] font-medium text-slate-400">
              Lihat laporan harian
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-6 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-medium gap-2">
        <p>© 2026 TEFA DKV SMK NU. All rights reserved.</p>
        <p className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-500">
          Version 1.0.0
        </p>
      </footer>
    </div>
  );
};


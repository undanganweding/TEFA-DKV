import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ProductionOrder, OrderStatus } from '../../types';

interface PesananViewProps {
  orders: ProductionOrder[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => void;
  onRecordPayment: (orderId: string, amount: number) => void;
  onOpenOrderReceipt: (order: ProductionOrder) => void;
  onOpenNewOrderModal: () => void;
  onOpenPublicUpload?: () => void;
  onArchiveOrder?: (order: ProductionOrder) => void;
}

export const PesananView: React.FC<PesananViewProps> = ({
  orders,
  onUpdateOrderStatus,
  onRecordPayment,
  onOpenOrderReceipt,
  onOpenNewOrderModal,
  onOpenPublicUpload,
  onArchiveOrder,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeOrderDetail, setActiveOrderDetail] = useState<ProductionOrder | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [payAmountInput, setPayAmountInput] = useState<number>(0);

  // Simple Status helper & progress calculation
  const getProgressPercentage = (status: OrderStatus): number => {
    switch (status) {
      case 'Draft':
        return 10;
      case 'Antrian':
        return 25;
      case 'Proses Desain':
        return 50;
      case 'Cetak/Produksi':
        return 75;
      case 'Finishing':
        return 90;
      case 'Siap Ambil':
      case 'Selesai':
        return 100;
      default:
        return 30;
    }
  };

  const getSimpleStatus = (status: OrderStatus): 'Baru' | 'Diproses' | 'Selesai' | 'Diambil' => {
    if (status === 'Draft' || status === 'Antrian') return 'Baru';
    if (status === 'Proses Desain' || status === 'Cetak/Produksi' || status === 'Finishing') return 'Diproses';
    if (status === 'Siap Ambil') return 'Selesai';
    if (status === 'Selesai') return 'Diambil';
    return 'Baru';
  };

  // Stat Counters
  const countBaru = orders.filter((o) => getSimpleStatus(o.status) === 'Baru').length;
  const countDiproses = orders.filter((o) => getSimpleStatus(o.status) === 'Diproses').length;
  const countSelesai = orders.filter((o) => getSimpleStatus(o.status) === 'Selesai').length;
  const countBelumDiambil = orders.filter(
    (o) => getSimpleStatus(o.status) === 'Selesai' || o.status === 'Siap Ambil'
  ).length;

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    const simpleStatus = getSimpleStatus(order.status);

    let matchStatus = true;
    if (selectedFilter === 'Baru') matchStatus = simpleStatus === 'Baru';
    else if (selectedFilter === 'Diproses') matchStatus = simpleStatus === 'Diproses';
    else if (selectedFilter === 'Selesai') matchStatus = simpleStatus === 'Selesai';
    else if (selectedFilter === 'Diambil') matchStatus = simpleStatus === 'Diambil' || order.status === 'Selesai';

    const mainProduct = order.items[0]?.productName || '';
    const mainFile = order.items.find((i) => i.fileName)?.fileName || '';

    const matchSearch =
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.institution && order.institution.toLowerCase().includes(searchQuery.toLowerCase())) ||
      mainProduct.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mainFile.toLowerCase().includes(searchQuery.toLowerCase());

    return matchStatus && matchSearch;
  });

  const getStatusBadge = (status: OrderStatus) => {
    const simple = getSimpleStatus(status);
    switch (simple) {
      case 'Baru':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            Baru
          </span>
        );
      case 'Diproses':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3BA7FF]"></span>
            Diproses
          </span>
        );
      case 'Selesai':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Siap Ambil
          </span>
        );
      case 'Diambil':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BFF]"></span>
            Selesai
          </span>
        );
      default:
        return null;
    }
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrderDetail || payAmountInput <= 0) return;
    onRecordPayment(activeOrderDetail.id, payAmountInput);
    setShowPaymentModal(false);
    setPayAmountInput(0);
    const updated = orders.find((o) => o.id === activeOrderDetail.id);
    if (updated) setActiveOrderDetail(updated);
  };

  const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* 1. View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Pesanan Produksi Creative
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Pantau progres cetak & pembuatan produk DKV dalam format kartu proyek visual.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onOpenNewOrderModal}
            className="bg-gradient-to-r from-[#5B4BFF] to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all shrink-0 active:scale-95"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>+ Order Baru</span>
          </button>

          {onOpenPublicUpload && (
            <button
              onClick={onOpenPublicUpload}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-2xs transition-all shrink-0 active:scale-95"
            >
              <span className="material-symbols-outlined text-base text-[#5B4BFF]">upload_file</span>
              <span>Portal Upload Siswa</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Soft Pastel Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedFilter('Baru')}
          className={`p-5 rounded-[24px] border shadow-xs space-y-1.5 cursor-pointer transition-all ${
            selectedFilter === 'Baru'
              ? 'bg-[#FFFBEB] text-slate-900 border-amber-300 ring-2 ring-amber-300'
              : 'bg-[#FFFBEB]/70 text-slate-900 border-amber-200/80 hover:bg-[#FFFBEB]'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-amber-900 uppercase tracking-wider">Order Baru</p>
            <span className="material-symbols-outlined text-amber-600 text-xl">fiber_new</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{countBaru}</h3>
        </div>

        <div
          onClick={() => setSelectedFilter('Diproses')}
          className={`p-5 rounded-[24px] border shadow-xs space-y-1.5 cursor-pointer transition-all ${
            selectedFilter === 'Diproses'
              ? 'bg-[#EFF6FF] text-slate-900 border-blue-300 ring-2 ring-blue-300'
              : 'bg-[#EFF6FF]/70 text-slate-900 border-blue-200/80 hover:bg-[#EFF6FF]'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-blue-900 uppercase tracking-wider">Sedang Diproses</p>
            <span className="material-symbols-outlined text-[#3BA7FF] text-xl">precision_manufacturing</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{countDiproses}</h3>
        </div>

        <div
          onClick={() => setSelectedFilter('Selesai')}
          className={`p-5 rounded-[24px] border shadow-xs space-y-1.5 cursor-pointer transition-all ${
            selectedFilter === 'Selesai'
              ? 'bg-[#ECFDF5] text-slate-900 border-emerald-300 ring-2 ring-emerald-300'
              : 'bg-[#ECFDF5]/70 text-slate-900 border-emerald-200/80 hover:bg-[#ECFDF5]'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-emerald-900 uppercase tracking-wider">Siap Ambil</p>
            <span className="material-symbols-outlined text-emerald-600 text-xl">verified</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{countSelesai}</h3>
        </div>

        <div
          onClick={() => setSelectedFilter('Diambil')}
          className={`p-5 rounded-[24px] border shadow-xs space-y-1.5 cursor-pointer transition-all ${
            selectedFilter === 'Diambil'
              ? 'bg-[#F3F0FF] text-slate-900 border-purple-300 ring-2 ring-purple-300'
              : 'bg-[#F3F0FF]/70 text-slate-900 border-purple-200/80 hover:bg-[#F3F0FF]'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-purple-900 uppercase tracking-wider">Sudah Diambil</p>
            <span className="material-symbols-outlined text-[#5B4BFF] text-xl">task_alt</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{countBelumDiambil}</h3>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['Semua', 'Baru', 'Diproses', 'Selesai', 'Diambil'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedFilter(tab)}
              className={`px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedFilter === tab
                  ? 'bg-[#5B4BFF] text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No Order, Customer, Produk..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#5B4BFF] focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* 4. Visual Project Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-[28px] p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <span className="material-symbols-outlined text-4xl text-slate-300">
            inventory_2
          </span>
          <p className="text-sm font-extrabold text-slate-600">Tidak ada pesanan produksi yang ditemukan.</p>
          <p className="text-xs text-slate-400">Ubah filter atau kata kunci pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const mainProduct = order.items[0]?.productName || 'Cetak Custom TEFA';
            const progress = getProgressPercentage(order.status);
            const imagePreview =
              order.designImage ||
              'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&q=80';

            return (
              <motion.div
                key={order.id}
                whileHover={{ y: -4 }}
                onClick={() => setActiveOrderDetail(order)}
                className="bg-white rounded-[24px] border border-slate-200/80 hover:border-purple-300 p-4.5 shadow-xs hover:shadow-xl hover:shadow-purple-500/10 transition-all cursor-pointer flex flex-col justify-between space-y-4 group relative"
              >
                <div>
                  {/* Thumbnail Image Preview */}
                  <div className="aspect-video w-full rounded-[18px] bg-slate-100 overflow-hidden relative mb-3.5 border border-slate-100">
                    <img
                      src={imagePreview}
                      alt={mainProduct}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1 rounded-full font-mono shadow-xs">
                      {order.orderNo}
                    </span>
                    <div className="absolute top-2 right-2 shrink-0">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-[#5B4BFF] transition-colors line-clamp-1">
                      {mainProduct}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 truncate">
                      Pemesan: <span className="text-slate-800 font-extrabold">{order.customerName}</span> ({order.institution || 'Siswa DKV'})
                    </p>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-extrabold">
                      <span className="text-slate-500">Progres Produksi</span>
                      <span className="text-[#5B4BFF]">{progress}% selesai</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#5B4BFF] to-[#3BA7FF] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Footer Payment & Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Tagihan</span>
                    <span className="font-black text-sm text-slate-900">{formatRupiah(order.totalAmount)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenOrderReceipt(order);
                      }}
                      title="Cetak Nota"
                      className="p-2 rounded-full bg-slate-100 hover:bg-purple-100 hover:text-[#5B4BFF] text-slate-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">receipt_long</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveOrderDetail(order);
                      }}
                      className="bg-[#5B4BFF] hover:bg-purple-700 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-md shadow-purple-500/20 transition-all flex items-center gap-1"
                    >
                      <span>Detail</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal / Drawer */}
      {activeOrderDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-5"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-black text-[#5B4BFF] font-mono">{activeOrderDetail.orderNo}</span>
                <h3 className="text-lg font-black text-slate-900">{activeOrderDetail.customerName}</h3>
              </div>
              <button
                onClick={() => setActiveOrderDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1">
                <span className="text-slate-400 font-extrabold uppercase tracking-wider block text-[10px]">Produk Cetak</span>
                <p className="text-slate-900 font-extrabold text-sm">{activeOrderDetail.items[0]?.productName || 'Custom TEFA'}</p>
                <p className="text-slate-500">Jumlah: {activeOrderDetail.items[0]?.qty || 1} pcs</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1">
                <span className="text-slate-400 font-extrabold uppercase tracking-wider block text-[10px]">Status Pembayaran</span>
                <p className="text-slate-900 font-extrabold text-sm">{formatRupiah(activeOrderDetail.totalAmount)}</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  {activeOrderDetail.paymentStatus}
                </span>
              </div>
            </div>

            {/* Change Status Controls */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700">Ubah Status Produksi:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Antrian', 'Proses Desain', 'Cetak/Produksi', 'Siap Ambil', 'Selesai'] as OrderStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      onUpdateOrderStatus(activeOrderDetail.id, st);
                      setActiveOrderDetail({ ...activeOrderDetail, status: st });
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      activeOrderDetail.status === st
                        ? 'bg-[#5B4BFF] text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => onOpenOrderReceipt(activeOrderDetail)}
                className="bg-purple-50 text-[#5B4BFF] hover:bg-purple-100 font-extrabold text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">receipt_long</span>
                <span>Cetak Nota Thermal</span>
              </button>

              <button
                onClick={() => setActiveOrderDetail(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-full"
              >
                Tutup Detail
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

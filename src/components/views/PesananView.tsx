import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ProductionOrder, OrderStatus } from '../../types';

interface PesananViewProps {
  orders: ProductionOrder[];
  inboxFiles?: any[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => void;
  onRecordPayment: (orderId: string, amount: number) => void;
  onRefundOrder?: (orderId: string, amount: number, reason: string) => void;
  onOpenOrderReceipt: (order: ProductionOrder) => void;
  onOpenNewOrderModal: () => void;
  onOpenPublicUpload?: () => void;
  onArchiveOrder?: (order: ProductionOrder) => void;
  onRejectOrder?: (orderId: string, reason: string) => Promise<void>;
  onConfirmOrderPrice?: (orderId: string, items: any[], subtotal: number, discount: number, taxAmount: number, totalAmount: number) => Promise<void>;
}

export const PesananView: React.FC<PesananViewProps> = ({
  orders,
  inboxFiles = [],
  onUpdateOrderStatus,
  onRecordPayment,
  onRefundOrder,
  onOpenOrderReceipt,
  onOpenNewOrderModal,
  onOpenPublicUpload,
  onArchiveOrder,
  onRejectOrder,
  onConfirmOrderPrice,
}) => {

  const [selectedFilter, setSelectedFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeOrderDetail, setActiveOrderDetail] = useState<ProductionOrder | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [payAmountInput, setPayAmountInput] = useState<number>(0);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState<boolean>(false);

  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);
  const [refundAmountInput, setRefundAmountInput] = useState<number>(0);
  const [refundReasonInput, setRefundReasonInput] = useState<string>('Order dibatalkan');
  const [isRefundProcessing, setIsRefundProcessing] = useState<boolean>(false);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('');
  const [isRejectProcessing, setIsRejectProcessing] = useState<boolean>(false);

  // Confirm price state
  const [showConfirmPriceModal, setShowConfirmPriceModal] = useState<boolean>(false);
  const [confirmPriceItems, setConfirmPriceItems] = useState<any[]>([]);
  const [isConfirmProcessing, setIsConfirmProcessing] = useState<boolean>(false);

  // Simple Status helper & progress calculation
  const getProgressPercentage = (status: OrderStatus): number => {
    switch (status) {
      case 'Draft':
        return 10;
      case 'Menunggu Admin':
        return 25;
      case 'Diproses':
        return 75;
      case 'Selesai':
        return 90;
      case 'Diterima':
        return 100;
      default:
        return 30;
    }
  };

  const getSimpleStatus = (status: OrderStatus): 'Baru' | 'Diproses' | 'Selesai' | 'Diterima' => {
    if (status === 'Draft' || status === 'Menunggu Admin') return 'Baru';
    if (status === 'Diproses') return 'Diproses';
    if (status === 'Selesai') return 'Selesai';
    if (status === 'Diterima') return 'Diterima';
    return 'Baru';
  };

  // Stat Counters (Memoized)
  const countBaru = useMemo(() => orders.filter((o) => getSimpleStatus(o.status) === 'Baru').length, [orders]);
  const countDiproses = useMemo(() => orders.filter((o) => getSimpleStatus(o.status) === 'Diproses').length, [orders]);
  const countSelesai = useMemo(() => orders.filter((o) => getSimpleStatus(o.status) === 'Selesai').length, [orders]);
  const countDiterima = useMemo(() => orders.filter((o) => getSimpleStatus(o.status) === 'Diterima').length, [orders]);

  // Filter logic (Memoized)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const simpleStatus = getSimpleStatus(order.status);

      let matchStatus = true;
      if (selectedFilter === 'Baru') matchStatus = simpleStatus === 'Baru';
      else if (selectedFilter === 'Diproses') matchStatus = simpleStatus === 'Diproses';
      else if (selectedFilter === 'Selesai') matchStatus = simpleStatus === 'Selesai';
      else if (selectedFilter === 'Diterima') matchStatus = simpleStatus === 'Diterima';

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
  }, [orders, selectedFilter, searchQuery]);

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
            Selesai
          </span>
        );
      case 'Diterima':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BFF]"></span>
            Diterima
          </span>
        );
      default:
        return null;
    }
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrderDetail || payAmountInput <= 0 || isPaymentProcessing) return;
    
    setIsPaymentProcessing(true);
    setTimeout(() => {
      onRecordPayment(activeOrderDetail.id, payAmountInput);
      setIsPaymentProcessing(false);
      setShowPaymentModal(false);
      setPayAmountInput(0);
      const updated = orders.find((o) => o.id === activeOrderDetail.id);
      if (updated) {
        setActiveOrderDetail({
          ...updated,
          paidAmount: updated.paidAmount + payAmountInput,
          balanceDue: Math.max(0, updated.totalAmount - (updated.paidAmount + payAmountInput))
        });
      }
    }, 400);
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
            <p className="text-xs font-black text-emerald-900 uppercase tracking-wider">Selesai</p>
            <span className="material-symbols-outlined text-emerald-600 text-xl">verified</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{countSelesai}</h3>
        </div>

        <div
          onClick={() => setSelectedFilter('Diterima')}
          className={`p-5 rounded-[24px] border shadow-xs space-y-1.5 cursor-pointer transition-all ${
            selectedFilter === 'Diterima'
              ? 'bg-[#F3F0FF] text-slate-900 border-purple-300 ring-2 ring-purple-300'
              : 'bg-[#F3F0FF]/70 text-slate-900 border-purple-200/80 hover:bg-[#F3F0FF]'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-purple-900 uppercase tracking-wider">Diterima</p>
            <span className="material-symbols-outlined text-[#5B4BFF] text-xl">task_alt</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{countDiterima}</h3>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['Semua', 'Baru', 'Diproses', 'Selesai', 'Diterima'].map((tab) => (
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
            
            // Find uploaded file from order items or linked inbox files
            const linkedFile = inboxFiles.find((f: any) => f.linkedOrderNo === order.orderNo || f.linked_order_no === order.orderNo);
            const itemWithFile = order.items.find(i => i.fileUrl || i.fileName);
            const uploadedImageUrl = itemWithFile?.fileUrl || linkedFile?.previewUrl || linkedFile?.folderPath || order.designImage;
            const hasRealImage = uploadedImageUrl && (uploadedImageUrl.startsWith('http') || uploadedImageUrl.startsWith('data:image'));
            const imagePreview = hasRealImage
              ? uploadedImageUrl
              : 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&q=80';

            return (
              <motion.div
                key={order.id}
                whileHover={{ y: -4 }}
                onClick={() => setActiveOrderDetail(order)}
                className="bg-white rounded-[24px] border border-slate-200/80 hover:border-purple-300 p-4.5 shadow-xs hover:shadow-xl hover:shadow-purple-500/10 transition-all cursor-pointer flex flex-col justify-between space-y-4 group relative"
              >
                <div>
                  {/* Thumbnail Image Preview */}
                  <div className="aspect-video w-full rounded-[18px] bg-slate-100 overflow-hidden relative mb-3.5 border border-slate-100 flex items-center justify-center">
                    {hasRealImage ? (
                      <img
                        src={imagePreview}
                        alt={mainProduct}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <span className="material-symbols-outlined text-4xl text-[#5B4BFF]/50 mb-1">design_services</span>
                        <span className="text-[11px] font-bold text-slate-600 line-clamp-1">{itemWithFile?.fileName || linkedFile?.fileName || 'Pesanan Cetak'}</span>
                      </div>
                    )}
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
                    {order.notes && (
                      <p className="text-[11px] text-slate-600 bg-amber-50/80 border border-amber-200/60 rounded-lg px-2.5 py-1 line-clamp-2 font-medium">
                        <strong className="text-amber-800 font-extrabold">Catatan:</strong> {order.notes}
                      </p>
                    )}
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
                      className="p-2 rounded-full bg-slate-100 hover:bg-purple-100 hover:text-[#5B4BFF] text-slate-600 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">receipt_long</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveOrderDetail(order);
                      }}
                      className="bg-[#5B4BFF] hover:bg-purple-700 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-md shadow-purple-500/20 transition-all flex items-center gap-1 cursor-pointer"
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
      {activeOrderDetail && (() => {
        const linkedFile = inboxFiles.find((f: any) => f.linkedOrderNo === activeOrderDetail.orderNo || f.linked_order_no === activeOrderDetail.orderNo);
        const itemWithFile = activeOrderDetail.items.find(i => i.fileUrl || i.fileName);
        let uploadedFileUrl = itemWithFile?.fileUrl || linkedFile?.previewUrl || linkedFile?.storagePath || linkedFile?.folderPath || activeOrderDetail.designImage;
        const uploadedFileName = itemWithFile?.fileName || linkedFile?.fileName || 'File Desain Siswa';

        // Ensure file URL points to valid Supabase storage URL if it is a storage path
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (uploadedFileUrl && !uploadedFileUrl.startsWith('http') && !uploadedFileUrl.startsWith('data:') && !uploadedFileUrl.startsWith('blob:')) {
          const cleanPath = uploadedFileUrl.startsWith('/') ? uploadedFileUrl.slice(1) : uploadedFileUrl;
          uploadedFileUrl = `${supabaseUrl}/storage/v1/object/public/design-files/${cleanPath}`;
        }

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-2xl rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-black text-[#5B4BFF] font-mono">{activeOrderDetail.orderNo}</span>
                  <h3 className="text-lg font-black text-slate-900">{activeOrderDetail.customerName}</h3>
                  {activeOrderDetail.customerPhone && (
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-sm text-emerald-600">phone</span>
                      {activeOrderDetail.customerPhone} ({activeOrderDetail.institution || 'Siswa DKV'})
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setActiveOrderDetail(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Uploaded File / Artwork Preview Box */}
              {(uploadedFileUrl || itemWithFile?.fileName || linkedFile?.fileName) && (
                <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-600">attachment</span>
                      <span className="text-xs font-black text-purple-950 uppercase tracking-wider">File & Gambar Yang Diupload Siswa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadedFileUrl ? (
                        <>
                          <a
                            href={uploadedFileUrl}
                            download={uploadedFileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            <span>Unduh File</span>
                          </a>
                          <a
                            href={uploadedFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#5B4BFF] hover:bg-purple-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                            <span>Buka File Asli</span>
                          </a>
                        </>
                      ) : (
                        <button
                          onClick={() => alert(`File "${uploadedFileName}" tersimpan di server. File path: ${linkedFile?.folderPath || 'inbox_files'}`)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          <span>Unduh File</span>
                        </button>
                      )}
                    </div>
                  </div>



                  <div className="flex flex-col sm:flex-row gap-4 items-start bg-white p-3 rounded-xl border border-purple-100">
                    {uploadedFileUrl && (uploadedFileUrl.startsWith('http') || uploadedFileUrl.startsWith('data:image')) ? (
                      <img
                        src={uploadedFileUrl}
                        alt="Design Uploaded"
                        className="w-28 h-28 object-cover rounded-lg border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-purple-100 text-purple-700 flex flex-col items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-3xl">draft</span>
                      </div>
                    )}
                    <div className="space-y-1 text-xs font-semibold text-slate-700">
                      <p className="font-extrabold text-slate-900 text-sm">{uploadedFileName}</p>
                      {linkedFile?.fileSize && <p className="text-slate-500">Ukuran: {linkedFile.fileSize}</p>}
                      {linkedFile?.serviceType && <p className="text-slate-500">Layanan: {linkedFile.serviceType}</p>}
                      {linkedFile?.printSize && <p className="text-slate-500">Ukuran Cetak: {linkedFile.printSize}</p>}
                      {linkedFile?.notes && (
                        <p className="text-purple-900 bg-purple-50 p-2 rounded-lg mt-1 border border-purple-200/50">
                          <strong>Catatan File:</strong> {linkedFile.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Order Notes / Specification Box */}
              {activeOrderDetail.notes && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-1 text-xs">
                  <span className="text-amber-900 font-black uppercase tracking-wider block text-[10px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-amber-700">description</span>
                    Catatan / Keterangan Pemesan
                  </span>
                  <p className="text-slate-800 font-bold leading-relaxed">{activeOrderDetail.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="bg-slate-50 p-3.5 rounded-2xl space-y-3">
                  <span className="text-slate-400 font-extrabold uppercase tracking-wider block text-[10px] border-b border-slate-200 pb-2">Rincian Produk Cetak</span>
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                    {activeOrderDetail.items.map((item, idx) => (
                      <div key={idx} className="space-y-1 border-b border-slate-100 last:border-0 pb-2">
                        <p className="text-slate-900 font-extrabold text-sm">{item.productName || 'Custom TEFA'}</p>
                        {item.variantName && <p className="text-slate-600">Varian: {item.variantName}</p>}
                        {item.notes && (
                          <p className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] font-bold">
                            Spesifikasi: {item.notes}
                          </p>
                        )}
                        <p className="text-slate-600">
                          {item.qty} {item.unit || 'pcs'} x {formatRupiah(item.unitPrice || 0)}
                        </p>
                        <p className="text-[#5B4BFF] font-black text-sm">Subtotal: {formatRupiah(item.totalPrice || 0)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2">
                  <span className="text-slate-400 font-extrabold uppercase tracking-wider block text-[10px]">Status Pembayaran</span>
                  <p className="text-slate-900 font-extrabold text-sm">Total: {formatRupiah(activeOrderDetail.totalAmount)}</p>
                  <p className="text-slate-700 font-bold">Bayar: {formatRupiah(activeOrderDetail.paidAmount)}</p>
                  <p className="text-rose-600 font-bold">Sisa Tagihan: {formatRupiah(activeOrderDetail.balanceDue)}</p>
                  {activeOrderDetail.refundedAmount && activeOrderDetail.refundedAmount > 0 ? (
                    <p className="text-rose-650 font-bold">Refunded: {formatRupiah(activeOrderDetail.refundedAmount)}</p>
                  ) : null}
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                    {activeOrderDetail.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Change Status Controls */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700">Ubah Status Pesanan:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Menunggu Admin', 'Diproses', 'Selesai', 'Diterima'] as OrderStatus[]).map((st) => {
                    const isActive = activeOrderDetail.status === st;
                    return (
                      <button
                        key={st}
                        onClick={async () => {
                          setActiveOrderDetail({ ...activeOrderDetail, status: st });
                          await onUpdateOrderStatus(activeOrderDetail.id, st);
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#5B4BFF] text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap pt-2">

                {activeOrderDetail.status === 'Menunggu Konfirmasi' && onConfirmOrderPrice && (
                  <button
                    onClick={() => {
                      setConfirmPriceItems(JSON.parse(JSON.stringify(activeOrderDetail.items))); // deep clone
                      setShowConfirmPriceModal(true);
                    }}
                    className="py-2 px-4 rounded-xl text-xs font-bold bg-[#5B4BFF] text-white shadow-md hover:bg-purple-700 transition-colors cursor-pointer"
                  >
                    Konfirmasi Harga
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowRejectModal(true);
                    setRejectReasonInput('');
                  }}
                  className="py-2 px-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                  disabled={activeOrderDetail.status === 'Dibatalkan' || activeOrderDetail.status === 'Ditolak'}
                >
                  {activeOrderDetail.status === 'Dibatalkan' || activeOrderDetail.status === 'Ditolak' ? 'Pesanan Dibatalkan/Ditolak' : 'Tolak Pesanan'}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex gap-2">
                  <button
                    onClick={() => onOpenOrderReceipt(activeOrderDetail)}
                    className="bg-purple-50 text-[#5B4BFF] hover:bg-purple-100 font-extrabold text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">receipt_long</span>
                    <span>Nota</span>
                  </button>

                  {onRefundOrder && activeOrderDetail.paidAmount > 0 && activeOrderDetail.paymentStatus !== 'REFUNDED' && (
                    <button
                      onClick={() => {
                        const available = activeOrderDetail.paidAmount - (activeOrderDetail.refundedAmount || 0);
                        setRefundAmountInput(available);
                        setShowRefundModal(true);
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-650 font-extrabold text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer border border-red-200"
                    >
                      <span className="material-symbols-outlined text-base">payments</span>
                      <span>Refund</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setActiveOrderDetail(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-full cursor-pointer"
                >
                  Tutup Detail
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}


      {/* Refund Confirmation Modal */}
      {showRefundModal && activeOrderDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-55 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl text-xs font-sans text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-600">
                <span className="material-symbols-outlined text-lg">payments</span>
                <h3 className="font-black text-slate-900 text-sm">Konfirmasi Refund / Kembalikan Dana</h3>
              </div>
              <button
                type="button"
                disabled={isRefundProcessing}
                onClick={() => setShowRefundModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Order ID:</span>
                <span className="text-slate-900 font-black">{activeOrderDetail.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Customer:</span>
                <span className="text-slate-900 font-extrabold max-w-[180px] truncate">{activeOrderDetail.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Total Order:</span>
                <span className="text-slate-900 font-extrabold">{formatRupiah(activeOrderDetail.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Total Paid:</span>
                <span className="text-slate-900 font-extrabold">{formatRupiah(activeOrderDetail.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-rose-650">
                <span className="font-bold">Total Refunded:</span>
                <span className="font-black">{formatRupiah(activeOrderDetail.refundedAmount || 0)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200/60 font-black text-slate-900">
                <span>Refund Available:</span>
                <span className="text-[#5B4BFF]">{formatRupiah(activeOrderDetail.paidAmount - (activeOrderDetail.refundedAmount || 0))}</span>
              </div>
            </div>

            <div className="space-y-3 font-semibold text-slate-700">
              <div>
                <label className="block text-slate-600 mb-1">Jumlah Refund (Rp) *</label>
                <input
                  type="number"
                  required
                  disabled={isRefundProcessing}
                  value={refundAmountInput || ''}
                  onChange={(e) => setRefundAmountInput(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Alasan Refund *</label>
                <select
                  disabled={isRefundProcessing}
                  value={refundReasonInput}
                  onChange={(e) => setRefundReasonInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="Order dibatalkan">Order dibatalkan</option>
                  <option value="Kesalahan produksi">Kesalahan produksi</option>
                  <option value="Pembayaran berlebih">Pembayaran berlebih</option>
                  <option value="Permintaan customer">Permintaan customer</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
          </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isRefundProcessing}
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-full cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isRefundProcessing}
                onClick={() => {
                  const available = activeOrderDetail.paidAmount - (activeOrderDetail.refundedAmount || 0);
                  if (refundAmountInput > available) {
                    alert(`Jumlah refund melebihi batas yang tersedia (${formatRupiah(available)})`);
                    return;
                  }
                  if (refundAmountInput <= 0) {
                    alert('Jumlah refund harus lebih besar dari 0');
                    return;
                  }
                  setIsRefundProcessing(true);
                  // Simulate brief timeout to block double clicks
                  setTimeout(() => {
                    if (onRefundOrder) {
                      onRefundOrder(activeOrderDetail.id, refundAmountInput, refundReasonInput);
                    }
                    setIsRefundProcessing(false);
                    setShowRefundModal(false);
                    // Refresh details inside main orders mapping
                    const updated = orders.find((o) => o.id === activeOrderDetail.id);
                    if (updated) {
                      setActiveOrderDetail({
                        ...updated,
                        refundedAmount: (updated.refundedAmount || 0) + refundAmountInput,
                        paymentStatus: ((updated.refundedAmount || 0) + refundAmountInput) >= updated.paidAmount ? 'REFUNDED' : 'PARTIALLY_REFUNDED'
                      });
                    } else {
                      setActiveOrderDetail(null);
                    }
                  }, 300);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-750 text-white font-extrabold rounded-full shadow-md cursor-pointer flex items-center gap-1"
              >
                {isRefundProcessing ? 'Memproses...' : 'Konfirmasi Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Order Modal */}
      {showRejectModal && activeOrderDetail && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl p-6"
          >
            <h3 className="text-lg font-black text-slate-900 mb-2">Batalkan Pesanan</h3>
            <p className="text-sm text-slate-600 mb-4">
              Apakah Anda yakin ingin menolak atau membatalkan pesanan <span className="font-bold">{activeOrderDetail.orderNo}</span>?
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Alasan Pembatalan / Penolakan</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  rows={3}
                  placeholder="Misal: Stok bahan habis, tidak bisa cetak..."
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                ></textarea>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  disabled={isRejectProcessing}
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    if (!rejectReasonInput.trim()) {
                      alert('Alasan pembatalan harus diisi');
                      return;
                    }
                    setIsRejectProcessing(true);
                    try {
                      if (onRejectOrder) {
                        await onRejectOrder(activeOrderDetail.id, rejectReasonInput);
                        setActiveOrderDetail({ ...activeOrderDetail, status: 'Ditolak' });
                      } else {
                        onUpdateOrderStatus(activeOrderDetail.id, 'Ditolak', rejectReasonInput);
                        setActiveOrderDetail({ ...activeOrderDetail, status: 'Ditolak' });
                      }
                      setShowRejectModal(false);
                      setRejectReasonInput('');
                    } finally {
                      setIsRejectProcessing(false);
                    }
                  }}
                  disabled={isRejectProcessing}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                >
                  {isRejectProcessing ? 'Memproses...' : 'Tolak Pesanan'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirm Price Modal */}
      {showConfirmPriceModal && activeOrderDetail && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-[24px] shadow-2xl p-6 my-8"
          >
            <h3 className="text-lg font-black text-slate-900 mb-2">Konfirmasi Harga Pesanan</h3>
            <p className="text-sm text-slate-600 mb-4">
              Pesanan custom <span className="font-bold">{activeOrderDetail.orderNo}</span> menunggu penentuan harga dari Admin.
            </p>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto p-1">
              {confirmPriceItems.map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-sm text-slate-800">{item.productName}</p>
                      {item.variantName && <p className="text-xs text-slate-500">{item.variantName}</p>}
                      <p className="text-xs text-slate-500">Qty: {item.qty} {item.unit}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Harga Satuan (Rp)</label>
                    <input
                      type="number"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#5B4BFF] outline-none"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const newPrice = Number(e.target.value);
                        const newItems = [...confirmPriceItems];
                        newItems[idx].unitPrice = newPrice;
                        newItems[idx].totalPrice = newPrice * newItems[idx].qty;
                        setConfirmPriceItems(newItems);
                      }}
                    />
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-xs font-bold text-slate-500">Subtotal Item: </span>
                    <span className="text-sm font-black text-[#5B4BFF]">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.totalPrice)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between text-sm font-bold text-slate-700">
                <span>Total Pesanan:</span>
                <span className="text-lg text-slate-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(confirmPriceItems.reduce((acc, curr) => acc + curr.totalPrice, 0))}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowConfirmPriceModal(false)}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                disabled={isConfirmProcessing}
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  setIsConfirmProcessing(true);
                  try {
                    const newSubtotal = confirmPriceItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
                    if (onConfirmOrderPrice) {
                      await onConfirmOrderPrice(activeOrderDetail.id, confirmPriceItems, newSubtotal, 0, 0, newSubtotal);
                      setActiveOrderDetail({ 
                        ...activeOrderDetail, 
                        items: confirmPriceItems,
                        subtotal: newSubtotal,
                        totalAmount: newSubtotal,
                        balanceDue: newSubtotal,
                        status: 'Dikonfirmasi'
                      });
                    }
                    setShowConfirmPriceModal(false);
                  } finally {
                    setIsConfirmProcessing(false);
                  }
                }}
                disabled={isConfirmProcessing}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-[#5B4BFF] text-white hover:bg-purple-700 transition-colors"
              >
                {isConfirmProcessing ? 'Memproses...' : 'Simpan & Konfirmasi'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

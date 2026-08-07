import React, { useState } from 'react';
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

  // Status mapping helper
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
    (o) => getSimpleStatus(o.status) === 'Selesai' || (o.status === 'Siap Ambil')
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
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Order Baru
          </span>
        );
      case 'Diproses':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-sky-100 text-sky-800 border border-sky-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            Sedang Diproses
          </span>
        );
      case 'Selesai':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Selesai (Siap Ambil)
          </span>
        );
      case 'Diambil':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
            Sudah Diambil
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
    // Refresh active detail
    const updated = orders.find((o) => o.id === activeOrderDetail.id);
    if (updated) setActiveOrderDetail(updated);
  };

  const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  const handleDownloadFile = (fileName: string, orderNo: string) => {
    alert(`[Simulasi Download File Artwork]\nOrder: ${orderNo}\nNama File: ${fileName}\nPath: /TEFA_FILES/2026/08/${orderNo}/${fileName}`);
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* 1. Header (Matches Prompt Specification) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Pesanan Produksi
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manajemen pesanan cetak & produksi TEFA DKV yang cepat dan terintegrasi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Order Baru Button */}
          <button
            onClick={onOpenNewOrderModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>+ Order Baru</span>
          </button>

          {/* Form Upload Siswa Button */}
          <button
            onClick={onOpenPublicUpload}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-base">upload_file</span>
            <span>Form Upload Siswa</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Cards Grid (Matches Prompt Specification) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Order Baru */}
        <div
          onClick={() => setSelectedFilter('Baru')}
          className={`p-5 rounded-2xl border shadow-2xs space-y-1 cursor-pointer transition-all ${
            selectedFilter === 'Baru'
              ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-300'
              : 'bg-[#FED872] text-slate-900 border-amber-300/50 hover:bg-amber-300'
          }`}
        >
          <p className="text-xs font-bold text-slate-800">Order Baru</p>
          <h3 className="text-3xl font-black">{countBaru}</h3>
        </div>

        {/* Card 2: Sedang Diproses */}
        <div
          onClick={() => setSelectedFilter('Diproses')}
          className={`p-5 rounded-2xl border shadow-2xs space-y-1 cursor-pointer transition-all ${
            selectedFilter === 'Diproses'
              ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300'
              : 'bg-[#60A5FA] text-white border-blue-400/50 hover:bg-blue-500'
          }`}
        >
          <p className="text-xs font-bold text-blue-50">Sedang Diproses</p>
          <h3 className="text-3xl font-black">{countDiproses}</h3>
        </div>

        {/* Card 3: Selesai */}
        <div
          onClick={() => setSelectedFilter('Selesai')}
          className={`p-5 rounded-2xl border shadow-2xs space-y-1 cursor-pointer transition-all ${
            selectedFilter === 'Selesai'
              ? 'bg-emerald-500 text-slate-950 border-emerald-600 ring-2 ring-emerald-300'
              : 'bg-[#34D399] text-slate-900 border-emerald-300/50 hover:bg-emerald-400'
          }`}
        >
          <p className="text-xs font-bold text-emerald-950">Selesai</p>
          <h3 className="text-3xl font-black">{countSelesai}</h3>
        </div>

        {/* Card 4: Belum Diambil */}
        <div
          onClick={() => setSelectedFilter('Selesai')}
          className={`p-5 rounded-2xl border shadow-2xs space-y-1 cursor-pointer transition-all ${
            selectedFilter === 'Diambil'
              ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-300'
              : 'bg-[#C084FC] text-white border-purple-400/50 hover:bg-purple-500'
          }`}
        >
          <p className="text-xs font-bold text-purple-100">Belum Diambil</p>
          <h3 className="text-3xl font-black">{countBelumDiambil}</h3>
        </div>
      </div>

      {/* 3. Simple Status Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Simple Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['Semua', 'Baru', 'Diproses', 'Selesai', 'Diambil'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedFilter === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No Order, Customer, Kelas..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* 4. Order Cards Grid (Replaces Wide Table with Clean Cards) */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-2xs space-y-3">
          <span className="material-symbols-outlined text-4xl text-slate-300">
            inventory_2
          </span>
          <p className="text-sm font-bold text-slate-600">Tidak ada pesanan produksi yang ditemukan.</p>
          <p className="text-xs text-slate-400">Silakan ubah filter atau kata kunci pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const mainProduct = order.items[0]?.productName || 'Cetak Custom';
            const totalQty = order.items.reduce((acc, curr) => acc + (curr.qty || 1), 0);
            const attachedFile = order.items.find((i) => i.fileName)?.fileName || order.artworkFiles?.[0]?.name;

            return (
              <div
                key={order.id}
                onClick={() => setActiveOrderDetail(order)}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group relative"
              >
                {/* Card Top: Order No & Status */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-mono font-extrabold text-indigo-600 block">
                      {order.orderNo}
                    </span>
                    <h3 className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {order.customerName}
                    </h3>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Card Body: Details */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-medium text-slate-400">Kelas / Instansi:</span>
                    <span className="font-extrabold text-slate-800">
                      {order.institution || 'XI DKV 1'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-medium text-slate-400">Produk Cetak:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[180px]">
                      {mainProduct}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-medium text-slate-400">Jumlah:</span>
                    <span className="font-black text-slate-900">{totalQty} pcs / lembar</span>
                  </div>

                  {/* File Attachment Indicator */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-medium text-slate-400 text-[11px]">File Attachment:</span>
                    {attachedFile ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 truncate max-w-[170px]" title={attachedFile}>
                        <span className="material-symbols-outlined text-xs">attach_file</span>
                        <span className="truncate">{attachedFile}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Tidak ada file</span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Payment & Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-black text-slate-900 text-sm">{formatRupiah(order.totalAmount)}</p>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.paymentStatus === 'Lunas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.paymentStatus} {order.balanceDue > 0 ? `(Sisa ${formatRupiah(order.balanceDue)})` : ''}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveOrderDetail(order);
                    }}
                    className="bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <span>Detail</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Order Detail Panel / Modal (Matches Prompt Specification) */}
      {activeOrderDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-extrabold text-indigo-600">
                  {activeOrderDetail.orderNo}
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Detail Order Produksi
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(activeOrderDetail.status)}
                <button
                  onClick={() => setActiveOrderDetail(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Quick Status Update Bar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <label className="text-xs font-extrabold text-slate-800 block">
                Update Status Produksi:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: '🟡 Baru', val: 'Antrian' as OrderStatus },
                  { label: '🔵 Diproses', val: 'Cetak/Produksi' as OrderStatus },
                  { label: '🟢 Selesai (Siap Ambil)', val: 'Siap Ambil' as OrderStatus },
                  { label: '🟣 Sudah Diambil', val: 'Selesai' as OrderStatus },
                ].map((st) => (
                  <button
                    key={st.val}
                    onClick={() => {
                      onUpdateOrderStatus(activeOrderDetail.id, st.val);
                      setActiveOrderDetail({ ...activeOrderDetail, status: st.val });
                    }}
                    className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                      activeOrderDetail.status === st.val
                        ? 'bg-slate-900 text-white shadow-sm ring-2 ring-indigo-400'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2-Column Info Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Customer & Product Info */}
              <div className="space-y-4">
                {/* Informasi Customer */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    Informasi Customer
                  </h4>
                  <div>
                    <p className="text-slate-400 font-medium">Nama Pemesan</p>
                    <p className="font-black text-slate-800 text-sm">{activeOrderDetail.customerName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Kelas / Instansi</p>
                    <p className="font-bold text-slate-800">{activeOrderDetail.institution || 'XI DKV 1'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Nomor Telepon / WA</p>
                    <p className="font-bold text-indigo-600 font-mono">{activeOrderDetail.customerPhone}</p>
                  </div>
                </div>

                {/* Detail Produk */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    Detail Produk & Item
                  </h4>
                  {activeOrderDetail.items.map((it, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                      <p className="font-extrabold text-slate-900">{it.productName}</p>
                      <p className="text-slate-600">
                        Jumlah: <strong>{it.qty} {it.unit}</strong> {it.calculatedArea ? `(${it.calculatedArea} m²)` : ''}
                      </p>
                      {it.notes && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          Catatan item: {it.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: File Preview & Payment */}
              <div className="space-y-4">
                {/* File Preview & Download */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 text-xs">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    File Attachment Artwork
                  </h4>
                  {activeOrderDetail.items.find((i) => i.fileName) || activeOrderDetail.artworkFiles?.[0] ? (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-600 text-2xl">
                          description
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {activeOrderDetail.items.find((i) => i.fileName)?.fileName || activeOrderDetail.artworkFiles?.[0]?.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">Siap cetak produksi</p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleDownloadFile(
                            activeOrderDetail.items.find((i) => i.fileName)?.fileName || 'Artwork.pdf',
                            activeOrderDetail.orderNo
                          )
                        }
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                        <span>Download File Cetak</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">Tidak ada file artwork yang terlampir.</p>
                  )}
                </div>

                {/* Information Keuangan */}
                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                  <h4 className="font-extrabold text-emerald-950 text-xs uppercase tracking-wider">
                    Informasi Pembayaran
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Biaya:</span>
                    <span className="font-black text-slate-900">{formatRupiah(activeOrderDetail.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sudah Dibayar:</span>
                    <span className="font-bold text-emerald-700">{formatRupiah(activeOrderDetail.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-emerald-200">
                    <span className="font-bold text-slate-800">Sisa Tagihan:</span>
                    <span className="font-black text-rose-600">{formatRupiah(activeOrderDetail.balanceDue)}</span>
                  </div>

                  {activeOrderDetail.balanceDue > 0 && (
                    <button
                      onClick={() => {
                        setPayAmountInput(activeOrderDetail.balanceDue);
                        setShowPaymentModal(true);
                      }}
                      className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-base">payments</span>
                      <span>+ Catat Pelunasan Tagihan</span>
                    </button>
                  )}
                </div>

                {/* Catatan Order */}
                {activeOrderDetail.designNotes && (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-1">
                    <span className="font-bold text-slate-700 block">Catatan Khusus:</span>
                    <p className="text-slate-600 italic bg-white p-2 rounded-xl border border-slate-200">
                      {activeOrderDetail.designNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenOrderReceipt(activeOrderDetail)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">receipt</span>
                  <span>Cetak Nota</span>
                </button>

                {onArchiveOrder && (
                  <button
                    onClick={() => {
                      onArchiveOrder(activeOrderDetail);
                      setActiveOrderDetail(null);
                    }}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">archive</span>
                    <span>Arsipkan Order</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setActiveOrderDetail(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-colors"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Sub Modal */}
      {showPaymentModal && activeOrderDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleRecordPaymentSubmit}
            className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 border border-slate-200 shadow-2xl text-xs animate-in zoom-in-95 duration-150"
          >
            <h3 className="font-black text-slate-900 text-sm">Input Pembayaran Pelunasan</h3>
            <p className="text-slate-600">Sisa Tagihan: <strong>{formatRupiah(activeOrderDetail.balanceDue)}</strong></p>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jumlah Pembayaran (Rp)</label>
              <input
                type="number"
                min="1"
                max={activeOrderDetail.balanceDue}
                value={payAmountInput}
                onChange={(e) => setPayAmountInput(Number(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-3.5 py-2 bg-slate-100 font-bold rounded-xl text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-xs"
              >
                Simpan Pembayaran
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { CustomOrder, CustomOrderStatus } from '../../types';

interface CustomOrderViewProps {
  customOrders: CustomOrder[];
  onAddCustomOrder: (order: CustomOrder) => void;
  onUpdateCustomOrderStatus: (orderId: string, newStatus: CustomOrderStatus, note?: string) => void;
  onDeleteCustomOrder?: (order: CustomOrder) => void;
  operatorName: string;
}

export const CustomOrderView: React.FC<CustomOrderViewProps> = ({
  customOrders,
  onAddCustomOrder,
  onUpdateCustomOrderStatus,
  onDeleteCustomOrder,
  operatorName,
}) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerClass, setCustomerClass] = useState('');
  const [customerMajor, setCustomerMajor] = useState('');
  const [orderName, setOrderName] = useState('');
  const [category, setCategory] = useState<'Printing' | 'Design Service' | 'Merchandise' | 'Advertising' | 'Lainnya'>('Printing');
  const [description, setDescription] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [unit, setUnit] = useState<'pcs' | 'lembar' | 'meter' | 'paket' | 'set' | 'roll' | 'box'>('pcs');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [deadline, setDeadline] = useState('');
  const [productionNotes, setProductionNotes] = useState('');

  const profit = sellingPrice - costPrice;

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerClass('');
    setCustomerMajor('');
    setOrderName('');
    setCategory('Printing');
    setDescription('');
    setQty(1);
    setUnit('pcs');
    setCostPrice(0);
    setSellingPrice(0);
    setDeadline('');
    setProductionNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !orderName.trim() || !customerPhone.trim()) {
      alert('Mohon isi nama customer, nomor WhatsApp, dan nama pesanan.');
      return;
    }

    const now = new Date();
    const orderId = `CO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const newOrder: CustomOrder = {
      id: orderId,
      orderNo: orderId,
      customerName,
      customerPhone,
      customerClass,
      customerMajor,
      orderName,
      category,
      description,
      qty,
      unit,
      costPrice,
      sellingPrice,
      profit,
      status: 'Menunggu',
      deadline,
      productionNotes,
      orderDate: now.toISOString().split('T')[0],
      operatorName,
      statusHistory: [
        {
          status: 'Menunggu',
          timestamp: now.toLocaleString('id-ID'),
          updatedBy: operatorName,
          note: 'Custom order dibuat',
        },
      ],
    };

    onAddCustomOrder(newOrder);
    resetForm();
    setShowForm(false);
  };

  const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  const getStatusBadge = (status: CustomOrderStatus) => {
    const styles: Record<CustomOrderStatus, { bg: string; icon: string }> = {
      'Menunggu': { bg: 'bg-amber-100 text-amber-800', icon: 'schedule' },
      'Disetujui': { bg: 'bg-sky-100 text-sky-800', icon: 'check_circle' },
      'Proses Produksi': { bg: 'bg-indigo-100 text-indigo-800', icon: 'precision_manufacturing' },
      'Quality Check': { bg: 'bg-purple-100 text-purple-800', icon: 'verified' },
      'Selesai': { bg: 'bg-emerald-100 text-emerald-800', icon: 'done_all' },
      'Sudah Diambil': { bg: 'bg-slate-100 text-slate-600', icon: 'inventory' },
    };
    const s = styles[status];
    return (
      <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full inline-flex items-center gap-1 ${s.bg}`}>
        <span className="material-symbols-outlined text-xs">{s.icon}</span>
        {status}
      </span>
    );
  };

  // Stats
  const totalOrders = customOrders.length;
  const pendingOrders = customOrders.filter(o => o.status === 'Menunggu').length;
  const inProgressOrders = customOrders.filter(o => ['Disetujui', 'Proses Produksi', 'Quality Check'].includes(o.status)).length;
  const completedOrders = customOrders.filter(o => ['Selesai', 'Sudah Diambil'].includes(o.status)).length;
  const totalProfit = customOrders.reduce((acc, o) => acc + o.profit, 0);

  // Filter
  const filteredOrders = customOrders.filter(o => {
    const matchSearch = o.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'Semua' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Custom Order</h2>
          <p className="text-xs text-slate-500">Kelola pesanan custom di luar katalog produk.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>+ Custom Order Baru</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Total Order</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalOrders}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 shadow-xs">
          <p className="text-[10px] font-bold text-amber-600 uppercase">Menunggu</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{pendingOrders}</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200/80 shadow-xs">
          <p className="text-[10px] font-bold text-indigo-600 uppercase">Diproses</p>
          <p className="text-2xl font-black text-indigo-700 mt-1">{inProgressOrders}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
          <p className="text-[10px] font-bold text-emerald-600 uppercase">Selesai</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{completedOrders}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200/80 shadow-xs col-span-2 sm:col-span-4 lg:col-span-1">
          <p className="text-[10px] font-bold text-purple-600 uppercase">Total Profit</p>
          <p className="text-xl font-black text-purple-700 mt-1">{formatRupiah(totalProfit)}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari order No, nama customer, atau pesanan..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
        >
          <option value="Semua">Semua Status</option>
          <option value="Menunggu">Menunggu</option>
          <option value="Disetujui">Disetujui</option>
          <option value="Proses Produksi">Proses Produksi</option>
          <option value="Quality Check">Quality Check</option>
          <option value="Selesai">Selesai</option>
          <option value="Sudah Diambil">Sudah Diambil</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
            <span className="material-symbols-outlined text-5xl text-slate-300">inbox_customize</span>
            <p className="text-sm font-bold text-slate-500 mt-3">Belum ada custom order</p>
            <p className="text-xs text-slate-400">Klik "+ Custom Order Baru" untuk membuat pesanan</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-extrabold text-indigo-600 text-xs">{order.orderNo}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <h3 className="font-black text-slate-900 text-sm mt-1 truncate">{order.orderName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {order.customerName} {order.customerClass && `(${order.customerClass})`} • {order.category}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-slate-900">{formatRupiah(order.sellingPrice)}</p>
                  <p className="text-[10px] font-bold text-emerald-600">Profit: {formatRupiah(order.profit)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{order.qty} {order.unit}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full my-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-lg">Custom Order Baru</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pt-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Customer Data */}
              <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Data Customer</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Nama Customer *</label>
                    <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500" placeholder="Nama lengkap" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">WhatsApp *</label>
                    <input type="text" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 font-mono" placeholder="0812xxxx" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Kelas</label>
                    <input type="text" value={customerClass} onChange={(e) => setCustomerClass(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500" placeholder="XI DKV 1" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Jurusan</label>
                    <input type="text" value={customerMajor} onChange={(e) => setCustomerMajor(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500" placeholder="DKV" />
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Detail Pesanan</h4>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Nama Pesanan *</label>
                  <input type="text" required value={orderName} onChange={(e) => setOrderName(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500" placeholder="Banner ukuran khusus 5x2m" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Kategori</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none">
                      <option value="Printing">Printing</option>
                      <option value="Design Service">Design Service</option>
                      <option value="Merchandise">Merchandise</option>
                      <option value="Advertising">Advertising</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Deadline</label>
                    <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Deskripsi Pesanan</label>
                  <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500" placeholder="Banner kegiatan sekolah ukuran 3x1 meter bahan flexi 280gsm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Jumlah</label>
                    <input type="number" min="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Satuan</label>
                    <select value={unit} onChange={(e) => setUnit(e.target.value as any)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none">
                      <option value="pcs">pcs</option>
                      <option value="lembar">lembar</option>
                      <option value="meter">meter</option>
                      <option value="paket">paket</option>
                      <option value="set">set</option>
                      <option value="roll">roll</option>
                      <option value="box">box</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Catatan Produksi</label>
                  <input type="text" value={productionNotes} onChange={(e) => setProductionNotes(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500" placeholder="Mata ayam 4 sudut" />
                </div>
              </div>

              {/* Financial */}
              <div className="bg-emerald-50 p-4 rounded-2xl space-y-3 border border-emerald-100">
                <h4 className="font-extrabold text-emerald-800 text-xs uppercase tracking-wider">Financial</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-emerald-700 block mb-1">Harga Modal (Rp)</label>
                    <input type="number" min="0" value={costPrice} onChange={(e) => setCostPrice(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-700" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-emerald-700 block mb-1">Harga Jual (Rp)</label>
                    <input type="number" min="0" value={sellingPrice} onChange={(e) => setSellingPrice(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-700" />
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700">Keuntungan:</span>
                  <span className={`text-sm font-black ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatRupiah(profit)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl">Batal</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md">Simpan Custom Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="font-mono font-extrabold text-indigo-600 text-xs">{selectedOrder.orderNo}</span>
                <h3 className="font-black text-slate-900 text-lg mt-1">{selectedOrder.orderName}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="space-y-4 pt-4">
              {getStatusBadge(selectedOrder.status)}

              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-800">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">WhatsApp:</span>
                  <span className="font-bold text-indigo-600 font-mono">{selectedOrder.customerPhone}</span>
                </div>
                {selectedOrder.customerClass && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kelas/Jurusan:</span>
                    <span className="font-bold text-slate-800">{selectedOrder.customerClass} {selectedOrder.customerMajor && `/ ${selectedOrder.customerMajor}`}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Kategori:</span>
                  <span className="font-bold text-slate-800">{selectedOrder.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jumlah:</span>
                  <span className="font-bold text-slate-800">{selectedOrder.qty} {selectedOrder.unit}</span>
                </div>
                {selectedOrder.deadline && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Deadline:</span>
                    <span className="font-bold text-slate-800">{selectedOrder.deadline}</span>
                  </div>
                )}
              </div>

              {selectedOrder.description && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-xs">
                  <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">Deskripsi</p>
                  <p className="text-slate-700">{selectedOrder.description}</p>
                </div>
              )}

              <div className="bg-emerald-50 p-4 rounded-2xl space-y-2 text-xs">
                <p className="font-extrabold text-emerald-800 text-xs uppercase">Financial</p>
                <div className="flex justify-between">
                  <span className="text-emerald-600">Harga Modal:</span>
                  <span className="font-bold text-slate-700">{formatRupiah(selectedOrder.costPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">Harga Jual:</span>
                  <span className="font-bold text-slate-700">{formatRupiah(selectedOrder.sellingPrice)}</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 pt-2 mt-2">
                  <span className="text-emerald-700 font-bold">Profit:</span>
                  <span className="font-black text-emerald-600">{formatRupiah(selectedOrder.profit)}</span>
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-600 uppercase">Update Status:</p>
                <div className="flex flex-wrap gap-2">
                  {(['Menunggu', 'Disetujui', 'Proses Produksi', 'Quality Check', 'Selesai', 'Sudah Diambil'] as CustomOrderStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => onUpdateCustomOrderStatus(selectedOrder.id, s)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        selectedOrder.status === s
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-slate-100">
                {onDeleteCustomOrder && (
                  <button
                    onClick={() => {
                      onDeleteCustomOrder(selectedOrder);
                      setSelectedOrder(null);
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">delete_forever</span>
                    Hapus
                  </button>
                )}
                <button onClick={() => setSelectedOrder(null)} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl ml-auto">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

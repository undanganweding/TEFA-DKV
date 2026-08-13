import React, { useState } from 'react';
import { ProductionOrder, Product, CartItem, OrderStatus, PaymentStatus, PaymentMethod } from '../../types';

interface NewOrderModalProps {
  products: Product[];
  onAddOrder: (newOrder: ProductionOrder) => void;
  onClose: () => void;
  operatorName: string;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  products,
  onAddOrder,
  onClose,
  operatorName,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'Mendesak' | 'Prioritas Tinggi'>('Normal');
  
  // Selected product items
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [qty, setQty] = useState(1);
  const [lengthMeters, setLengthMeters] = useState(1);
  const [widthMeters, setWidthMeters] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  const [items, setItems] = useState<CartItem[]>([]);
  
  // Payment
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [designNotes, setDesignNotes] = useState('');

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleAddItem = () => {
    if (!activeProduct) return;

    let area = 0;
    let totalPrice = 0;

    if (activeProduct.isCustomDimension) {
      area = Number((lengthMeters * widthMeters).toFixed(2));
      totalPrice = Math.round(area * activeProduct.basePrice * qty);
    } else {
      totalPrice = activeProduct.basePrice * qty;
    }

    const newItem: CartItem = {
      id: 'ITEM-' + Date.now(),
      productId: activeProduct.id,
      productName: activeProduct.name,
      category: activeProduct.category,
      unit: activeProduct.unit,
      unitPrice: activeProduct.basePrice,
      qty,
      lengthMeters: activeProduct.isCustomDimension ? lengthMeters : undefined,
      widthMeters: activeProduct.isCustomDimension ? widthMeters : undefined,
      calculatedArea: activeProduct.isCustomDimension ? area : undefined,
      notes: itemNotes,
      totalPrice,
    };

    setItems([...items, newItem]);
    setItemNotes('');
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const subtotal = items.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalAmount = subtotal;
  const balanceDue = Math.max(0, totalAmount - paidAmount);

  let paymentStatus: PaymentStatus = 'Belum Bayar';
  if (paidAmount >= totalAmount && totalAmount > 0) {
    paymentStatus = 'Lunas';
  } else if (paidAmount > 0) {
    paymentStatus = 'DP';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || items.length === 0) {
      alert('Mohon isi Nama Pemesan dan tambahkan minimal 1 item pesanan.');
      return;
    }

    const now = new Date();
    const orderNo = 'POS-' + now.getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
    const todayStr = now.toISOString().split('T')[0];
    
    // Due date default tomorrow 15:00
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dueDateStr = tomorrow.toISOString().split('T')[0] + ' 15:00';

    const newOrder: ProductionOrder = {
      id: 'ORD-' + Date.now(),
      orderNo,
      customerName,
      customerPhone,
      institution,
      orderDate: todayStr,
      dueDate: dueDateStr,
      status: 'Menunggu Admin',
      paymentStatus,
      paymentMethod,
      items,
      subtotal,
      discount: 0,
      taxAmount: 0,
      totalAmount,
      paidAmount,
      balanceDue,
      operatorName,
      priority,
      designNotes,
      statusHistory: [
        { status: 'Draft', timestamp: now.toLocaleString('id-ID'), updatedBy: operatorName },
        { status: 'Menunggu Admin', timestamp: now.toLocaleString('id-ID'), updatedBy: operatorName },
      ],
    };

    onAddOrder(newOrder);
  };

  const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-400">add_circle</span>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Buat Pesanan Produksi Baru</h3>
              <p className="text-xs text-slate-400">Input cepat pesanan cetak & konfirmasi DP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Customer Info Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-lg">person</span>
              Informasi Pemesan / Client
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Pemesan *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pak H. Subhan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / Telp</label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Instansi / Sekolah</label>
                <input
                  type="text"
                  placeholder="PCNU / OSIS / UMKM"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Add Product Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-lg">shopping_cart</span>
              Tambah Item Cetak
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Produk & Jasa</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:border-emerald-500 focus:outline-hidden"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatRupiah(p.basePrice)} / {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jumlah / Qty ({activeProduct?.unit})</label>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Custom Dimension input if Banner */}
            {activeProduct?.isCustomDimension && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-emerald-900 mb-1">Panjang (Meter)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={lengthMeters}
                    onChange={(e) => setLengthMeters(parseFloat(e.target.value) || 1)}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-bold text-emerald-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-emerald-900 mb-1">Lebar (Meter)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={widthMeters}
                    onChange={(e) => setWidthMeters(parseFloat(e.target.value) || 1)}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-bold text-emerald-900"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex flex-col justify-center">
                  <span className="text-[10px] text-emerald-700 font-medium">Total Luas Banner:</span>
                  <span className="font-extrabold text-sm text-emerald-900">
                    {(lengthMeters * widthMeters).toFixed(2)} m²
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Catatan pengerjaan item ini (e.g. Mata ayam 4 titik / Laminasi Doff)"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:border-emerald-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-xl flex items-center gap-1 shrink-0"
              >
                + Tambah Item
              </button>
            </div>
          </div>

          {/* Itemized Table List */}
          {items.length > 0 && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2.5">Produk</th>
                    <th className="p-2.5">Qty / Ukuran</th>
                    <th className="p-2.5">Subtotal</th>
                    <th className="p-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2.5">
                        <p className="font-bold text-slate-800">{item.productName}</p>
                        {item.notes && <p className="text-[10px] text-slate-500">{item.notes}</p>}
                      </td>
                      <td className="p-2.5">
                        {item.calculatedArea
                          ? `${item.lengthMeters}m x ${item.widthMeters}m (${item.calculatedArea} m² x ${item.qty})`
                          : `${item.qty} ${item.unit}`}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">{formatRupiah(item.totalPrice)}</td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment & Priority Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Prioritas Pengerjaan</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium"
              >
                <option value="Normal">Normal</option>
                <option value="Mendesak">Mendesak (Prioritas Tinggi)</option>
              </select>

              <label className="block font-bold text-slate-700 mt-3 mb-1">Metode Pembayaran</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium"
              >
                <option value="Cash">Cash (Tunai)</option>
                <option value="QRIS">QRIS Statis / Dinamis</option>
                <option value="Transfer Bank">Transfer Bank (BRI/BCA)</option>
              </select>
            </div>

            <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Total Biaya:</span>
                <span className="font-bold text-slate-900">{formatRupiah(totalAmount)}</span>
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Jumlah Diterima (DP / Pelunasan):</label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>
              <div className="flex justify-between font-extrabold pt-2 border-t border-slate-200">
                <span>Sisa Pembayaran:</span>
                <span className={balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                  {formatRupiah(balanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              id="btn-submit-create-order"
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
            >
              Simpan & Masukkan Antrian
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

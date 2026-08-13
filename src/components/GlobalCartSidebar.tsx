import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, PaymentMethod, ProductionOrder } from '../types';

interface GlobalCartSidebarProps {
  cartItems: CartItem[];
  customerName: string;
  setCustomerName: (val: string) => void;
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  orderPriority: 'Normal' | 'Mendesak';
  setOrderPriority: (val: 'Normal' | 'Mendesak') => void;
  discount: number;
  setDiscount: (val: number) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (val: PaymentMethod) => void;
  paidAmount: number;
  setPaidAmount: (val: number) => void;
  notes: string;
  setNotes: (val: string) => void;
  onUpdateQty: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onSaveDraftOrder: () => void;
  onCheckoutOrder: () => void;
  operatorName?: string;
}

export const GlobalCartSidebar: React.FC<GlobalCartSidebarProps> = ({
  cartItems,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  orderPriority,
  setOrderPriority,
  discount,
  setDiscount,
  paymentMethod,
  setPaymentMethod,
  paidAmount,
  setPaidAmount,
  notes,
  setNotes,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onSaveDraftOrder,
  onCheckoutOrder,
  operatorName = 'Kepala TEFA',
}) => {
  const [isCustomerExpanded, setIsCustomerExpanded] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const changeAmount = Math.max(0, paidAmount - totalAmount);

  // Quick cash setters
  const setQuickCash = (amount: number) => {
    setPaidAmount(amount);
  };

  return (
    <aside className="w-80 lg:w-96 shrink-0 flex flex-col h-full bg-white border-l border-slate-200/80 font-sans select-none sticky top-0 z-10 shadow-lg">
      {/* 1. Header Bar */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#5B4BFF] text-white flex items-center justify-center font-bold shadow-xs">
            <span className="material-symbols-outlined text-lg">shopping_cart</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white tracking-tight uppercase">
                Kasir TEFA
              </h3>
              <span className="bg-[#5B4BFF] text-white text-[10px] font-black px-2 py-0.2 rounded-full">
                {cartItems.reduce((acc, i) => acc + i.qty, 0)} Item
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold">
              Shift: {operatorName}
            </p>
          </div>
        </div>

        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-slate-400 hover:text-rose-400 text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            title="Kosongkan Keranjang"
          >
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            <span className="hidden sm:inline text-[11px]">Batal</span>
          </button>
        )}
      </div>

      {/* 2. Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-3.5">
        {/* Customer Information Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2">
          <button
            type="button"
            onClick={() => setIsCustomerExpanded(!isCustomerExpanded)}
            className="w-full flex items-center justify-between text-xs font-black text-slate-900 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#5B4BFF] text-base">person</span>
              <span>Informasi Customer</span>
              {customerName.trim() && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.2 rounded-md border border-emerald-200">
                  {customerName}
                </span>
              )}
            </div>
            <span className="material-symbols-outlined text-slate-400 text-sm">
              {isCustomerExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {isCustomerExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 pt-1.5 border-t border-slate-200/60"
            >
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-0.5">
                  Nama Pelanggan *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi / Panitia DKV"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-0.5">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-0.5">
                    Prioritas Order
                  </label>
                  <select
                    value={orderPriority}
                    onChange={(e) => setOrderPriority(e.target.value as 'Normal' | 'Mendesak')}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Mendesak">Mendesak (Kilat)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Daftar Pesanan ({cartItems.length})
            </h4>
            {subtotal > 0 && (
              <span className="text-[11px] font-extrabold text-[#5B4BFF]">
                Rp {subtotal.toLocaleString('id-ID')}
              </span>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200/90 text-slate-400 space-y-2">
              <span className="material-symbols-outlined text-3xl text-slate-300">
                remove_shopping_cart
              </span>
              <p className="text-xs font-bold text-slate-600">Keranjang Masih Kosong</p>
              <p className="text-[11px] text-slate-400 font-medium">
                Pilih produk dari katalog Kasir TEFA atau klik "Custom Order" untuk menambahkan item.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5 no-scrollbar">
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs hover:border-purple-200 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="font-extrabold text-xs text-slate-900 leading-tight">
                            {item.productName}
                          </h5>
                          {item.isCustomOrder && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded-md">
                              Custom Order
                            </span>
                          )}
                        </div>

                        {item.lengthMeters && item.widthMeters ? (
                          <p className="text-[10px] text-purple-700 font-bold mt-0.5">
                            Ukuran: {item.lengthMeters}m x {item.widthMeters}m ({item.calculatedArea} m2)
                          </p>
                        ) : null}

                        {item.fileName && (
                          <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5 truncate">
                            <span className="material-symbols-outlined text-xs">attach_file</span>
                            <span className="truncate">{item.fileName}</span>
                          </p>
                        )}

                        <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                          Rp {item.unitPrice.toLocaleString('id-ID')} / {item.unit}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="text-slate-300 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0"
                        title="Hapus item"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>

                    {/* Qty Controls & Item Subtotal */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, Math.max(1, item.qty - 1))}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-xs shadow-2xs cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => onUpdateQty(item.id, Math.max(1, Number(e.target.value)))}
                          className="w-10 text-center text-xs font-black bg-transparent text-slate-900 focus:outline-hidden"
                          min={1}
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, item.qty + 1)}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-xs shadow-2xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-black text-xs text-[#5B4BFF]">
                        Rp {item.totalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Notes Input */}
        {cartItems.length > 0 && (
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 mb-0.5">
              Catatan Produksi / Finishing (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Mata ayam 4 sudut, laminasi doff"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#5B4BFF]"
            />
          </div>
        )}
      </div>

      {/* 3. Sticky Checkout & Payment Area */}
      {cartItems.length > 0 && (
        <div className="p-3.5 bg-slate-50 border-t border-slate-200/90 space-y-3">
          {/* Discount & Calculation Summary */}
          <div className="space-y-1.5 text-xs font-semibold text-slate-600 bg-white p-3 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-extrabold text-slate-900">
                Rp {subtotal.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span>Diskon (Rp)</span>
              <input
                type="number"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-24 px-2 py-0.5 text-right font-black text-rose-600 bg-rose-50/50 border border-rose-200 rounded-lg focus:bg-white focus:outline-hidden text-xs"
                min={0}
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-sm">
              <span className="font-black text-slate-900">Total Pembayaran</span>
              <span className="font-black text-[#5B4BFF] text-base">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-4 gap-1">
              {(['Cash', 'QRIS', 'Transfer Bank', 'DP / Piutang'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(method);
                    if (method === 'Cash' && paidAmount < totalAmount) {
                      setPaidAmount(totalAmount);
                    }
                  }}
                  className={`py-1.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border ${
                    paymentMethod === method
                      ? 'bg-[#5B4BFF] text-white border-[#5B4BFF] shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {method === 'Transfer Bank' ? 'Transfer' : method === 'DP / Piutang' ? 'DP' : method}
                </button>
              ))}
            </div>
          </div>

          {/* Nominal Bayar (For Cash or DP) */}
          {paymentMethod === 'Cash' && (
            <div className="space-y-1.5 bg-white p-2.5 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[10px] font-extrabold text-slate-500">Nominal Uang Bayar</label>
                <input
                  type="number"
                  value={paidAmount || ''}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-28 px-2 py-1 text-right font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg text-xs"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex items-center gap-1 justify-end">
                <button
                  type="button"
                  onClick={() => setQuickCash(totalAmount)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-md text-[10px] font-extrabold text-slate-700 cursor-pointer"
                >
                  Uang Pas
                </button>
                <button
                  type="button"
                  onClick={() => setQuickCash(50000)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-md text-[10px] font-extrabold text-slate-700 cursor-pointer"
                >
                  50k
                </button>
                <button
                  type="button"
                  onClick={() => setQuickCash(100000)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-md text-[10px] font-extrabold text-slate-700 cursor-pointer"
                >
                  100k
                </button>
              </div>

              {paidAmount >= totalAmount && (
                <div className="flex items-center justify-between text-xs font-black text-emerald-700 pt-1 border-t border-slate-100">
                  <span>Kembalian</span>
                  <span>Rp {changeAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          )}

          {/* 4. Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onSaveDraftOrder}
              className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
            >
              <span className="material-symbols-outlined text-base">draft</span>
              <span>Simpan Order</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || cartItems.length === 0}
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  // Tambahkan sedikit jeda buatan agar terlihat ada proses dan mencegah double click cepat
                  await new Promise((res) => setTimeout(res, 400));
                  onCheckoutOrder();
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className={`w-full py-2.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1 shadow-md
                ${isSubmitting || cartItems.length === 0 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                  : 'bg-[#5B4BFF] hover:bg-purple-700 text-white cursor-pointer active:scale-95 shadow-purple-500/20'
                }`}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">print</span>
                  <span>Cetak Nota</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../../types';

interface PersistentCartConfirmModalProps {
  isOpen: boolean;
  restoredCartItems: CartItem[];
  customerName?: string;
  onContinue: () => void;
  onSaveDraft: () => void;
  onDiscard: () => void;
}

export const PersistentCartConfirmModal: React.FC<PersistentCartConfirmModalProps> = ({
  isOpen,
  restoredCartItems = [],
  customerName = '',
  onContinue,
  onSaveDraft,
  onDiscard,
}) => {
  if (!isOpen || restoredCartItems.length === 0) return null;

  const totalItemsCount = restoredCartItems.reduce((acc, i) => acc + i.qty, 0);
  const totalSubtotal = restoredCartItems.reduce((acc, i) => acc + i.totalPrice, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-slate-200/90 space-y-4 font-sans"
        >
          {/* Header Icon & Title */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">pending_actions</span>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5B4BFF] text-[10px] font-black border border-purple-100 mb-1">
                <span>Sesi Transaksi Aktif Terdeteksi</span>
              </div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Lanjutkan Transaksi Kasir?
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                Terdapat transaksi yang belum diselesaikan pada sesi kasir sebelumnya.
              </p>
            </div>
          </div>

          {/* Transaction Summary Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 font-bold">
              <span>Customer:</span>
              <span className="text-slate-900 font-extrabold">{customerName.trim() || 'Pelanggan Umum'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-bold">
              <span>Jumlah Item:</span>
              <span className="text-slate-900 font-extrabold">{totalItemsCount} item ({restoredCartItems.length} jenis)</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-bold pt-1.5 border-t border-slate-200/60">
              <span>Estimasi Subtotal:</span>
              <span className="text-[#5B4BFF] font-black text-sm">Rp {totalSubtotal.toLocaleString('id-ID')}</span>
            </div>

            {/* Preview items */}
            <div className="mt-2 pt-2 border-t border-slate-200/60 space-y-1 max-h-28 overflow-y-auto pr-1 no-scrollbar text-[11px]">
              {restoredCartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-slate-500">
                  <span className="truncate max-w-[200px] font-semibold">• {item.productName}</span>
                  <span className="font-bold shrink-0">{item.qty}x</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Options */}
          <div className="space-y-2 pt-1">
            <button
              onClick={onContinue}
              className="w-full bg-[#5B4BFF] hover:bg-purple-700 text-white font-black py-3 rounded-2xl text-xs transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              <span>Lanjutkan Order Sesi Ini</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onSaveDraft}
                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold py-2.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-base">draft</span>
                <span>Simpan Draft</span>
              </button>

              <button
                onClick={onDiscard}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold py-2.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                <span>Hapus Order</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React from 'react';

export interface DeleteModalItemDetails {
  id?: string;
  category?: string;
  title: string;
  subtitle?: string;
  codeOrNo?: string;
  date?: string;
  customer?: string;
  customerName?: string;
  amount?: string;
  note?: string;
  warningNote?: string;
  actionType?: 'archive' | 'permanent_delete' | 'deactivate';
}

interface GlobalDeleteModalProps {
  isOpen: boolean;
  itemDetails: DeleteModalItemDetails | null;
  currentUserRole?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const GlobalDeleteModal: React.FC<GlobalDeleteModalProps> = ({
  isOpen,
  itemDetails,
  currentUserRole = 'Admin Utama / Kepala TEFA',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !itemDetails) return null;

  const isAdmin = currentUserRole === 'Admin Utama / Kepala TEFA';
  const isPermanent = itemDetails.actionType === 'permanent_delete';
  const isDeactivate = itemDetails.actionType === 'deactivate';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl border border-slate-100 text-slate-800">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isPermanent
                ? 'bg-rose-100 text-rose-600'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">
              {isPermanent ? 'delete_forever' : 'archive'}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              {isPermanent
                ? 'Hapus Data Permanen?'
                : isDeactivate
                ? 'Nonaktifkan Produk?'
                : 'Pindahkan Data ke Arsip?'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isPermanent
                ? 'Tindakan ini tidak dapat dibatalkan. Data akan dihapus sepenuhnya.'
                : 'Data akan disimpan di Recycle Bin & Arsip. Anda dapat memulihkannya kapan saja.'}
            </p>
          </div>
        </div>

        {/* Data Item Summary Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
          <div className="font-extrabold text-slate-900 text-sm border-b border-slate-200/60 pb-2 flex items-center justify-between">
            <span className="truncate">{itemDetails.title}</span>
            {itemDetails.codeOrNo && (
              <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 shrink-0 ml-2">
                {itemDetails.codeOrNo}
              </span>
            )}
          </div>

          {itemDetails.subtitle && (
            <p className="text-slate-600 font-medium">{itemDetails.subtitle}</p>
          )}

          {itemDetails.customer && (
            <div className="flex justify-between text-slate-600">
              <span className="text-slate-400 font-medium">Customer:</span>
              <span className="font-bold text-slate-800">{itemDetails.customer}</span>
            </div>
          )}

          {itemDetails.date && (
            <div className="flex justify-between text-slate-600">
              <span className="text-slate-400 font-medium">Tanggal:</span>
              <span className="font-bold text-slate-800 font-mono">{itemDetails.date}</span>
            </div>
          )}

          {itemDetails.amount && (
            <div className="flex justify-between text-slate-600">
              <span className="text-slate-400 font-medium">Nilai / Total:</span>
              <span className="font-black text-slate-900">{itemDetails.amount}</span>
            </div>
          )}
        </div>

        {/* Warning Note if any */}
        {itemDetails.warningNote && (
          <div className="bg-amber-50 text-amber-900 border border-amber-200/80 p-3 rounded-2xl text-xs font-semibold flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-600 text-base shrink-0 mt-0.5">
              warning
            </span>
            <p className="leading-relaxed">{itemDetails.warningNote}</p>
          </div>
        )}

        {/* Role Access Restriction Banner */}
        {!isAdmin && (
          <div className="bg-rose-50 text-rose-800 border border-rose-200 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-base shrink-0">
              lock
            </span>
            <span>
              Akses Dibatasi: Hanya <strong>Admin Utama / Kepala TEFA</strong> yang dapat menghapus atau mengarsipkan data.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors"
          >
            Batalkan
          </button>

          <button
            type="button"
            disabled={!isAdmin}
            onClick={onConfirm}
            className={`px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
              !isAdmin
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                : isPermanent
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {isPermanent ? 'delete' : 'archive'}
            </span>
            <span>
              {isPermanent
                ? 'Hapus Permanen'
                : isDeactivate
                ? 'Nonaktifkan'
                : 'Pindahkan ke Arsip'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

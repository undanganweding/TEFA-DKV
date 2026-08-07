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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 text-slate-800">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">delete_forever</span>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              Hapus Data?
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Data akan dihapus secara permanen dan tidak dapat dipulihkan.
            </p>
          </div>
        </div>

        {/* Data Item Summary Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs mb-4">
          <div className="font-extrabold text-slate-900 text-sm border-b border-slate-200/60 pb-2 flex items-center justify-between">
            <span className="truncate">{itemDetails.title}</span>
            {itemDetails.codeOrNo && (
              <span className="font-mono text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 shrink-0 ml-2">
                {itemDetails.codeOrNo}
              </span>
            )}
          </div>

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
              <span className="text-slate-400 font-medium">Total:</span>
              <span className="font-black text-slate-900">{itemDetails.amount}</span>
            </div>
          )}
        </div>

        {/* Warning Note if any */}
        {itemDetails.warningNote && (
          <div className="bg-amber-50 text-amber-900 border border-amber-200/80 p-3 rounded-2xl text-xs font-semibold flex items-start gap-2 mb-4">
            <span className="material-symbols-outlined text-amber-600 text-base shrink-0 mt-0.5">
              warning
            </span>
            <p className="leading-relaxed">{itemDetails.warningNote}</p>
          </div>
        )}

        {/* Role Access Restriction Banner */}
        {!isAdmin && (
          <div className="bg-rose-50 text-rose-800 border border-rose-200 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-rose-600 text-base shrink-0">
              lock
            </span>
            <span>
              Hanya <strong>Admin Utama / Kepala TEFA</strong> yang dapat menghapus data.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors"
          >
            Batalkan
          </button>

          <button
            type="button"
            disabled={!isAdmin}
            onClick={onConfirm}
            className={`px-6 py-2.5 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
              !isAdmin
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">delete_forever</span>
            <span>Hapus Permanen</span>
          </button>
        </div>
      </div>
    </div>
  );
};

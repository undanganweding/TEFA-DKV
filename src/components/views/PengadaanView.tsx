import React, { useState } from 'react';
import { AnnualProcurement } from '../../types';

interface PengadaanViewProps {
  procurements: AnnualProcurement[];
  onAddProcurement: (procurement: AnnualProcurement) => void;
}

export const PengadaanView: React.FC<PengadaanViewProps> = ({
  procurements,
  onAddProcurement,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [targetItem, setTargetItem] = useState('');
  const [category, setCategory] = useState<'Pengembangan Lab' | 'Peremajaan Mesin' | 'Lisensi Software' | 'Peralatan Tambahan'>('Pengembangan Lab');
  const [qty, setQty] = useState(1);
  const [estimatedUnitPrice, setEstimatedUnitPrice] = useState(1000000);
  const [priority, setPriority] = useState<'Sangat Penting' | 'Penting' | 'Sekunder'>('Penting');
  const [justification, setJustification] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetItem.trim()) return;

    const newP: AnnualProcurement = {
      id: 'PRC-' + Date.now(),
      year: '2025/2026',
      title,
      category,
      targetItem,
      qty,
      estimatedUnitPrice,
      totalBudget: qty * estimatedUnitPrice,
      priority,
      status: 'Diusulkan',
      requestedBy: 'Tim TEFA DKV',
      justification,
    };

    onAddProcurement(newP);
    setShowModal(false);
    setTitle('');
    setTargetItem('');
    setJustification('');
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Sangat Penting':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Penting':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Disetujui':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Dalam Review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Rencana Pengadaan Tahunan Peralatan TEFA DKV
          </h2>
          <p className="text-xs text-slate-500">
            Usulan peremajaan mesin, penambahan hardware studio, dan lisensi software TA 2025/2026.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-base">add_box</span>
          <span>+ Usulkan Pengadaan Baru</span>
        </button>
      </div>

      {/* List of Procurements */}
      <div className="space-y-4">
        {procurements.map((proc) => (
          <div
            key={proc.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getPriorityBadge(
                    proc.priority
                  )}`}
                >
                  {proc.priority}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                    proc.status
                  )}`}
                >
                  {proc.status}
                </span>
                <span className="text-[10px] font-bold text-slate-500">TA {proc.year}</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">{proc.title}</h3>
              <p className="text-xs font-bold text-emerald-700">
                Item Target: {proc.targetItem} ({proc.qty} Unit)
              </p>
              <p className="text-xs text-slate-600 italic">"{proc.justification}"</p>
              <p className="text-[10px] text-slate-400">Diusulkan oleh: {proc.requestedBy}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right shrink-0">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Estimasi Total Anggaran</p>
              <p className="text-xl font-black text-slate-900">{formatRupiah(proc.totalBudget)}</p>
              <p className="text-[10px] text-slate-500">
                {proc.qty} x {formatRupiah(proc.estimatedUnitPrice)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl text-xs"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">Usulkan Rencana Pengadaan Baru</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Usulan *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pengadaan Mesin DTF A3 Dual Head"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Spesifikasi Target Item *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mesin DTF A3 i1600 + Shake Powder Oven"
                  value={targetItem}
                  onChange={(e) => setTargetItem(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah (Qty)</label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Satuan Est. (Rp)</label>
                  <input
                    type="number"
                    min="1000"
                    value={estimatedUnitPrice}
                    onChange={(e) => setEstimatedUnitPrice(Number(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prioritas</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Sangat Penting">Sangat Penting</option>
                  <option value="Penting">Penting</option>
                  <option value="Sekunder">Sekunder</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Justifikasi Kebutuhan</label>
                <textarea
                  rows={2}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md"
              >
                Simpan Usulan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

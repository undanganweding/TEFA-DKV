import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnnualProcurement } from '../../types';
import { Pagination } from '../Pagination';

interface PengadaanViewProps {
  procurements: AnnualProcurement[];
  onAddProcurement: (procurement: AnnualProcurement) => void;
}

export const PengadaanView: React.FC<PengadaanViewProps> = ({
  procurements,
  onAddProcurement,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('Semua');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Form states
  const [title, setTitle] = useState('');
  const [targetItem, setTargetItem] = useState('');
  const [category, setCategory] = useState<'Pengembangan Lab' | 'Peremajaan Mesin' | 'Lisensi Software' | 'Peralatan Tambahan'>('Pengembangan Lab');
  const [qty, setQty] = useState(1);
  const [estimatedUnitPrice, setEstimatedUnitPrice] = useState(1000000);
  const [priority, setPriority] = useState<'Sangat Penting' | 'Penting' | 'Sekunder'>('Penting');
  const [justification, setJustification] = useState('');

  const filteredProcurements = procurements.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.targetItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPriority = selectedPriority === 'Semua' || p.priority === selectedPriority;
    return matchSearch && matchPriority;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedPriority]);

  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(filteredProcurements.length / ITEMS_PER_PAGE) || 1;
  const paginatedProcurements = filteredProcurements.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
    <div className="space-y-5 pb-10 font-sans text-slate-800">
      {/* Header */}
      <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Rencana Pengadaan Tahunan Peralatan TEFA DKV
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Usulan peremajaan mesin, penambahan hardware studio, dan lisensi software TA 2025/2026.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-full flex items-center gap-2 shadow-md shadow-emerald-500/15 transition-all shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">add_box</span>
          <span>+ Usulkan Pengadaan Baru</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-[20px] border border-slate-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {['Semua', 'Sangat Penting', 'Penting', 'Sekunder'].map((pri) => (
            <button
              key={pri}
              onClick={() => setSelectedPriority(pri)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all whitespace-nowrap ${
                selectedPriority === pri
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pri}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari usulan, item target..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#5B4BFF] focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* List of Procurements (Compact Cards) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage + searchQuery + selectedPriority}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="space-y-3"
        >
          {paginatedProcurements.length === 0 ? (
            <div className="bg-white rounded-[24px] p-10 text-center border border-slate-200/80 text-slate-400 font-bold text-xs">
              Tidak ada usulan pengadaan ditemukan.
            </div>
          ) : (
            paginatedProcurements.map((proc) => (
              <motion.div
                key={proc.id}
                whileHover={{ y: -2 }}
                className="bg-white rounded-[20px] border border-slate-200/80 hover:border-purple-300 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${getPriorityBadge(
                        proc.priority
                      )}`}
                    >
                      {proc.priority}
                    </span>
                    <span
                      className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        proc.status
                      )}`}
                    >
                      {proc.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">TA {proc.year}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-[#5B4BFF] transition-colors">{proc.title}</h3>
                  <p className="text-xs font-bold text-emerald-700">
                    Item Target: {proc.targetItem} ({proc.qty} Unit)
                  </p>
                  {proc.justification && (
                    <p className="text-[11px] text-slate-600 italic line-clamp-1">"{proc.justification}"</p>
                  )}
                  <p className="text-[10px] text-slate-400">Diusulkan oleh: {proc.requestedBy}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-left md:text-right shrink-0">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Est. Total Anggaran</p>
                  <p className="text-base font-black text-slate-900">{formatRupiah(proc.totalBudget)}</p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {proc.qty} x {formatRupiah(proc.estimatedUnitPrice)}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Global SaaS Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredProcurements.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemName="usulan"
      />

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[24px] p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl text-xs font-sans"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">Usulkan Rencana Pengadaan Baru</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Satuan Est. (Rp)</label>
                  <input
                    type="number"
                    min="1000"
                    value={estimatedUnitPrice}
                    onChange={(e) => setEstimatedUnitPrice(Number(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prioritas</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-full cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#5B4BFF] hover:bg-purple-700 text-white font-extrabold rounded-full shadow-md cursor-pointer"
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

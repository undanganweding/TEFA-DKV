import React, { useState } from 'react';
import { AnnualProcurement } from '../../types';

interface PengadaanViewProps {
  procurements: AnnualProcurement[];
  onAddProcurement: (procurement: AnnualProcurement) => void;
  onUpdateProcurementStatus?: (id: string, newStatus: string) => void;
}

export const PengadaanView: React.FC<PengadaanViewProps> = ({
  procurements,
  onAddProcurement,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<string>('2025/2026');
  const [selectedItem, setSelectedItem] = useState<AnnualProcurement | null>(null);
  const [kebabOpen, setKebabOpen] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [targetItem, setTargetItem] = useState('');
  const [category, setCategory] = useState<'Pengembangan Lab' | 'Peremajaan Mesin' | 'Lisensi Software' | 'Peralatan Tambahan'>('Pengembangan Lab');
  const [qty, setQty] = useState(1);
  const [estimatedUnitPrice, setEstimatedUnitPrice] = useState(1000000);
  const [priority, setPriority] = useState<'Sangat Penting' | 'Penting' | 'Sekunder'>('Penting');
  const [justification, setJustification] = useState('');

  // Available years
  const years = ['2024/2025', '2025/2026', '2026/2027', '2027/2028'];

  // Filter by year
  const filteredProc = procurements.filter(p => p.year === selectedYear);

  // Group by status (Kanban columns)
  const draftItems = filteredProc.filter(p => p.status === 'Diusulkan');
  const reviewItems = filteredProc.filter(p => p.status === 'Dalam Review');
  const approvedItems = filteredProc.filter(p => p.status === 'Disetujui' || p.status === 'Direalisasikan');

  // Calculate totals per column
  const calcTotal = (items: AnnualProcurement[]) => {
    return items.reduce((sum, item) => sum + item.totalBudget, 0);
  };

  // Format currency for Indonesia - clean readable format
  const formatRupiah = (val: number) => {
    if (val >= 1000000000) {
      return `Rp ${(val / 1000000000).toFixed(1).replace('.', ',')} M`;
    } else if (val >= 1000000) {
      return `Rp ${(val / 1000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}Jt`;
    } else if (val >= 1000) {
      return `Rp ${val.toLocaleString('id-ID')}`;
    }
    return `Rp ${val}`;
  };

  const formatRupiahFull = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetItem.trim()) return;

    const newP: AnnualProcurement = {
      id: 'PRC-' + Date.now(),
      year: selectedYear,
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
    resetForm();
  };

  const resetForm = () => {
    setShowModal(false);
    setTitle('');
    setTargetItem('');
    setJustification('');
    setQty(1);
    setEstimatedUnitPrice(1000000);
  };

  const getPriorityConfig = (p: string) => {
    switch (p) {
      case 'Sangat Penting':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
      case 'Penting':
        return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };
    }
  };

  const getCategoryTag = (cat: string) => {
    const tags: Record<string, string> = {
      'Pengembangan Lab': 'bg-violet-100 text-violet-700 border-violet-200',
      'Peremajaan Mesin': 'bg-blue-100 text-blue-700 border-blue-200',
      'Lisensi Software': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'Peralatan Tambahan': 'bg-teal-100 text-teal-700 border-teal-200',
    };
    return tags[cat] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-white text-xl">calendar_month</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Rencana Pengadaan Tahunan</h2>
            <p className="text-xs text-slate-500">Pengelolaan anggaran & peremajaan peralatan TEFA DKV</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Year Filter */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              {years.map(y => (
                <option key={y} value={y}>TA {y}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">expand_more</span>
          </div>

          {/* Export Button */}
          <button className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-base">file_download</span>
            Export Laporan
          </button>

          {/* Add Button */}
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-colors"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            + Pengadaan Baru
          </button>
        </div>
      </div>

      {/* Total Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl text-white shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pengajuan</p>
          <p className="text-2xl font-black mt-1">{formatRupiah(calcTotal(filteredProc))}</p>
          <p className="text-[10px] text-slate-400 mt-1">{filteredProc.length} pengajuan</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Draft</p>
          <p className="text-xl font-black text-slate-600 mt-1">{formatRupiah(calcTotal(draftItems))}</p>
          <p className="text-[10px] text-slate-400 mt-1">{draftItems.length} item</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-blue-500 uppercase">Dalam Review</p>
          <p className="text-xl font-black text-blue-600 mt-1">{formatRupiah(calcTotal(reviewItems))}</p>
          <p className="text-[10px] text-slate-400 mt-1">{reviewItems.length} item</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-emerald-500 uppercase">Disetujui</p>
          <p className="text-xl font-black text-emerald-600 mt-1">{formatRupiah(calcTotal(approvedItems))}</p>
          <p className="text-[10px] text-slate-400 mt-1">{approvedItems.length} item</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Draft Column */}
        <KanbanColumn
          title="Draft"
          subtitle="Diusulkan"
          count={draftItems.length}
          total={calcTotal(draftItems)}
          accentColor="slate"
          items={draftItems}
          onItemClick={setSelectedItem}
          onEdit={(item) => {
            setSelectedItem(item);
            // Open edit modal logic
          }}
          onDelete={(item) => {
            // Delete logic
          }}
          formatRupiah={formatRupiah}
          getPriorityConfig={getPriorityConfig}
          getCategoryTag={getCategoryTag}
          kebabOpen={kebabOpen}
          setKebabOpen={setKebabOpen}
          showDelete={true}
        />

        {/* Review Column */}
        <KanbanColumn
          title="Dalam Review"
          subtitle="Sedang Dinilai"
          count={reviewItems.length}
          total={calcTotal(reviewItems)}
          accentColor="blue"
          items={reviewItems}
          onItemClick={setSelectedItem}
          formatRupiah={formatRupiah}
          getPriorityConfig={getPriorityConfig}
          getCategoryTag={getCategoryTag}
          kebabOpen={kebabOpen}
          setKebabOpen={setKebabOpen}
          showDelete={false}
        />

        {/* Approved Column */}
        <KanbanColumn
          title="Disetujui"
          subtitle="Siap Direalisasikan"
          count={approvedItems.length}
          total={calcTotal(approvedItems)}
          accentColor="emerald"
          items={approvedItems}
          onItemClick={setSelectedItem}
          formatRupiah={formatRupiah}
          getPriorityConfig={getPriorityConfig}
          getCategoryTag={getCategoryTag}
          kebabOpen={kebabOpen}
          setKebabOpen={setKebabOpen}
          showDelete={false}
          isApproved={true}
        />
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base">Pengadaan Baru</h3>
                <p className="text-[11px] text-slate-500">TA {selectedYear}</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Judul Pengajuan</label>
                <input
                  type="text"
                  required
                  placeholder="Pengadaan Mesin DTF Sablon Digital"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Spesifikasi Item</label>
                <input
                  type="text"
                  required
                  placeholder="Mesin DTF A3 Dual Head i1600"
                  value={targetItem}
                  onChange={(e) => setTargetItem(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="Pengembangan Lab">Pengembangan Lab</option>
                    <option value="Peremajaan Mesin">Peremajaan Mesin</option>
                    <option value="Lisensi Software">Lisensi Software</option>
                    <option value="Peralatan Tambahan">Peralatan Tambahan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Prioritas</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="Sangat Penting">🔴 Sangat Penting</option>
                    <option value="Penting">🟡 Penting</option>
                    <option value="Sekunder">⚪ Sekunder</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Jumlah Unit</label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Estimasi Harga/Unit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rp</span>
                    <input
                      type="number"
                      min="0"
                      value={estimatedUnitPrice}
                      onChange={(e) => setEstimatedUnitPrice(Number(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none text-right"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-600">Total Estimasi:</span>
                  <span className="text-sm font-black text-indigo-700">{formatRupiahFull(qty * estimatedUnitPrice)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Alasan / Justifikasi Kebutuhan</label>
                <textarea
                  rows={3}
                  placeholder="Meningkatkan kapasitas produksi dan kompetensi siswa..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Simpan Pengajuan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detail Side Drawer */}
      {selectedItem && (
        <DetailDrawer
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onMoveToInventaris={() => {
            // Move to Inventaris logic
            setSelectedItem(null);
          }}
          formatRupiah={formatRupiah}
          formatRupiahFull={formatRupiahFull}
          getPriorityConfig={getPriorityConfig}
          getCategoryTag={getCategoryTag}
        />
      )}
    </div>
  );
};

// Kanban Column Component
interface KanbanColumnProps {
  title: string;
  subtitle: string;
  count: number;
  total: number;
  accentColor: string;
  items: AnnualProcurement[];
  onItemClick: (item: AnnualProcurement) => void;
  onEdit?: (item: AnnualProcurement) => void;
  onDelete?: (item: AnnualProcurement) => void;
  formatRupiah: (val: number) => string;
  getPriorityConfig: (p: string) => any;
  getCategoryTag: (cat: string) => string;
  kebabOpen: string | null;
  setKebabOpen: (id: string | null) => void;
  showDelete: boolean;
  isApproved?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  subtitle,
  count,
  total,
  accentColor,
  items,
  onItemClick,
  onEdit,
  onDelete,
  formatRupiah,
  getPriorityConfig,
  getCategoryTag,
  kebabOpen,
  setKebabOpen,
  showDelete,
  isApproved,
}) => {
  const accentStyles: Record<string, { header: string; dot: string; border: string }> = {
    slate: { header: 'from-slate-500 to-slate-600', dot: 'bg-slate-400', border: 'border-slate-200' },
    blue: { header: 'from-blue-500 to-blue-600', dot: 'bg-blue-400', border: 'border-blue-200' },
    emerald: { header: 'from-emerald-500 to-emerald-600', dot: 'bg-emerald-400', border: 'border-emerald-200' },
  };
  const style = accentStyles[accentColor] || accentStyles.slate;

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
      {/* Column Header */}
      <div className={`bg-gradient-to-r ${style.header} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`}></span>
            <h3 className="font-black text-white text-sm">{title}</h3>
            <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full">{count}</span>
          </div>
          <span className="text-white/80 text-xs font-bold">{formatRupiah(total)}</span>
        </div>
        <p className="text-white/60 text-[10px] mt-0.5">{subtitle}</p>
      </div>

      {/* Cards */}
      <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <span className="material-symbols-outlined text-3xl">inbox</span>
            <p className="text-xs mt-2">Belum ada pengajuan</p>
          </div>
        ) : (
          items.map((item) => {
            const prio = getPriorityConfig(item.priority);
            const catTag = getCategoryTag(item.category);
            const isOpen = kebabOpen === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
                onClick={() => onItemClick(item)}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h4>
                    <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-md border ${catTag}`}>
                      [{item.category.split(' ')[0]}]
                    </span>
                  </div>

                  {/* Kebab Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setKebabOpen(isOpen ? null : item.id);
                      }}
                      className="w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-slate-400 text-sm">more_vert</span>
                    </button>

                    {isOpen && (
                      <div className="absolute right-0 top-7 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10 min-w-[120px]">
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(item);
                              setKebabOpen(null);
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Edit
                          </button>
                        )}
                        {showDelete && onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item);
                              setKebabOpen(null);
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            Hapus
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority Badge */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`}></span>
                  <span className={`text-[9px] font-bold ${prio.text}`}>{item.priority}</span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-500">×{item.qty} unit</span>
                  <span className="text-xs font-black text-slate-700">{formatRupiah(item.totalBudget)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Detail Side Drawer Component
interface DetailDrawerProps {
  item: AnnualProcurement;
  onClose: () => void;
  onMoveToInventaris: () => void;
  formatRupiah: (val: number) => string;
  formatRupiahFull: (val: number) => string;
  getPriorityConfig: (p: string) => any;
  getCategoryTag: (cat: string) => string;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({
  item,
  onClose,
  onMoveToInventaris,
  formatRupiah,
  formatRupiahFull,
  getPriorityConfig,
  getCategoryTag,
}) => {
  const prio = getPriorityConfig(item.priority);
  const catTag = getCategoryTag(item.category);
  const isApproved = item.status === 'Disetujui' || item.status === 'Direalisasikan';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${prio.bg} ${prio.text} border ${prio.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`}></span>
                {item.priority}
              </span>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${catTag}`}>
                {item.category}
              </span>
            </div>
            <h3 className="font-black text-slate-900 text-base">{item.title}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">TA {item.year} • Diajukan oleh {item.requestedBy}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Budget Summary */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-2xl text-white">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Total Estimasi Anggaran</p>
            <p className="text-2xl font-black mt-1">{formatRupiahFull(item.totalBudget)}</p>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/20">
              <div>
                <p className="text-[10px] text-white/60">Harga/Unit</p>
                <p className="text-sm font-bold">{formatRupiahFull(item.estimatedUnitPrice)}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/60">Jumlah</p>
                <p className="text-sm font-bold">{item.qty} Unit</p>
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-3">Detail Item</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Spesifikasi</span>
                <span className="font-bold text-slate-800 text-right max-w-[60%]">{item.targetItem}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tahun Ajaran</span>
                <span className="font-bold text-slate-800">{item.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-emerald-600">{item.status}</span>
              </div>
            </div>
          </div>

          {/* Justification */}
          {item.justification && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <h4 className="text-[11px] font-bold text-amber-700 uppercase mb-2">Alasan Kebutuhan</h4>
              <p className="text-xs text-slate-700 leading-relaxed italic">"{item.justification}"</p>
            </div>
          )}

          {/* Reference Links */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-3">Referensi & Link</h4>
            <button className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500">link</span>
                <span className="text-xs font-bold text-slate-700">Link SIPLah / E-Catalog</span>
              </div>
              <span className="material-symbols-outlined text-slate-400">open_in_new</span>
            </button>
          </div>

          {/* Reference Image */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-3">Referensi Gambar</h4>
            <div className="aspect-video bg-slate-200 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-4xl text-slate-400">image</span>
                <p className="text-xs text-slate-500 mt-2">Tidak ada gambar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-5">
          {isApproved ? (
            <button
              onClick={onMoveToInventaris}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined">check_circle</span>
              Barang Diterima - Pindahkan ke Inventaris
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Tutup
              </button>
              <button className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors">
                Ajukan Review
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PengadaanView;

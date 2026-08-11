import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ToolInventory } from '../../types';
import { Pagination } from '../Pagination';

interface InventarisAlatViewProps {
  tools: ToolInventory[];
  onUpdateToolCondition?: (toolId: string, condition: any) => void;
  onArchiveTool?: (tool: ToolInventory) => void;
}

export const InventarisAlatView: React.FC<InventarisAlatViewProps> = ({ tools, onArchiveTool }) => {
  const [selectedCondition, setSelectedCondition] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filteredTools = tools.filter((t) => {
    const matchCondition = selectedCondition === 'Semua' || t.condition === selectedCondition;
    const matchSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.picName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCondition && matchSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCondition, searchQuery]);

  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(filteredTools.length / ITEMS_PER_PAGE) || 1;
  const paginatedTools = filteredTools.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getConditionBadge = (cond: string) => {
    switch (cond) {
      case 'Sangat Baik':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Baik':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Perlu Perbaikan':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Rusak':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getToolImage = (name: string) => {
    if (name.toLowerCase().includes('printer') || name.toLowerCase().includes('roland') || name.toLowerCase().includes('konica')) {
      return 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&q=80';
    } else if (name.toLowerCase().includes('kamera') || name.toLowerCase().includes('canon') || name.toLowerCase().includes('sony')) {
      return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80';
    } else if (name.toLowerCase().includes('pc') || name.toLowerCase().includes('imac') || name.toLowerCase().includes('komputer')) {
      return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80';
    }
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80';
  };

  return (
    <div className="space-y-5 pb-10 font-sans text-slate-800">
      {/* Header */}
      <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Inventaris Peralatan & Mesin Lab DKV
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Pencatatan aset mesin cetak, finishing, kamera studio, dan PC laboratorium.
          </p>
        </div>
        <button
          onClick={() =>
            alert('Simulasi Laporan Maintenance: Laporan kerusakan dikirim ke Penanggung Jawab Lab.')
          }
          className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-full flex items-center gap-2 shadow-md shadow-amber-500/15 transition-all shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">build</span>
          <span>+ Laporkan Perawatan Mesin</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-[20px] border border-slate-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {['Semua', 'Sangat Baik', 'Baik', 'Perlu Perbaikan', 'Rusak'].map((cond) => (
            <button
              key={cond}
              onClick={() => setSelectedCondition(cond)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all whitespace-nowrap ${
                selectedCondition === cond
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cond}
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
            placeholder="Cari mesin, kode, PIC..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#5B4BFF] focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Compact Equipment Grid (3 columns desktop) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage + selectedCondition + searchQuery}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {paginatedTools.length === 0 ? (
            <div className="col-span-full bg-white rounded-[24px] p-10 text-center border border-slate-200/80 shadow-2xs text-slate-400 font-bold text-xs">
              Tidak ada aset ditemukan.
            </div>
          ) : (
            paginatedTools.map((tool) => (
              <motion.div
                key={tool.id}
                whileHover={{ y: -3 }}
                className="bg-white rounded-[22px] border border-slate-200/80 hover:border-purple-300 p-4 shadow-2xs hover:shadow-lg hover:shadow-purple-500/10 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-slate-100 text-slate-700 font-mono font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200">
                      {tool.code}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getConditionBadge(
                        tool.condition
                      )}`}
                    >
                      {tool.condition}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-100">
                      <img
                        src={getToolImage(tool.name)}
                        alt={tool.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-[#5B4BFF] transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-[11px] font-bold text-[#5B4BFF] line-clamp-1">
                        {tool.location} • PIC: {tool.picName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                  <span className="font-semibold">Maint: {tool.lastMaintenance}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700 font-mono">S/N: {tool.serialNumber}</span>
                    {onArchiveTool && (
                      <button
                        onClick={() => onArchiveTool(tool)}
                        className="p-1.5 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-800 transition-colors cursor-pointer"
                        title="Arsipkan Aset"
                      >
                        <span className="material-symbols-outlined text-sm">archive</span>
                      </button>
                    )}
                  </div>
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
        totalItems={filteredTools.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemName="aset"
      />
    </div>
  );
};

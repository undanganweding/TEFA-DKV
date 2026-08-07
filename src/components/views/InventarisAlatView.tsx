import React, { useState } from 'react';
import { ToolInventory } from '../../types';

interface InventarisAlatViewProps {
  tools: ToolInventory[];
  onUpdateToolCondition?: (toolId: string, condition: any) => void;
  onDeleteTool?: (tool: ToolInventory) => void;
}

export const InventarisAlatView: React.FC<InventarisAlatViewProps> = ({ tools, onDeleteTool }) => {
  const [selectedCondition, setSelectedCondition] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTools = tools.filter((t) => {
    const matchCondition = selectedCondition === 'Semua' || t.condition === selectedCondition;
    const matchSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.picName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCondition && matchSearch;
  });

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
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Inventaris Peralatan & Mesin Laboratorium DKV
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan aset mesin cetak, finishing, kamera studio, dan PC laboratorium.
          </p>
        </div>
        <button
          onClick={() =>
            alert('Simulasi Laporan Maintenance: Laporan kerusakan berhasil dikirim ke Penanggung Jawab Lab.')
          }
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-base">build</span>
          <span>+ Laporkan Perawatan Mesin</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['Semua', 'Sangat Baik', 'Baik', 'Perlu Perbaikan', 'Rusak'].map((cond) => (
            <button
              key={cond}
              onClick={() => setSelectedCondition(cond)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCondition === cond
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cond}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mesin, kode, PIC..."
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-md">
                  {tool.code}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getConditionBadge(
                    tool.condition
                  )}`}
                >
                  {tool.condition}
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">{tool.name}</h3>
              <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                Lokasi: {tool.location} • PIC: {tool.picName}
              </p>
              {tool.specification && (
                <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100 leading-tight">
                  {tool.specification}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Maintenance: {tool.lastMaintenance}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">S/N: {tool.serialNumber}</span>
                {onDeleteTool && (
                  <button
                    onClick={() => onDeleteTool(tool)}
                    className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors"
                    title="Hapus Alat Permanen"
                  >
                    <span className="material-symbols-outlined text-sm">delete_forever</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { MaterialStock } from '../../types';

interface StokBahanViewProps {
  materials: MaterialStock[];
  onRestockItem?: (materialId: string, addQty: number) => void;
  onDeleteMaterial?: (material: MaterialStock) => void;
}

export const StokBahanView: React.FC<StokBahanViewProps> = ({ materials, onDeleteMaterial }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredMaterials = materials.filter((m) => {
    const matchStatus = selectedStatus === 'Semua' || m.status === selectedStatus;
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Aman':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Menipis':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Kritis':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Stok Bahan Baku & Konsumabel Cetak
          </h2>
          <p className="text-xs text-slate-500">
            Monitoring ketersediaan roll flexi banner, kertas A3+, tinta solvent, dan souvenir polos.
          </p>
        </div>
        <button
          onClick={() => alert('Simulasi Buat PO Bahan Baku ke Supplier')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-base">local_shipping</span>
          <span>+ Buat Permintaan Pembelian Bahan</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['Semua', 'Aman', 'Menipis', 'Kritis'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedStatus === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari bahan, supplier..."
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Material Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Kode & Nama Bahan</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Stok Saat Ini</th>
                <th className="p-4">Status Ketersediaan</th>
                <th className="p-4">Harga Beli Est.</th>
                <th className="p-4">Supplier & Lokasi</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map((mat) => (
                <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <p className="font-black text-slate-900">{mat.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{mat.code}</p>
                  </td>
                  <td className="p-4 font-semibold text-slate-700">{mat.category}</td>
                  <td className="p-4">
                    <span className="font-extrabold text-sm text-slate-900">
                      {mat.currentStock} {mat.unit}
                    </span>
                    <p className="text-[10px] text-slate-500">Min: {mat.minStock} {mat.unit}</p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getStatusBadge(
                        mat.status
                      )}`}
                    >
                      {mat.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    {formatRupiah(mat.unitPrice)} /{mat.unit}
                  </td>
                  <td className="p-4 text-slate-600">
                    <p className="font-bold text-slate-800">{mat.supplier}</p>
                    <p className="text-[10px] text-slate-500">{mat.location}</p>
                  </td>
                  <td className="p-4 text-center">
                    {onDeleteMaterial && (
                      <button
                        onClick={() => onDeleteMaterial(mat)}
                        title="Hapus Bahan Permanen"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">delete_forever</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

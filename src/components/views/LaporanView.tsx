import React, { useState } from 'react';
import { ProductionOrder, FinanceTransaction } from '../../types';

interface LaporanViewProps {
  orders: ProductionOrder[];
  transactions: FinanceTransaction[];
}

export const LaporanView: React.FC<LaporanViewProps> = ({ orders, transactions }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'Bulan Ini' | 'Bulan Lalu' | 'Tahun 2025'>('Bulan Ini');

  const totalOmset = orders.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalOrdersCount = orders.length;
  const totalItemsSold = orders.reduce((acc, curr) => acc + curr.items.reduce((iAcc, iCurr) => iAcc + iCurr.qty, 0), 0);

  const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Laporan Kinerja Unit Produksi TEFA DKV
          </h2>
          <p className="text-xs text-slate-500">
            Rekapitulasi omset penjualan, statistik produk favorit, dan efisiensi bahan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Simulasi Export Laporan PDF/Excel: File Laporan TEFA DKV berhasil diunduh.')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">file_download</span>
            <span>Export Laporan PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Period Tabs */}
      <div className="flex items-center gap-2">
        {['Bulan Ini', 'Bulan Lalu', 'Tahun 2025'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedPeriod === period
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase">Omset Bersih Diterima</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{formatRupiah(totalOmset)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Periode {selectedPeriod}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase">Jumlah Transaksi Order</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalOrdersCount} Pesanan</p>
          <p className="text-[11px] text-slate-400 mt-1">Rata-rata {Math.round(totalOmset / (totalOrdersCount || 1))} / order</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Unit Produk Dicetak</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{totalItemsSold} Item</p>
          <p className="text-[11px] text-slate-400 mt-1">Banner, Stiker, Mug & Card</p>
        </div>
      </div>

      {/* Detailed Order Summary List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm">Rincian Laporan Omset Per Order</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase border-b border-slate-100">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">No. Nota</th>
                <th className="p-3">Pemesan</th>
                <th className="p-3">Total Nilai Order</th>
                <th className="p-3">Telah Dibayar</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-600">{o.orderDate}</td>
                  <td className="p-3 font-black text-slate-900">{o.orderNo}</td>
                  <td className="p-3 font-bold text-slate-800">{o.customerName}</td>
                  <td className="p-3 font-extrabold text-slate-900">{formatRupiah(o.totalAmount)}</td>
                  <td className="p-3 font-extrabold text-emerald-700">{formatRupiah(o.paidAmount)}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {o.paymentStatus}
                    </span>
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

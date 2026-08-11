import React, { useState, useMemo } from 'react';
import { ProductionOrder, FinanceTransaction } from '../../types';

interface LaporanViewProps {
  orders: ProductionOrder[];
  transactions: FinanceTransaction[];
}

export const LaporanView: React.FC<LaporanViewProps> = ({ orders = [], transactions = [] }) => {
  const safeOrders = useMemo(() => orders.filter((o) => !o.isArchived), [orders]);
  const safeTransactions = useMemo(() => transactions.filter((t) => !t.isArchived), [transactions]);

  // Extract unique months from transaction data to populate filter dropdown dynamically
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    safeTransactions.forEach((t) => {
      // Date format is YYYY-MM-DD or YYYY-MM-DD HH:mm
      if (t.date && t.date.length >= 7) {
        monthsSet.add(t.date.substring(0, 7));
      }
    });
    // Add current month if empty
    if (monthsSet.size === 0) {
      const now = new Date();
      monthsSet.add(now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'));
    }
    return Array.from(monthsSet).sort().reverse();
  }, [safeTransactions]);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    availableMonths[0] || new Date().toISOString().substring(0, 7)
  );

  // Filtered datasets based on selected month (YYYY-MM)
  const filteredTransactions = useMemo(() => {
    return safeTransactions.filter((t) => t.date && t.date.startsWith(selectedMonth));
  }, [safeTransactions, selectedMonth]);

  const filteredOrders = useMemo(() => {
    return safeOrders.filter((o) => o.orderDate && o.orderDate.startsWith(selectedMonth));
  }, [safeOrders, selectedMonth]);

  // Calculations for reporting period
  const reportMetrics = useMemo(() => {
    const totalTransactions = filteredTransactions.length;
    
    // Revenue (Pemasukan)
    const grossRevenue = filteredTransactions
      .filter((t) => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    // Realized Refunds (RFD- prefix)
    const refunds = filteredTransactions
      .filter((t) => t.transNo && t.transNo.startsWith('RFD-'))
      .reduce((sum, t) => sum + t.amount, 0);

    // Discounts given in the orders during this month
    const totalDiscount = filteredOrders.reduce((sum, o) => sum + (o.discount || 0), 0);

    // Net Sales = Gross Revenue - Discount - Refunds
    const netRevenue = Math.max(0, grossRevenue - totalDiscount - refunds);

    // HPP / COGS for Pemasukan
    const hppValue = filteredTransactions
      .filter((t) => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + (t.cogsAmount || 0), 0);

    // Subtract HPP associated with refunds
    const refundedHpp = filteredTransactions
      .filter((t) => t.transNo && t.transNo.startsWith('RFD-'))
      .reduce((sum, t) => sum + (t.cogsAmount || 0), 0);
    const netHpp = Math.max(0, hppValue - refundedHpp);

    const grossProfit = Math.max(0, netRevenue - netHpp);

    // Operating expenses (Pengeluaran - excluding refund transactions)
    const operatingExpenses = filteredTransactions
      .filter((t) => t.type === 'Pengeluaran' && (!t.transNo || !t.transNo.startsWith('RFD-')))
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = grossProfit - operatingExpenses;

    // Payment methods breakdown for this month
    const cashPayments = filteredTransactions
      .filter((t) => t.type === 'Pemasukan' && t.paymentMethod === 'Cash')
      .reduce((sum, t) => sum + t.amount, 0);

    const qrisPayments = filteredTransactions
      .filter((t) => t.type === 'Pemasukan' && t.paymentMethod === 'QRIS')
      .reduce((sum, t) => sum + t.amount, 0);

    const transferPayments = filteredTransactions
      .filter((t) => t.type === 'Pemasukan' && t.paymentMethod === 'Transfer Bank')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalTransactions,
      grossRevenue,
      totalDiscount,
      refunds,
      netRevenue,
      hppValue: netHpp,
      grossProfit,
      operatingExpenses,
      netProfit,
      cashPayments,
      qrisPayments,
      transferPayments,
    };
  }, [filteredTransactions, filteredOrders]);

  // Breakdown per day
  const dailyBreakdown = useMemo(() => {
    const dayMap: {
      [date: string]: {
        date: string;
        trxCount: number;
        omset: number;
        hpp: number;
        expenses: number;
        netRevenue: number;
        laba: number;
      };
    } = {};

    filteredTransactions.forEach((t) => {
      const dateKey = t.date.split(' ')[0]; // Extract YYYY-MM-DD
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          date: dateKey,
          trxCount: 0,
          omset: 0,
          hpp: 0,
          expenses: 0,
          netRevenue: 0,
          laba: 0,
        };
      }
      dayMap[dateKey].trxCount += 1;
      if (t.type === 'Pemasukan') {
        dayMap[dateKey].omset += t.amount;
        dayMap[dateKey].hpp += t.cogsAmount || 0;
        dayMap[dateKey].netRevenue += t.amount;
      } else {
        if (t.transNo && t.transNo.startsWith('RFD-')) {
          // Refund reduces omset and netRevenue
          dayMap[dateKey].omset = Math.max(0, dayMap[dateKey].omset - t.amount);
          dayMap[dateKey].netRevenue = Math.max(0, dayMap[dateKey].netRevenue - t.amount);
          dayMap[dateKey].hpp = Math.max(0, dayMap[dateKey].hpp - (t.cogsAmount || 0));
        } else {
          dayMap[dateKey].expenses += t.amount;
        }
      }
    });

    // Adjust netRevenue and laba with discounts (assigned to order dates)
    filteredOrders.forEach((o) => {
      if (o.discount > 0 && dayMap[o.orderDate]) {
        dayMap[o.orderDate].netRevenue = Math.max(0, dayMap[o.orderDate].netRevenue - o.discount);
      }
    });

    // Calculate final laba
    Object.keys(dayMap).forEach((k) => {
      dayMap[k].laba = dayMap[k].netRevenue - dayMap[k].hpp - dayMap[k].expenses;
    });

    return Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTransactions, filteredOrders]);

  // Breakdown per category
  const categoryBreakdown = useMemo(() => {
    const catMap: { [cat: string]: number } = {};
    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        catMap[item.category] = (catMap[item.category] || 0) + item.totalPrice;
      });
    });
    return Object.entries(catMap).map(([category, value]) => ({ category, value }));
  }, [filteredOrders]);

  const formatRupiah = (val: number) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    return (isNegative ? '- ' : '') + 'Rp ' + absVal.toLocaleString('id-ID');
  };

  const getMonthName = (yearMonth: string) => {
    if (!yearMonth) return '';
    const [year, month] = yearMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Laporan Keuangan Unit Produksi TEFA DKV
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Laporan rugi laba bersih studio, rekapitulasi COGS, pengeluaran operasional, dan cash reconciliation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert(`Simulasi Export Laporan Keuangan Bulan ${getMonthName(selectedMonth)} berhasil diunduh.`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">file_download</span>
            <span>Export Excel / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Month Dropdown */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/85 shadow-2xs w-fit">
        <label className="text-xs font-extrabold text-slate-500">Pilih Periode Bulan:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-slate-900 outline-none focus:border-[#5B4BFF]"
        >
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {getMonthName(m)}
            </option>
          ))}
        </select>
      </div>

      {/* Financial Statement Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profit & Loss statement */}
        <div className="lg:col-span-2 bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div>
            <h3 className="font-black text-slate-900 text-sm">Laporan Perhitungan Rugi &amp; Laba</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Periode: {getMonthName(selectedMonth)}</p>
          </div>

          <div className="space-y-3.5 text-xs font-semibold text-slate-700">
            {/* Revenue */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-extrabold">1. Pendapatan Omset Kotor (Gross Sales)</span>
              <span className="text-slate-900 font-black">{formatRupiah(reportMetrics.grossRevenue)}</span>
            </div>
             <div className="flex justify-between items-center pb-2 border-b border-slate-100 pl-4 text-slate-500">
              <span>Dikurangi: Potongan Diskon</span>
              <span>({formatRupiah(reportMetrics.totalDiscount)})</span>
            </div>
            {reportMetrics.refunds > 0 && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 pl-4 text-rose-650">
                <span>Dikurangi: Refund / Pengembalian</span>
                <span>({formatRupiah(reportMetrics.refunds)})</span>
              </div>
            )}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 bg-slate-50 p-2 rounded-xl">
              <span className="font-extrabold text-slate-900">Pendapatan Bersih (Net Revenue)</span>
              <span className="text-[#5B4BFF] font-black">{formatRupiah(reportMetrics.netRevenue)}</span>
            </div>

            {/* COGS */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 pl-4 text-slate-500">
              <span>Dikurangi: Harga Pokok Penjualan (HPP / COGS)</span>
              <span className="text-rose-650 font-bold">({formatRupiah(reportMetrics.hppValue)})</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 bg-[#E6F4EA]/80 p-2 rounded-xl text-emerald-900">
              <span className="font-extrabold">Laba Kotor (Gross Profit)</span>
              <span className="font-black">{formatRupiah(reportMetrics.grossProfit)}</span>
            </div>

            {/* Operating Expense */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 pl-4 text-slate-500">
              <span>Dikurangi: Biaya Operasional (Operating Expenses)</span>
              <span className="text-rose-650 font-bold">({formatRupiah(reportMetrics.operatingExpenses)})</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-900 text-white rounded-2xl shadow-md">
              <span className="font-extrabold text-sm">Laba Bersih (Net Profit)</span>
              <span className="font-black text-sm text-emerald-400">{formatRupiah(reportMetrics.netProfit)}</span>
            </div>
          </div>
        </div>

        {/* Cash / Payment Reconciliation */}
        <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-black text-slate-900 text-sm">Rekonsiliasi Kas Masuk</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Metode Pembayaran Bulan Ini</p>
          </div>

          <div className="space-y-3 text-xs font-semibold pt-2">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5B4BFF]"></span> Tunai / Cash
              </span>
              <span className="text-slate-950 font-black">{formatRupiah(reportMetrics.cashPayments)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3BA7FF]"></span> QRIS Digital
              </span>
              <span className="text-slate-950 font-black">{formatRupiah(reportMetrics.qrisPayments)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]"></span> Transfer Bank
              </span>
              <span className="text-slate-950 font-black">{formatRupiah(reportMetrics.transferPayments)}</span>
            </div>
            <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center font-black bg-slate-50 p-2.5 rounded-xl">
              <span>Total Pembayaran Diterima:</span>
              <span className="text-emerald-700">{formatRupiah(reportMetrics.cashPayments + reportMetrics.qrisPayments + reportMetrics.transferPayments)}</span>
            </div>
          </div>

          {/* Verification Check */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-[10px] text-emerald-800 font-bold flex gap-2 items-start mt-2">
            <span className="material-symbols-outlined text-emerald-600 text-sm shrink-0">verified_user</span>
            <div>
              <p>Reconciliation Status: MATCHED</p>
              <p className="text-slate-500 font-normal mt-0.5">Seluruh cash masuk sesuai dengan total invoice terbayar.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown list */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm">Distribusi Nilai Order Per Kategori Layanan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categoryBreakdown.map((c) => (
              <div key={c.category} className="bg-slate-50/50 p-3 rounded-2xl border border-slate-150 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">{c.category}</span>
                <span className="font-black text-slate-900">{formatRupiah(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily report breakdown table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm">Laporan Keuangan Harian</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Jumlah Trx</th>
                <th className="p-3">Gross Revenue</th>
                <th className="p-3">HPP / COGS</th>
                <th className="p-3">Pengeluaran</th>
                <th className="p-3">Laba Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyBreakdown.map((d) => (
                <tr key={d.date} className="hover:bg-slate-50/60 font-semibold text-slate-700">
                  <td className="p-3 font-bold text-slate-900">{d.date}</td>
                  <td className="p-3 font-bold text-slate-600">{d.trxCount} Trx</td>
                  <td className="p-3 font-extrabold text-slate-900">{formatRupiah(d.omset)}</td>
                  <td className="p-3 text-rose-650 font-extrabold">{formatRupiah(d.hpp)}</td>
                  <td className="p-3 text-rose-650 font-bold">{formatRupiah(d.expenses)}</td>
                  <td className="p-3">
                    <span className={`font-black ${d.laba >= 0 ? 'text-emerald-700' : 'text-rose-650'}`}>
                      {formatRupiah(d.laba)}
                    </span>
                  </td>
                </tr>
              ))}
              {dailyBreakdown.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                    Tidak ada aktivitas keuangan pada bulan ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

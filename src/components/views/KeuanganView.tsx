import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FinanceTransaction } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface KeuanganViewProps {
  transactions: FinanceTransaction[];
  onAddTransaction: (trx: FinanceTransaction) => void;
  operatorName: string;
  onArchiveTransaction?: (trx: FinanceTransaction) => void;
}

export const KeuanganView: React.FC<KeuanganViewProps> = ({
  transactions,
  onAddTransaction,
  operatorName,
  onArchiveTransaction,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [type, setType] = useState<'Pemasukan' | 'Pengeluaran'>('Pemasukan');
  const [category, setCategory] = useState<string>('Penjualan Cetak');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<any>('Cash');

  const totalIn = transactions
    .filter((t) => t.type === 'Pemasukan')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalOut = transactions
    .filter((t) => t.type === 'Pengeluaran')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const saldoKas = totalIn - totalOut;
  const profitMargin = totalIn > 0 ? Math.round(((totalIn - totalOut) / totalIn) * 100) : 0;

  // Chart data
  const revenueVsExpenseData = [
    { month: 'Mei', income: 9800000, expense: 4200000 },
    { month: 'Jun', income: 12100000, expense: 5100000 },
    { month: 'Jul', income: 13900000, expense: 5800000 },
    { month: 'Agu', income: totalIn || 15250000, expense: totalOut || 6200000 },
  ];

  const paymentDistData = [
    { name: 'Cash', value: 55, color: '#5B4BFF' },
    { name: 'QRIS', value: 35, color: '#3BA7FF' },
    { name: 'Transfer Bank', value: 10, color: '#34D399' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) return;

    const now = new Date();
    const transNo =
      'TRX-' +
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      '-' +
      Math.floor(10 + Math.random() * 90);

    const newTrx: FinanceTransaction = {
      id: 'TRX-' + Date.now(),
      transNo,
      date:
        now.toISOString().split('T')[0] +
        ' ' +
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      type,
      category: category as any,
      description,
      amount,
      paymentMethod,
      operator: operatorName,
      status: 'Berhasil',
    };

    onAddTransaction(newTrx);
    setShowModal(false);
    setDescription('');
    setAmount(0);
  };

  const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Financial Dashboard & Buku Kas
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Analisis arus kas, pemasukan omset cetak, dan biaya operasional TEFA DKV.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-[#5B4BFF] to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all shrink-0 active:scale-95"
        >
          <span className="material-symbols-outlined text-base">add_card</span>
          <span>+ Catat Transaksi Baru</span>
        </button>
      </div>

      {/* Top 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#ECFDF5] border border-emerald-100/90 p-5 rounded-[24px] shadow-xs space-y-1.5">
          <p className="text-xs font-black text-emerald-900 uppercase tracking-wider">Total Pemasukan</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{formatRupiah(totalIn)}</h3>
          <span className="inline-block text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            Kas Masuk Penjualan
          </span>
        </div>

        <div className="bg-[#FFF1F2] border border-rose-100/90 p-5 rounded-[24px] shadow-xs space-y-1.5">
          <p className="text-xs font-black text-rose-900 uppercase tracking-wider">Total Pengeluaran</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{formatRupiah(totalOut)}</h3>
          <span className="inline-block text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
            Bahan & Operasional
          </span>
        </div>

        <div className="bg-[#151A2D] border border-slate-800 text-white p-5 rounded-[24px] shadow-xl space-y-1.5">
          <p className="text-xs font-black text-purple-300 uppercase tracking-wider">Saldo Kas TEFA</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white">{formatRupiah(saldoKas)}</h3>
          <span className="inline-block text-[10px] font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/40">
            Kondisi Kas Sehat
          </span>
        </div>

        <div className="bg-[#F3F0FF] border border-purple-100/90 p-5 rounded-[24px] shadow-xs space-y-1.5">
          <p className="text-xs font-black text-purple-900 uppercase tracking-wider">Profit Margin</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{profitMargin}%</h3>
          <span className="inline-block text-[10px] font-extrabold text-[#5B4BFF] bg-purple-100 px-2 py-0.5 rounded-full">
            Laba Bersih Studio
          </span>
        </div>
      </div>

      {/* Financial Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expense Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-base">Pemasukan vs Pengeluaran</h3>
              <p className="text-xs font-semibold text-slate-400">Perbandingan omset dan biaya bahan baku</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-extrabold">
              <span className="flex items-center gap-1 text-[#5B4BFF]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5B4BFF]"></span> Pemasukan
              </span>
              <span className="flex items-center gap-1 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Pengeluaran
              </span>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueVsExpenseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip
                  cursor={{ fill: 'rgba(91, 75, 255, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white text-xs font-extrabold py-2 px-3 rounded-2xl shadow-xl">
                          <div>In: Rp {payload[0]?.value?.toLocaleString('id-ID')}</div>
                          <div>Out: Rp {payload[1]?.value?.toLocaleString('id-ID')}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="income" fill="#5B4BFF" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="#FF6B9D" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-base">Metode Pembayaran</h3>
            <p className="text-xs font-semibold text-slate-400">Distribusi kanal transaksi</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs font-bold pt-2 border-t border-slate-100">
            {paymentDistData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-700">{item.name}</span>
                </div>
                <span className="font-extrabold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions List Table */}
      <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-xs overflow-hidden p-6 space-y-4">
        <h3 className="font-black text-slate-900 text-base">Riwayat Transaksi Keuangan</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-3.5 rounded-l-2xl">No. Transaksi</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Jenis & Kategori</th>
                <th className="p-3.5">Keterangan</th>
                <th className="p-3.5">Metode</th>
                <th className="p-3.5 text-right rounded-r-2xl">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-mono font-extrabold text-[#5B4BFF]">{trx.transNo}</td>
                  <td className="p-3.5 text-slate-500 font-medium whitespace-nowrap">{trx.date}</td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        trx.type === 'Pemasukan'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {trx.type}
                    </span>
                    <p className="text-[11px] font-bold text-slate-800 mt-0.5">{trx.category}</p>
                  </td>
                  <td className="p-3.5 text-slate-800 font-medium">{trx.description}</td>
                  <td className="p-3.5 text-slate-600 font-bold">{trx.paymentMethod}</td>
                  <td className="p-3.5 text-right font-black text-sm">
                    <span className={trx.type === 'Pemasukan' ? 'text-emerald-600' : 'text-rose-600'}>
                      {trx.type === 'Pemasukan' ? '+' : '-'}{formatRupiah(trx.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.form
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-[28px] p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl text-xs"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">Catat Transaksi Kas Baru</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipe Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('Pemasukan')}
                    className={`py-2.5 font-extrabold rounded-full ${
                      type === 'Pemasukan' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    + Pemasukan Kas
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('Pengeluaran')}
                    className={`py-2.5 font-extrabold rounded-full ${
                      type === 'Pengeluaran' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    - Pengeluaran Kas
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan Transaksi</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Pembelian Tinta Sublim Mug 500ml"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-full bg-slate-100 text-slate-700 font-extrabold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-full bg-[#5B4BFF] text-white font-extrabold shadow-md"
              >
                Simpan Transaksi
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
};

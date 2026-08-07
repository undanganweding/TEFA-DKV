import React, { useState } from 'react';
import { FinanceTransaction } from '../../types';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) return;

    const now = new Date();
    const transNo = 'TRX-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + Math.floor(10 + Math.random() * 90);

    const newTrx: FinanceTransaction = {
      id: 'TRX-' + Date.now(),
      transNo,
      date: now.toISOString().split('T')[0] + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Buku Kas & Transaksi Keuangan TEFA
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan arus kas pendaftaran order, operasional, dan pembelian bahan baku.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-base">add_card</span>
          <span>+ Catat Transaksi Baru</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pemasukan</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{formatRupiah(totalIn)}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran</p>
          <p className="text-2xl font-black text-red-600 mt-1">{formatRupiah(totalOut)}</p>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Saldo Bersih Kas TEFA</p>
          <p className="text-2xl font-black mt-1">{formatRupiah(saldoKas)}</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-extrabold text-slate-800 text-sm">
          Riwayat Transaksi Keuangan
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">No. Transaksi & Waktu</th>
                <th className="p-4">Jenis & Kategori</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4">Metode & Operator</th>
                <th className="p-4 text-right">Nominal (Rp)</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <p className="font-black text-slate-900">{trx.transNo}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{trx.date}</p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                        trx.type === 'Pemasukan'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {trx.type}
                    </span>
                    <p className="text-[11px] font-bold text-slate-700 mt-1">{trx.category}</p>
                  </td>
                  <td className="p-4 text-slate-800 font-medium max-w-xs">{trx.description}</td>
                  <td className="p-4 text-slate-600">
                    <p className="font-bold text-slate-800">{trx.paymentMethod}</p>
                    <p className="text-[10px] text-slate-500">{trx.operator}</p>
                  </td>
                  <td className="p-4 text-right">
                    <span
                      className={`font-black text-sm ${
                        trx.type === 'Pemasukan' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {trx.type === 'Pemasukan' ? '+' : '-'}{formatRupiah(trx.amount)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {onArchiveTransaction && (
                      <button
                        onClick={() => onArchiveTransaction(trx)}
                        title="Arsipkan Transaksi"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-800 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">archive</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl text-xs"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">Catat Transaksi Kas Baru</h3>
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
                <label className="block font-bold text-slate-700 mb-1">Tipe Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('Pemasukan')}
                    className={`py-2 font-bold rounded-xl ${
                      type === 'Pemasukan' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    + Pemasukan Kas
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('Pengeluaran')}
                    className={`py-2 font-bold rounded-xl ${
                      type === 'Pengeluaran' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    - Pengeluaran Kas
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Penjualan Cetak">Penjualan Cetak</option>
                  <option value="Jasa Desain">Jasa Desain</option>
                  <option value="Pembelian Bahan">Pembelian Bahan</option>
                  <option value="Perawatan Alat">Perawatan Alat</option>
                  <option value="Operasional & Listrik">Operasional & Listrik</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan Transaksi *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pembelian tinta eco-solvent 2 liter"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Cash">Cash (Tunai)</option>
                  <option value="QRIS">QRIS</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                </select>
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
                Simpan Transaksi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

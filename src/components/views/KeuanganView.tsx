import React, { useState, useMemo, useEffect } from 'react';
import { FinanceTransaction } from '../../types';

interface KeuanganViewProps {
  transactions: FinanceTransaction[];
  onAddTransaction: (trx: FinanceTransaction) => void;
  operatorName: string;
  onDeleteTransaction?: (trx: FinanceTransaction) => void;
  onViewTransaction?: (trx: FinanceTransaction) => void;
}

export const KeuanganView: React.FC<KeuanganViewProps> = ({
  transactions,
  onAddTransaction,
  operatorName,
  onDeleteTransaction,
  onViewTransaction,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [dateFilter, setDateFilter] = useState<'hari_ini' | 'bulan_ini' | 'semua'>('bulan_ini');
  const [selectedTransaction, setSelectedTransaction] = useState<FinanceTransaction | null>(null);

  // Form state
  const [type, setType] = useState<'Pemasukan' | 'Pengeluaran'>('Pengeluaran');
  const [category, setCategory] = useState<string>('Pembelian Bahan');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS' | 'Transfer Bank'>('Cash');

  // System transaction categories - read only
  const SYSTEM_CATEGORIES = ['Penjualan Cetak', 'Jasa Desain'];

  // Check if transaction is system-generated (auto from orders/custom orders)
  const isSystemTransaction = (trx: FinanceTransaction): boolean => {
    return SYSTEM_CATEGORIES.includes(trx.category);
  };

  // Filter transactions by date
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);
    const monthStart = currentMonth + '-01';

    return transactions.filter(t => {
      const transDate = t.date.split(' ')[0];
      const transMonth = transDate.substring(0, 7);

      switch (dateFilter) {
        case 'hari_ini':
          return transDate === today;
        case 'bulan_ini':
          return transMonth === currentMonth;
        default:
          return true;
      }
    });
  }, [transactions, dateFilter]);

  // Calculate totals
  const totalIn = filteredTransactions
    .filter(t => t.type === 'Pemasukan')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalOut = filteredTransactions
    .filter(t => t.type === 'Pengeluaran')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const saldoKas = totalIn - totalOut;
  const transactionCount = filteredTransactions.length;

  // Format currency Indonesia
  const formatRupiah = (val: number): string => {
    const formatted = val.toLocaleString('id-ID');
    return val < 0 ? `-Rp ${formatted.replace('-', '')}` : `Rp ${formatted}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const randomNum = Math.floor(100 + Math.random() * 900);
    const transNo = `TRX-${dateStr.replace(/-/g, '')}-${randomNum}`;

    const newTrx: FinanceTransaction = {
      id: `TRX-${Date.now()}`,
      transNo,
      date: `${dateStr} ${timeStr}`,
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-white text-xl">payments</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Buku Kas Keuangan</h2>
            <p className="text-xs text-slate-500">Pencatatan arus kas TEFA DKV</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Date Filter */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="hari_ini">📅 Hari Ini</option>
              <option value="bulan_ini">📆 Bulan Ini</option>
              <option value="semua">📊 Semua Data</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </span>
          </div>

          {/* Export Button */}
          <button className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-base">file_download</span>
            Export
          </button>

          {/* Add Button */}
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            + Catat Transaksi
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pemasukan */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Total Pemasukan</p>
              <p className="text-2xl font-black mt-1">{formatRupiah(totalIn)}</p>
              <p className="text-[10px] text-emerald-200 mt-1">
                {filteredTransactions.filter(t => t.type === 'Pemasukan').length} transaksi masuk
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-white">trending_up</span>
            </div>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran</p>
              <p className="text-2xl font-black mt-1 text-red-600">{formatRupiah(totalOut)}</p>
              <p className="text-[10px] text-slate-400 mt-1">
                {filteredTransactions.filter(t => t.type === 'Pengeluaran').length} transaksi keluar
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-red-500">trending_down</span>
            </div>
          </div>
        </div>

        {/* Saldo Bersih */}
        <div className={`p-5 rounded-2xl shadow-md ${saldoKas < 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-slate-800 to-slate-900'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${saldoKas < 0 ? 'text-red-200' : 'text-emerald-400'}`}>
                Saldo Bersih Kas
              </p>
              <p className={`text-2xl font-black mt-1 ${saldoKas < 0 ? 'text-white' : 'text-white'}`}>
                {formatRupiah(saldoKas)}
              </p>
              {saldoKas < 0 && (
                <p className="text-[10px] text-red-200 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Saldo minus! Perbaiki kasir
                </p>
              )}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${saldoKas < 0 ? 'bg-white/20' : 'bg-white/10'}`}>
              <span className={`material-symbols-outlined text-2xl ${saldoKas < 0 ? 'text-white' : 'text-white/70'}`}>account_balance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-sm">Riwayat Transaksi</h3>
          <span className="text-[11px] text-slate-500 font-medium">{transactionCount} data</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">No. Transaksi</th>
                <th className="p-4">Waktu</th>
                <th className="p-4">Jenis & Kategori</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4">Metode</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactionCount === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="flex flex-col items-center text-slate-400 py-4">
                      <span className="material-symbols-outlined text-4xl">receipt_long</span>
                      <p className="mt-2 font-medium">Belum ada transaksi</p>
                      <p className="text-[11px]">Catat transaksi manual atau buat pesanan di Kasir</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const isSystem = isSystemTransaction(trx);
                  const dateParts = trx.date.split(' ');

                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <p className="font-mono font-extrabold text-slate-900">{trx.transNo}</p>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <p className="font-medium text-slate-700">{dateParts[0]}</p>
                        <p className="text-[10px] text-slate-400">{dateParts[1] || ''}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                          trx.type === 'Pemasukan'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {trx.type}
                        </span>
                        <p className="text-[11px] font-bold text-slate-600 mt-1">{trx.category}</p>
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="text-slate-700 font-medium truncate">{trx.description}</p>
                        {trx.refOrderNo && (
                          <button
                            onClick={() => setSelectedTransaction(trx)}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline mt-0.5"
                          >
                            Ref: {trx.refOrderNo}
                          </button>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="text-slate-600 font-medium">{trx.paymentMethod}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{trx.operator}</p>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <span className={`font-black text-sm ${
                          trx.type === 'Pemasukan' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {trx.type === 'Pemasukan' ? '+' : '-'}
                          {formatRupiah(trx.amount)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View/Detail Button - ALL transactions */}
                          <button
                            onClick={() => setSelectedTransaction(trx)}
                            title="Lihat Detail"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">visibility</span>
                          </button>

                          {/* Delete Button - ONLY for manual transactions */}
                          {onDeleteTransaction && !isSystem && (
                            <button
                              onClick={() => onDeleteTransaction(trx)}
                              title="Hapus Transaksi"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 transition-colors"
                            >
                              <span className="material-symbols-outlined text-base">delete_forever</span>
                            </button>
                          )}

                          {/* Lock icon for system transactions */}
                          {isSystem && (
                            <span className="text-[10px] text-slate-400" title="Transaksi sistem otomatis">
                              <span className="material-symbols-outlined text-sm">lock</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900">Catat Transaksi Baru</h3>
                <p className="text-[11px] text-slate-500">Input manual ke buku kas</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>

            <div className="space-y-4 pt-4">
              {/* Type Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('Pemasukan')}
                  className={`py-3 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all ${
                    type === 'Pemasukan'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  + Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setType('Pengeluaran')}
                  className={`py-3 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all ${
                    type === 'Pengeluaran'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">remove_circle</span>
                  - Pengeluaran
                </button>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {type === 'Pemasukan' ? (
                    <>
                      <option value="Penjualan Cetak">Penjualan Cetak</option>
                      <option value="Jasa Desain">Jasa Desain</option>
                      <option value="Lainnya">Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="Pembelian Bahan">Pembelian Bahan</option>
                      <option value="Perawatan Alat">Perawatan Alat</option>
                      <option value="Operasional & Listrik">Operasional & Listrik</option>
                      <option value="Lainnya">Lainnya</option>
                    </>
                  )}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Keterangan *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pembelian tinta eco-solvent 2 liter"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Nominal (Rp) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="0"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Cash">💵 Cash (Tunai)</option>
                  <option value="QRIS">📱 QRIS</option>
                  <option value="Transfer Bank">🏦 Transfer Bank</option>
                </select>
              </div>

              {/* Preview */}
              <div className={`p-4 rounded-xl ${
                type === 'Pemasukan' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    type === 'Pemasukan' ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {type === 'Pemasukan' ? 'Pemasukan Baru:' : 'Pengeluaran Baru:'}
                  </span>
                  <span className={`text-sm font-black ${
                    type === 'Pemasukan' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {type === 'Pemasukan' ? '+' : '-'}Rp {amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className={`flex-1 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-colors ${
                  type === 'Pemasukan' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Simpan Transaksi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-indigo-600">{selectedTransaction.transNo}</span>
                <h3 className="font-black text-slate-900 mt-1">Detail Transaksi</h3>
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>

            <div className="space-y-4 pt-4">
              {/* Amount Display */}
              <div className={`p-4 rounded-xl text-center ${
                selectedTransaction.type === 'Pemasukan' ? 'bg-emerald-50' : 'bg-red-50'
              }`}>
                <p className={`text-[10px] font-bold uppercase ${
                  selectedTransaction.type === 'Pemasukan' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {selectedTransaction.type}
                </p>
                <p className={`text-2xl font-black mt-1 ${
                  selectedTransaction.type === 'Pemasukan' ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {selectedTransaction.type === 'Pemasukan' ? '+' : '-'}Rp {selectedTransaction.amount.toLocaleString('id-ID')}
                </p>
              </div>

              {/* Details */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kategori:</span>
                  <span className="font-bold text-slate-800">{selectedTransaction.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal:</span>
                  <span className="font-bold text-slate-800">{selectedTransaction.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode:</span>
                  <span className="font-bold text-slate-800">{selectedTransaction.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Operator:</span>
                  <span className="font-bold text-slate-800">{selectedTransaction.operator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-600">{selectedTransaction.status}</span>
                </div>
                {selectedTransaction.refOrderNo && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ref Order:</span>
                    <span className="font-bold text-indigo-600">{selectedTransaction.refOrderNo}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedTransaction.description && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">Keterangan</p>
                  <p className="text-sm text-slate-800 font-medium">{selectedTransaction.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Tutup
                </button>
                {onDeleteTransaction && !isSystemTransaction(selectedTransaction) && (
                  <button
                    onClick={() => {
                      onDeleteTransaction(selectedTransaction);
                      setSelectedTransaction(null);
                    }}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete_forever</span>
                    Hapus
                  </button>
                )}
                {isSystemTransaction(selectedTransaction) && (
                  <span className="flex-1 py-2.5 text-center text-slate-400 text-xs font-bold">
                    <span className="material-symbols-outlined text-sm align-text-bottom">lock</span>
                    Transaksi sistem
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeuanganView;

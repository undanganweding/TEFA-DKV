import React, { useState } from 'react';
import {
  FinanceTransaction,
  InboxFile,
  CustomerFile,
  ProductionOrder,
  Product,
  ToolInventory,
  MaterialStock,
} from '../types';

interface RecycleBinTabProps {
  currentUserRole?: string;
  transactions: FinanceTransaction[];
  inboxFiles: InboxFile[];
  customerFiles: CustomerFile[];
  orders: ProductionOrder[];
  products: Product[];
  tools: ToolInventory[];
  materials: MaterialStock[];
  onRestoreItem: (category: string, id: string) => void;
  onPermanentDeleteItem: (category: string, id: string) => void;
}

export const RecycleBinTab: React.FC<RecycleBinTabProps> = ({
  currentUserRole = 'Admin Utama / Kepala TEFA',
  transactions,
  inboxFiles,
  customerFiles,
  orders,
  products,
  tools,
  materials,
  onRestoreItem,
  onPermanentDeleteItem,
}) => {
  const [activeCategory, setActiveCategory] = useState<
    'transaksi' | 'file' | 'order' | 'produk' | 'inventaris' | 'stok' | 'keuangan'
  >('transaksi');

  // Filter archived items
  const archivedTransactions = transactions.filter((t) => t.isArchived);
  const archivedInboxFiles = inboxFiles.filter((f) => f.isArchived);
  const archivedCustomerFiles = customerFiles.filter((c) => c.isArchived);
  const archivedOrders = orders.filter((o) => o.isArchived);
  const archivedProducts = products.filter((p) => p.isArchived || p.status === 'Nonaktif');
  const archivedTools = tools.filter((t) => t.isArchived);
  const archivedMaterials = materials.filter((m) => m.isArchived);

  const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  const categories = [
    { id: 'transaksi', label: 'Transaksi Kasir', count: archivedTransactions.length, icon: 'receipt_long' },
    { id: 'file', label: 'File Customer & Inbox', count: archivedInboxFiles.length + archivedCustomerFiles.length, icon: 'folder_delete' },
    { id: 'order', label: 'Order Produksi', count: archivedOrders.length, icon: 'inventory' },
    { id: 'produk', label: 'Produk & Jasa', count: archivedProducts.length, icon: 'sell' },
    { id: 'inventaris', label: 'Inventaris Alat', count: archivedTools.length, icon: 'build' },
    { id: 'stok', label: 'Stok Bahan', count: archivedMaterials.length, icon: 'inventory_2' },
  ];

  return (
    <div className="space-y-6">
      {/* Category Tabs Header */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-base">{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeCategory === cat.id ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Item List Body */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        {/* TRANSAKSI TAB */}
        {activeCategory === 'transaksi' && (
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Arsip Transaksi Penjualan / Kasir ({archivedTransactions.length})
            </h3>
            {archivedTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Tidak ada data transaksi yang diarsipkan.
              </div>
            ) : (
              <div className="space-y-2">
                {archivedTransactions.map((trx) => (
                  <div
                    key={trx.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-indigo-600 text-xs">
                          {trx.transNo}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Diarsipkan
                        </span>
                      </div>
                      <p className="font-black text-slate-900 text-sm mt-0.5">{trx.description}</p>
                      <p className="text-[11px] text-slate-500">
                        {trx.date} • Operator: {trx.operator} • Method: {trx.paymentMethod}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end border-t sm:border-0 pt-2 sm:pt-0">
                      <span className="font-black text-slate-900 text-sm">
                        {formatRupiah(trx.amount)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onRestoreItem('transaksi', trx.id)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">restore</span>
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => onPermanentDeleteItem('transaksi', trx.id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">delete_forever</span>
                          <span>Hapus Permanen</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FILE TAB */}
        {activeCategory === 'file' && (
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Trash & Arsip File Customer / Inbox ({archivedInboxFiles.length + archivedCustomerFiles.length})
            </h3>
            {archivedInboxFiles.length === 0 && archivedCustomerFiles.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Tidak ada file di dalam trash/arsip.
              </div>
            ) : (
              <div className="space-y-2">
                {archivedInboxFiles.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center shrink-0">
                        {f.fileType}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-xs truncate">{f.fileName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Customer: {f.customerName} ({f.classGrade}) • Size: {f.fileSize}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 justify-end">
                      <button
                        onClick={() => onRestoreItem('inboxFile', f.id)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">restore</span>
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => onPermanentDeleteItem('inboxFile', f.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete_forever</span>
                        <span>Hapus Permanen</span>
                      </button>
                    </div>
                  </div>
                ))}

                {archivedCustomerFiles.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-black text-slate-900 text-xs">{c.customerName}</p>
                      <p className="text-[11px] text-slate-500">
                        Category: {c.category} • Folder: {c.folderPath}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 justify-end">
                      <button
                        onClick={() => onRestoreItem('customerFile', c.id)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">restore</span>
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => onPermanentDeleteItem('customerFile', c.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete_forever</span>
                        <span>Hapus Permanen</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDER TAB */}
        {activeCategory === 'order' && (
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Arsip Order Produksi ({archivedOrders.length})
            </h3>
            {archivedOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Tidak ada order produksi yang diarsipkan.
              </div>
            ) : (
              <div className="space-y-2">
                {archivedOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-indigo-600 text-xs">
                          {ord.orderNo}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                          {ord.status}
                        </span>
                      </div>
                      <p className="font-black text-slate-900 text-sm mt-0.5">
                        {ord.customerName} ({ord.institution || 'DKV'})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Total: {formatRupiah(ord.totalAmount)} • Operator: {ord.operatorName}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 justify-end">
                      <button
                        onClick={() => onRestoreItem('order', ord.id)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">restore</span>
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => onPermanentDeleteItem('order', ord.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete_forever</span>
                        <span>Hapus Permanen</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRODUK TAB */}
        {activeCategory === 'produk' && (
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Produk Tidak Aktif & Arsip ({archivedProducts.length})
            </h3>
            {archivedProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Semua produk aktif. Tidak ada produk diarsip/nonaktif.
              </div>
            ) : (
              <div className="space-y-2">
                {archivedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-500 text-xs">{p.code}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {p.status}
                        </span>
                      </div>
                      <p className="font-black text-slate-900 text-sm">{p.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Kategori: {p.category} • Harga: {formatRupiah(p.basePrice)} / {p.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 justify-end">
                      <button
                        onClick={() => onRestoreItem('product', p.id)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">toggle_on</span>
                        <span>Aktifkan Kembali</span>
                      </button>
                      <button
                        onClick={() => onPermanentDeleteItem('product', p.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete_forever</span>
                        <span>Hapus Permanen</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INVENTARIS TAB */}
        {activeCategory === 'inventaris' && (
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Arsip Inventaris Alat ({archivedTools.length})
            </h3>
            {archivedTools.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Tidak ada aset inventaris yang diarsipkan.
              </div>
            ) : (
              <div className="space-y-2">
                {archivedTools.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-mono font-bold text-slate-500 text-xs">{t.code}</p>
                      <p className="font-black text-slate-900 text-sm">{t.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Lokasi: {t.location} • PIC: {t.picName}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 justify-end">
                      <button
                        onClick={() => onRestoreItem('tool', t.id)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">restore</span>
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => onPermanentDeleteItem('tool', t.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete_forever</span>
                        <span>Hapus Permanen</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STOK TAB */}
        {activeCategory === 'stok' && (
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Arsip Stok Bahan ({archivedMaterials.length})
            </h3>
            {archivedMaterials.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Tidak ada bahan baku yang diarsipkan.
              </div>
            ) : (
              <div className="space-y-2">
                {archivedMaterials.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-mono font-bold text-slate-500 text-xs">{m.code}</p>
                      <p className="font-black text-slate-900 text-sm">{m.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Stok Terakhir: {m.currentStock} {m.unit} • Supplier: {m.supplier}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 justify-end">
                      <button
                        onClick={() => onRestoreItem('material', m.id)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">restore</span>
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => onPermanentDeleteItem('material', m.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete_forever</span>
                        <span>Hapus Permanen</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  SystemSettings,
  FinanceTransaction,
  InboxFile,
  CustomerFile,
  ProductionOrder,
  Product,
  ToolInventory,
  MaterialStock,
} from '../../types';
import { RecycleBinTab } from '../RecycleBinTab';

interface PengaturanViewProps {
  settings: SystemSettings;
  onSaveSettings: (newSettings: SystemSettings) => void;
  transactions?: FinanceTransaction[];
  inboxFiles?: InboxFile[];
  customerFiles?: CustomerFile[];
  orders?: ProductionOrder[];
  products?: Product[];
  tools?: ToolInventory[];
  materials?: MaterialStock[];
  onRestoreItem?: (category: string, id: string) => void;
  onPermanentDeleteItem?: (category: string, id: string) => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  settings,
  onSaveSettings,
  transactions = [],
  inboxFiles = [],
  customerFiles = [],
  orders = [],
  products = [],
  tools = [],
  materials = [],
  onRestoreItem = () => {},
  onPermanentDeleteItem = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'recycle_bin'>('settings');
  const [form, setForm] = useState<SystemSettings>({
    ...settings,
    currentUserRole: settings.currentUserRole || 'Admin Utama / Kepala TEFA',
  });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header & Main Tabs */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Pengaturan & Pengelolaan Data TEFA DKV
          </h2>
          <p className="text-xs text-slate-500">
            Atur identitas unit produksi, role hak akses, serta pulihkan data dari Recycle Bin.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'settings'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">tune</span>
            <span>Konfigurasi Sistem</span>
          </button>
          <button
            onClick={() => setActiveTab('recycle_bin')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'recycle_bin'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base text-amber-400">delete_sweep</span>
            <span>Recycle Bin / Arsip Data</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-2xl text-xs font-bold animate-in fade-in flex items-center gap-2">
          <span className="material-symbols-outlined">check_circle</span>
          <span>Pengaturan sistem & role akses berhasil diperbarui!</span>
        </div>
      )}

      {activeTab === 'settings' ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6 text-xs">
          {/* Hak Akses / Role Section */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Role & Hak Akses Pengguna Saat Ini</span>
              <span className="text-indigo-600 font-mono text-xs capitalize">
                {form.currentUserRole}
              </span>
            </h3>
            <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-slate-900 text-xs">Akses Hapus / Restore & Pengelolaan Data</p>
                <p className="text-[11px] text-slate-600">
                  Hanya <strong>Admin Utama / Kepala TEFA</strong> yang memiliki otoritas untuk menghapus, mengarsipkan, dan memulihkan data seluruh sistem.
                </p>
              </div>
              <select
                value={form.currentUserRole}
                onChange={(e) =>
                  setForm({
                    ...form,
                    currentUserRole: e.target.value as 'Admin Utama / Kepala TEFA' | 'Operator / Staff',
                  })
                }
                className="p-2.5 bg-white border border-indigo-200 rounded-xl font-bold text-xs text-slate-900 focus:outline-hidden shrink-0 shadow-2xs"
              >
                <option value="Admin Utama / Kepala TEFA">👑 Admin Utama / Kepala TEFA</option>
                <option value="Operator / Staff">👤 Operator / Staff (View Only)</option>
              </select>
            </div>
          </div>

          {/* Identity Section */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
              Identitas Unit Produksi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Unit TEFA *</label>
                <input
                  type="text"
                  required
                  value={form.tefaName}
                  onChange={(e) => setForm({ ...form, tefaName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Induk Sekolah *</label>
                <input
                  type="text"
                  required
                  value={form.schoolName}
                  onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Telepon / WhatsApp Kasir</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Resmi Unit Produksi</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap TEFA</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>
          </div>

          {/* Thermal Receipt Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
              Konfigurasi Cetak Nota Thermal 80mm
            </h3>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Teks Catatan Footer Nota</label>
              <textarea
                rows={2}
                value={form.receiptFooterText}
                onChange={(e) => setForm({ ...form, receiptFooterText: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Operator Shift Aktif</label>
                <input
                  type="text"
                  value={form.activeShiftOperator}
                  onChange={(e) => setForm({ ...form, activeShiftOperator: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran Aktif</label>
                <input
                  type="text"
                  value={form.activeAcademicYear}
                  onChange={(e) => setForm({ ...form, activeAcademicYear: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md"
            >
              Simpan Perubahan Pengaturan
            </button>
          </div>
        </form>
      ) : (
        <RecycleBinTab
          currentUserRole={settings.currentUserRole}
          transactions={transactions}
          inboxFiles={inboxFiles}
          customerFiles={customerFiles}
          orders={orders}
          products={products}
          tools={tools}
          materials={materials}
          onRestoreItem={onRestoreItem}
          onPermanentDeleteItem={onPermanentDeleteItem}
        />
      )}
    </div>
  );
};


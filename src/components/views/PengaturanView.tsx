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
  UserProfile,
} from '../../types';
import { RecycleBinTab } from '../RecycleBinTab';
import { getStoredUsers, updateUserStatus } from '../../utils/authStore';

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
  const [activeTab, setActiveTab] = useState<'settings' | 'users' | 'recycle_bin'>('settings');
  const [form, setForm] = useState<SystemSettings>({
    ...settings,
    currentUserRole: settings.currentUserRole || 'Admin Utama / Kepala TEFA',
  });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // User Management State
  const [userList, setUserList] = useState<UserProfile[]>(() => getStoredUsers());
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('Semua');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleStatusChange = (userId: string, newStatus: 'Aktif' | 'Menunggu Verifikasi' | 'Nonaktif') => {
    const updated = updateUserStatus(userId, newStatus);
    setUserList(updated);
    setStatusNotice(`Status pengguna berhasil diperbarui menjadi "${newStatus}"`);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const filteredUsers = userList.filter((u) => {
    const matchQuery =
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.nis && u.nis.includes(userSearchQuery));
    const matchRole = selectedRoleFilter === 'Semua' || u.role === selectedRoleFilter;
    return matchQuery && matchRole;
  });

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      {/* Header & Main Tabs */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Pengaturan & User Management TEFA DKV
          </h2>
          <p className="text-xs text-slate-500">
            Kelola identitas unit produksi, pengguna & verifikasi siswa, serta Recycle Bin.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl shrink-0 flex-wrap">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">tune</span>
            <span>Konfigurasi</span>
          </button>

          <button
            onClick={() => {
              setUserList(getStoredUsers());
              setActiveTab('users');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#5B4BFF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">group</span>
            <span>Manajemen User ({userList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('recycle_bin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'recycle_bin'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base text-amber-400">delete_sweep</span>
            <span>Recycle Bin</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-2xl text-xs font-bold animate-in fade-in flex items-center gap-2">
          <span className="material-symbols-outlined">check_circle</span>
          <span>Pengaturan sistem & role akses berhasil diperbarui!</span>
        </div>
      )}

      {statusNotice && (
        <div className="p-4 bg-blue-100 text-blue-900 border border-blue-300 rounded-2xl text-xs font-bold animate-in fade-in flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          <span>{statusNotice}</span>
        </div>
      )}

      {activeTab === 'settings' && (
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
      )}

      {/* USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Daftar Pengguna Platform ({filteredUsers.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Manajemen akun Kepala TEFA, Admin TEFA, dan Verifikasi Siswa Terdaftar
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  search
                </span>
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Cari nama, email, atau NIS..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#5B4BFF]"
                />
              </div>

              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
              >
                <option value="Semua">Semua Role</option>
                <option value="Kepala TEFA">Kepala TEFA</option>
                <option value="Admin TEFA">Admin TEFA</option>
                <option value="Siswa">Siswa</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 text-slate-600 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Pengguna</th>
                  <th className="p-3.5">Role Platform</th>
                  <th className="p-3.5">Identitas / Kelas</th>
                  <th className="p-3.5">Status Akun</th>
                  <th className="p-3.5 text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                      Tidak ada pengguna yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={usr.avatar}
                            alt={usr.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs">{usr.name}</p>
                            <p className="text-[10px] font-mono text-slate-500">{usr.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            usr.role === 'Kepala TEFA'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : usr.role === 'Admin TEFA'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {usr.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {usr.role === 'Siswa' ? (
                          <div>
                            <p className="font-bold text-slate-800 text-[11px]">{usr.studentClass || 'Siswa DKV'}</p>
                            <p className="text-[10px] text-slate-500">NIS: {usr.nis || '-'}</p>
                          </div>
                        ) : (
                          <p className="text-[11px] font-bold text-slate-600">{usr.position || 'Pengelola TEFA'}</p>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            usr.statusAkun === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : usr.statusAkun === 'Menunggu Verifikasi'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {usr.statusAkun}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {usr.statusAkun === 'Menunggu Verifikasi' && (
                            <button
                              onClick={() => handleStatusChange(usr.id, 'Aktif')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                            >
                              <span className="material-symbols-outlined text-sm">check</span>
                              <span>Approve</span>
                            </button>
                          )}

                          {usr.statusAkun === 'Aktif' && usr.role !== 'Kepala TEFA' && (
                            <button
                              onClick={() => handleStatusChange(usr.id, 'Nonaktif')}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 text-[11px] font-bold"
                            >
                              Nonaktifkan
                            </button>
                          )}

                          {usr.statusAkun === 'Nonaktif' && (
                            <button
                              onClick={() => handleStatusChange(usr.id, 'Aktif')}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold"
                            >
                              Aktifkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'recycle_bin' && (
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


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { AvatarCropModal } from '../AvatarCropModal';
import {
  getStoredUsers,
  getFilteredUsers,
  approveStudent,
  rejectStudent,
  updateUserProfile,
  resetUserPasswordAdmin,
  deleteUser,
  getPendingCount,
  UpdateUserInput,
  UserFilter,
} from '../../utils/authStore';

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

// Status config for SaaS look
const getStatusConfig = (status: string) => {
  const configs: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    Pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    Approved: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    Active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    Rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    Inactive: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  };
  return configs[status] || configs.Inactive;
};

const getRoleConfig = (role: string) => {
  const configs: Record<string, { bg: string; text: string }> = {
    'Kepala TEFA': { bg: 'bg-purple-50', text: 'text-purple-700' },
    'Admin TEFA': { bg: 'bg-blue-50', text: 'text-blue-700' },
    'Siswa': { bg: 'bg-amber-50', text: 'text-amber-700' },
    'Guest': { bg: 'bg-slate-50', text: 'text-slate-600' },
  };
  return configs[role] || configs['Guest'];
};

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
  const [activeTab, setActiveTab] = useState<'settings' | 'users' | 'recycle_bin'>('users');
  const [form, setForm] = useState<SystemSettings>({
    ...settings,
    currentUserRole: settings.currentUserRole || 'Admin Utama / Kepala TEFA',
  });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // User Management State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentFilter, setCurrentFilter] = useState<UserFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAvatarCrop, setShowAvatarCrop] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState<UpdateUserInput>({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [tempAvatar, setTempAvatar] = useState<string>('');

  // Toast notification
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'success',
  });

  // Load users
  const loadUsers = () => {
    const allUsers = getStoredUsers();
    setUsers(allUsers);
    setPendingCount(getPendingCount());
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  // Show toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  // Filter users
  const filteredUsers = getFilteredUsers(currentFilter).filter((u) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.nis && u.nis.toLowerCase().includes(query)) ||
      (u.studentClass && u.studentClass.toLowerCase().includes(query))
    );
  });

  // Handlers
  const handleApprove = (userId: string) => {
    const updated = approveStudent(userId);
    setUsers(updated);
    setPendingCount(getPendingCount());
    setShowDetailModal(false);
    setSelectedUser(null);
    showToast('Akun berhasil diaktifkan!', 'success');
  };

  const handleReject = () => {
    if (!selectedUser || !rejectReason.trim()) {
      showToast('Alasan penolakan harus diisi!', 'error');
      return;
    }
    const updated = rejectStudent(selectedUser.id, rejectReason);
    setUsers(updated);
    setPendingCount(getPendingCount());
    setShowRejectModal(false);
    setShowDetailModal(false);
    setSelectedUser(null);
    setRejectReason('');
    showToast('Pendaftaran ditolak', 'info');
  };

  const handleSaveEdit = () => {
    if (!selectedUser) return;
    updateUserProfile(selectedUser.id, editForm);
    setUsers(getStoredUsers());
    setShowEditModal(false);
    setShowDetailModal(false);
    setSelectedUser(null);
    showToast('Data user berhasil diperbarui!', 'success');
  };

  const handleResetPassword = () => {
    if (!selectedUser) return;
    if (newPassword.length < 8) {
      showToast('Password minimal 8 karakter!', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi password tidak cocok!', 'error');
      return;
    }
    const result = resetUserPasswordAdmin(selectedUser.id, newPassword);
    if (result.success) {
      showToast(result.message, 'success');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    const result = deleteUser(selectedUser.id);
    if (result.success) {
      setUsers(getStoredUsers());
      setShowDeleteModal(false);
      setShowDetailModal(false);
      setSelectedUser(null);
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleAvatarSave = (avatarUrl: string) => {
    setTempAvatar(avatarUrl);
    setEditForm((prev) => ({ ...prev, avatar: avatarUrl }));
    setShowAvatarCrop(false);
  };

  const openDetail = (user: UserProfile) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const openEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      nis: user.nis,
      studentClass: user.studentClass,
      major: user.major,
      whatsapp: user.whatsapp,
      phone: user.phone,
      avatar: user.avatar,
    });
    setTempAvatar(user.avatar);
    setShowEditModal(true);
    setShowDetailModal(false);
  };

  const filterTabs = [
    { key: 'all' as UserFilter, label: 'Semua', icon: 'group' },
    { key: 'pending' as UserFilter, label: 'Pending', icon: 'pending', highlight: true },
    { key: 'active' as UserFilter, label: 'Aktif', icon: 'check_circle' },
    { key: 'admin' as UserFilter, label: 'Admin', icon: 'admin_panel_settings' },
    { key: 'inactive' as UserFilter, label: 'Nonaktif', icon: 'block' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-emerald-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <span className="material-symbols-outlined">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
            </span>
            <span className="font-bold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl border border-slate-700/50 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Manajemen TEFA DKV</h1>
            <p className="text-sm text-slate-400 mt-1">Pengaturan sistem, manajemen akun & data management</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'users'
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-base">manage_accounts</span>
              Manajemen Akun
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-base">settings</span>
              Konfigurasi
            </button>

            <button
              onClick={() => setActiveTab('recycle_bin')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'recycle_bin'
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-base">delete_sweep</span>
              Recycle Bin
            </button>
          </div>
        </div>
      </div>

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
        <div className="space-y-5">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {filterTabs.map((tab) => {
              const count = tab.key === 'all' ? users.length :
                tab.key === 'pending' ? users.filter(u => u.statusAkun === 'Pending').length :
                tab.key === 'active' ? users.filter(u => u.statusAkun === 'Active').length :
                tab.key === 'admin' ? users.filter(u => u.role === 'Admin TEFA' || u.role === 'Kepala TEFA').length :
                users.filter(u => u.statusAkun === 'Inactive' || u.statusAkun === 'Rejected').length;

              return (
                <motion.button
                  key={tab.key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentFilter(tab.key)}
                  className={`p-4 rounded-2xl border transition-all text-left ${
                    currentFilter === tab.key
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent shadow-xl shadow-indigo-500/30'
                      : tab.highlight && count > 0
                      ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`material-symbols-outlined text-xl ${
                      currentFilter === tab.key ? 'text-white/80' : tab.highlight && count > 0 ? 'text-amber-500' : 'text-slate-400'
                    }`}>{tab.icon}</span>
                    {count > 0 && (
                      <span className={`text-2xl font-black ${
                        currentFilter === tab.key ? 'text-white' : tab.highlight && count > 0 ? 'text-amber-600' : 'text-slate-700'
                      }`}>{count}</span>
                    )}
                  </div>
                  <p className={`text-xs font-bold ${
                    currentFilter === tab.key ? 'text-white/90' : 'text-slate-600'
                  }`}>{tab.label}</p>
                </motion.button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, email, NIS, atau kelas..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="material-symbols-outlined text-base">group</span>
                <span className="font-semibold">{filteredUsers.length} user</span>
              </div>
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredUsers.map((user, idx) => {
                const statusConf = getStatusConfig(user.statusAkun);
                const roleConf = getRoleConfig(user.role);
                return (
                  <motion.div
                    key={user.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => openDetail(user)}
                    className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 group-hover:border-indigo-300 transition-all"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusConf.dot}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 truncate">{user.name}</h3>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${roleConf.bg} ${roleConf.text}`}>
                            {user.role}
                          </span>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                            {user.statusAkun}
                          </span>
                        </div>
                      </div>
                    </div>

                    {user.role === 'Siswa' && (
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400">NIS</span>
                          <p className="font-bold text-slate-700">{user.nis || '-'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Kelas</span>
                          <p className="font-bold text-slate-700">{user.studentClass || '-'}</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{user.createdAt}</span>
                      {user.statusAkun === 'Pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleApprove(user.id); }}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setShowRejectModal(true); }}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-all"
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredUsers.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-200">search_off</span>
              <p className="text-slate-500 mt-4 font-bold">Tidak ada user ditemukan</p>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
              <div className="flex items-center gap-4">
                <img src={selectedUser.avatar} alt={selectedUser.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30" />
                <div>
                  <h2 className="text-xl font-black">{selectedUser.name}</h2>
                  <p className="text-white/80 text-sm">{selectedUser.email}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 text-xs">Role</span>
                  <p className="font-bold text-slate-800">{selectedUser.role}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 text-xs">Status</span>
                  <p className="font-bold text-slate-800">{selectedUser.statusAkun}</p>
                </div>
                {selectedUser.role === 'Siswa' && (
                  <>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-slate-400 text-xs">NIS</span>
                      <p className="font-bold text-slate-800">{selectedUser.nis || '-'}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-slate-400 text-xs">Kelas</span>
                      <p className="font-bold text-slate-800">{selectedUser.studentClass || '-'}</p>
                    </div>
                  </>
                )}
              </div>
              {selectedUser.rejectReason && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                  <span className="text-red-600 text-xs font-bold">Alasan Penolakan:</span>
                  <p className="text-red-700 text-sm mt-1">{selectedUser.rejectReason}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={() => openEdit(selectedUser)} className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-base">edit</span> Edit
                </button>
                <button onClick={() => { setShowDetailModal(false); setShowPasswordModal(true); }} className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-base">key</span> Reset Password
                </button>
                <button onClick={() => { setShowDetailModal(false); setShowDeleteModal(true); }} className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition-all">
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
              <div className="flex gap-2">
                {selectedUser.statusAkun === 'Pending' && (
                  <>
                    <button onClick={() => handleApprove(selectedUser.id)} className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-all">
                      Approve
                    </button>
                    <button onClick={() => { setShowRejectModal(true); }} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition-all">
                      Tolak
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => setShowDetailModal(false)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all">
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-800">Edit User</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <img src={tempAvatar || selectedUser.avatar} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200" />
                <button onClick={() => setShowAvatarCrop(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all">
                  Ganti Foto
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Lengkap</label>
                <input type="text" value={editForm.name || ''} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
              </div>
              {selectedUser.role === 'Siswa' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">NIS</label>
                      <input type="text" value={editForm.nis || ''} onChange={(e) => setEditForm((p) => ({ ...p, nis: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Kelas</label>
                      <input type="text" value={editForm.studentClass || ''} onChange={(e) => setEditForm((p) => ({ ...p, studentClass: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Jurusan</label>
                    <input type="text" value={editForm.major || ''} onChange={(e) => setEditForm((p) => ({ ...p, major: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">WhatsApp</label>
                    <input type="text" value={editForm.whatsapp || ''} onChange={(e) => setEditForm((p) => ({ ...p, whatsapp: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                  </div>
                </>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all">
                Batal
              </button>
              <button onClick={handleSaveEdit} className="flex-1 py-3 bg-indigo-500 text-white font-bold text-sm rounded-xl hover:bg-indigo-600 transition-all">
                Simpan
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6">
            <h2 className="text-xl font-black text-slate-800 mb-2">Reset Password</h2>
            <p className="text-sm text-slate-500 mb-6">Reset password untuk: <strong>{selectedUser.name}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Password Baru</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 8 karakter" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Konfirmasi Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password baru" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowPasswordModal(false); setNewPassword(''); setConfirmPassword(''); }} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all">Batal</button>
              <button onClick={handleResetPassword} className="flex-1 py-3 bg-amber-500 text-white font-bold text-sm rounded-xl hover:bg-amber-600 transition-all">Reset Password</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6">
            <h2 className="text-xl font-black text-red-600 mb-2">Tolak Pendaftaran</h2>
            <p className="text-sm text-slate-500 mb-4">Tolak pendaftaran: <strong>{selectedUser.name}</strong></p>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Alasan Penolakan *</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Jelaskan alasan penolakan..." rows={4} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowRejectModal(false); setRejectReason(''); }} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all">Batal</button>
              <button onClick={handleReject} className="flex-1 py-3 bg-red-500 text-white font-bold text-sm rounded-xl hover:bg-red-600 transition-all">Tolak Pendaftaran</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-red-500">warning</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Hapus Akun?</h2>
            <p className="text-sm text-slate-500">Apakah Anda yakin ingin menghapus akun <strong>{selectedUser.name}</strong>?</p>
            <p className="text-xs text-slate-400 mt-2">Histori order dan transaksi akan tetap tersimpan untuk laporan.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all">Batal</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white font-bold text-sm rounded-xl hover:bg-red-600 transition-all">Hapus</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Avatar Crop Modal */}
      {showAvatarCrop && (
        <AvatarCropModal
          isOpen={showAvatarCrop}
          initialImageSrc={tempAvatar || selectedUser?.avatar || ''}
          onClose={() => setShowAvatarCrop(false)}
          onCropSave={handleAvatarSave}
        />
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


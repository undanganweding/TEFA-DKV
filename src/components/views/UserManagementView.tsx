import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../types';
import * as profileService from '../../services/profileService';

type UserFilter = 'all' | 'siswa' | 'admin' | 'staff' | 'active' | 'inactive';

interface UpdateUserInput {
  name?: string;
  email?: string;
  nis?: string;
  studentClass?: string;
  major?: string;
  whatsapp?: string;
  phone?: string;
  avatar?: string;
  role?: string;
  status?: string;
}
import { AvatarCropModal } from '../AvatarCropModal';
import { Pagination } from '../Pagination';

interface UserManagementViewProps {
  currentUser?: UserProfile | null;
}

const ITEMS_PER_PAGE = 10;

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [currentFilter, setCurrentFilter] = useState<UserFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showAvatarCrop, setShowAvatarCrop] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState<UpdateUserInput>({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [tempAvatar, setTempAvatar] = useState<string>('');

  // Load users
  const loadUsers = () => {
    profileService.getAllUsers().then((allUsers) => {
      setUsers(allUsers);
    });
    profileService.getPendingCount().then((count) => {
      setPendingCount(count);
    });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users when filter or search changes
  useEffect(() => {
    let result = [...users];

    switch (currentFilter) {
      case 'siswa':
        result = result.filter((u) => u.role === 'Siswa');
        break;
      case 'active':
        result = result.filter((u) => u.statusAkun === 'Active');
        break;
      case 'admin':
        result = result.filter((u) => u.role === 'Admin TEFA' || u.role === 'Kepala TEFA' || u.role === 'Admin');
        break;
      case 'staff':
        result = result.filter((u) => u.role === 'Guru / Operator');
        break;
      case 'inactive':
        result = result.filter((u) => u.statusAkun === 'Inactive' || u.statusAkun === 'Rejected' || u.statusAkun === 'Suspended');
        break;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.nis?.toLowerCase().includes(query) ||
          u.studentClass?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(result);
    setCurrentPage(1);
  }, [currentFilter, searchQuery, users]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Handlers
  const handleActivate = async (userId: string) => {
    const success = await profileService.activateUser(userId);
    if (success) {
      loadUsers();
      setShowDetailModal(false);
      setSelectedUser(null);
    } else {
      alert('Gagal mengaktifkan user.');
    }
  };

  const handleSuspend = async () => {
    if (!selectedUser) return;
    const success = await profileService.suspendUser(selectedUser.id, suspendReason);
    if (success) {
      loadUsers();
      setShowSuspendModal(false);
      setShowDetailModal(false);
      setSelectedUser(null);
      setSuspendReason('');
    } else {
      alert('Gagal me-nonaktifkan user.');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    const success = await profileService.updateProfile(selectedUser.id, {
      full_name: editForm.name,
      phone: editForm.phone,
      nis: editForm.nis,
      school_class: editForm.studentClass,
      major: editForm.major,
      whatsapp: editForm.whatsapp,
      avatar_path: editForm.avatar,
      role: editForm.role,
      status: editForm.status,
    });
    if (success) {
      setShowEditModal(false);
      loadUsers();
    } else {
      alert('Gagal menyimpan perubahan.');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (newPassword.length < 8) {
      alert('Password minimal 8 karakter!');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Konfirmasi password tidak cocok!');
      return;
    }
    
    if (!confirm('Anda akan mengubah password akun ' + selectedUser.name + '. Lanjutkan?')) {
      return;
    }

    const { success, message } = await profileService.adminSetPassword(selectedUser.id, newPassword);
    if (success) {
      alert('Password berhasil diperbarui.');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } else {
      alert(message);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    const result = await profileService.deleteUser(selectedUser.id);
    if (result.success) {
      loadUsers();
      setShowDeleteModal(false);
      setShowDetailModal(false);
      setSelectedUser(null);
    } else {
      alert(result.message);
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
      role: user.role,
      status: user.statusAkun,
    });
    setTempAvatar(user.avatar);
    setShowEditModal(true);
    setShowDetailModal(false);
  };

  const filterTabs = [
    { key: 'all' as UserFilter, label: 'Semua User', count: users.length },
    { key: 'siswa' as UserFilter, label: 'Total Siswa', count: users.filter((u) => u.role === 'Siswa').length },
    { key: 'admin' as UserFilter, label: 'Total Admin', count: users.filter((u) => u.role === 'Admin TEFA' || u.role === 'Kepala TEFA' || u.role === 'Admin').length },
    { key: 'staff' as UserFilter, label: 'Guru / Staff', count: users.filter((u) => u.role === 'Guru / Operator').length },
    { key: 'active' as UserFilter, label: 'User Aktif', count: users.filter((u) => u.statusAkun === 'Active').length },
    { key: 'inactive' as UserFilter, label: 'User Nonaktif', count: users.filter((u) => u.statusAkun === 'Inactive' || u.statusAkun === 'Rejected' || u.statusAkun === 'Suspended').length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Active':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Approved':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Rejected':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'Inactive':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Manajemen Akun</h1>
          <p className="text-sm text-slate-500">Kelola seluruh user TEFA DKV</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCurrentFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              currentFilter === tab.key
                ? 'bg-[#5B4BFF] text-white shadow-lg shadow-purple-500/30'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  currentFilter === tab.key
                    ? 'bg-white/20'
                    : 'bg-slate-100'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          search
        </span>
        <input
          type="text"
          placeholder="Cari nama, email, NIS..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30 focus:border-[#5B4BFF]"
        />
      </div>

      {/* User Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginatedUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg hover:border-[#5B4BFF]/30 transition-all cursor-pointer group"
            onClick={() => openDetail(user)}
          >
            <div className="flex items-start gap-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 group-hover:border-[#5B4BFF]/40 transition-all"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-800 truncate">{user.name}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getStatusBadge(user.statusAkun)}`}
                  >
                    {user.statusAkun}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-1">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold">
                    {user.role}
                  </span>
                  {user.studentClass && (
                    <span className="text-[10px] text-slate-400">{user.studentClass}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(user);
                }}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:text-[#5B4BFF] hover:bg-[#5B4BFF]/10 rounded-xl transition-all"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedUser(user);
                  setShowPasswordModal(true);
                }}
                className="flex-1 py-2 text-xs font-bold text-amber-600 hover:text-white hover:bg-amber-500 rounded-xl transition-all"
              >
                Password
              </button>
              {user.statusAkun !== 'Active' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActivate(user.id);
                  }}
                  className="flex-1 py-2 text-xs font-bold text-emerald-600 hover:text-white hover:bg-emerald-500 rounded-xl transition-all"
                >
                  Aktifkan
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUser(user);
                    setShowSuspendModal(true);
                  }}
                  className="flex-1 py-2 text-xs font-bold text-red-600 hover:text-white hover:bg-red-500 rounded-xl transition-all"
                >
                  Suspend
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <span className="material-symbols-outlined text-5xl text-slate-300">person_search</span>
          <p className="text-slate-500 mt-3">Tidak ada user ditemukan</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-20 h-20 rounded-2xl object-cover mx-auto border-4 border-slate-100"
              />
              <h2 className="text-xl font-black text-slate-800 mt-3">{selectedUser.name}</h2>
              <p className="text-sm text-slate-500">{selectedUser.email}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusBadge(selectedUser.statusAkun)}`}>
                  {selectedUser.statusAkun}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">
                  {selectedUser.role}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {selectedUser.nis && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">NIS</span>
                  <span className="font-bold text-slate-700">{selectedUser.nis}</span>
                </div>
              )}
              {selectedUser.studentClass && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Kelas</span>
                  <span className="font-bold text-slate-700">{selectedUser.studentClass}</span>
                </div>
              )}
              {selectedUser.major && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Jurusan</span>
                  <span className="font-bold text-slate-700">{selectedUser.major}</span>
                </div>
              )}
              {selectedUser.whatsapp && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">WhatsApp</span>
                  <span className="font-bold text-slate-700">{selectedUser.whatsapp}</span>
                </div>
              )}
              {selectedUser.createdAt && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Tanggal Daftar</span>
                  <span className="font-bold text-slate-700">{selectedUser.createdAt}</span>
                </div>
              )}
              {selectedUser.rejectReason && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-xs text-red-600 font-bold">Alasan Penolakan:</p>
                  <p className="text-sm text-red-700 mt-1">{selectedUser.rejectReason}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all"
              >
                Tutup
              </button>
              <button
                onClick={() => openEdit(selectedUser)}
                className="flex-1 py-3 bg-[#5B4BFF] text-white font-bold text-sm rounded-xl hover:bg-[#4a3ce0] transition-all"
              >
                Edit
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex-1 py-3 bg-amber-500 text-white font-bold text-sm rounded-xl hover:bg-amber-600 transition-all"
              >
                Set Password
              </button>
              {selectedUser.statusAkun !== 'Active' ? (
                <button
                  onClick={() => handleActivate(selectedUser.id)}
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold text-sm rounded-xl hover:bg-emerald-600 transition-all"
                >
                  Aktifkan
                </button>
              ) : (
                <button
                  onClick={() => setShowSuspendModal(true)}
                  className="flex-1 py-3 bg-red-500 text-white font-bold text-sm rounded-xl hover:bg-red-600 transition-all"
                >
                  Suspend
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-slate-800 mb-6">Edit User</h2>

            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <img
                  src={tempAvatar || selectedUser.avatar}
                  alt="Avatar"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200"
                />
                <div>
                  <button
                    onClick={() => setShowAvatarCrop(true)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Ganti Foto
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1">JPG, PNG, WEBP max 2MB</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  autoComplete="off"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  autoComplete="off"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
                />
              </div>

              {selectedUser.role === 'Siswa' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">NIS</label>
                      <input
                        type="text"
                        value={editForm.nis || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, nis: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Kelas</label>
                      <input
                        type="text"
                        value={editForm.studentClass || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, studentClass: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Jurusan</label>
                    <input
                      type="text"
                      value={editForm.major || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, major: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={editForm.whatsapp || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Role</label>
                  <select
                    value={editForm.role || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
                  >
                    <option value="Siswa">Siswa</option>
                    <option value="Guru / Operator">Guru / Staff</option>
                    <option value="Admin">Admin</option>
                    <option value="Admin TEFA">Admin TEFA</option>
                    <option value="Kepala TEFA">Kepala TEFA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Status Akun</label>
                  <select
                    value={editForm.status || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-3 bg-[#5B4BFF] text-white font-bold text-sm rounded-xl hover:bg-[#4a3ce0] transition-all"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-black text-slate-800 mb-2">Reset Password</h2>
            <p className="text-sm text-slate-500 mb-6">Reset password untuk: {selectedUser.name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Password Baru</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Konfirmasi Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleResetPassword}
                className="flex-1 py-3 bg-amber-500 text-white font-bold text-sm rounded-xl hover:bg-amber-600 transition-all"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-black text-red-600 mb-2">Suspend User</h2>
            <p className="text-sm text-slate-500 mb-4">
              Anda akan me-nonaktifkan: <strong>{selectedUser.name}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Alasan Suspend *</label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Jelaskan alasan suspend..."
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendReason('');
                }}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSuspend}
                className="flex-1 py-3 bg-red-500 text-white font-bold text-sm rounded-xl hover:bg-red-600 transition-all"
              >
                Suspend User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-red-500">warning</span>
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">Hapus Akun?</h2>
              <p className="text-sm text-slate-500">
                Apakah Anda yakin ingin menghapus akun <strong>{selectedUser.name}</strong>?
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Histori order dan transaksi akan tetap tersimpan untuk laporan.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-500 text-white font-bold text-sm rounded-xl hover:bg-red-600 transition-all"
              >
                Hapus
              </button>
            </div>
          </div>
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
    </div>
  );
};

export default UserManagementView;

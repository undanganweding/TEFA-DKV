import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from '../../types';
import * as profileService from '../../services/profileService';
import { AvatarCropModal } from '../AvatarCropModal';
import { Pagination } from '../Pagination';

type SortConfig = 'Terbaru' | 'Terlama' | 'Nama A-Z' | 'Nama Z-A' | 'Last Login';

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

interface UserManagementViewProps {
  currentUser?: UserProfile | null;
}

const ITEMS_PER_PAGE = 20;

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterIsNew, setFilterIsNew] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortConfig>('Terbaru');
  
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showAvatarCrop, setShowAvatarCrop] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState<UpdateUserInput>({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempAvatar, setTempAvatar] = useState<string>('');
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const allUsers = await profileService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      setErrorMsg('Gagal mengambil data pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Derived filters
  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    users.forEach(u => {
      if (u.studentClass) classes.add(u.studentClass);
    });
    return Array.from(classes).sort();
  }, [users]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...users];

    // Search
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.nis && u.nis.toLowerCase().includes(q))
      );
    }

    // Role
    if (filterRole !== 'all') {
      result = result.filter(u => u.role === filterRole);
    }

    // Status
    if (filterStatus !== 'all') {
      if (filterStatus === 'Active') {
        result = result.filter(u => u.statusAkun === 'Active');
      } else if (filterStatus === 'Inactive') {
        result = result.filter(u => u.statusAkun !== 'Active');
      } else if (filterStatus === 'Unverified') {
        result = result.filter(u => !u.emailConfirmedAt);
      }
    }

    // Class
    if (filterClass !== 'all') {
      result = result.filter(u => u.studentClass === filterClass);
    }

    // New User
    if (filterIsNew) {
      result = result.filter(u => u.isNewUser);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'Terbaru':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'Terlama':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'Nama A-Z':
          return a.name.localeCompare(b.name);
        case 'Nama Z-A':
          return b.name.localeCompare(a.name);
        case 'Last Login':
          return new Date(b.lastSignInAt || 0).getTime() - new Date(a.lastSignInAt || 0).getTime();
        default:
          return 0;
      }
    });

    setFilteredUsers(result);
    setCurrentPage(1);
  }, [users, debouncedSearch, filterRole, filterStatus, filterClass, filterIsNew, sortBy]);

  // Summary stats
  const totalStudents = users.filter(u => u.role === 'Siswa').length;
  const totalActive = users.filter(u => u.statusAkun === 'Active').length;
  const totalInactive = users.length - totalActive;
  const totalNew = users.filter(u => u.isNewUser).length;
  const totalUnverified = users.filter(u => !u.emailConfirmedAt).length;
  const totalAdmin = users.filter(u => u.role.includes('Admin') || u.role.includes('Kepala') || u.role.includes('Guru')).length;

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Actions
  const handleActivate = async (userId: string) => {
    setIsProcessing(true);
    const success = await profileService.activateUser(userId);
    if (success) {
      loadUsers();
      setShowDetailModal(false);
      setSelectedUser(null);
    } else {
      alert('Gagal mengaktifkan user.');
    }
    setIsProcessing(false);
  };

  const handleDisable = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    const success = await profileService.suspendUser(selectedUser.id, 'Dinonaktifkan oleh Admin');
    if (success) {
      loadUsers();
      setShowDisableModal(false);
      setShowDetailModal(false);
      setSelectedUser(null);
    } else {
      alert('Gagal me-nonaktifkan user.');
    }
    setIsProcessing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    
    // Check if email changed
    if (editForm.email && editForm.email !== selectedUser.email) {
      const emailRes = await profileService.adminChangeEmail(selectedUser.id, editForm.email);
      if (!emailRes.success) {
        alert('Gagal mengganti email Auth: ' + emailRes.message);
        setIsProcessing(false);
        return;
      }
    }

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
      alert('Data pengguna berhasil diperbarui!');
    } else {
      alert('Gagal menyimpan perubahan profil.');
    }
    setIsProcessing(false);
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
    
    setIsProcessing(true);
    const { success, message } = await profileService.adminSetPassword(selectedUser.id, newPassword);
    if (success) {
      alert('Password berhasil direset.');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } else {
      alert(message);
    }
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    const result = await profileService.adminDeleteUserSecure(selectedUser.id);
    if (result.success) {
      loadUsers();
      setShowDeleteModal(false);
      setShowDetailModal(false);
      setSelectedUser(null);
    } else {
      alert(result.message);
    }
    setIsProcessing(false);
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

  const getStatusBadge = (status: string) => {
    if (status === 'Active') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Manajemen Akun</h1>
          <p className="text-sm text-slate-500">Pusat pengelolaan seluruh pengguna TEFA DKV.</p>
        </div>
        <button onClick={loadUsers} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold text-sm shadow-sm transition-all cursor-pointer">
          <span className="material-symbols-outlined text-sm">refresh</span>
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-slate-500">Total User</p>
          <p className="text-2xl font-black text-slate-800">{users.length}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-emerald-600">Siswa Aktif</p>
          <p className="text-2xl font-black text-emerald-800">{totalActive}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-slate-600">Nonaktif</p>
          <p className="text-2xl font-black text-slate-800">{totalInactive}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 shadow-sm flex flex-col justify-center cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setFilterIsNew(!filterIsNew)}>
          <p className="text-xs font-bold text-blue-600">User Baru</p>
          <p className="text-2xl font-black text-blue-800">{totalNew}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 shadow-sm flex flex-col justify-center cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => { setFilterStatus('Unverified'); }}>
          <p className="text-[10px] font-bold text-amber-600 uppercase">Belum Konfirmasi</p>
          <p className="text-2xl font-black text-amber-800">{totalUnverified}</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-purple-600">Admin / Staff</p>
          <p className="text-2xl font-black text-purple-800">{totalAdmin}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 flex-shrink-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            placeholder="Cari Nama, Email, NIS/NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:justify-end">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30">
            <option value="all">Semua Role</option>
            <option value="Siswa">Siswa</option>
            <option value="Admin TEFA">Admin</option>
            <option value="Kepala TEFA">Kepala TEFA</option>
            <option value="Guru / Operator">Staff/Guru</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30">
            <option value="all">Semua Status</option>
            <option value="Active">Aktif</option>
            <option value="Inactive">Nonaktif</option>
            <option value="Unverified">Belum Konfirmasi Email</option>
          </select>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30">
            <option value="all">Semua Kelas</option>
            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortConfig)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30">
            <option value="Terbaru">Terbaru</option>
            <option value="Terlama">Terlama</option>
            <option value="Nama A-Z">Nama A-Z</option>
            <option value="Nama Z-A">Nama Z-A</option>
            <option value="Last Login">Last Login</option>
          </select>
          <button onClick={() => setFilterIsNew(!filterIsNew)} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${filterIsNew ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200'}`}>
            User Baru
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#5B4BFF] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium text-sm">Memuat data pengguna & auth...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-white rounded-2xl border border-red-200 p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
          <p className="text-slate-800 font-bold mb-4">{errorMsg}</p>
          <button onClick={loadUsers} className="px-4 py-2 bg-red-50 text-red-600 font-bold text-sm rounded-xl hover:bg-red-100 cursor-pointer">Coba Lagi</button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <span className="material-symbols-outlined text-3xl text-slate-400">group_off</span>
          </div>
          <p className="text-slate-800 font-bold text-lg">Belum ada user yang cocok.</p>
          <p className="text-slate-500 text-sm mt-1">Sesuaikan pencarian atau filter Anda.</p>
        </div>
      ) : (
        /* Data Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Identitas</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status & Email</th>
                  <th className="p-4">Last Login</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openDetail(user)}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        <div>
                          <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            {user.name}
                            {user.isNewUser && <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded-md uppercase font-black tracking-widest">Baru</span>}
                          </p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {user.role === 'Siswa' ? (
                        <>
                          <p className="text-slate-700 text-sm font-mono">{user.nis || '-'}</p>
                          <p className="text-slate-500 text-xs">{user.studentClass || '-'} {user.major || ''}</p>
                        </>
                      ) : (
                        <p className="text-slate-500 text-xs">-</p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">{user.role}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getStatusBadge(user.statusAkun)}`}>
                          {user.statusAkun === 'Active' ? 'Aktif' : 'Nonaktif'}
                        </span>
                        {user.emailConfirmedAt ? (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">verified</span> Verified</span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">warning</span> Unverified</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 text-xs whitespace-nowrap">
                      {user.lastSignInAt ? formatDate(user.lastSignInAt) : 'Belum pernah login'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(user)} title="Edit Profil & Email" className="w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => { setSelectedUser(user); setShowPasswordModal(true); }} title="Reset Password" className="w-8 h-8 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 flex items-center justify-center transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-sm">key</span>
                        </button>
                        {user.statusAkun === 'Active' ? (
                          <button onClick={() => { setSelectedUser(user); setShowDisableModal(true); }} title="Nonaktifkan" className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-sm">block</span>
                          </button>
                        ) : (
                          <button onClick={() => handleActivate(user.id)} disabled={isProcessing} title="Aktifkan" className="w-8 h-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                          </button>
                        )}
                        <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }} title="Hapus Akun Permanen" className="w-8 h-8 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer ml-2 border border-transparent hover:border-red-200">
                          <span className="material-symbols-outlined text-sm">delete_forever</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
            <div className="bg-slate-50 p-6 md:w-1/3 border-r border-slate-200 flex flex-col items-center text-center">
              <img src={selectedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'} alt={selectedUser.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4" />
              <h2 className="text-lg font-black text-slate-800">{selectedUser.name}</h2>
              <span className="text-xs px-3 py-1 rounded-full bg-slate-200 text-slate-700 font-bold mt-2">{selectedUser.role}</span>
              {selectedUser.isNewUser && <span className="text-[10px] bg-blue-100 text-blue-700 font-black px-2 py-1 rounded mt-2 uppercase tracking-widest">User Baru</span>}
            </div>

            <div className="p-6 md:w-2/3 overflow-y-auto">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2"><span className="material-symbols-outlined text-lg">person</span> Profile Information</h3>
                <button onClick={() => setShowDetailModal(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div><p className="text-slate-400 text-xs">Email</p><p className="font-bold text-slate-700">{selectedUser.email}</p></div>
                <div><p className="text-slate-400 text-xs">No. WhatsApp</p><p className="font-bold text-slate-700">{selectedUser.whatsapp || '-'}</p></div>
                <div><p className="text-slate-400 text-xs">NIS/NISN</p><p className="font-bold text-slate-700">{selectedUser.nis || '-'}</p></div>
                <div><p className="text-slate-400 text-xs">Kelas & Jurusan</p><p className="font-bold text-slate-700">{selectedUser.studentClass || '-'} {selectedUser.major || ''}</p></div>
              </div>

              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2 mt-6"><span className="material-symbols-outlined text-lg">shield_person</span> Account Identity & Auth</h3>
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="col-span-2"><p className="text-slate-400 text-xs">User ID (Auth UID)</p><p className="font-mono text-xs text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 break-all">{selectedUser.id}</p></div>
                <div><p className="text-slate-400 text-xs">Status Akun</p><p className={`font-bold ${selectedUser.statusAkun === 'Active' ? 'text-emerald-600' : 'text-slate-600'}`}>{selectedUser.statusAkun === 'Active' ? 'Aktif / Bisa Login' : 'Nonaktif / Terblokir'}</p></div>
                <div><p className="text-slate-400 text-xs">Status Email</p>
                  <p className={`font-bold flex items-center gap-1 ${selectedUser.emailConfirmedAt ? 'text-emerald-600' : 'text-amber-600'}`}>
                    <span className="material-symbols-outlined text-[16px]">{selectedUser.emailConfirmedAt ? 'check_circle' : 'warning'}</span>
                    {selectedUser.emailConfirmedAt ? 'Verified' : 'Unverified'}
                  </p>
                </div>
                <div><p className="text-slate-400 text-xs">Tanggal Terdaftar</p><p className="font-bold text-slate-700">{formatDate(selectedUser.createdAt)}</p></div>
                <div><p className="text-slate-400 text-xs">Last Login (Auth)</p><p className="font-bold text-slate-700">{selectedUser.lastSignInAt ? formatDate(selectedUser.lastSignInAt) : 'Belum pernah login'}</p></div>
              </div>

              <div className="flex gap-2 mt-6">
                <button onClick={() => openEdit(selectedUser)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all flex justify-center items-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined text-sm">edit</span> Edit Profil & Email
                </button>
                <button onClick={() => setShowPasswordModal(true)} className="flex-1 py-2.5 bg-white border border-slate-200 text-amber-700 font-bold text-xs rounded-xl hover:bg-amber-50 transition-all flex justify-center items-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined text-sm">key</span> Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (Included Change Email) */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-blue-500">manage_accounts</span> Edit Profil & Identity</h2>

            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <img src={tempAvatar || selectedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200" />
                <div>
                  <button type="button" onClick={() => setShowAvatarCrop(true)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all cursor-pointer">Ganti Foto</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Lengkap</label>
                <input type="text" value={editForm.name || ''} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30" />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">warning</span> Email Identity (Auth)</label>
                <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white" placeholder="Masukkan email baru..." />
                <p className="text-[10px] text-amber-700 mt-1">Mengubah ini akan mengganti email login siswa pada Supabase Auth.</p>
              </div>

              {selectedUser.role === 'Siswa' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">NIS/NISN</label>
                      <input type="text" value={editForm.nis || ''} onChange={(e) => setEditForm(p => ({ ...p, nis: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Kelas</label>
                      <input type="text" value={editForm.studentClass || ''} onChange={(e) => setEditForm(p => ({ ...p, studentClass: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Jurusan</label>
                      <input type="text" value={editForm.major || ''} onChange={(e) => setEditForm(p => ({ ...p, major: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">WhatsApp</label>
                      <input type="text" value={editForm.whatsapp || ''} onChange={(e) => setEditForm(p => ({ ...p, whatsapp: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30" />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Role</label>
                  <select value={editForm.role || ''} onChange={(e) => setEditForm(p => ({ ...p, role: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30 bg-white">
                    <option value="Siswa">Siswa</option>
                    <option value="Guru / Operator">Guru / Staff</option>
                    <option value="Admin TEFA">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Status Akun</label>
                  <select value={editForm.status || ''} onChange={(e) => setEditForm(p => ({ ...p, status: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30 bg-white">
                    <option value="Active">Aktif</option>
                    <option value="Inactive">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all cursor-pointer">Batal</button>
              <button onClick={handleSaveEdit} disabled={isProcessing} className="flex-1 py-3 bg-[#5B4BFF] text-white font-bold text-sm rounded-xl hover:bg-[#4a3ce0] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                {isProcessing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 border border-amber-100">
              <span className="material-symbols-outlined">key</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-1">Reset Password Server-side</h2>
            <p className="text-sm text-slate-500 mb-6">Paksa penggantian sandi untuk akun: <strong>{selectedUser.name}</strong></p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Password Sementara Baru</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 8 karakter" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Konfirmasi Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 mt-4"><span className="font-bold text-slate-500">Security Note:</span> Aksi ini langsung mengubah identitas Auth melalui layanan API tersinkronisasi. Service key tidak digunakan pada browser.</p>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button onClick={() => { setShowPasswordModal(false); setNewPassword(''); setConfirmPassword(''); }} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all cursor-pointer">Batal</button>
              <button onClick={handleResetPassword} disabled={isProcessing} className="flex-1 py-3 bg-amber-500 text-white font-bold text-sm rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50 cursor-pointer">Simpan Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Disable (Nonaktifkan) Modal */}
      {showDisableModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">person_off</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Nonaktifkan akun siswa ini?</h2>
            <p className="text-sm text-slate-500 mb-6 px-4">
              Akun <strong>{selectedUser.name}</strong> tidak akan bisa login, namun data pesanan/transaksi akan tetap dipertahankan dengan aman.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setShowDisableModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all cursor-pointer">Batal</button>
              <button onClick={handleDisable} disabled={isProcessing} className="flex-1 py-3 bg-slate-700 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer">Nonaktifkan</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Secure Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">Hapus Auth Account Permanen?</h2>
              <p className="text-sm text-slate-500">Anda akan menghapus akun:</p>
              <p className="text-md font-bold text-slate-800 mt-1">{selectedUser.name}</p>
              <p className="text-sm font-medium text-slate-600">{selectedUser.email}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-xl border border-red-200 mb-6">
              <p className="text-xs font-bold text-red-800 mb-1">PERINGATAN SANGAT PENTING:</p>
              <ul className="text-[11px] text-red-700 list-disc list-inside space-y-1">
                <li>Tindakan ini menghancurkan identitas login di database Auth.</li>
                <li>Data riwayat order dan invoice yang di-set NULL akan tetap ada (tidak Cascade menghancurkan finance).</li>
                <li>Tindakan ini tidak dapat dibatalkan.</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all cursor-pointer">Batal</button>
              <button onClick={handleDelete} disabled={isProcessing} className="flex-1 py-3 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                {isProcessing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Ya, Hapus Permanen'}
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

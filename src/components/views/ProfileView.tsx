import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, UserRole, InstitutionProfile, PageId } from '../../types';

interface ProfileViewProps {
  currentUser: UserProfile;
  onUpdateProfile: (updatedUser: UserProfile) => void;
  institutionInfo?: InstitutionProfile;
  onUpdateInstitution?: (updatedInst: InstitutionProfile) => void;
  initialTab?: 'pribadi' | 'keamanan' | 'preferensi' | 'institusi';
  onNavigate?: (page: PageId) => void;
}

export const defaultInstitution: InstitutionProfile = {
  schoolName: 'SMK NU Ungaran',
  tefaName: 'TEFA DKV Creative Studio',
  logoUrl: 'https://images.unsplash.com/photo-1542744094-3a31b272c390?w=200&q=80',
  address: 'Jl. Kaligarang No. 9, Ungaran, Kab. Semarang, Jawa Tengah 50511',
  contactPhone: '(024) 692-1234 / 0813-9000-8800',
  schoolEmail: 'info@smknuungaran.sch.id',
  website: 'https://smknuungaran.sch.id',
  description:
    'Teaching Factory DKV SMK NU Ungaran merupakan unit produksi dan pelatihan vokasi berbasis standar industri kreatif digital, percetakan, dan cetak offset.',
};

export const getInitials = (name: string): string => {
  if (!name) return 'U';
  const clean = name.replace(/^(Drs\.|H\.|M\.|S\.|Pd|Sn|M\.Pd|S\.Sn)\b/gi, '').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return 'TF';
};

export const getRoleGradient = (role: UserRole): string => {
  switch (role) {
    case 'Kepala TEFA':
      return 'from-purple-600 via-indigo-600 to-purple-800';
    case 'Guru / Operator':
      return 'from-blue-600 via-indigo-600 to-cyan-600';
    case 'Admin':
      return 'from-emerald-600 via-teal-600 to-emerald-800';
    case 'Siswa':
      return 'from-amber-500 via-orange-600 to-amber-700';
    default:
      return 'from-purple-600 to-indigo-600';
  }
};

export const getRoleBadgeBg = (role: UserRole): string => {
  switch (role) {
    case 'Kepala TEFA':
      return 'bg-purple-100 text-[#5B4BFF] border-purple-200';
    case 'Guru / Operator':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Admin':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Siswa':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateProfile,
  institutionInfo = defaultInstitution,
  onUpdateInstitution,
  initialTab = 'pribadi',
  onNavigate,
}) => {
  // Active Tab State
  const [activeTab, setActiveTab] = useState<'pribadi' | 'keamanan' | 'preferensi' | 'institusi'>(
    initialTab
  );

  // Form States initialized with currentUser
  const [formData, setFormData] = useState<UserProfile>({ ...currentUser });
  const [instData, setInstData] = useState<InstitutionProfile>({ ...institutionInfo });

  // Password Security Form State
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showOldPass, setShowOldPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);

  // Photo Upload & Editor Modal State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState<boolean>(false);

  // General Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Permissions check helper
  const canEditInstitution = currentUser.role === 'Admin' || currentUser.role === 'Kepala TEFA';
  const isSiswa = currentUser.role === 'Siswa';

  // Calculate Password Strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Sangat Lemah', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Lemah', color: 'bg-red-500' };
      case 2:
        return { score: 50, label: 'Sedang', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Kuat', color: 'bg-blue-500' };
      case 4:
        return { score: 100, label: 'Sangat Kuat', color: 'bg-emerald-500' };
      default:
        return { score: 15, label: 'Sangat Lemah', color: 'bg-red-400' };
    }
  };

  const passStrength = getPasswordStrength(newPassword);

  // File Change & Validation Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2 MB = 2 * 1024 * 1024 bytes)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError('Ukuran foto maksimal 2 MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate type (JPG, JPEG, PNG, WEBP)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Tipe file tidak didukung. Gunakan JPG, PNG, atau WEBP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save Cropped/Edited Avatar
  const handleSaveAvatar = () => {
    if (!previewImage) {
      setUploadError('Silakan pilih file foto terlebih dahulu.');
      return;
    }

    setIsSavingPhoto(true);

    // Simulate canvas crop / rotation processing
    setTimeout(() => {
      const updated = {
        ...formData,
        avatar: previewImage,
      };
      setFormData(updated);
      onUpdateProfile(updated);

      setIsSavingPhoto(false);
      setShowUploadModal(false);
      setSelectedFile(null);
      setPreviewImage(null);
      setZoomLevel(1);
      setRotationAngle(0);

      showToast('Foto profil berhasil diperbarui');
    }, 600);
  };

  // Remove Avatar (Use Default Initials)
  const handleRemoveAvatar = () => {
    const updated = {
      ...formData,
      avatar: '',
    };
    setFormData(updated);
    onUpdateProfile(updated);
    showToast('Foto profil berhasil dihapus. Menggunakan avatar inisial.');
  };

  // Save Personal & Professional Profile Changes
  const handleSavePersonalData = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    showToast('Informasi profil berhasil diperbarui!');
  };

  // Save Password Changes
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      showToast('Masukkan kata sandi lama Anda.', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast('Kata sandi baru minimal 6 karakter.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi kata sandi baru tidak cocok.', 'error');
      return;
    }

    showToast('Kata sandi berhasil diperbarui!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Save Preferences
  const handleSavePreferences = (theme: 'light' | 'dark', notifKey?: keyof typeof formData.notifications) => {
    let updatedNotifs = { ...formData.notifications };
    if (notifKey) {
      updatedNotifs[notifKey] = !updatedNotifs[notifKey];
    }

    const updated = {
      ...formData,
      theme: theme,
      notifications: updatedNotifs,
    };
    setFormData(updated);
    onUpdateProfile(updated);
    showToast('Preferensi sistem telah disimpan!');
  };

  // Save Institution Info
  const handleSaveInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateInstitution) {
      onUpdateInstitution(instData);
    }
    showToast('Profil institusi SMK NU Ungaran berhasil diperbarui!');
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12 max-w-7xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-black backdrop-blur-xl max-w-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-emerald-950/30'
                : 'bg-red-950/90 text-red-200 border-red-500/50 shadow-red-950/30'
            }`}
          >
            <span className="material-symbols-outlined text-xl">
              {toastMessage.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span className="flex-1">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER PAGE BANNER */}
      <div className="bg-gradient-to-r from-[#151A2D] via-[#1C233B] to-[#252D4A] rounded-[28px] p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5B4BFF]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-md">
                User Account Management
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs text-slate-300 font-bold">SMK NU UNGARAN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pengaturan Profil Akun
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
              Kelola informasi akun, foto profil, keamanan password, serta preferensi sistem pengguna.
            </p>
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition-all cursor-pointer self-start md:self-auto shrink-0"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Kembali ke Dashboard</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: PROFILE OVERVIEW CARD */}
      <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-6 text-center sm:text-left">
            {/* Profile Photo / Avatar Initials */}
            <div className="relative shrink-0 group">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt={formData.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-xl shadow-purple-500/10 ring-4 ring-purple-500/20"
                />
              ) : (
                <div
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr ${getRoleGradient(
                    formData.role
                  )} text-white font-black text-3xl sm:text-4xl flex items-center justify-center border-4 border-white shadow-xl shadow-purple-500/10 ring-4 ring-purple-500/20 uppercase tracking-wider`}
                >
                  {getInitials(formData.name)}
                </div>
              )}

              {/* Online Indicator */}
              <span
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-md animate-pulse"
                title="Sesi Aktif"
              />
            </div>

            {/* User Meta Information */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${getRoleBadgeBg(
                    formData.role
                  )}`}
                >
                  {formData.role}
                </span>

                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {formData.statusAkun || 'Akun Terverifikasi'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {formData.name}
              </h2>

              <p className="text-xs font-semibold text-slate-500 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <span className="flex items-center gap-1 text-slate-700 font-bold">
                  <span className="material-symbols-outlined text-sm text-[#5B4BFF]">
                    alternate_email
                  </span>
                  @{formData.username || 'username'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-slate-400">mail</span>
                  {formData.email}
                </span>
              </p>

              <p className="text-[11px] font-medium text-slate-400 pt-1">
                SMK NU Ungaran • TEFA DKV Creative Studio Management Platform
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center sm:justify-end gap-2.5 flex-wrap shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowUploadModal(true);
                setUploadError(null);
              }}
              className="px-5 py-3 rounded-2xl bg-[#5B4BFF] hover:bg-purple-700 text-white text-xs font-black shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35 transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-base">photo_camera</span>
              <span>Ganti Foto Profil</span>
            </button>

            {formData.avatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold border border-slate-200 hover:border-red-200 transition-all cursor-pointer active:scale-95"
                title="Hapus foto profil dan gunakan avatar inisial"
              >
                Hapus Foto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('pribadi')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'pribadi'
              ? 'bg-[#5B4BFF] text-white shadow-lg shadow-purple-500/25'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-base">person</span>
          <span>Informasi Pribadi & Data Role</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('keamanan')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'keamanan'
              ? 'bg-[#5B4BFF] text-white shadow-lg shadow-purple-500/25'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-base">lock</span>
          <span>Keamanan Akun</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferensi')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'preferensi'
              ? 'bg-[#5B4BFF] text-white shadow-lg shadow-purple-500/25'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-base">tune</span>
          <span>Preferensi Sistem</span>
        </button>

        {canEditInstitution && (
          <button
            type="button"
            onClick={() => setActiveTab('institusi')}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'institusi'
                ? 'bg-[#5B4BFF] text-white shadow-lg shadow-purple-500/25'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">domain</span>
            <span>Profil Institusi TEFA</span>
          </button>
        )}
      </div>

      {/* SECTION 3: TAB CONTENT PANELS */}

      {/* TAB 1: INFORMASI PRIBADI & ROLE DATA */}
      {activeTab === 'pribadi' && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSavePersonalData}
          className="space-y-6"
        >
          {/* Personal Info Card */}
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#5B4BFF] flex items-center justify-center font-black border border-purple-100">
                  <span className="material-symbols-outlined text-lg">badge</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Informasi Pribadi</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Data utama identitas pengguna terdaftar
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                Data Pengguna
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/10 transition-all focus:outline-hidden"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Username System <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.username || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        username: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                      })
                    }
                    className="w-full pl-8 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/10 transition-all focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Alamat Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/10 transition-all focus:outline-hidden"
                />
              </div>

              {/* Nomor WhatsApp / HP */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Nomor WhatsApp / Telepon
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0812-3456-7890"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/10 transition-all focus:outline-hidden"
                />
              </div>

              {/* Tanggal Lahir */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={formData.birthDate || ''}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/10 transition-all focus:outline-hidden"
                />
              </div>

              {/* Status Akun */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Status Otentikasi
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.statusAkun || 'Aktif - Terverifikasi'}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Alamat Lengkap */}
              <div className="md:col-span-2">
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Alamat Lengkap Tempat Tinggal
                </label>
                <textarea
                  rows={3}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Masukkan alamat domisili lengkap..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/10 transition-all focus:outline-hidden resize-none"
                />
              </div>
            </div>
          </div>

          {/* Role-Specific Professional Data Card */}
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black border border-blue-100">
                  <span className="material-symbols-outlined text-lg">work</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Data Profesional Berdasarkan Role: {formData.role}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Atribut khusus untuk hak akses dan verifikasi tugas sekolah
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${getRoleBadgeBg(
                  formData.role
                )}`}
              >
                {formData.role}
              </span>
            </div>

            {/* KEPALA TEFA FIELDS */}
            {formData.role === 'Kepala TEFA' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Jabatan / Tanggung Jawab
                  </label>
                  <input
                    type="text"
                    value={formData.position || 'Kepala Unit Produksi TEFA DKV'}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    NIP / NUPTK
                  </label>
                  <input
                    type="text"
                    value={formData.nip || '19750812 200212 1 003'}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Email Resmi Sekolah
                  </label>
                  <input
                    type="email"
                    value={formData.schoolEmail || 'kepala.tefa@smknuungaran.sch.id'}
                    onChange={(e) => setFormData({ ...formData, schoolEmail: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Nomor HP Kedinasan
                  </label>
                  <input
                    type="text"
                    value={formData.phone || '0812-3456-7890'}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
                  />
                </div>
              </div>
            )}

            {/* GURU / OPERATOR FIELDS */}
            {formData.role === 'Guru / Operator' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Bidang Keahlian Studio
                  </label>
                  <input
                    type="text"
                    value={
                      formData.expertise ||
                      'Desain Grafis, Operasional Mesin Outdoor/Digital & Press'
                    }
                    onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Mata Pelajaran Ampuan
                  </label>
                  <input
                    type="text"
                    value={formData.subject || 'Konsentrasi Keahlian DKV / Produksi Grafika'}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Nomor Pegawai / NGT
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId || 'PEG-2022-8819'}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
                  />
                </div>
              </div>
            )}

            {/* SISWA FIELDS */}
            {formData.role === 'Siswa' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    NIS / NISN Siswa
                  </label>
                  <input
                    type="text"
                    disabled={isSiswa} // Restricted edit for siswa
                    value={formData.nis || '2122.10.045'}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className={`w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold ${
                      isSiswa
                        ? 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-50 border border-slate-200 text-slate-900'
                    }`}
                  />
                  {isSiswa && (
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      🔒 NIS diverifikasi langsung oleh Bagian Tata Usaha SMK NU Ungaran.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Kelas
                  </label>
                  <input
                    type="text"
                    value={formData.studentClass || 'XI DKV 1'}
                    onChange={(e) => setFormData({ ...formData, studentClass: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Jurusan / Kompetensi Keahlian
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.major || 'Desain Komunikasi Visual (DKV)'}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* ADMIN FIELDS */}
            {formData.role === 'Admin' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    ID Administrator System
                  </label>
                  <input
                    type="text"
                    value={formData.adminId || 'ADM-TEFA-ROOT-01'}
                    onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Cakupan Hak Akses
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Full Access • Master Data & Configuration Root"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3.5 rounded-2xl bg-[#5B4BFF] hover:bg-purple-700 text-white font-black text-xs tracking-wide shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>Simpan Perubahan Profil</span>
              </button>
            </div>
          </div>
        </motion.form>
      )}

      {/* TAB 2: KEAMANAN AKUN */}
      {activeTab === 'keamanan' && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSavePassword}
          className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black border border-amber-100">
                <span className="material-symbols-outlined text-lg">lock</span>
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Keamanan & Ubah Password</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Perbarui kata sandi untuk melindungi akses akun Anda
                </p>
              </div>
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              Otentikasi
            </span>
          </div>

          <div className="max-w-xl space-y-4">
            {/* Password Lama */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Kata Sandi Saat Ini <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama"
                  className="w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/10 transition-all focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showOldPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Password Baru */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Kata Sandi Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 - 8+ karakter"
                  className="w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/10 transition-all focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showNewPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Strength Meter Bar */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-400">Kekuatan Password:</span>
                    <span
                      className={
                        passStrength.score >= 75
                          ? 'text-emerald-600'
                          : passStrength.score >= 50
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }
                    >
                      {passStrength.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passStrength.color}`}
                      style={{ width: `${passStrength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Konfirmasi Password Baru */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/10 transition-all focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showConfirmPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>Kata sandi tidak cocok.</span>
                </p>
              )}
            </div>

            {/* Checklist Syarat Password */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <p className="font-extrabold text-slate-700">Panduan Password Aman:</p>
              <ul className="space-y-1 text-slate-500 font-medium text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span
                    className={`material-symbols-outlined text-sm ${
                      newPassword.length >= 8 ? 'text-emerald-500' : 'text-slate-300'
                    }`}
                  >
                    check_circle
                  </span>
                  <span>Minimal 8 karakter</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span
                    className={`material-symbols-outlined text-sm ${
                      /[A-Z]/.test(newPassword) ? 'text-emerald-500' : 'text-slate-300'
                    }`}
                  >
                    check_circle
                  </span>
                  <span>Mengandung setidaknya 1 huruf kapital</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span
                    className={`material-symbols-outlined text-sm ${
                      /[0-9]/.test(newPassword) ? 'text-emerald-500' : 'text-slate-300'
                    }`}
                  >
                    check_circle
                  </span>
                  <span>Mengandung angka</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-[#5B4BFF] hover:bg-purple-700 text-white font-black text-xs tracking-wide shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">key</span>
              <span>Perbarui Kata Sandi</span>
            </button>
          </div>
        </motion.form>
      )}

      {/* TAB 3: PREFERENSI SISTEM */}
      {activeTab === 'preferensi' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Theme Preference */}
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#5B4BFF] flex items-center justify-center font-black border border-purple-100">
                  <span className="material-symbols-outlined text-lg">palette</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Tampilan Tema Workspace</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Pilih mode tampilan sesuai kenyamanan mata Anda
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              {/* Light Mode Card */}
              <button
                type="button"
                onClick={() => handleSavePreferences('light')}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-4 ${
                  formData.theme === 'light'
                    ? 'bg-purple-50/80 border-[#5B4BFF] ring-2 ring-purple-500/20 shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-amber-500 shadow-xs shrink-0">
                  <span className="material-symbols-outlined text-2xl">light_mode</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-900 text-sm">Light Mode (Default)</h4>
                    {formData.theme === 'light' && (
                      <span className="material-symbols-outlined text-base text-[#5B4BFF] font-black">
                        check_circle
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Tampilan terang kontras tinggi untuk suasana siang studio.
                  </p>
                </div>
              </button>

              {/* Dark Mode Card */}
              <button
                type="button"
                onClick={() => handleSavePreferences('dark')}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-4 ${
                  formData.theme === 'dark'
                    ? 'bg-purple-50/80 border-[#5B4BFF] ring-2 ring-purple-500/20 shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#0F1322] text-indigo-400 flex items-center justify-center shadow-xs shrink-0 border border-slate-800">
                  <span className="material-symbols-outlined text-2xl">dark_mode</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-900 text-sm">Dark Studio Mode</h4>
                    {formData.theme === 'dark' && (
                      <span className="material-symbols-outlined text-base text-[#5B4BFF] font-black">
                        check_circle
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Mode gelap elegan untuk pengerjaan desain malam hari.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Notifications Preferences */}
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black border border-blue-100">
                  <span className="material-symbols-outlined text-lg">notifications</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Pemberitahuan & Notifikasi</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Atur notifikasi penting yang ingin Anda terima di sistem
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-w-2xl">
              {[
                {
                  key: 'orderNotif' as const,
                  title: 'Notifikasi Pesanan Baru',
                  desc: 'Pemberitahuan saat ada pesanan cetak / custom order baru masuk.',
                  icon: 'shopping_bag',
                },
                {
                  key: 'fileInboxNotif' as const,
                  title: 'Notifikasi File Inbox Masuk',
                  desc: 'Pemberitahuan saat siswa/public mengunggah file cetak ke inbox.',
                  icon: 'upload_file',
                },
                {
                  key: 'productionNotif' as const,
                  title: 'Notifikasi Status Produksi',
                  desc: 'Pemberitahuan progres antrean cetak, proofing, dan quality check.',
                  icon: 'precision_manufacturing',
                },
                {
                  key: 'stockNotif' as const,
                  title: 'Notifikasi Peringatan Stok Bahan',
                  desc: 'Pemberitahuan saat bahan kertas, tinta, atau ketersediaan stok kritis.',
                  icon: 'inventory_2',
                },
              ].map((notif) => (
                <label
                  key={notif.key}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.notifications?.[notif.key] ?? true}
                    onChange={() => handleSavePreferences(formData.theme, notif.key)}
                    className="w-5 h-5 rounded-md text-[#5B4BFF] accent-[#5B4BFF] focus:ring-purple-500 mt-0.5 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#5B4BFF]">
                        {notif.icon}
                      </span>
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                        {notif.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{notif.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 4: PROFIL INSTITUSI TEFA (Khusus Admin & Kepala TEFA) */}
      {activeTab === 'institusi' && canEditInstitution && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveInstitution}
          className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#5B4BFF] flex items-center justify-center font-black border border-purple-100">
                <span className="material-symbols-outlined text-lg">domain</span>
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Profil Institusi & Teaching Factory
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Pengaturan identitas sekolah SMK NU Ungaran dan Studio DKV
                </p>
              </div>
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-100 text-[#5B4BFF]">
              Otoritas Sekolah
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Nama Sekolah Resmi
              </label>
              <input
                type="text"
                required
                value={instData.schoolName}
                onChange={(e) => setInstData({ ...instData, schoolName: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Nama Studio Teaching Factory
              </label>
              <input
                type="text"
                required
                value={instData.tefaName}
                onChange={(e) => setInstData({ ...instData, tefaName: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Kontak & Telepon Kantor
              </label>
              <input
                type="text"
                value={instData.contactPhone}
                onChange={(e) => setInstData({ ...instData, contactPhone: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Email Utama Sekolah
              </label>
              <input
                type="email"
                value={instData.schoolEmail}
                onChange={(e) => setInstData({ ...instData, schoolEmail: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Website Sekolah
              </label>
              <input
                type="text"
                value={instData.website}
                onChange={(e) => setInstData({ ...instData, website: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                URL Logo Institusi
              </label>
              <input
                type="text"
                value={instData.logoUrl}
                onChange={(e) => setInstData({ ...instData, logoUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Alamat Sekolah Lengkap
              </label>
              <input
                type="text"
                value={instData.address}
                onChange={(e) => setInstData({ ...instData, address: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Deskripsi Singkat Studio DKV
              </label>
              <textarea
                rows={3}
                value={instData.description}
                onChange={(e) => setInstData({ ...instData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#5B4BFF] resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-[#5B4BFF] hover:bg-purple-700 text-white font-black text-xs tracking-wide shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">domain_verification</span>
              <span>Simpan Profil Institusi</span>
            </button>
          </div>
        </motion.form>
      )}

      {/* ========================================================================= */}
      {/* MODAL GANTI FOTO PROFIL & IMAGE EDITOR                                    */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden font-sans"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#5B4BFF] flex items-center justify-center font-black border border-purple-100">
                  <span className="material-symbols-outlined text-lg">photo_camera</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    Ganti Foto Profil
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Upload & atur tampilan avatar pengguna
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setPreviewImage(null);
                  setSelectedFile(null);
                  setZoomLevel(1);
                  setRotationAngle(0);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Error Notification Toast in Modal */}
            {uploadError && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-800 font-bold">
                <span className="material-symbols-outlined text-base text-red-600 shrink-0">
                  error
                </span>
                <span>{uploadError}</span>
              </div>
            )}

            {/* File Upload Area or Image Editor */}
            {!previewImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#5B4BFF] rounded-3xl p-8 text-center bg-slate-50 hover:bg-purple-50/40 transition-all cursor-pointer group space-y-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-full bg-purple-100 text-[#5B4BFF] flex items-center justify-center mx-auto text-2xl font-black group-hover:scale-110 transition-transform shadow-inner">
                  <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                </div>

                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                    Klik untuk memilih foto dari perangkat Anda
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Format yang didukung: <strong>JPG, JPEG, PNG, WEBP</strong> (Maks. <strong>2 MB</strong>)
                  </p>
                </div>
              </div>
            ) : (
              /* Image Editor Controls Area */
              <div className="space-y-5">
                {/* Circle Avatar Crop Preview Mask */}
                <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-white shadow-2xl ring-4 ring-purple-500/30 bg-slate-900 flex items-center justify-center">
                  <div
                    className="w-full h-full flex items-center justify-center transition-transform duration-100"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotationAngle}deg)`,
                    }}
                  >
                    <img
                      src={previewImage}
                      alt="Preview Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Editor Controls (Zoom & Rotate) */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  {/* Zoom Slider */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#5B4BFF]">
                          zoom_in
                        </span>
                        <span>Zoom Perbesar</span>
                      </span>
                      <span className="font-mono text-[11px]">{Math.round(zoomLevel * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="2.5"
                      step="0.05"
                      value={zoomLevel}
                      onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                      className="w-full accent-[#5B4BFF] cursor-pointer"
                    />
                  </div>

                  {/* Rotate Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-700">Putar Foto:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRotationAngle((prev) => (prev - 90 + 360) % 360)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">rotate_left</span>
                        <span>-90°</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotationAngle((prev) => (prev + 90) % 360)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">rotate_right</span>
                        <span>+90°</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Switch File Option */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs font-bold text-[#5B4BFF] hover:underline cursor-pointer"
                  >
                    Pilih file foto lain
                  </button>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-5 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setPreviewImage(null);
                  setSelectedFile(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={!previewImage || isSavingPhoto}
                onClick={handleSaveAvatar}
                className="flex-1 py-3 rounded-2xl bg-[#5B4BFF] hover:bg-purple-700 text-white font-black text-xs shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingPhoto ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">check</span>
                    <span>Simpan Foto</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

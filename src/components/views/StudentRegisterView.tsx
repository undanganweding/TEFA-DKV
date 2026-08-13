import React, { useState } from 'react';
import * as authService from '../../services/authService';
import { AvatarCropModal } from '../AvatarCropModal';

interface RegisterStudentInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  nis: string;
  studentClass: string;
  major: string;
  whatsapp: string;
  avatar?: string;
}

interface StudentRegisterViewProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: () => void;
}

export const StudentRegisterView: React.FC<StudentRegisterViewProps> = ({
  onSwitchToLogin,
  onRegisterSuccess,
}) => {
  const [form, setForm] = useState<RegisterStudentInput>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    nis: '',
    studentClass: '',
    major: 'Desain Komunikasi Visual',
    whatsapp: '',
  });
  const [avatar, setAvatar] = useState<string>('');
  const [showAvatarCrop, setShowAvatarCrop] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof RegisterStudentInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleAvatarSave = (avatarUrl: string) => {
    setAvatar(avatarUrl);
    setForm((prev) => ({ ...prev, avatar: avatarUrl }));
    setShowAvatarCrop(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.name.trim()) {
      setError('Nama lengkap harus diisi!');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setError('Email valid harus diisi!');
      return;
    }
    if (!form.password || form.password.length < 8) {
      setError('Password minimal 8 karakter!');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Konfirmasi password tidak cocok!');
      return;
    }
    if (!form.nis.trim()) {
      setError('NIS harus diisi!');
      return;
    }
    if (!form.studentClass.trim()) {
      setError('Kelas harus diisi!');
      return;
    }
    if (!form.whatsapp.trim()) {
      setError('Nomor WhatsApp harus diisi!');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.signUp({
        name: form.name,
        email: form.email,
        password: form.password,
        nis: form.nis,
        studentClass: form.studentClass,
        major: form.major,
        whatsapp: form.whatsapp,
      });

      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          onRegisterSuccess();
        }, 3000);
      } else {
        setError(result.message || 'Terjadi kesalahan saat registrasi');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const majorOptions = [
    'Desain Komunikasi Visual',
    'Multimedia',
    'Teknik Grafika',
    'Teknik Komputer dan Jaringan',
    'Rekayasa Perangkat Lunak',
    'Animasi',
    'Broadcasting',
    'Jurusan Lain',
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-slate-500 mb-6">
            Pendaftaran berhasil dikirim.
            <br />
            <strong>Silakan menunggu persetujuan admin TEFA.</strong>
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3 text-left">
              <span className="material-symbols-outlined text-2xl text-amber-500">info</span>
              <div>
                <p className="text-sm font-bold text-amber-800">Informasi Penting</p>
                <p className="text-xs text-amber-600 mt-1">
                  Admin akan memverifikasi data kamu. Setelah disetujui, kamu akan bisa login dan menggunakan platform.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onSwitchToLogin}
            className="w-full py-3 bg-[#5B4BFF] text-white font-bold rounded-xl hover:bg-[#4a3ce0] transition-all"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-[#5B4BFF] via-purple-600 to-[#3BA7FF] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl text-white">school</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800">Pendaftaran Siswa TEFA DKV</h1>
          <p className="text-sm text-slate-500 mt-1">SMK NU Ungaran</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-red-500">error</span>
            <p className="text-sm text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
              alt="Avatar"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200"
            />
            <div>
              <button
                type="button"
                onClick={() => setShowAvatarCrop(true)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all"
              >
                Upload Foto Profil
              </button>
              <p className="text-[10px] text-slate-400 mt-1">JPG, PNG, WEBP max 2MB</p>
            </div>
          </div>

          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Masukkan nama lengkap"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@smknuungaran.sch.id"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
            />
          </div>

          {/* Password */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Min. 8 karakter"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Konfirmasi *</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Ulangi password"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
              />
            </div>
          </div>

          {/* NIS */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">NIS *</label>
            <input
              type="text"
              value={form.nis}
              onChange={(e) => handleChange('nis', e.target.value)}
              placeholder="Nomor Induk Siswa"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
            />
          </div>

          {/* Kelas & Jurusan */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Kelas *</label>
              <input
                type="text"
                value={form.studentClass}
                onChange={(e) => handleChange('studentClass', e.target.value)}
                placeholder="XI DKV 1"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Jurusan</label>
              <select
                value={form.major}
                onChange={(e) => handleChange('major', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30 bg-white"
              >
                {majorOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Nomor WhatsApp *</label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => handleChange('whatsapp', e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#5B4BFF] text-white font-bold rounded-xl hover:bg-[#4a3ce0] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin material-symbols-outlined">progress_activity</span>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">how_to_reg</span>
                <span>Daftar</span>
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center mt-6 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Sudah punya akun?{' '}
            <button onClick={onSwitchToLogin} className="text-[#5B4BFF] font-bold hover:underline">
              Login di sini
            </button>
          </p>
        </div>
      </div>

      {/* Avatar Crop Modal */}
      {showAvatarCrop && (
        <AvatarCropModal
          isOpen={showAvatarCrop}
          initialImageSrc={avatar}
          onClose={() => setShowAvatarCrop(false)}
          onCropSave={handleAvatarSave}
        />
      )}
    </div>
  );
};

export default StudentRegisterView;

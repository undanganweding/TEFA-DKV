import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../../types';
import {
  authenticateUser,
  registerStudentAccount,
  resetUserPassword,
  createGuestUser,
} from '../../utils/authStore';
import { AvatarCropModal } from '../AvatarCropModal';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

interface SlideItem {
  id: number;
  title: string;
  description: string;
  features: string[];
  imageUrl: string;
  badge: string;
  visualTag: string;
}

const slides: SlideItem[] = [
  {
    id: 1,
    title: 'TEFA DKV Creative Management',
    description:
      'Platform digital enterprise terpadu untuk mengelola produksi cetak, kasir POS, manajemen file, dan workflow industri DKV.',
    features: ['Production Control', 'Point of Sales', 'File Inbox System'],
    imageUrl:
      'https://images.unsplash.com/photo-1542744094-3a31b272c390?w=1200&q=85',
    badge: 'TEFA DKV',
    visualTag: 'Studio & Workstation DKV',
  },
  {
    id: 2,
    title: 'Manajemen Produksi Real-Time',
    description:
      'Pantau alur pengerjaan order dari pemeriksaan file masuk, cetak outdoor/indoor, finishing, hingga siap diambil.',
    features: ['Production Tracking', 'Queue Management', 'Quality Inspection'],
    imageUrl:
      'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1200&q=85',
    badge: 'SMK NU UNGARAN',
    visualTag: 'Mesin Press & Large Format Print',
  },
  {
    id: 3,
    title: 'Workspace Digital Siswa',
    description:
      'Wadah nyata siswa DKV untuk berkolaborasi, submit karya cetak, menerima order industri, dan melihat histori transaksi.',
    features: ['Student Asset Hub', 'Direct Order Form', 'Order Status Timeline'],
    imageUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=85',
    badge: 'Teaching Factory',
    visualTag: 'Portfolio & Project Management',
  },
];

type AuthTab = 'login' | 'register_student' | 'forgot_password';

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  // Slider State
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Active Auth Tab
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  // Login Form State
  const [emailOrUsername, setEmailOrUsername] = useState<string>('syifaanjay@gmail.com');
  const [password, setPassword] = useState<string>('punyadkv123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Student Register Form State
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regNis, setRegNis] = useState<string>('');
  const [regClass, setRegClass] = useState<string>('XI DKV 1');
  const [regMajor, setRegMajor] = useState<string>('Desain Komunikasi Visual');
  const [regWhatsapp, setRegWhatsapp] = useState<string>('');
  const [regAvatarUrl, setRegAvatarUrl] = useState<string>('');
  const [showCropModal, setShowCropModal] = useState<boolean>(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  // Notification & Loading States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Slider Timer
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Switch Auth Tab
  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab);
    setErrorMessage(null);
    setSuccessToast(null);
  };

  // Submit Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessToast(null);

    if (!emailOrUsername.trim()) {
      setErrorMessage('Silakan masukkan Email atau Username terdaftar.');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan kata sandi akun Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = authenticateUser(emailOrUsername, password);
      setIsLoading(false);

      if (!result.success || !result.user) {
        setErrorMessage(result.message || 'Otentikasi gagal.');
        return;
      }

      const user = result.user;
      setSuccessToast(`Otentikasi Berhasil! Pengalihan ke ${user.role} Platform...`);

      setTimeout(() => {
        onLoginSuccess(user);
      }, 800);
    }, 900);
  };

  // Submit Student Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessToast(null);

    if (!regName.trim()) {
      setErrorMessage('Nama Lengkap wajib diisi.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('Email aktif wajib diisi.');
      return;
    }
    if (!regNis.trim()) {
      setErrorMessage('NIS Siswa wajib diisi.');
      return;
    }
    if (!regWhatsapp.trim()) {
      setErrorMessage('Nomor WhatsApp wajib diisi.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = registerStudentAccount({
        name: regName,
        email: regEmail,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        nis: regNis,
        studentClass: regClass,
        major: regMajor,
        whatsapp: regWhatsapp,
        avatar: regAvatarUrl,
      });

      setIsLoading(false);

      if (!result.success || !result.user) {
        setErrorMessage(result.message || 'Pendaftaran gagal.');
        return;
      }

      setSuccessToast('Pendaftaran berhasil! Menunggu persetujuan admin TEFA.');

      // Reset form & redirect to login after short delay
      setTimeout(() => {
        setEmailOrUsername(result.user!.email);
        setPassword(regPassword);
        setActiveTab('login');
        setSuccessToast('Akun Anda telah terdaftar dan menunggu persetujuan admin.');
      }, 2000);
    }, 900);
  };

  // Submit Forgot Password Step 1
  const handleForgotVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!forgotEmail.trim()) {
      setErrorMessage('Masukkan email terdaftar Anda.');
      return;
    }

    setForgotStep(2);
  };

  // Submit Forgot Password Step 2 (Reset)
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = resetUserPassword(forgotEmail, newPasswordInput);
    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    setSuccessToast(res.message);
    setTimeout(() => {
      setEmailOrUsername(forgotEmail);
      setPassword(newPasswordInput);
      setActiveTab('login');
      setForgotStep(1);
      setForgotEmail('');
      setNewPasswordInput('');
    }, 1200);
  };

  // Guest Customer Entrance
  const handleEnterGuestMode = () => {
    const guestUser = createGuestUser();
    setSuccessToast('Mengakses Guest Customer Platform (Tanpa Akun)...');
    setTimeout(() => {
      onLoginSuccess(guestUser);
    }, 600);
  };

  const activeSlide = slides[currentSlide];

  return (
    <div className="min-h-screen w-full bg-[#0F1322] text-slate-100 flex items-center justify-center p-3 sm:p-6 font-sans relative overflow-hidden select-none">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-[#5B4BFF]/25 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Card Container */}
      <div className="relative w-full max-w-[1360px] bg-[#151A2D]/90 backdrop-blur-2xl border border-slate-800/90 rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[720px]">
        {/* ========================================================================= */}
        {/* LEFT AREA: STUDIO & ECOSYSTEM SHOWCASE PANEL (70% Light / 20% Dark Navy)  */}
        {/* ========================================================================= */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="lg:col-span-7 relative bg-[#0B0E19] overflow-hidden flex flex-col justify-between p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-slate-800/80 min-h-[480px] lg:min-h-full group"
        >
          {/* Slide Background Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1.02 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 z-0"
            >
              <img
                src={activeSlide.imageUrl}
                alt={activeSlide.title}
                className="w-full h-full object-cover opacity-40 mix-blend-luminosity filter contrast-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E19] via-[#0B0E19]/70 to-[#0B0E19]/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E19]/90 via-transparent to-[#0B0E19]/90" />
            </motion.div>
          </AnimatePresence>

          {/* Header Brand Badge */}
          <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/15 px-4 py-2.5 rounded-2xl shadow-lg">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5B4BFF] via-purple-600 to-[#3BA7FF] flex items-center justify-center text-white shadow-md font-black shrink-0 border border-white/30">
                <span className="material-symbols-outlined text-lg">palette</span>
              </div>
              <div>
                <h2 className="text-sm font-black text-white tracking-tight leading-none">
                  TEFA DKV
                </h2>
                <p className="text-[10px] text-purple-200 font-bold uppercase tracking-wider mt-0.5">
                  SMK NU UNGARAN
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full text-[11px] font-extrabold bg-[#5B4BFF]/30 text-purple-200 border border-[#5B4BFF]/50 backdrop-blur-md">
                {activeSlide.badge}
              </span>
              <span className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-[11px] font-extrabold bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md">
                Production System
              </span>
            </div>
          </div>

          {/* Middle Glass Information Box */}
          <div className="relative z-10 my-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-slate-900/85 backdrop-blur-2xl border border-slate-700/80 p-6 sm:p-8 rounded-[28px] shadow-2xl relative overflow-hidden"
              >
                <div className="w-12 h-1.5 rounded-full bg-gradient-to-r from-[#5B4BFF] to-cyan-400 mb-5" />

                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-0.5 rounded-md inline-block mb-2">
                  {activeSlide.visualTag}
                </span>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mb-3">
                  {activeSlide.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-xl mb-6">
                  {activeSlide.description}
                </p>

                <div className="flex items-center gap-2.5 flex-wrap pt-2 border-t border-slate-800/80">
                  {activeSlide.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 bg-[#151A2D]/90 border border-slate-700/70 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-sm text-emerald-400 font-black">
                        check_circle
                      </span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slider Controls */}
          <div className="relative z-10 flex items-center justify-between gap-4 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    currentSlide === idx
                      ? 'w-8 h-2.5 bg-gradient-to-r from-[#5B4BFF] to-cyan-400 shadow-md shadow-purple-500/50'
                      : 'w-2.5 h-2.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                className="w-10 h-10 rounded-2xl bg-slate-900/80 hover:bg-[#5B4BFF] text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                className="w-10 h-10 rounded-2xl bg-slate-900/80 hover:bg-[#5B4BFF] text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT AREA: 70% WHITE / LIGHT PREMIUM AUTHENTICATION CARD                 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-white text-slate-900 p-6 sm:p-10 flex flex-col justify-between relative overflow-y-auto font-sans">
          <div>
            {/* Top Auth Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 mb-6 gap-2">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Masuk Akun
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('register_student')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'register_student'
                      ? 'bg-gradient-to-r from-[#5B4BFF] to-purple-600 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Daftar Siswa
                </button>
              </div>

              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Production ERP
              </span>
            </div>

            {/* Error Notification Toast */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-800 font-bold"
              >
                <span className="material-symbols-outlined text-base text-red-600 shrink-0">
                  error
                </span>
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Success Notification Toast */}
            {successToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold"
              >
                <span className="material-symbols-outlined text-base text-emerald-600 shrink-0">
                  check_circle
                </span>
                <span>{successToast}</span>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: LOGIN FORM                                                         */}
            {/* ========================================================================= */}
            {activeTab === 'login' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
                    Selamat Datang
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-bold">
                    Masuk ke Platform TEFA DKV SMK NU Ungaran
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email / Username Input */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Email / Username Akun
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                        mail
                      </span>
                      <input
                        type="text"
                        required
                        value={emailOrUsername}
                        onChange={(e) => setEmailOrUsername(e.target.value)}
                        placeholder="email@smknuungaran.sch.id / username"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/10 text-xs sm:text-sm font-semibold text-slate-900 transition-all focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-extrabold text-slate-700">
                        Kata Sandi (Password)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleTabChange('forgot_password')}
                        className="text-xs font-extrabold text-[#5B4BFF] hover:underline cursor-pointer"
                      >
                        Lupa Password?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                        lock
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan kata sandi"
                        className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#5B4BFF] focus:ring-3 focus:ring-purple-500/10 text-xs sm:text-sm font-semibold text-slate-900 transition-all focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-lg cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Remember me option */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded-md text-[#5B4BFF] focus:ring-purple-500 border-slate-300 accent-[#5B4BFF] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-600">
                        Ingat Saya di Perangkat Ini
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#5B4BFF] via-indigo-600 to-purple-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black text-sm tracking-wide shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-[1.01] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Memverifikasi Sesi...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk Dashboard</span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <span className="relative bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Akses Tanpa Akun
                  </span>
                </div>

                {/* Guest Customer Access Button */}
                <button
                  type="button"
                  onClick={handleEnterGuestMode}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-slate-300"
                >
                  <span className="material-symbols-outlined text-base text-[#5B4BFF]">
                    person_outline
                  </span>
                  <span>Masuk sebagai Guest Customer (Pelanggan)</span>
                </button>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: REGISTER STUDENT FORM (/register/student)                          */}
            {/* ========================================================================= */}
            {activeTab === 'register_student' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-5">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">
                    Pendaftaran Akun Siswa
                  </h2>
                  <p className="text-xs text-slate-500 font-bold">
                    Khusus Siswa SMK NU Ungaran Jurusan DKV
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  {/* Foto Profil Preview & Upload Trigger */}
                  <div className="flex items-center gap-3 p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl">
                    {regAvatarUrl ? (
                      <img
                        src={regAvatarUrl}
                        alt="Preview Avatar"
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#5B4BFF] shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-purple-200 text-[#5B4BFF] flex items-center justify-center text-xl font-black border-2 border-purple-300">
                        <span className="material-symbols-outlined">account_circle</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900">Foto Profil Siswa</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        Format JPG, PNG, WEBP (Maksimal 2 MB)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCropModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      Upload & Crop
                    </button>
                  </div>

                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Nama Lengkap Siswa
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Contoh: Rizky Dwi Prasetya"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#5B4BFF]"
                    />
                  </div>

                  {/* Email & WhatsApp Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        Email Aktif
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="siswa@smknuungaran.sch.id"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#5B4BFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        Nomor WhatsApp
                      </label>
                      <input
                        type="text"
                        required
                        value={regWhatsapp}
                        onChange={(e) => setRegWhatsapp(e.target.value)}
                        placeholder="081234567890"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#5B4BFF]"
                      />
                    </div>
                  </div>

                  {/* NIS, Kelas & Jurusan Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                        NIS Siswa
                      </label>
                      <input
                        type="text"
                        required
                        value={regNis}
                        onChange={(e) => setRegNis(e.target.value)}
                        placeholder="202611045"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#5B4BFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                        Kelas
                      </label>
                      <select
                        value={regClass}
                        onChange={(e) => setRegClass(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#5B4BFF]"
                      >
                        <option value="X DKV 1">X DKV 1</option>
                        <option value="X DKV 2">X DKV 2</option>
                        <option value="XI DKV 1">XI DKV 1</option>
                        <option value="XI DKV 2">XI DKV 2</option>
                        <option value="XII DKV 1">XII DKV 1</option>
                        <option value="XII DKV 2">XII DKV 2</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1 truncate">
                        Jurusan
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={regMajor}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        Password (Min 8 Karakter)
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#5B4BFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        Konfirmasi Password
                      </label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ulangi password"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#5B4BFF]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-[#5B4BFF] to-purple-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black text-xs tracking-wide shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Mendaftarkan Siswa...</span>
                      </>
                    ) : (
                      <>
                        <span>Daftar Akun Siswa</span>
                        <span className="material-symbols-outlined text-base">how_to_reg</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: FORGOT PASSWORD FLOW                                               */}
            {/* ========================================================================= */}
            {activeTab === 'forgot_password' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-5">
                  <button
                    type="button"
                    onClick={() => handleTabChange('login')}
                    className="text-xs font-extrabold text-[#5B4BFF] flex items-center gap-1 mb-2 hover:underline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    <span>Kembali ke Halaman Login</span>
                  </button>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">
                    Lupa Kata Sandi?
                  </h2>
                  <p className="text-xs text-slate-500 font-bold">
                    Pemulihan kata sandi akun TEFA DKV
                  </p>
                </div>

                {forgotStep === 1 ? (
                  <form onSubmit={handleForgotVerifyEmail} className="space-y-4">
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Masukkan email terdaftar Anda di sistem TEFA DKV. Kami akan memverifikasi identitas akun Anda.
                    </p>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                        Email Terdaftar
                      </label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="nama@smknuungaran.sch.id"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#5B4BFF]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl bg-[#5B4BFF] hover:bg-purple-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer"
                    >
                      Lanjutkan Reset Password
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 font-bold">
                      Email terverifikasi: {forgotEmail}
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                        Password Baru (Min 8 Karakter)
                      </label>
                      <input
                        type="password"
                        required
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="Masukkan password baru"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#5B4BFF]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#5B4BFF] to-purple-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                    >
                      Simpan Password Baru
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </div>

          {/* Bottom Footer Credits */}
          <div className="pt-6 border-t border-slate-100 mt-6 text-center text-[11px] text-slate-400 font-bold flex items-center justify-between">
            <span>© 2026 TEFA DKV SMK NU Ungaran</span>
            <span className="text-[#5B4BFF]">Enterprise Platform</span>
          </div>
        </div>
      </div>

      {/* Avatar Crop Modal */}
      <AvatarCropModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        onCropSave={(croppedUrl) => {
          setRegAvatarUrl(croppedUrl);
          setShowCropModal(false);
        }}
      />
    </div>
  );
};

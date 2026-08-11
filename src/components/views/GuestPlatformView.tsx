import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ProductionOrder } from '../../types';

interface GuestPlatformViewProps {
  onSwitchToAdmin?: () => void;
  onLogout?: () => void;
}

type GuestPage = 'landing' | 'order' | 'tracking';

const services = [
  { id: 'cetak_dokumen', name: 'Cetak Dokumen', icon: 'description', desc: 'Poster, Brosur, Banner' },
  { id: 'cetak_foto', name: 'Cetak Foto', icon: 'photo_library', desc: 'Foto ukuran apapun' },
  { id: 'merchandise', name: 'Merchandise', icon: 'redeem', desc: 'Pin, Mug, Sticker' },
  { id: 'custom', name: 'Custom Order', icon: 'design_services', desc: 'Desain sesuai request' },
];

const products = [
  { name: 'Cetak Banner Flexi 280gr', price: 'Rp 18.000/m²' },
  { name: 'Stiker Vinyl Glossy A3+', price: 'Rp 12.000/lembar' },
  { name: 'Pin Bros Custom 44mm', price: 'Rp 4.500/pcs' },
  { name: 'Kartu Nama Art Paper', price: 'Rp 35.000/box' },
];

export const GuestPlatformView: React.FC<GuestPlatformViewProps> = ({
  onSwitchToAdmin,
  onLogout,
}) => {
  const [currentPage, setCurrentPage] = useState<GuestPage>('landing');

  // Order Form State
  const [orderForm, setOrderForm] = useState({
    name: '',
    whatsapp: '',
    email: '',
    service: '',
    notes: '',
  });
  const [orderFile, setOrderFile] = useState<File | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Tracking State
  const [trackInput, setTrackInput] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.name || !orderForm.whatsapp || !orderForm.service) {
      alert('Mohon lengkapi form!');
      return;
    }

    // Generate order ID
    const orderId = `TEFA-GUEST-2026-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
    setOrderSuccess(orderId);
    setOrderForm({ name: '', whatsapp: '', email: '', service: '', notes: '' });
    setOrderFile(null);
  };

  const handleTrack = () => {
    // Simulate tracking
    if (trackInput.trim()) {
      setTrackResult({
        orderId: trackInput,
        product: 'Cetak Banner Flexi',
        date: '11 Agu 2026',
        status: 'Diproses',
      });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => setCurrentPage('landing')} className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5B4BFF] to-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">palette</span>
            </div>
            <div>
              <h1 className="font-black text-slate-800 text-lg leading-tight">TEFA DKV</h1>
              <p className="text-[10px] text-slate-500 font-bold">SMK NU UNGARAN</p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage('order')}
              className="px-4 py-2 bg-[#5B4BFF] hover:bg-[#4a3ce0] text-white font-bold text-sm rounded-xl transition-all"
            >
              Buat Pesanan
            </button>
            <button
              onClick={onSwitchToAdmin}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all"
            >
              Login Admin
            </button>
          </div>
        </div>
      </header>

      {/* LANDING PAGE */}
      {currentPage === 'landing' && (
        <div>
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 text-white py-20 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold mb-4 backdrop-blur-sm">
                  Teaching Factory Desain Komunikasi Visual
                </span>
                <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                  Pesan Layanan Kreatif
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    TEFA DKV
                  </span>
                </h1>
                <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                  Layanan cetak dan desain berkualitas dari siswa SMK NU Ungaran.
                  Cepat, murah, dan hasil profesional.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => setCurrentPage('order')}
                    className="px-8 py-4 bg-[#5B4BFF] hover:bg-[#4a3ce0] text-white font-black text-lg rounded-2xl shadow-xl shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">add_circle</span>
                    Buat Pesanan
                  </button>
                  <button
                    onClick={() => setCurrentPage('tracking')}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-black text-lg rounded-2xl backdrop-blur-sm transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">search</span>
                    Cek Status Pesanan
                  </button>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Services Section */}
          <section className="py-16 px-4 bg-slate-50">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-black text-slate-800 text-center mb-10">Layanan Kami</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {services.map((service) => (
                  <motion.div
                    key={service.id}
                    whileHover={{ scale: 1.03 }}
                    className="bg-white p-6 rounded-2xl border border-slate-200 text-center cursor-pointer hover:border-[#5B4BFF]/30 hover:shadow-lg transition-all"
                    onClick={() => {
                      setOrderForm(prev => ({ ...prev, service: service.id }));
                      setCurrentPage('order');
                    }}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5B4BFF] to-purple-600 flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-white text-2xl">{service.icon}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1">{service.name}</h3>
                    <p className="text-xs text-slate-500">{service.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Products Section */}
          <section className="py-16 px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-black text-slate-800 text-center mb-10">Produk Unggulan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((product, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-lg transition-all"
                  >
                    <div className="w-full h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl mb-4 flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-slate-300">image</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{product.name}</h3>
                    <p className="text-[#5B4BFF] font-black">{product.price}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="py-12 px-4 bg-slate-900 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-black mb-4">Hubungi Kami</h2>
              <p className="text-slate-400 mb-6">TEFA DKV SMK NU Ungaran siap membantu kebutuhan cetak Anda</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                  <span className="material-symbols-outlined text-[#5B4BFF]">phone</span>
                  <span className="font-bold">0812-3456-7890</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                  <span className="material-symbols-outlined text-[#5B4BFF]">location_on</span>
                  <span className="font-bold">SMK NU Ungaran</span>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-6 px-4 bg-slate-950 text-slate-500 text-center text-xs">
            <p>© 2026 TEFA DKV SMK NU Ungaran. All rights reserved.</p>
          </footer>
        </div>
      )}

      {/* ORDER PAGE */}
      {currentPage === 'order' && (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
          <div className="max-w-xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => setCurrentPage('landing')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-bold mb-6 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Kembali
            </button>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-white text-3xl">add_circle</span>
                </div>
                <h1 className="text-2xl font-black text-slate-800">Buat Pesanan</h1>
                <p className="text-slate-500 text-sm mt-1">Isi form di bawah untuk memesan layanan</p>
              </div>

              {/* Success Message */}
              {orderSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-4xl text-emerald-500">check_circle</span>
                  </div>
                  <h3 className="text-xl font-black text-emerald-800 mb-2">Pesanan Berhasil!</h3>
                  <p className="text-emerald-600 text-sm mb-4">Simpan kode pesanan Anda untuk tracking:</p>
                  <div className="bg-white border-2 border-emerald-300 rounded-xl px-6 py-3 inline-block">
                    <span className="text-2xl font-black text-emerald-700 tracking-wider">{orderSuccess}</span>
                  </div>
                  <p className="text-xs text-emerald-500 mt-4">
                    Pesanan akan diproses setelah diverifikasi admin
                  </p>
                  <button
                    onClick={() => {
                      setOrderSuccess(null);
                      setCurrentPage('tracking');
                    }}
                    className="mt-4 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
                  >
                    Lacak Pesanan
                  </button>
                </motion.div>
              )}

              {/* Order Form */}
              {!orderSuccess && (
                <form onSubmit={handleSubmitOrder} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={orderForm.name}
                      onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                      placeholder="Masukkan nama lengkap"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30 focus:border-[#5B4BFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Nomor WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={orderForm.whatsapp}
                      onChange={(e) => setOrderForm({ ...orderForm, whatsapp: e.target.value })}
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30 focus:border-[#5B4BFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Email <span className="text-slate-400">(Opsional)</span>
                    </label>
                    <input
                      type="email"
                      value={orderForm.email}
                      onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30 focus:border-[#5B4BFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Pilih Layanan <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {services.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => setOrderForm({ ...orderForm, service: service.id })}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            orderForm.service === service.id
                              ? 'border-[#5B4BFF] bg-[#5B4BFF]/5'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-2xl ${
                            orderForm.service === service.id ? 'text-[#5B4BFF]' : 'text-slate-400'
                          }`}>{service.icon}</span>
                          <p className={`font-bold text-sm mt-2 ${
                            orderForm.service === service.id ? 'text-[#5B4BFF]' : 'text-slate-700'
                          }`}>{service.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Upload File Desain <span className="text-slate-400">(Opsional)</span>
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-[#5B4BFF]/50 transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-4xl text-slate-300">upload_file</span>
                      <p className="text-sm text-slate-500 mt-2">Klik atau drag file ke sini</p>
                      <p className="text-xs text-slate-400">JPG, PNG, PDF, AI, CDR (Max 10MB)</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Catatan Pesanan <span className="text-slate-400">(Opsional)</span>
                    </label>
                    <textarea
                      value={orderForm.notes}
                      onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                      placeholder="Ukuran, jumlah, keterangan tambahan..."
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30 focus:border-[#5B4BFF] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#5B4BFF] hover:bg-[#4a3ce0] text-white font-black text-lg rounded-2xl shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">send</span>
                    Kirim Pesanan
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRACKING PAGE */}
      {currentPage === 'tracking' && (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
          <div className="max-w-xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => setCurrentPage('landing')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-bold mb-6 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Kembali
            </button>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-white text-3xl">search</span>
                </div>
                <h1 className="text-2xl font-black text-slate-800">Lacak Pesanan</h1>
                <p className="text-slate-500 text-sm mt-1">Masukkan Order ID atau Nomor WhatsApp</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Order ID</label>
                  <input
                    type="text"
                    value={trackInput}
                    onChange={(e) => setTrackInput(e.target.value)}
                    placeholder="TEFA-GUEST-2026-001"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30 focus:border-[#5B4BFF]"
                  />
                </div>

                <button
                  onClick={handleTrack}
                  className="w-full py-4 bg-[#5B4BFF] hover:bg-[#4a3ce0] text-white font-black text-lg rounded-2xl shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">search</span>
                  Lacak
                </button>
              </div>

              {/* Track Result */}
              {trackResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 bg-slate-50 rounded-2xl p-6"
                >
                  <h3 className="font-bold text-slate-800 mb-4">Hasil Tracking</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-500">Order ID</span>
                      <span className="font-bold text-slate-800">{trackResult.orderId}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-500">Produk</span>
                      <span className="font-bold text-slate-800">{trackResult.product}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-500">Tanggal</span>
                      <span className="font-bold text-slate-800">{trackResult.date}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Status</span>
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold text-sm rounded-full">
                        {trackResult.status}
                      </span>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="mt-6 space-y-4">
                    {['Menunggu Admin', 'Diproses', 'Selesai', 'Diterima'].map((step, idx) => {
                      const isActive = trackResult.status === step ||
                        (trackResult.status === 'Diproses' && idx <= 2) ||
                        (trackResult.status === 'Selesai' && idx <= 3) ||
                        (trackResult.status === 'Diterima');
                      return (
                        <div key={step} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                            <span className="material-symbols-outlined text-sm">
                              {isActive ? 'check' : 'radio_button_unchecked'}
                            </span>
                          </div>
                          <span className={`text-sm font-bold ${
                            isActive ? 'text-slate-800' : 'text-slate-400'
                          }`}>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

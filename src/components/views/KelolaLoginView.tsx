import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getLoginSlides, saveLoginSlides, SlideItem } from '../../utils/loginContentStore';

export const KelolaLoginView: React.FC = () => {
  const [slides, setSlides] = useState<SlideItem[]>(getLoginSlides());
  const [editingSlide, setEditingSlide] = useState<SlideItem | null>(null);
  
  // Form fields state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [featuresInput, setFeaturesInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [badge, setBadge] = useState('');
  const [visualTag, setVisualTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFeaturesInput('');
    setImageUrl('');
    setBadge('');
    setVisualTag('');
    setEditingSlide(null);
    setIsAdding(false);
  };

  const handleEditClick = (slide: SlideItem) => {
    setEditingSlide(slide);
    setTitle(slide.title);
    setDescription(slide.description);
    setFeaturesInput(slide.features.join(', '));
    setImageUrl(slide.imageUrl);
    setBadge(slide.badge);
    setVisualTag(slide.visualTag);
    setIsAdding(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !imageUrl || !badge || !visualTag) {
      alert('Mohon lengkapi seluruh field wajib!');
      return;
    }

    const features = featuresInput
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    let updatedSlides = [...slides];

    if (editingSlide) {
      // Edit mode
      updatedSlides = updatedSlides.map((s) =>
        s.id === editingSlide.id
          ? { ...s, title, description, features, imageUrl, badge, visualTag }
          : s
      );
    } else {
      // Add mode
      const newId = slides.length > 0 ? Math.max(...slides.map((s) => s.id)) + 1 : 1;
      const newSlide: SlideItem = {
        id: newId,
        title,
        description,
        features,
        imageUrl,
        badge,
        visualTag,
      };
      updatedSlides.push(newSlide);
    }

    saveLoginSlides(updatedSlides);
    setSlides(updatedSlides);
    resetForm();
    alert('Konten halaman login berhasil disimpan!');
  };

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus slide ini?')) {
      const updated = slides.filter((s) => s.id !== id);
      saveLoginSlides(updated);
      setSlides(updated);
      if (editingSlide?.id === id) {
        resetForm();
      }
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header View */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200/80 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Kelola Konten Login</h1>
          <p className="text-xs text-slate-500 font-bold mt-1">Atur teks, fitur promosi, dan tayangan slide (slideshow) di halaman masuk utama.</p>
        </div>
        {!isAdding && !editingSlide && (
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="px-5 py-2.5 bg-[#5B4BFF] hover:bg-[#4a3ce0] text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-500/10 hover:shadow-lg transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-black">add</span>
            Tambah Slide Baru
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Slide List */}
        <div className={`space-y-4 ${isAdding || editingSlide ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-2">Daftar Slide Aktif ({slides.length})</h2>
          
          {slides.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">slideshow</span>
              <p className="text-sm text-slate-550 font-bold">Tidak ada slide login terdaftar.</p>
              <button
                onClick={() => setIsAdding(true)}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Buat Slide Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className={`bg-white border rounded-2xl overflow-hidden p-4 flex flex-col md:flex-row gap-4 transition-all hover:shadow-md ${
                    editingSlide?.id === slide.id ? 'border-[#5B4BFF] ring-2 ring-[#5B4BFF]/10' : 'border-slate-200/85'
                  }`}
                >
                  {/* Image Preview */}
                  <div className="w-full md:w-36 h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 relative">
                    <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 text-[9px] bg-slate-900/85 text-white font-extrabold px-2 py-0.5 rounded-md backdrop-blur-xs">
                      ID: {slide.id}
                    </span>
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[9px] bg-[#5B4BFF]/10 text-[#5B4BFF] font-extrabold px-2.5 py-0.5 rounded-full">
                          {slide.badge}
                        </span>
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
                          {slide.visualTag}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-sm leading-snug">{slide.title}</h3>
                      <p className="text-xs text-slate-500 font-bold line-clamp-2 mt-1 leading-relaxed">{slide.description}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 justify-end">
                      <button
                        onClick={() => handleEditClick(slide)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[12px]">edit</span>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(slide.id)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 font-bold text-[10px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[12px]">delete</span>
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Form editor */}
        <AnimatePresence>
          {(isAdding || editingSlide) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-6 bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-sm space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-slate-850 text-sm">
                  {editingSlide ? `Edit Slide (ID: ${editingSlide.id})` : 'Tambah Slide Baru'}
                </h3>
                <button
                  onClick={resetForm}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Badge <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Contoh: TEFA DKV / BARU"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5B4BFF] bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Judul Slide (Title) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Layanan Cetak Instan"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5B4BFF] bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Deskripsi Singkat <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tuliskan penjelasan singkat mengenai slide ini..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5B4BFF] bg-slate-50/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Fitur / Tag Tambahan <span className="text-slate-400 font-normal">(Pisahkan dengan koma)</span>
                  </label>
                  <input
                    type="text"
                    value={featuresInput}
                    onChange={(e) => setFeaturesInput(e.target.value)}
                    placeholder="Contoh: Cepat, Murah, Kualitas Tinggi"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5B4BFF] bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    URL Gambar Konten (Image Link) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5B4BFF] bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Tag Visual <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={visualTag}
                    onChange={(e) => setVisualTag(e.target.value)}
                    placeholder="Contoh: Studio DKV / Mesin Cetak"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5B4BFF] bg-slate-50/50"
                  />
                </div>

                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#5B4BFF] hover:bg-[#4a3ce0] text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-500/10 transition-all cursor-pointer"
                  >
                    {editingSlide ? 'Simpan Perubahan' : 'Simpan Baru'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

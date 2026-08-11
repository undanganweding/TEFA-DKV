import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ToolInventory } from '../../types';
import { Pagination } from '../Pagination';
import { ImageUploader } from '../ImageUploader';

interface InventarisAlatViewProps {
  tools: ToolInventory[];
  onArchiveTool?: (toolId: string) => void;
  onAddTool?: (newTool: ToolInventory) => void;
  onUpdateTool?: (updatedTool: ToolInventory) => void;
}

export const InventarisAlatView: React.FC<InventarisAlatViewProps> = ({
  tools,
  onArchiveTool,
  onAddTool,
  onUpdateTool,
}) => {
  const [selectedCondition, setSelectedCondition] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals state
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingTool, setEditingTool] = useState<ToolInventory | null>(null);
  const [detailTool, setDetailTool] = useState<ToolInventory | null>(null);
  
  // Lightbox state for image gallery
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    tool: ToolInventory | null;
    activeImageIdx: number;
  }>({
    isOpen: false,
    tool: null,
    activeImageIdx: 0,
  });

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<ToolInventory['category']>('Mesin Cetak Utama');
  const [location, setLocation] = useState<ToolInventory['location']>('Lab Cetak 1');
  const [condition, setCondition] = useState<ToolInventory['condition']>('Sangat Baik');
  const [status, setStatus] = useState<ToolInventory['status']>('Tersedia');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState<number>(0);
  const [picName, setPicName] = useState('');
  const [specification, setSpecification] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState<number>(0);

  const filteredTools = tools.filter((t) => {
    const matchCondition = selectedCondition === 'Semua' || t.condition === selectedCondition;
    
    // Safety check fields
    const tBrand = t.brand || '';
    const tModel = t.model || '';
    const tPic = t.picName || '';
    const q = searchQuery.toLowerCase();
    
    const matchSearch =
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      tPic.toLowerCase().includes(q) ||
      tBrand.toLowerCase().includes(q) ||
      tModel.toLowerCase().includes(q);
      
    return matchCondition && matchSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCondition, searchQuery]);

  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(filteredTools.length / ITEMS_PER_PAGE) || 1;
  const paginatedTools = filteredTools.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const openAddModal = () => {
    setEditingTool(null);
    setCode('ALT-' + Math.floor(100 + Math.random() * 900));
    setName('');
    setCategory('Mesin Cetak Utama');
    setLocation('Lab Cetak 1');
    setCondition('Sangat Baik');
    setStatus('Tersedia');
    setBrand('');
    setModel('');
    setSerialNumber('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setAcquisitionCost(0);
    setPicName('Kepala Lab DKV');
    setSpecification('');
    setImages([]);
    setCoverIndex(0);
    setShowFormModal(true);
  };

  const openEditModal = (t: ToolInventory) => {
    setEditingTool(t);
    setCode(t.code);
    setName(t.name);
    setCategory(t.category);
    setLocation(t.location);
    setCondition(t.condition);
    setStatus(t.status);
    setBrand(t.brand || '');
    setModel(t.model || '');
    setSerialNumber(t.serialNumber || '');
    setPurchaseDate(t.purchaseDate || new Date().toISOString().split('T')[0]);
    setAcquisitionCost(t.acquisitionCost || 0);
    setPicName(t.picName);
    setSpecification(t.specification || '');
    const tImages = t.images || [];
    setImages(tImages);
    const covIdx = t.coverImage ? tImages.indexOf(t.coverImage) : 0;
    setCoverIndex(covIdx > -1 ? covIdx : 0);
    setShowFormModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const coverImage = images[coverIndex] || images[0] || undefined;
    const finalAcqCost = Number(acquisitionCost) || 0;

    const data: ToolInventory = {
      id: editingTool ? editingTool.id : 'ALT-' + Date.now(),
      code,
      name: name.trim(),
      category,
      location,
      condition,
      status,
      brand: brand.trim(),
      model: model.trim(),
      serialNumber: serialNumber.trim(),
      purchaseDate,
      acquisitionCost: finalAcqCost,
      picName: picName.trim(),
      specification: specification.trim(),
      images,
      coverImage,
      lastMaintenance: editingTool ? editingTool.lastMaintenance : new Date().toLocaleDateString('id-ID'),
    };

    if (editingTool) {
      if (onUpdateTool) onUpdateTool(data);
      if (detailTool && detailTool.id === editingTool.id) {
        setDetailTool(data);
      }
    } else {
      if (onAddTool) onAddTool(data);
    }
    setShowFormModal(false);
  };

  const getConditionBadge = (cond: string) => {
    switch (cond) {
      case 'Sangat Baik':
        return 'bg-emerald-100 text-emerald-800 border-emerald-205';
      case 'Baik':
        return 'bg-blue-100 text-blue-800 border-blue-205';
      case 'Perlu Perbaikan':
        return 'bg-amber-100 text-amber-800 border-amber-205';
      case 'Rusak':
        return 'bg-red-100 text-red-800 border-red-205';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-205';
    }
  };

  const getFallbackToolImage = (cat: string) => {
    switch (cat) {
      case 'Mesin Cetak Utama':
        return 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&q=80';
      case 'Mesin Finishing':
        return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80';
      case 'Peralatan Fotografi':
        return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80';
      case 'Hardware Komputer':
        return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80';
      default:
        return 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&q=80';
    }
  };

  const formatRupiah = (val: number) => 'Rp ' + (val || 0).toLocaleString('id-ID');

  // Lightbox navigation
  const nextImage = () => {
    if (!lightboxState.tool || !lightboxState.tool.images) return;
    const count = lightboxState.tool.images.length;
    setLightboxState((prev) => ({
      ...prev,
      activeImageIdx: (prev.activeImageIdx + 1) % count,
    }));
  };

  const prevImage = () => {
    if (!lightboxState.tool || !lightboxState.tool.images) return;
    const count = lightboxState.tool.images.length;
    setLightboxState((prev) => ({
      ...prev,
      activeImageIdx: (prev.activeImageIdx - 1 + count) % count,
    }));
  };

  return (
    <div className="space-y-5 pb-10 font-sans text-slate-800">
      {/* Header */}
      <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Inventaris Peralatan & Mesin Lab DKV
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Pencatatan aset mesin cetak, finishing, kamera studio, dan PC laboratorium.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openAddModal}
            className="bg-[#5B4BFF] hover:bg-[#4a3ce6] text-white font-extrabold text-xs px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>+ Tambah Alat Baru</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-[20px] border border-slate-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {['Semua', 'Sangat Baik', 'Baik', 'Perlu Perbaikan', 'Rusak'].map((cond) => (
            <button
              key={cond}
              onClick={() => setSelectedCondition(cond)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                selectedCondition === cond
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cond}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mesin, kode, merk..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#5B4BFF] focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Compact Equipment Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage + selectedCondition + searchQuery}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {paginatedTools.length === 0 ? (
            <div className="col-span-full bg-white rounded-[24px] p-10 text-center border border-slate-200/80 shadow-2xs text-slate-400 font-bold text-xs">
              Tidak ada aset ditemukan.
            </div>
          ) : (
            paginatedTools.map((tool) => (
              <motion.div
                key={tool.id}
                whileHover={{ y: -3 }}
                className="bg-white rounded-[22px] border border-slate-200/80 hover:border-purple-300 p-4 shadow-2xs hover:shadow-lg hover:shadow-purple-500/10 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-slate-100 text-slate-700 font-mono font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200">
                      {tool.code}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getConditionBadge(
                        tool.condition
                      )}`}
                    >
                      {tool.condition}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mb-2 cursor-pointer" onClick={() => setDetailTool(tool)}>
                    <div className="w-14 h-14 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-100">
                      <img
                        src={tool.coverImage || tool.images?.[0] || getFallbackToolImage(tool.category)}
                        alt={tool.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-[#5B4BFF] transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-[11px] font-bold text-[#5B4BFF] line-clamp-1">
                        {tool.location} • PIC: {tool.picName}
                      </p>
                      {tool.brand && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          {tool.brand} {tool.model ? `(${tool.model})` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 mt-2 text-[10px] text-slate-50 flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Maint: {tool.lastMaintenance}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(tool)}
                      className="p-1.5 rounded-full bg-slate-100 hover:bg-purple-100 hover:text-[#5B4BFF] text-slate-700 transition-colors cursor-pointer"
                      title="Edit Aset"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">edit</span>
                    </button>
                    {onArchiveTool && (
                      <button
                        onClick={() => onArchiveTool(tool.id)}
                        className="p-1.5 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-800 transition-colors cursor-pointer"
                        title="Arsipkan Aset"
                      >
                        <span className="material-symbols-outlined text-sm">archive</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Global SaaS Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredTools.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemName="aset"
      />

      {/* Form Add / Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[24px] p-6 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl text-xs font-sans max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">
                {editingTool ? 'Edit Informasi Aset Lab' : 'Tambah Aset Inventaris Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Alat / Mesin *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Canon EOS R50 Studio"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="Mesin Cetak Utama">Mesin Cetak Utama</option>
                    <option value="Mesin Finishing">Mesin Finishing</option>
                    <option value="Peralatan Fotografi">Peralatan Fotografi</option>
                    <option value="Hardware Komputer">Hardware Komputer</option>
                    <option value="Alat Pendukung">Alat Pendukung</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Lab *</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="Lab Cetak 1">Lab Cetak 1</option>
                    <option value="Lab Desain 2">Lab Desain 2</option>
                    <option value="Studio Foto">Studio Foto</option>
                    <option value="Ruang Finishing">Ruang Finishing</option>
                    <option value="Gudang Utama">Gudang Utama</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Merk</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Canon"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Model / Tipe</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. EOS R50"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Seri</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. SN-891278"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Pengadaan</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Perolehan (Rp)</label>
                  <input
                    type="number"
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kondisi *</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    <option value="Rusak">Rusak</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Operasional *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Tersedia">Tersedia</option>
                    <option value="Digunakan">Digunakan</option>
                    <option value="Dalam Perbaikan">Dalam Perbaikan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penanggung Jawab *</label>
                  <input
                    type="text"
                    required
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Spesifikasi Detail</label>
                <textarea
                  rows={2}
                  value={specification}
                  onChange={(e) => setSpecification(e.target.value)}
                  placeholder="Kapasitas, resolusi, tegangan listrik..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              {/* Dynamic Image Uploader */}
              <div className="pt-2 border-t border-slate-100">
                <ImageUploader
                  images={images}
                  onImagesChange={(imgs, covIdx) => {
                    setImages(imgs);
                    if (covIdx !== undefined) setCoverIndex(covIdx);
                  }}
                  coverIndex={coverIndex}
                  maxImages={5}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="flex-1 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-full bg-[#5B4BFF] text-white font-extrabold shadow-md cursor-pointer"
              >
                Simpan Inventaris
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tool Detail View Modal */}
      {detailTool && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-[28px] p-6 max-w-2xl w-full space-y-5 border border-slate-200 shadow-2xl my-8 text-xs font-sans max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#5B4BFF] border border-purple-100 flex items-center justify-center font-bold shrink-0">
                  <span className="material-symbols-outlined text-2xl">construction</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-base">{detailTool.name}</h3>
                    <span
                      className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${getConditionBadge(
                        detailTool.condition
                      )}`}
                    >
                      {detailTool.condition}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    Kode Aset: <span className="font-mono font-extrabold">{detailTool.code}</span> • Kategori: {detailTool.category}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailTool(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Photo Gallery Grid */}
            <div>
              <h4 className="font-extrabold text-slate-900 mb-2">Galeri Hasil Karya / Foto Alat</h4>
              {detailTool.images && detailTool.images.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {detailTool.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setLightboxState({ isOpen: true, tool: detailTool, activeImageIdx: idx })}
                      className="aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:border-[#5B4BFF] transition-colors relative group"
                    >
                      <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                      {detailTool.coverImage === img && (
                        <span className="absolute top-1 left-1 bg-[#5B4BFF] text-white text-[8px] font-bold px-1 py-0.2 rounded-md">
                          Cover
                        </span>
                      )}
                      <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="material-symbols-outlined text-white text-base">zoom_in</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-36 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-2xl mb-1">image_not_supported</span>
                  <p className="text-[10px] font-bold">Belum ada foto media terunggah</p>
                </div>
              )}
            </div>

            {/* Specifications Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-250/60 space-y-2">
                <h4 className="font-extrabold text-slate-900">Spesifikasi Aset</h4>
                <div className="space-y-1.5 text-slate-700">
                  <p><span className="text-slate-400 font-bold">Merk:</span> {detailTool.brand || '-'}</p>
                  <p><span className="text-slate-400 font-bold">Model / Tipe:</span> {detailTool.model || '-'}</p>
                  <p><span className="text-slate-400 font-bold">Nomor Seri:</span> {detailTool.serialNumber || '-'}</p>
                  <p><span className="text-slate-400 font-bold">Kondisi Fisik:</span> {detailTool.condition}</p>
                  <p><span className="text-slate-400 font-bold">Status Operasional:</span> {detailTool.status}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-250/60 space-y-2">
                <h4 className="font-extrabold text-slate-900">Pembelian & Manajemen</h4>
                <div className="space-y-1.5 text-slate-700">
                  <p><span className="text-slate-400 font-bold">Tahun Pengadaan:</span> {detailTool.purchaseDate || '-'}</p>
                  <p><span className="text-slate-400 font-bold">Harga Perolehan:</span> {formatRupiah(detailTool.acquisitionCost || 0)}</p>
                  <p><span className="text-slate-400 font-bold">Lokasi Lab:</span> {detailTool.location}</p>
                  <p><span className="text-slate-400 font-bold">Penanggung Jawab:</span> {detailTool.picName}</p>
                  <p><span className="text-slate-400 font-bold">Terakhir Perawatan:</span> {detailTool.lastMaintenance || '-'}</p>
                </div>
              </div>
            </div>

            {detailTool.specification && (
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 text-slate-700">
                <h4 className="font-extrabold text-slate-900 mb-1">Keterangan Spesifikasi Lainnya</h4>
                <p className="whitespace-pre-line leading-relaxed">{detailTool.specification}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailTool(null)}
                className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = detailTool;
                  setDetailTool(null);
                  openEditModal(t);
                }}
                className="px-5 py-2 bg-[#5B4BFF] hover:bg-[#4a3ce6] text-white font-extrabold rounded-xl shadow-xs"
              >
                Ubah Informasi
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lightbox / Image Zoom Viewer Modal */}
      <AnimatePresence>
        {lightboxState.isOpen && lightboxState.tool && lightboxState.tool.images && (
          <div className="fixed inset-0 bg-slate-950/90 z-100 flex flex-col items-center justify-center p-4">
            <button
              onClick={() => setLightboxState({ isOpen: false, tool: null, activeImageIdx: 0 })}
              className="absolute top-4 right-4 text-white hover:text-slate-300 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold cursor-pointer"
            >
              ✕
            </button>
            
            <div className="relative max-w-3xl w-full flex items-center justify-center">
              <button
                onClick={prevImage}
                className="absolute left-2 md:-left-12 text-white hover:text-slate-300 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold cursor-pointer"
              >
                ❮
              </button>

              <img
                src={lightboxState.tool.images[lightboxState.activeImageIdx]}
                alt={`Zoom ${lightboxState.activeImageIdx + 1}`}
                className="max-h-[75vh] max-w-full object-contain rounded-lg border border-white/10 shadow-2xl"
              />

              <button
                onClick={nextImage}
                className="absolute right-2 md:-right-12 text-white hover:text-slate-300 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold cursor-pointer"
              >
                ❯
              </button>
            </div>

            <div className="mt-4 text-white text-[11px] font-bold">
              Gambar {lightboxState.activeImageIdx + 1} dari {lightboxState.tool.images.length}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

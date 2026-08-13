import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../types';
import { Pagination } from '../Pagination';
import { ImageUploader } from '../ImageUploader';

interface ProdukViewProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onArchiveProduct?: (product: Product) => void;
}

export const ProdukView: React.FC<ProdukViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onArchiveProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Cetak Outdoor' | 'Cetak Indoor / A3+' | 'Merchandise' | 'Desain & Creative' | 'Finishing & Jilid'>('Cetak Outdoor');
  const [unit, setUnit] = useState<'m2' | 'lembar' | 'pcs' | 'paket' | 'meter' | 'set'>('m2');
  const [basePrice, setBasePrice] = useState<number>(10000);
  const [description, setDescription] = useState('');
  const [isCustomDimension, setIsCustomDimension] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState<number>(0);
  const [showInCustomerPlatform, setShowInCustomerPlatform] = useState<boolean>(true);

  const categories = ['Semua', 'Cetak Outdoor', 'Cetak Indoor / A3+', 'Merchandise', 'Desain & Creative'];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setCode('PRD-' + Math.floor(100 + Math.random() * 900));
    setName('');
    setCategory('Cetak Outdoor');
    setUnit('m2');
    setBasePrice(20000);
    setDescription('');
    setIsCustomDimension(false);
    setImages([]);
    setCoverIndex(0);
    setShowInCustomerPlatform(true);
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setCode(p.code);
    setName(p.name);
    setCategory(p.category);
    setUnit(p.unit);
    setBasePrice(p.basePrice);
    setDescription(p.description);
    setIsCustomDimension(!!p.isCustomDimension);
    const pImages = p.images || (p.image ? [p.image] : []);
    setImages(pImages);
    const covIdx = p.coverImage ? pImages.indexOf(p.coverImage) : 0;
    setCoverIndex(covIdx > -1 ? covIdx : 0);
    setShowInCustomerPlatform(p.showInCustomerPlatform !== false);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {

    const coverImage = images[coverIndex] || images[0] || undefined;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        code,
        name,
        category,
        unit,
        basePrice,
        description,
        isCustomDimension,
        images,
        coverImage,
        showInCustomerPlatform,
      });
    } else {
      const newP: Product = {
        id: 'PRD-' + Date.now(),
        code,
        name,
        category,
        unit,
        basePrice,
        minQty: 1,
        description,
        isCustomDimension,
        status: 'Aktif',
        images,
        coverImage,
        showInCustomerPlatform,
      };
      onAddProduct(newP);
    }
    setIsSubmitting(false);
    setShowModal(false);
    }, 400); // realistic delay for polish
  };

  const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  const getCategoryImage = (cat: string) => {
    switch (cat) {
      case 'Cetak Outdoor':
        return 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80';
      case 'Cetak Indoor / A3+':
        return 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=400&q=80';
      case 'Merchandise':
        return 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80';
      case 'Desain & Creative':
        return 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&q=80';
      default:
        return 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80';
    }
  };

  return (
    <div className="space-y-5 pb-10 font-sans text-slate-800">
      {/* Compact Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Katalog Produk & Jasa Cetak TEFA DKV
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Daftar tarif cetak, jasa kreatif, dan paket layanan TEFA.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-[#5B4BFF] to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-full flex items-center gap-2 shadow-md shadow-purple-500/15 transition-all shrink-0 active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>+ Tambah Produk Baru</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-[20px] border border-slate-200/80 p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-full text-xs font-extrabold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#5B4BFF] text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode atau nama produk..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#5B4BFF] focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Compact 3 Columns Desktop Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage + selectedCategory + searchQuery}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {paginatedProducts.length === 0 ? (
            <div className="col-span-full bg-white rounded-[24px] p-10 text-center border border-slate-200/80 shadow-2xs space-y-2">
              <span className="material-symbols-outlined text-3xl text-slate-300">inventory_2</span>
              <p className="text-xs font-extrabold text-slate-600">Tidak ada produk ditemukan.</p>
            </div>
          ) : (
            paginatedProducts.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ y: -3 }}
                className="bg-white rounded-[22px] border border-slate-200/80 hover:border-purple-300 p-4 shadow-2xs hover:shadow-lg hover:shadow-purple-500/10 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Compact Header Badge & Thumbnail */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border border-slate-200">
                      {p.code}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        p.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-100">
                      <img
                        src={p.coverImage || p.images?.[0] || getCategoryImage(p.category)}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-[#5B4BFF] transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-[11px] font-semibold text-[#5B4BFF]">{p.category}</p>
                    </div>
                  </div>
                </div>

                {/* Compact Footer Price & Actions */}
                <div className="pt-2.5 border-t border-slate-100 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Tarif</span>
                    <p className="font-black text-sm text-slate-900">
                      {formatRupiah(p.basePrice)} <span className="text-[10px] text-slate-500 font-bold">/{p.unit}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 bg-slate-100 hover:bg-purple-100 hover:text-[#5B4BFF] text-slate-700 rounded-full transition-colors cursor-pointer"
                      title="Edit Produk"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    {onArchiveProduct && (
                      <button
                        onClick={() => onArchiveProduct(p)}
                        className="p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-800 rounded-full transition-colors cursor-pointer"
                        title="Arsipkan"
                      >
                        <span className="material-symbols-outlined text-base">archive</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Global SaaS Pagination Component */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredProducts.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemName="produk"
      />

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[24px] p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl text-xs font-sans"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">
                {editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk / Jasa Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Produk / Jasa</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Banner Flexi 280gr Standard"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="Cetak Outdoor">Cetak Outdoor</option>
                    <option value="Cetak Indoor / A3+">Cetak Indoor / A3+</option>
                    <option value="Merchandise">Merchandise</option>
                    <option value="Desain & Creative">Desain & Creative</option>
                    <option value="Finishing & Jilid">Finishing & Jilid</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan Hitung</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="m2">m2 (Meter Persegi)</option>
                    <option value="lembar">lembar</option>
                    <option value="pcs">pcs</option>
                    <option value="paket">paket</option>
                    <option value="meter">meter</option>
                    <option value="set">set</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Harga Dasar / Satuan (Rp)</label>
                <input
                  type="number"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan Singkat</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi bahan / spesifikasi cetak..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 resize-none"
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

              {/* Product Visibility Option */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show-in-customer"
                  checked={showInCustomerPlatform}
                  onChange={(e) => setShowInCustomerPlatform(e.target.checked)}
                  className="w-4 h-4 text-[#5B4BFF] focus:ring-purple-500 border-slate-300 rounded cursor-pointer accent-[#5B4BFF]"
                />
                <label htmlFor="show-in-customer" className="font-bold text-slate-750 cursor-pointer select-none">
                  Tampilkan di Customer Platform
                </label>
              </div>
            </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#5B4BFF] hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-black shadow-md shadow-purple-500/20 flex items-center gap-2 cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="material-symbols-outlined text-sm">save</span>
                    )}
                    <span>{isSubmitting ? 'Menyimpan...' : (editingProduct ? 'Simpan Perubahan' : 'Simpan Produk')}</span>
                  </button>
                </div>
              </form>
            </div>
      )}
    </div>
  );
};

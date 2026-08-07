import React, { useState } from 'react';
import { Product } from '../../types';

interface ProdukViewProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
}

export const ProdukView: React.FC<ProdukViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Cetak Outdoor' | 'Cetak Indoor / A3+' | 'Merchandise' | 'Desain & Creative' | 'Finishing & Jilid'>('Cetak Outdoor');
  const [unit, setUnit] = useState<'m2' | 'lembar' | 'pcs' | 'paket' | 'meter' | 'set'>('m2');
  const [basePrice, setBasePrice] = useState<number>(10000);
  const [description, setDescription] = useState('');
  const [isCustomDimension, setIsCustomDimension] = useState(false);

  const categories = ['Semua', 'Cetak Outdoor', 'Cetak Indoor / A3+', 'Merchandise', 'Desain & Creative'];

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setCode('PRD-' + Math.floor(100 + Math.random() * 900));
    setName('');
    setCategory('Cetak Outdoor');
    setUnit('m2');
    setBasePrice(20000);
    setDescription('');
    setIsCustomDimension(false);
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
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

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
      };
      onAddProduct(newP);
    }
    setShowModal(false);
  };

  const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Katalog Produk & Jasa Cetak TEFA DKV
          </h2>
          <p className="text-xs text-slate-500">
            Kelola daftar produk, satuan, dan rumus perhitungan harga dasar.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>+ Tambah Produk Baru</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode atau nama produk..."
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Grid of Product Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {p.code}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    p.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1">{p.name}</h3>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{p.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Harga Satuan</p>
                <p className="font-black text-sm text-emerald-700">
                  {formatRupiah(p.basePrice)} <span className="text-[10px] text-slate-500">/{p.unit}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(p)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                  title="Edit Produk"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
                {onDeleteProduct && (
                  <button
                    onClick={() => onDeleteProduct(p)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl transition-colors"
                    title="Hapus Produk Permanen"
                  >
                    <span className="material-symbols-outlined text-base">delete_forever</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl text-xs"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk / Jasa Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Produk</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Cetak Outdoor">Cetak Outdoor</option>
                    <option value="Cetak Indoor / A3+">Cetak Indoor / A3+</option>
                    <option value="Merchandise">Merchandise</option>
                    <option value="Desain & Creative">Desain & Creative</option>
                    <option value="Finishing & Jilid">Finishing & Jilid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Base (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="m2">m² (Meter Persegi)</option>
                    <option value="lembar">lembar</option>
                    <option value="pcs">pcs</option>
                    <option value="box">box</option>
                    <option value="paket">paket</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-custom-dimension"
                  checked={isCustomDimension}
                  onChange={(e) => setIsCustomDimension(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm"
                />
                <label htmlFor="chk-custom-dimension" className="font-bold text-slate-800">
                  Produk Butuh Input Dimensi (Panjang x Lebar, e.g. Banner)
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
              >
                Simpan Produk
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

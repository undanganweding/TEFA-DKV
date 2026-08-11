import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, ProductionOrder, InboxFile } from '../../types';
import { Pagination } from '../Pagination';

interface KasirViewProps {
  products: Product[];
  orders?: ProductionOrder[];
  onCheckoutOrder: (order: ProductionOrder) => void;
  operatorName: string;
  prefilledFile?: InboxFile | null;
  onClearPrefilledFile?: () => void;
  onAddProduct?: (product: Product) => void;
  onAddToCart?: (item: CartItem) => void;
  searchQuery?: string;
}

export interface RecentlyUsedItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  unit: string;
  category?: string;
  icon?: string;
  image?: string;
  isCustomDimension?: boolean;
  lastUsedTimestamp: number;
}

const INITIAL_RECENTLY_USED: RecentlyUsedItem[] = [
  {
    id: 'PRD-002',
    productId: 'PRD-002',
    name: 'Print Warna A4 HVS',
    price: 1500,
    unit: 'lembar',
    category: 'Cetak Indoor / A3+',
    icon: 'palette',
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300&q=80',
    lastUsedTimestamp: Date.now() - 5 * 60 * 1000,
  },
  {
    id: 'PRD-007',
    productId: 'PRD-007',
    name: 'Mug Custom Putih Sublim',
    price: 28000,
    unit: 'pcs',
    category: 'Merchandise',
    icon: 'local_cafe',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80',
    lastUsedTimestamp: Date.now() - 20 * 60 * 1000,
  },
  {
    id: 'PRD-005',
    productId: 'PRD-005',
    name: 'Print Foto 4R Glossy',
    price: 3000,
    unit: 'pcs',
    category: 'Cetak Indoor / A3+',
    icon: 'photo',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80',
    lastUsedTimestamp: Date.now() - 45 * 60 * 1000,
  },
  {
    id: 'PRD-003',
    productId: 'PRD-003',
    name: 'Banner Flexi 340g High Res',
    price: 25000,
    unit: 'm2',
    category: 'Cetak Outdoor',
    icon: 'aspect_ratio',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=300&q=80',
    isCustomDimension: true,
    lastUsedTimestamp: Date.now() - 90 * 60 * 1000,
  },
];

const getCategoryImage = (category: string): string => {
  switch (category) {
    case 'Cetak Outdoor':
      return 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=300&q=80';
    case 'Cetak Indoor / A3+':
      return 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300&q=80';
    case 'Merchandise':
      return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80';
    case 'Desain & Creative':
      return 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=300&q=80';
    default:
      return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80';
  }
};

export const KasirView: React.FC<KasirViewProps> = ({
  products,
  prefilledFile,
  onClearPrefilledFile,
  onAddProduct,
  onAddToCart,
  searchQuery = '',
}) => {
  // Navigation & Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Recently Used Items State & Persistence (Max 5 unique items, LIFO order)
  const [recentlyUsed, setRecentlyUsed] = useState<RecentlyUsedItem[]>(() => {
    try {
      const saved = localStorage.getItem('tefa_pos_recently_used');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_RECENTLY_USED;
  });

  useEffect(() => {
    try {
      localStorage.setItem('tefa_pos_recently_used', JSON.stringify(recentlyUsed));
    } catch (e) {
      console.error('Failed to save recently used items', e);
    }
  }, [recentlyUsed]);

  // Record item into recently used (LIFO order, max 5 unique items)
  const recordRecentlyUsed = (item: {
    productId?: string;
    name: string;
    price: number;
    unit: string;
    category?: string;
    icon?: string;
    image?: string;
    isCustomDimension?: boolean;
  }) => {
    setRecentlyUsed((prev) => {
      let list = [...prev];
      const existingIdx = list.findIndex(
        (x) =>
          (item.productId && x.productId === item.productId) ||
          x.name.toLowerCase() === item.name.toLowerCase()
      );

      let img = item.image || getCategoryImage(item.category || '');
      let icn = item.icon || 'history';

      if (existingIdx > -1) {
        img = list[existingIdx].image || img;
        icn = list[existingIdx].icon || icn;
        list.splice(existingIdx, 1);
      }

      const newItem: RecentlyUsedItem = {
        id: item.productId || 'REC-' + Date.now() + Math.random().toString(36).substring(2, 6),
        productId: item.productId,
        name: item.name,
        price: item.price,
        unit: item.unit || 'pcs',
        category: item.category,
        icon: icn,
        image: img,
        isCustomDimension: item.isCustomDimension,
        lastUsedTimestamp: Date.now(),
      };

      list.unshift(newItem);
      return list.slice(0, 5);
    });
  };

  const handleClearRecentlyUsed = () => {
    setRecentlyUsed([]);
    try {
      localStorage.removeItem('tefa_pos_recently_used');
    } catch {}
    showToast('Histori pemakaian berhasil dibersihkan.');
  };

  // Command Palette Search Modal (Ctrl + K) State
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [commandQuery, setCommandQuery] = useState<string>('');

  // Global Ctrl + K Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Custom Order Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [customCategory, setCustomCategory] = useState<
    'Printing' | 'Design Service' | 'Merchandise' | 'Photo' | 'Other'
  >('Printing');
  const [customProductName, setCustomProductName] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [customSizeSpec, setCustomSizeSpec] = useState<string>('');
  const [customQty, setCustomQty] = useState<number>(1);
  const [customUnitPrice, setCustomUnitPrice] = useState<number>(10000);
  const [customCostPrice, setCustomCostPrice] = useState<number>(0);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [customSaveAsProduct, setCustomSaveAsProduct] = useState<boolean>(false);

  // Banner Dimension Modal
  const [activeBannerProduct, setActiveBannerProduct] = useState<Product | null>(null);
  const [bannerLength, setBannerLength] = useState<number>(3);
  const [bannerWidth, setBannerWidth] = useState<number>(1);
  const [bannerQty, setBannerQty] = useState<number>(1);
  const [bannerNote, setBannerNote] = useState<string>('');

  // Handle Prefilled File from File Inbox
  useEffect(() => {
    if (prefilledFile && onAddToCart) {
      const matchedProduct =
        products.find((p) => p.name.toLowerCase().includes(prefilledFile.serviceType.toLowerCase())) ||
        products[0];

      const newItem: CartItem = {
        id: 'CART-FILE-' + Date.now(),
        productId: matchedProduct ? matchedProduct.id : 'PRD-FILE',
        productName: matchedProduct ? matchedProduct.name : prefilledFile.serviceType,
        category: matchedProduct ? matchedProduct.category : 'Cetak Indoor / A3+',
        unit: matchedProduct ? matchedProduct.unit : 'pcs',
        unitPrice: matchedProduct ? matchedProduct.basePrice : 15000,
        qty: prefilledFile.qty || 1,
        notes: `File: ${prefilledFile.fileName} (${prefilledFile.id}) | ${prefilledFile.notes || ''}`,
        totalPrice: (matchedProduct ? matchedProduct.basePrice : 15000) * (prefilledFile.qty || 1),
        fileName: prefilledFile.fileName,
        isCustomOrder: true,
      };

      onAddToCart(newItem);
      recordRecentlyUsed({
        productId: newItem.productId,
        name: newItem.productName,
        price: newItem.unitPrice,
        unit: newItem.unit,
        category: newItem.category,
      });
      showToast(`File Inbox "${prefilledFile.fileName}" dimuat ke keranjang!`);
      
      // Clear prefilled file from parent state to prevent infinite triggers or duplicate additions
      if (onClearPrefilledFile) {
        onClearPrefilledFile();
      }
    }
  }, [prefilledFile, products, onAddToCart, onClearPrefilledFile]);

  // Categories list
  const categories = ['Semua', 'Cetak Outdoor', 'Cetak Indoor / A3+', 'Merchandise', 'Desain & Creative'];

  // Filtered Catalog using global searchQuery and selected category
  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchCategory && matchSearch && p.status === 'Aktif' && !p.isArchived;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Map Custom Category
  const mapCategoryToProductCategory = (
    cat: 'Printing' | 'Design Service' | 'Merchandise' | 'Photo' | 'Other'
  ): Product['category'] => {
    switch (cat) {
      case 'Printing':
        return 'Cetak Indoor / A3+';
      case 'Design Service':
        return 'Desain & Creative';
      case 'Merchandise':
        return 'Merchandise';
      case 'Photo':
        return 'Cetak Indoor / A3+';
      default:
        return 'Finishing & Jilid' as any;
    }
  };

  // Add Product from Catalog to Cart
  const handleAddToCartClick = (product: Product) => {
    if (product.isCustomDimension) {
      setActiveBannerProduct(product);
      setBannerLength(3);
      setBannerWidth(1);
      setBannerQty(1);
      setBannerNote('');
      return;
    }

    const newItem: CartItem = {
      id: 'CART-' + Date.now() + Math.random().toString(36).substring(2, 6),
      productId: product.id,
      productName: product.name,
      category: product.category,
      unit: product.unit,
      unitPrice: product.basePrice,
      costPrice: product.costPrice || 0,
      qty: 1,
      totalPrice: product.basePrice,
    };

    if (onAddToCart) {
      onAddToCart(newItem);
    }

    recordRecentlyUsed({
      productId: product.id,
      name: product.name,
      price: product.basePrice,
      unit: product.unit,
      category: product.category,
      isCustomDimension: product.isCustomDimension,
    });

    showToast(`"${product.name}" ditambahkan ke keranjang.`);
  };

  // Add Recently Used Item to Cart
  const handleAddRecentlyUsedToCart = (item: RecentlyUsedItem) => {
    if (item.isCustomDimension) {
      const bannerProduct: Product = {
        id: item.productId || item.id,
        code: 'Q-BANNER',
        name: item.name,
        category: 'Cetak Outdoor',
        unit: (item.unit as Product['unit']) || 'pcs',
        basePrice: item.price,
        minQty: 1,
        description: 'Bahan Flexi Outdoor TEFA',
        isCustomDimension: true,
        status: 'Aktif',
      };
      setActiveBannerProduct(bannerProduct);
      setBannerLength(3);
      setBannerWidth(1);
      setBannerQty(1);
      setBannerNote('');
      return;
    }

    const newItem: CartItem = {
      id: 'CART-R-' + Date.now() + Math.random().toString(36).substring(2, 6),
      productId: item.productId || 'PRD-' + item.id,
      productName: item.name,
      category: item.category || 'Cetak Indoor / A3+',
      unit: item.unit || 'pcs',
      unitPrice: item.price,
      costPrice: products.find(p => p.id === item.productId)?.costPrice || 0,
      qty: 1,
      totalPrice: item.price,
    };

    if (onAddToCart) {
      onAddToCart(newItem);
    }

    recordRecentlyUsed({
      productId: item.productId,
      name: item.name,
      price: item.price,
      unit: item.unit,
      category: item.category,
    });

    showToast(`"${item.name}" ditambahkan ke keranjang.`);
  };

  // Banner Custom Dimension Add
  const handleAddBannerToCart = () => {
    if (!activeBannerProduct) return;
    const area = Number((bannerLength * bannerWidth).toFixed(2));
    const totalPrice = Math.round(area * activeBannerProduct.basePrice * bannerQty);

    const newItem: CartItem = {
      id: 'CART-' + Date.now() + Math.random().toString(36).substring(2, 6),
      productId: activeBannerProduct.id,
      productName: activeBannerProduct.name,
      category: activeBannerProduct.category,
      unit: activeBannerProduct.unit,
      unitPrice: activeBannerProduct.basePrice,
      costPrice: activeBannerProduct.costPrice || 0,
      qty: bannerQty,
      lengthMeters: bannerLength,
      widthMeters: bannerWidth,
      calculatedArea: area,
      notes: bannerNote,
      totalPrice,
    };

    if (onAddToCart) {
      onAddToCart(newItem);
    }

    recordRecentlyUsed({
      productId: activeBannerProduct.id,
      name: activeBannerProduct.name,
      price: activeBannerProduct.basePrice,
      unit: activeBannerProduct.unit,
      category: activeBannerProduct.category,
      isCustomDimension: true,
    });

    setActiveBannerProduct(null);
    showToast(`Banner ${bannerLength}m x ${bannerWidth}m masuk keranjang.`);
  };

  // Custom Order Submit Handler
  const handleAddCustomOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customProductName.trim()) {
      alert('Nama Layanan Custom tidak boleh kosong.');
      return;
    }
    if (customUnitPrice <= 0) {
      alert('Harga Satuan harus lebih besar dari 0.');
      return;
    }

    const itemCategory = mapCategoryToProductCategory(customCategory);

    const newItem: CartItem = {
      id: 'CART-CUSTOM-' + Date.now(),
      productId: 'PRD-CUSTOM-' + Date.now(),
      productName: customProductName.trim(),
      category: itemCategory,
      unit: 'pcs',
      unitPrice: customUnitPrice,
      costPrice: customCostPrice,
      qty: customQty,
      totalPrice: customUnitPrice * customQty,
      notes: [
        customSizeSpec ? `Spec: ${customSizeSpec}` : '',
        customDescription ? `Detail: ${customDescription}` : '',
      ]
        .filter(Boolean)
        .join(' | '),
      fileName: customFileName.trim() || undefined,
      isCustomOrder: true,
      customSizeSpec: customSizeSpec.trim() || undefined,
      customDescription: customDescription.trim() || undefined,
    };

    if (onAddToCart) {
      onAddToCart(newItem);
    }

    recordRecentlyUsed({
      productId: newItem.productId,
      name: newItem.productName,
      price: newItem.unitPrice,
      unit: newItem.unit,
      category: newItem.category,
    });

    // Save as Product if requested
    if (customSaveAsProduct && onAddProduct) {
      const newProduct: Product = {
        id: 'PRD-CUST-' + Date.now(),
        code: 'PRD-C' + Math.floor(100 + Math.random() * 900),
        name: customProductName.trim(),
        category: itemCategory,
        unit: 'pcs',
        basePrice: customUnitPrice,
        costPrice: customCostPrice,
        minQty: 1,
        description:
          [customSizeSpec, customDescription].filter(Boolean).join(' - ') || 'Layanan Custom TEFA',
        status: 'Aktif',
      };
      onAddProduct(newProduct);
    }

    showToast(`Order Custom "${customProductName.trim()}" ditambahkan ke keranjang.`);

    // Reset Form
    setIsCustomModalOpen(false);
    setCustomProductName('');
    setCustomDescription('');
    setCustomSizeSpec('');
    setCustomQty(1);
    setCustomUnitPrice(10000);
    setCustomCostPrice(0);
    setCustomFileName('');
    setCustomSaveAsProduct(false);
  };

  // Command Palette Results
  const commandResults = useMemo(() => {
    if (!commandQuery.trim()) return products.slice(0, 8);
    const q = commandQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, commandQuery]);

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-800 relative bg-slate-50/50 p-1 md:p-2 rounded-3xl">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-8 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border border-slate-700"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">check</span>
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POS Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Katalog Produk & Kasir POS</h2>
            <span className="bg-purple-100 text-[#5B4BFF] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">
              Smart POS TEFA
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Pilih produk katalog, buat custom order, atau gunakan histori pemakaian untuk langsung mengisi keranjang transaksi.
          </p>
        </div>

        {prefilledFile && (
          <div className="bg-purple-50 border border-purple-200 px-3.5 py-2 rounded-2xl flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-[#5B4BFF] text-base">inbox</span>
            <div>
              <p className="text-[9px] font-extrabold text-purple-900 uppercase">File Inbox</p>
              <p className="text-xs font-black text-slate-900 line-clamp-1">{prefilledFile.customerName}</p>
            </div>
            <button
              type="button"
              onClick={onClearPrefilledFile}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold underline ml-1 cursor-pointer"
            >
              Rilis
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* QUICK ORDER SECTION: TERAKHIR DIGUNAKAN ONLY                              */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-[24px] border border-slate-200/80 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center border border-[#5B4BFF]/20 font-bold shrink-0">
              <span className="material-symbols-outlined text-lg">history</span>
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-xs sm:text-sm tracking-tight uppercase">
                TERAKHIR DIGUNAKAN
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">
                Histori pemakaian terkini oleh Kasir
              </p>
            </div>
          </div>

          {recentlyUsed.length > 0 && (
            <button
              onClick={handleClearRecentlyUsed}
              className="text-slate-400 hover:text-rose-600 text-[11px] font-bold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              title="Bersihkan Histori Pemakaian"
            >
              <span className="material-symbols-outlined text-xs">delete_sweep</span>
              <span>Bersihkan Histori</span>
            </button>
          )}
        </div>

        {recentlyUsed.length === 0 ? (
          <div className="p-6 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-semibold">
            Belum ada histori transaksi terkini. Produk dan layanan yang dipilih kasir saat checkout akan otomatis muncul di sini.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {recentlyUsed.slice(0, 5).map((item) => (
              <motion.div
                key={'rec-' + item.id}
                whileHover={{ y: -2 }}
                onClick={() => handleAddRecentlyUsedToCart(item)}
                className="bg-white hover:bg-purple-50/40 border border-slate-200/80 hover:border-purple-300 p-3 rounded-[18px] transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60 flex items-center justify-center text-slate-600">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-base">{item.icon || 'history'}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="w-6 h-6 rounded-full bg-purple-100 text-[#5B4BFF] group-hover:bg-[#5B4BFF] group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors shrink-0"
                  >
                    +
                  </button>
                </div>

                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-[#5B4BFF] transition-colors line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="font-black text-xs text-[#5B4BFF] mt-1">
                    Rp {item.price.toLocaleString('id-ID')}
                    <span className="text-[9px] font-normal text-slate-400">/{item.unit || 'pcs'}</span>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MAIN FULL-WIDTH CATALOG GRID                                               */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="bg-white rounded-[20px] p-3.5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar w-full sm:w-auto flex-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#5B4BFF] text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Secondary Action: Custom Order Button inside Catalog Toolbar */}
          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            className="bg-[#5B4BFF] hover:bg-[#4a3ce6] text-white font-extrabold text-xs px-4 py-2 rounded-full flex items-center gap-1.5 shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Buat Order Custom dengan Ukuran & Spesifikasi Bebas"
          >
            <span className="material-symbols-outlined text-base">edit_note</span>
            <span>+ Custom Order</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage + selectedCategory + searchQuery}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {paginatedProducts.length === 0 ? (
              <div className="col-span-full bg-white rounded-[20px] p-8 text-center border border-slate-200/80 text-slate-400 font-bold text-xs space-y-2">
                <p>Tidak ada produk ditemukan di katalog.</p>
                <button
                  onClick={() => setIsCustomModalOpen(true)}
                  className="text-[#5B4BFF] underline font-extrabold cursor-pointer"
                >
                  + Buat Custom Order untuk item ini
                </button>
              </div>
            ) : (
              paginatedProducts.map((product) => (
                <motion.div
                  key={product.id}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-[20px] border border-slate-200/80 hover:border-purple-300 p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="aspect-video w-full rounded-[14px] bg-slate-100 overflow-hidden relative mb-2.5 border border-slate-100">
                      <img
                        src={product.coverImage || product.images?.[0] || product.image || getCategoryImage(product.category)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                        {product.category}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-xs text-slate-900 group-hover:text-[#5B4BFF] transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {product.description || 'Layanan cetak TEFA DKV'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Tarif</span>
                      <p className="font-black text-xs text-[#5B4BFF]">
                        Rp {product.basePrice.toLocaleString('id-ID')}{' '}
                        <span className="text-[9px] text-slate-400 font-normal">/{product.unit}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddToCartClick(product)}
                      className="w-8 h-8 rounded-full bg-[#5B4BFF] hover:bg-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-500/20 active:scale-90 transition-all cursor-pointer"
                      title="Tambah ke Keranjang"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredProducts.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemName="produk"
        />
      </div>

      {/* ========================================================================= */}
      {/* COMMAND PALETTE SEARCH MODAL (Ctrl + K)                                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
            onClick={() => setIsSearchModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
                <input
                  type="text"
                  autoFocus
                  value={commandQuery}
                  onChange={(e) => setCommandQuery(e.target.value)}
                  placeholder="Ketik nama produk, kode, atau kategori cetak... (ESC untuk keluar)"
                  className="w-full bg-transparent font-bold text-slate-900 text-sm focus:outline-hidden"
                />
                <button
                  onClick={() => setIsSearchModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-extrabold px-2 py-1 rounded-lg bg-slate-100 cursor-pointer"
                >
                  ESC
                </button>
              </div>

              <div className="p-3 max-h-96 overflow-y-auto divide-y divide-slate-100">
                {commandResults.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-bold">
                    Tidak ada produk cocok dengan "{commandQuery}".
                  </div>
                ) : (
                  commandResults.map((prd) => (
                    <div
                      key={prd.id}
                      className="py-2.5 px-3 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          <img
                            src={prd.image || getCategoryImage(prd.category)}
                            alt={prd.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-black text-xs text-slate-900 group-hover:text-[#5B4BFF] transition-colors">
                            {prd.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            {prd.code} • {prd.category}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-xs text-[#5B4BFF]">
                          Rp {prd.basePrice.toLocaleString('id-ID')}/{prd.unit}
                        </span>
                        <button
                          onClick={() => {
                            handleAddToCartClick(prd);
                            setIsSearchModalOpen(false);
                          }}
                          className="bg-[#5B4BFF] hover:bg-[#4a3ce6] text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-xs cursor-pointer"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* CUSTOM ORDER MODAL                                                        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCustomModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setIsCustomModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-purple-100 text-[#5B4BFF] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-base">edit_note</span>
                  </span>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Input Custom Order Non-Katalog</h3>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Untuk pesanan spesialisasi dengan bahan / ukuran kustom
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCustomModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCustomOrderSubmit} className="space-y-3 text-xs font-semibold">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Nama Layanan Custom *</label>
                  <input
                    type="text"
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    placeholder="Contoh: Cetak Brosur A4 Lipat 3 Art Paper 150g"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-[#5B4BFF] focus:outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Kategori Utama</label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                    >
                      <option value="Printing">Cetak / Printing</option>
                      <option value="Merchandise">Merchandise</option>
                      <option value="Design Service">Jasa Desain</option>
                      <option value="Photo">Foto & Dokumentasi</option>
                      <option value="Other">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Spesifikasi Ukuran</label>
                    <input
                      type="text"
                      value={customSizeSpec}
                      onChange={(e) => setCustomSizeSpec(e.target.value)}
                      placeholder="e.g. 21 x 29.7 cm"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Jumlah (Qty)</label>
                    <input
                      type="number"
                      value={customQty}
                      onChange={(e) => setCustomQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Harga Satuan Jual (Rp) *</label>
                    <input
                      type="number"
                      value={customUnitPrice}
                      onChange={(e) => setCustomUnitPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">HPP / Harga Modal Satuan (Rp)</label>
                  <input
                    type="number"
                    value={customCostPrice || ''}
                    onChange={(e) => setCustomCostPrice(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Catatan Pengerjaan / Detail Bahan</label>
                  <textarea
                    rows={2}
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Instruksi khusus finishing, jenis laminasi, warna tinta..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Upload File Design / Referensi (Opsional)</label>
                  <input
                    type="text"
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    placeholder="Nama file / link design (misal: brochure_v1.pdf)"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="saveAsProdCheck"
                    checked={customSaveAsProduct}
                    onChange={(e) => setCustomSaveAsProduct(e.target.checked)}
                    className="rounded border-slate-300 text-[#5B4BFF]"
                  />
                  <label htmlFor="saveAsProdCheck" className="text-slate-700 font-bold cursor-pointer">
                    Simpan juga item custom ini ke Katalog Produk Permanen
                  </label>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCustomModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-extrabold text-slate-700 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3ce6] text-white font-black shadow-xs cursor-pointer"
                  >
                    + Masukkan Keranjang
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* BANNER CUSTOM DIMENSIONS MODAL                                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeBannerProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setActiveBannerProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-slate-900 text-sm">
                  Kalkulator Dimensi Banner/Outdoor
                </h3>
                <button
                  onClick={() => setActiveBannerProduct(null)}
                  className="text-slate-400 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs font-semibold">
                <div>
                  <p className="font-extrabold text-slate-900">{activeBannerProduct.name}</p>
                  <p className="text-[10px] text-slate-500">
                    Tarif Dasar: Rp {activeBannerProduct.basePrice.toLocaleString('id-ID')}/m²
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Panjang (Meter)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={bannerLength}
                      onChange={(e) => setBannerLength(Math.max(0.1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Lebar (Meter)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={bannerWidth}
                      onChange={(e) => setBannerWidth(Math.max(0.1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Jumlah Pcs (Qty)</label>
                  <input
                    type="number"
                    value={bannerQty}
                    onChange={(e) => setBannerQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-center space-y-0.5">
                  <p className="text-[10px] font-bold text-purple-900 uppercase">Perhitungan Luas & Estimasi</p>
                  <p className="font-black text-sm text-[#5B4BFF]">
                    {(bannerLength * bannerWidth).toFixed(2)} m² × {bannerQty} Pcs = Rp{' '}
                    {Math.round(
                      bannerLength * bannerWidth * activeBannerProduct.basePrice * bannerQty
                    ).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setActiveBannerProduct(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAddBannerToCart}
                    className="px-5 py-2 rounded-xl bg-[#5B4BFF] text-white font-black shadow-xs cursor-pointer"
                  >
                    + Masukkan Keranjang
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Product, CartItem, ProductionOrder, PaymentMethod, InboxFile } from '../../types';

interface KasirViewProps {
  products: Product[];
  onCheckoutOrder: (order: ProductionOrder) => void;
  operatorName: string;
  prefilledFile?: InboxFile | null;
  onClearPrefilledFile?: () => void;
}

export const KasirView: React.FC<KasirViewProps> = ({
  products,
  onCheckoutOrder,
  operatorName,
  prefilledFile,
  onClearPrefilledFile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchCatalog, setSearchCatalog] = useState<string>('');
  
  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [institution, setInstitution] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');

  // Handle prefilled file from File Inbox
  useEffect(() => {
    if (prefilledFile) {
      setCustomerName(prefilledFile.customerName);
      setCustomerPhone(prefilledFile.phone);
      setInstitution(`${prefilledFile.classGrade} (${prefilledFile.major || 'DKV'})`);

      // Match product or create cart item from service type
      const matchedProduct = products.find(p => p.name.toLowerCase().includes(prefilledFile.serviceType.toLowerCase())) || products[0];

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
      };

      setCartItems([newItem]);
    }
  }, [prefilledFile, products]);

  // Custom Banner Modal State
  const [activeBannerProduct, setActiveBannerProduct] = useState<Product | null>(null);
  const [bannerLength, setBannerLength] = useState<number>(3);
  const [bannerWidth, setBannerWidth] = useState<number>(1);
  const [bannerQty, setBannerQty] = useState<number>(1);
  const [bannerNote, setBannerNote] = useState<string>('');

  const categories = ['Semua', 'Cetak Outdoor', 'Cetak Indoor / A3+', 'Merchandise', 'Desain & Creative'];

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchCatalog.toLowerCase()) ||
                        p.code.toLowerCase().includes(searchCatalog.toLowerCase());
    return matchCategory && matchSearch && p.status === 'Aktif';
  });

  const handleAddToCart = (product: Product) => {
    if (product.isCustomDimension) {
      setActiveBannerProduct(product);
      setBannerLength(3);
      setBannerWidth(1);
      setBannerQty(1);
      setBannerNote('');
      return;
    }

    const existingIndex = cartItems.findIndex((ci) => ci.productId === product.id && !ci.calculatedArea);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].qty += 1;
      updated[existingIndex].totalPrice = updated[existingIndex].qty * updated[existingIndex].unitPrice;
      setCartItems(updated);
    } else {
      const newItem: CartItem = {
        id: 'CART-' + Date.now() + Math.random(),
        productId: product.id,
        productName: product.name,
        category: product.category,
        unit: product.unit,
        unitPrice: product.basePrice,
        qty: 1,
        totalPrice: product.basePrice,
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const handleAddBannerToCart = () => {
    if (!activeBannerProduct) return;
    const area = Number((bannerLength * bannerWidth).toFixed(2));
    const totalPrice = Math.round(area * activeBannerProduct.basePrice * bannerQty);

    const newItem: CartItem = {
      id: 'CART-' + Date.now() + Math.random(),
      productId: activeBannerProduct.id,
      productName: activeBannerProduct.name,
      category: activeBannerProduct.category,
      unit: activeBannerProduct.unit,
      unitPrice: activeBannerProduct.basePrice,
      qty: bannerQty,
      lengthMeters: bannerLength,
      widthMeters: bannerWidth,
      calculatedArea: area,
      notes: bannerNote,
      totalPrice,
    };

    setCartItems([...cartItems, newItem]);
    setActiveBannerProduct(null);
  };

  const updateCartQty = (id: string, delta: number) => {
    setCartItems(
      cartItems
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            if (newQty <= 0) return null;
            let itemTotal = 0;
            if (item.calculatedArea) {
              itemTotal = Math.round(item.calculatedArea * item.unitPrice * newQty);
            } else {
              itemTotal = item.unitPrice * newQty;
            }
            return { ...item, qty: newQty, totalPrice: itemTotal };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const subtotal = cartItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const balanceDue = Math.max(0, totalAmount - paidAmount);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Keranjang kasir masih kosong. Pilih produk terlebih dahulu.');
      return;
    }
    if (!customerName.trim()) {
      alert('Masukkan Nama Pemesan terlebih dahulu.');
      return;
    }

    const now = new Date();
    const orderNo = 'POS-' + now.getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
    const todayStr = now.toISOString().split('T')[0];

    let paymentStatus: 'Belum Bayar' | 'DP' | 'Lunas' = 'Belum Bayar';
    if (paidAmount >= totalAmount && totalAmount > 0) {
      paymentStatus = 'Lunas';
    } else if (paidAmount > 0) {
      paymentStatus = 'DP';
    }

    const newOrder: ProductionOrder = {
      id: 'ORD-' + Date.now(),
      orderNo,
      customerName,
      customerPhone,
      institution,
      orderDate: todayStr,
      dueDate: todayStr + ' 16:00',
      status: 'Antrian',
      paymentStatus,
      paymentMethod,
      items: cartItems,
      subtotal,
      discount,
      taxAmount: 0,
      totalAmount,
      paidAmount,
      balanceDue,
      operatorName,
      priority: 'Normal',
      statusHistory: [
        { status: 'Draft', timestamp: now.toLocaleString('id-ID'), updatedBy: operatorName },
        { status: 'Antrian', timestamp: now.toLocaleString('id-ID'), updatedBy: operatorName },
      ],
    };

    onCheckoutOrder(newOrder);

    // Reset Cart
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setInstitution('');
    setDiscount(0);
    setPaidAmount(0);
  };

  const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="space-y-4 h-[calc(100vh-100px)] overflow-hidden flex flex-col">
      {prefilledFile && (
        <div className="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs shadow-md shrink-0 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">folder_shared</span>
            <span>
              <strong>Transaksi dari File Inbox:</strong> <code className="bg-indigo-800 px-1.5 py-0.5 rounded text-indigo-100 font-mono">{prefilledFile.id}</code> — {prefilledFile.customerName} ({prefilledFile.serviceType} - {prefilledFile.fileName})
            </span>
          </div>
          {onClearPrefilledFile && (
            <button
              onClick={onClearPrefilledFile}
              className="text-indigo-200 hover:text-white text-xs font-bold underline ml-4"
            >
              Reset Prefill
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
      {/* Product Catalog Column (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col h-full bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 overflow-hidden">
        {/* Search & Categories Bar */}
        <div className="space-y-3 pb-4 border-b border-slate-100">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              type="text"
              value={searchCatalog}
              onChange={(e) => setSearchCatalog(e.target.value)}
              placeholder="Cari produk cetak, banner, mug, stiker, jasa..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Categories Pill Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="flex-1 overflow-y-auto pt-4 pr-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleAddToCart(product)}
              className="bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-400 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] group shadow-xs"
            >
              <div>
                <div className="aspect-video w-full rounded-xl bg-slate-200 overflow-hidden mb-2.5 relative">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-3xl">image</span>
                    </div>
                  )}
                  <span className="absolute top-1.5 right-1.5 bg-slate-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                    {product.code}
                  </span>
                </div>
                <p className="font-extrabold text-xs text-slate-900 line-clamp-2 leading-tight">
                  {product.name}
                </p>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  {product.description}
                </p>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-200/60 mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Harga Base</span>
                  <span className="font-black text-xs text-emerald-700">
                    {formatRupiah(product.basePrice)}
                    <span className="text-[9px] text-slate-500 font-medium">/{product.unit}</span>
                  </span>
                </div>
                <button
                  id={`btn-add-product-${product.id}`}
                  className="w-8 h-8 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center shadow-sm"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shopping Cart & Checkout Column (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col h-full bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 overflow-hidden">
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-2xl">shopping_cart</span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Keranjang Transaksi</h3>
              <p className="text-[11px] text-slate-500">{cartItems.length} jenis item dipilih</p>
            </div>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={() => setCartItems([])}
              className="text-[11px] font-bold text-red-600 hover:text-red-800"
            >
              Kosongkan
            </button>
          )}
        </div>

        {/* Customer Form */}
        <div className="py-3 space-y-2 border-b border-slate-100 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 text-[10px] uppercase mb-0.5">
                Nama Pemesan *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Pak H. Subhan"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 text-[10px] uppercase mb-0.5">
                No. HP / WA
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0812-xxxx"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Cart Items Scrollable List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 text-center p-6">
              <span className="material-symbols-outlined text-5xl">remove_shopping_cart</span>
              <p className="font-bold text-xs">Keranjang Kasir Kosong</p>
              <p className="text-[11px]">Klik produk di sebelah kiri untuk menambahkan item ke nota ini.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-slate-900">{item.productName}</p>
                    {item.calculatedArea && (
                      <p className="text-[10px] font-bold text-emerald-700">
                        Dimensi: {item.lengthMeters}m x {item.widthMeters}m ({item.calculatedArea} m²)
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-slate-500 italic">"{item.notes}"</p>
                    )}
                  </div>
                  <span className="font-black text-slate-900 shrink-0">
                    {formatRupiah(item.totalPrice)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                  <span className="text-[10px] text-slate-500">
                    {formatRupiah(item.unitPrice)}/{item.unit}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQty(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-xs px-1">{item.qty}</span>
                    <button
                      onClick={() => updateCartQty(item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Summary Footer */}
        <div className="pt-3 border-t border-slate-200 space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Subtotal:</span>
            <span className="font-bold text-slate-900">{formatRupiah(subtotal)}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">Diskon Nota (Rp):</span>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="w-24 p-1 text-right bg-white border border-slate-300 rounded-lg font-bold text-xs"
            />
          </div>

          <div className="flex justify-between items-center font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
            <span>TOTAL BAYAR:</span>
            <span className="text-emerald-700 text-base">{formatRupiah(totalAmount)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase">
                Metode Bayar
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
              >
                <option value="Cash">Cash</option>
                <option value="QRIS">QRIS</option>
                <option value="Transfer Bank">Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase">
                Uang Diterima / DP
              </label>
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                placeholder="Jumlah bayar"
                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-emerald-800"
              />
            </div>
          </div>

          {/* Quick Pay Buttons (Uang Pas / Pelunasan) */}
          <div className="flex gap-1.5 pt-1">
            <button
              onClick={() => setPaidAmount(totalAmount)}
              className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[10px] rounded-lg"
            >
              Uang Pas ({formatRupiah(totalAmount)})
            </button>
            <button
              onClick={() => setPaidAmount(Math.round(totalAmount * 0.5))}
              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] rounded-lg"
            >
              DP 50% ({formatRupiah(Math.round(totalAmount * 0.5))})
            </button>
          </div>

          <button
            id="btn-checkout-pos-order"
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 mt-2 transition-all"
          >
            <span className="material-symbols-outlined text-lg">receipt</span>
            <span>Simpan Order & Cetak Nota</span>
          </button>
        </div>
      </div>

      {/* Modal Custom Banner Dimension Calculator */}
      {activeBannerProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Kalkulator Ukuran Banner ({activeBannerProduct.name})
              </h3>
              <button
                onClick={() => setActiveBannerProduct(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Panjang (Meter)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={bannerLength}
                    onChange={(e) => setBannerLength(parseFloat(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lebar (Meter)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={bannerWidth}
                    onChange={(e) => setBannerWidth(parseFloat(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jumlah Lembar (Qty)</label>
                <input
                  type="number"
                  min="1"
                  value={bannerQty}
                  onChange={(e) => setBannerQty(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Finishing</label>
                <input
                  type="text"
                  placeholder="e.g. Mata ayam 4 sudut / Selongsong bambu"
                  value={bannerNote}
                  onChange={(e) => setBannerNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex justify-between text-emerald-900 font-bold">
                  <span>Luas Satuan:</span>
                  <span>{(bannerLength * bannerWidth).toFixed(2)} m²</span>
                </div>
                <div className="flex justify-between text-emerald-900 font-black text-sm">
                  <span>Total Harga Banner:</span>
                  <span>
                    {formatRupiah(
                      Math.round(
                        bannerLength * bannerWidth * activeBannerProduct.basePrice * bannerQty
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveBannerProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleAddBannerToCart}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Masukkan ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

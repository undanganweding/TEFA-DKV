import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialStock, StockMovement, FinanceTransaction } from '../../types';
import { Pagination } from '../Pagination';
import { ImageUploader } from '../ImageUploader';

interface StokBahanViewProps {
  materials: MaterialStock[];
  stockMovements?: StockMovement[];
  onArchiveMaterial?: (material: MaterialStock) => void;
  onRestockMaterial?: (id: string, addQty: number) => void;
  onAddMaterial?: (newMaterial: MaterialStock) => void;
  onAddTransaction?: (trx: FinanceTransaction) => void;
  onAddStockMovement?: (movement: StockMovement) => void;
  onUpdateMaterial?: (updated: MaterialStock) => void;
}

export const StokBahanView: React.FC<StokBahanViewProps> = ({
  materials,
  stockMovements = [],
  onArchiveMaterial,
  onRestockMaterial,
  onAddMaterial,
  onAddTransaction,
  onAddStockMovement,
  onUpdateMaterial,
}) => {
  // Tabs: 'inventory' | 'history' | 'hpp_analysis'
  const [activeTab, setActiveTab] = useState<'inventory' | 'history' | 'hpp_analysis'>('inventory');

  // View Mode for Inventory: 'grid' (Compact Cards) vs 'list' (Clean Minimal List)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtering & Search
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // History Filtering
  const [movementFilterType, setMovementFilterType] = useState<string>('Semua');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyPage, setHistoryPage] = useState<number>(1);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Helper formatting
  const formatRupiah = (val: number) => 'Rp ' + (val || 0).toLocaleString('id-ID');

  const categoriesList = [
    'Semua',
    'Kertas & Stiker',
    'Bahan Banner & Cloth',
    'Tinta & Solvent',
    'Bahan Sublim & Merchandise',
    'Aksesoris Finishing',
  ];

  // ==========================================
  // MODAL STATES
  // ==========================================

  // 1. Full Add / Edit Material Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialStock | null>(null); // null = Add mode
  const [editForm, setEditForm] = useState<{
    name: string;
    code: string;
    category: MaterialStock['category'];
    currentStock: number;
    unit: string;
    costPrice: number;
    sellingRefPrice: number;
    minStock: number;
    supplier: string;
    location: string;
    recordExpenseIfAdd: boolean;
    image?: string;
  }>({
    name: '',
    code: '',
    category: 'Kertas & Stiker',
    currentStock: 0,
    unit: 'lembar',
    costPrice: 0,
    sellingRefPrice: 0,
    minStock: 10,
    supplier: 'CV. Paper Nusantara',
    location: 'Gudang Utama',
    recordExpenseIfAdd: true,
    image: '',
  });

  // 2. Stock Adjustment Modal (Increase / Decrease with Reason)
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState<boolean>(false);
  const [adjMaterialId, setAdjMaterialId] = useState<string>('');
  const [adjAction, setAdjAction] = useState<'increase' | 'decrease'>('increase');
  const [adjReason, setAdjReason] = useState<'Purchase' | 'Production usage' | 'Damage' | 'Correction'>('Purchase');
  const [adjQty, setAdjQty] = useState<number>(10);
  const [adjUnitCost, setAdjUnitCost] = useState<number>(0);
  const [adjSupplier, setAdjSupplier] = useState<string>('');
  const [adjNotes, setAdjNotes] = useState<string>('');
  const [adjRecordExpense, setAdjRecordExpense] = useState<boolean>(true);

  // 3. Quick Edit Popover Modal (For fast edit of stock, cost, or selling price)
  const [quickEditState, setQuickEditState] = useState<{
    isOpen: boolean;
    material: MaterialStock | null;
    field: 'currentStock' | 'costPrice' | 'sellingRefPrice' | null;
    value: number;
  }>({
    isOpen: false,
    material: null,
    field: null,
    value: 0,
  });

  // 4. Detail View Modal
  const [detailMaterial, setDetailMaterial] = useState<MaterialStock | null>(null);

  // ==========================================
  // DASHBOARD CALCULATIONS
  // ==========================================
  const totalMaterialTypes = useMemo(() => materials.length, [materials]);
  const totalInventoryValue = useMemo(() => materials.reduce((acc, m) => {
    const cost = m.costPrice ?? m.unitPrice ?? 0;
    return acc + m.currentStock * cost;
  }, 0), [materials]);

  const lowStockCount = useMemo(() => materials.filter(
    (m) => m.status === 'Menipis' || (m.currentStock > 0 && m.currentStock <= m.minStock)
  ).length, [materials]);

  const criticalStockCount = useMemo(() => materials.filter(
    (m) => m.status === 'Kritis' || m.currentStock === 0
  ).length, [materials]);

  // ==========================================
  // FILTERING LOGIC
  // ==========================================
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchStatus = selectedStatus === 'Semua' || m.status === selectedStatus;
      const matchCategory = selectedCategory === 'Semua' || m.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.supplier.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q);
      return matchStatus && matchCategory && matchSearch;
    });
  }, [materials, selectedStatus, selectedCategory, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, selectedCategory, searchQuery]);

  const ITEMS_PER_PAGE = viewMode === 'grid' ? 8 : 10;
  const totalPages = Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE) || 1;
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // History Filter
  const filteredMovements = stockMovements.filter((mov) => {
    const matchType =
      movementFilterType === 'Semua' ||
      (movementFilterType === 'Masuk' && mov.type === 'Masuk') ||
      (movementFilterType === 'Keluar' && (mov.type === 'Keluar' || mov.type === 'Penyesuaian'));
    const q = historySearchQuery.toLowerCase();
    const matchSearch =
      mov.materialName.toLowerCase().includes(q) ||
      (mov.notes && mov.notes.toLowerCase().includes(q)) ||
      (mov.supplier && mov.supplier.toLowerCase().includes(q)) ||
      (mov.operator && mov.operator.toLowerCase().includes(q));
    return matchType && matchSearch;
  });

  const MOVEMENTS_PER_PAGE = 8;
  const totalHistoryPages = Math.ceil(filteredMovements.length / MOVEMENTS_PER_PAGE) || 1;
  const paginatedMovements = filteredMovements.slice(
    (historyPage - 1) * MOVEMENTS_PER_PAGE,
    historyPage * MOVEMENTS_PER_PAGE
  );

  // ==========================================
  // HANDLERS FOR FULL EDIT & ADD
  // ==========================================
  const handleOpenAddModal = () => {
    setEditingMaterial(null);
    setEditForm({
      name: '',
      code: 'MAT-' + Math.floor(1000 + Math.random() * 9000),
      category: 'Kertas & Stiker',
      currentStock: 100,
      unit: 'lembar',
      costPrice: 5000,
      sellingRefPrice: 8000,
      minStock: 20,
      supplier: 'CV. Paper Nusantara',
      location: 'Gudang Utama A-1',
      recordExpenseIfAdd: true,
      image: '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (mat: MaterialStock) => {
    setEditingMaterial(mat);
    const cost = mat.costPrice ?? mat.unitPrice;
    const sell = mat.sellingRefPrice ?? Math.round(cost * 1.5);
    setEditForm({
      name: mat.name,
      code: mat.code,
      category: mat.category,
      currentStock: mat.currentStock,
      unit: mat.unit,
      costPrice: cost,
      sellingRefPrice: sell,
      minStock: mat.minStock,
      supplier: mat.supplier,
      location: mat.location,
      recordExpenseIfAdd: false,
      image: mat.image || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveFullEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      alert('Nama bahan tidak boleh kosong');
      return;
    }

    const costPrice = Math.max(0, editForm.costPrice);
    const sellingRefPrice = Math.max(0, editForm.sellingRefPrice);
    const currentStock = Math.max(0, editForm.currentStock);
    const minStock = Math.max(1, editForm.minStock);

    let status: 'Aman' | 'Menipis' | 'Kritis' = 'Aman';
    if (currentStock === 0) status = 'Kritis';
    else if (currentStock <= minStock) status = 'Menipis';

    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    if (editingMaterial) {
      // Editing existing material
      const stockDiff = currentStock - editingMaterial.currentStock;

      const updatedMat: MaterialStock = {
        ...editingMaterial,
        name: editForm.name.trim(),
        code: editForm.code.trim(),
        category: editForm.category,
        currentStock,
        unit: editForm.unit.trim(),
        unitPrice: costPrice,
        costPrice,
        sellingRefPrice,
        minStock,
        supplier: editForm.supplier.trim(),
        location: editForm.location.trim(),
        status,
        image: editForm.image || undefined,
      };

      if (onUpdateMaterial) {
        onUpdateMaterial(updatedMat);
      }

      // Record movement if stock quantity changed
      if (stockDiff !== 0 && onAddStockMovement) {
        const movement: StockMovement = {
          id: 'MOV-EDIT-' + Date.now(),
          materialId: editingMaterial.id,
          materialName: updatedMat.name,
          date: new Date().toLocaleString('id-ID'),
          type: stockDiff > 0 ? 'Masuk' : 'Penyesuaian',
          quantity: stockDiff,
          unit: updatedMat.unit,
          unitCost: costPrice,
          totalValue: Math.abs(stockDiff) * costPrice,
          supplier: updatedMat.supplier,
          notes: `Edit data bahan (Koreksi stok: ${stockDiff > 0 ? '+' : ''}${stockDiff} ${updatedMat.unit})`,
          operator: 'Operator TEFA',
        };
        onAddStockMovement(movement);
      }

      if (detailMaterial && detailMaterial.id === editingMaterial.id) {
        setDetailMaterial(updatedMat);
      }

      showToast(`Bahan "${updatedMat.name}" berhasil diperbarui!`);
    } else {
      // Creating new material
      const newMaterial: MaterialStock = {
        id: 'MAT-' + Date.now(),
        code: editForm.code.trim() || 'MAT-' + Math.floor(1000 + Math.random() * 9000),
        name: editForm.name.trim(),
        category: editForm.category,
        currentStock,
        minStock,
        unit: editForm.unit.trim() || 'pcs',
        unitPrice: costPrice,
        costPrice,
        sellingRefPrice,
        supplier: editForm.supplier.trim() || 'Supplier TEFA',
        location: editForm.location.trim() || 'Gudang Utama',
        status,
        lastRestocked: nowStr,
        image: editForm.image || undefined,
      };

      if (onAddMaterial) {
        onAddMaterial(newMaterial);
      }

      if (currentStock > 0 && onAddStockMovement) {
        const movement: StockMovement = {
          id: 'MOV-NEW-' + Date.now(),
          materialId: newMaterial.id,
          materialName: newMaterial.name,
          date: new Date().toLocaleString('id-ID'),
          type: 'Masuk',
          quantity: currentStock,
          unit: newMaterial.unit,
          unitCost: costPrice,
          totalValue: currentStock * costPrice,
          supplier: newMaterial.supplier,
          notes: 'Stok Awal pendaftaran bahan baru',
          operator: 'Operator TEFA',
        };
        onAddStockMovement(movement);
      }

      if (editForm.recordExpenseIfAdd && currentStock > 0 && costPrice > 0 && onAddTransaction) {
        const totalCost = currentStock * costPrice;
        const now = new Date();
        const newTrx: FinanceTransaction = {
          id: 'TRX-ADD-MAT-' + Date.now(),
          transNo: 'TRX-MAT-' + Math.floor(10000 + Math.random() * 90000),
          date: now.toISOString().split('T')[0] + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          type: 'Pengeluaran',
          category: 'Pembelian Bahan',
          description: `Pengadaan Stok Awal: ${newMaterial.name} (${currentStock} ${newMaterial.unit})`,
          amount: totalCost,
          paymentMethod: 'Cash',
          operator: 'Operator TEFA',
          status: 'Berhasil',
        };
        onAddTransaction(newTrx);
      }

      showToast(`Bahan baru "${newMaterial.name}" berhasil dibuat!`);
    }

    setIsEditModalOpen(false);
  };

  // ==========================================
  // HANDLERS FOR STOCK ADJUSTMENT
  // ==========================================
  const handleOpenAdjustmentModal = (mat?: MaterialStock) => {
    if (mat) {
      setAdjMaterialId(mat.id);
      setAdjUnitCost(mat.costPrice ?? mat.unitPrice);
      setAdjSupplier(mat.supplier);
    } else if (materials.length > 0) {
      setAdjMaterialId(materials[0].id);
      setAdjUnitCost(materials[0].costPrice ?? materials[0].unitPrice);
      setAdjSupplier(materials[0].supplier);
    }
    setAdjAction('increase');
    setAdjReason('Purchase');
    setAdjQty(10);
    setAdjNotes('');
    setAdjRecordExpense(true);
    setIsAdjustmentModalOpen(true);
  };

  const handleSelectAdjMaterial = (id: string) => {
    setAdjMaterialId(id);
    const m = materials.find((mat) => mat.id === id);
    if (m) {
      setAdjUnitCost(m.costPrice ?? m.unitPrice);
      setAdjSupplier(m.supplier);
    }
  };

  const handleSubmitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const mat = materials.find((m) => m.id === adjMaterialId);
    if (!mat) {
      alert('Pilih bahan terlebih dahulu');
      return;
    }
    if (adjQty <= 0) {
      alert('Jumlah penyesuaian harus lebih dari 0');
      return;
    }

    const unitCost = Math.max(0, adjUnitCost);
    const isIncrease = adjAction === 'increase';
    const deltaQty = isIncrease ? adjQty : -adjQty;
    const newStock = Math.max(0, mat.currentStock + deltaQty);

    let newStatus: 'Aman' | 'Menipis' | 'Kritis' = 'Aman';
    if (newStock === 0) newStatus = 'Kritis';
    else if (newStock <= mat.minStock) newStatus = 'Menipis';

    const todayFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const updatedMat: MaterialStock = {
      ...mat,
      currentStock: newStock,
      costPrice: isIncrease ? unitCost : (mat.costPrice ?? mat.unitPrice),
      unitPrice: isIncrease ? unitCost : mat.unitPrice,
      status: newStatus,
      lastRestocked: isIncrease ? todayFormatted : mat.lastRestocked,
    };

    if (onUpdateMaterial) {
      onUpdateMaterial(updatedMat);
    }

    // Record Stock Movement
    const reasonLabels: Record<string, string> = {
      Purchase: 'Pembelian Bahan Baru (Purchase)',
      'Production usage': 'Pemakaian Produksi TEFA',
      Damage: 'Bahan Rusak / Basi / Cacat',
      Correction: 'Koreksi Stok Opnam',
    };

    if (onAddStockMovement) {
      const movement: StockMovement = {
        id: 'MOV-ADJ-' + Date.now(),
        materialId: mat.id,
        materialName: mat.name,
        date: new Date().toLocaleString('id-ID'),
        type: isIncrease ? 'Masuk' : adjReason === 'Production usage' ? 'Keluar' : 'Penyesuaian',
        quantity: deltaQty,
        unit: mat.unit,
        unitCost,
        totalValue: Math.abs(deltaQty) * unitCost,
        supplier: isIncrease ? adjSupplier || mat.supplier : undefined,
        notes: `${reasonLabels[adjReason]} - ${adjNotes || 'Tanpa catatan'}`.trim(),
        operator: 'Operator TEFA',
      };
      onAddStockMovement(movement);
    }

    // Record Finance Expense if Purchase
    if (isIncrease && adjReason === 'Purchase' && adjRecordExpense && unitCost > 0 && onAddTransaction) {
      const totalCost = adjQty * unitCost;
      const now = new Date();
      const newTrx: FinanceTransaction = {
        id: 'TRX-PURCHASE-' + Date.now(),
        transNo: 'TRX-PUR-' + Math.floor(10000 + Math.random() * 90000),
        date: now.toISOString().split('T')[0] + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: 'Pengeluaran',
        category: 'Pembelian Bahan',
        description: `Pembelian Restock: ${mat.name} (+${adjQty} ${mat.unit}) - Supplier: ${adjSupplier || mat.supplier}`,
        amount: totalCost,
        paymentMethod: 'Cash',
        operator: 'Operator TEFA',
        status: 'Berhasil',
      };
      onAddTransaction(newTrx);
    }

    if (detailMaterial && detailMaterial.id === mat.id) {
      setDetailMaterial(updatedMat);
    }

    setIsAdjustmentModalOpen(false);
    showToast(
      `Penyesuaian stok "${mat.name}" (${deltaQty > 0 ? '+' : ''}${deltaQty} ${mat.unit}) berhasil disimpan!`
    );
  };

  // ==========================================
  // HANDLERS FOR QUICK INLINE EDIT
  // ==========================================
  const handleOpenQuickEdit = (
    mat: MaterialStock,
    field: 'currentStock' | 'costPrice' | 'sellingRefPrice',
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const currentVal =
      field === 'currentStock'
        ? mat.currentStock
        : field === 'costPrice'
        ? mat.costPrice ?? mat.unitPrice
        : mat.sellingRefPrice ?? Math.round((mat.costPrice ?? mat.unitPrice) * 1.5);

    setQuickEditState({
      isOpen: true,
      material: mat,
      field,
      value: currentVal,
    });
  };

  const handleSaveQuickEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const { material, field, value } = quickEditState;
    if (!material || !field) return;

    const newVal = Math.max(0, value);
    let updatedMat = { ...material };

    if (field === 'currentStock') {
      const diff = newVal - material.currentStock;
      let newStatus: 'Aman' | 'Menipis' | 'Kritis' = 'Aman';
      if (newVal === 0) newStatus = 'Kritis';
      else if (newVal <= material.minStock) newStatus = 'Menipis';

      updatedMat.currentStock = newVal;
      updatedMat.status = newStatus;

      if (diff !== 0 && onAddStockMovement) {
        const movement: StockMovement = {
          id: 'MOV-QUICK-' + Date.now(),
          materialId: material.id,
          materialName: material.name,
          date: new Date().toLocaleString('id-ID'),
          type: diff > 0 ? 'Masuk' : 'Penyesuaian',
          quantity: diff,
          unit: material.unit,
          unitCost: material.costPrice ?? material.unitPrice,
          totalValue: Math.abs(diff) * (material.costPrice ?? material.unitPrice),
          notes: 'Quick edit stok langsung di kartu',
          operator: 'Operator TEFA',
        };
        onAddStockMovement(movement);
      }
    } else if (field === 'costPrice') {
      updatedMat.costPrice = newVal;
      updatedMat.unitPrice = newVal;
    } else if (field === 'sellingRefPrice') {
      updatedMat.sellingRefPrice = newVal;
    }

    if (onUpdateMaterial) {
      onUpdateMaterial(updatedMat);
    }

    if (detailMaterial && detailMaterial.id === material.id) {
      setDetailMaterial(updatedMat);
    }

    setQuickEditState({ isOpen: false, material: null, field: null, value: 0 });
    showToast(`Nilai ${field === 'currentStock' ? 'Stok' : field === 'costPrice' ? 'HPP Modal' : 'Harga Jual Acuan'} berhasil diubah!`);
  };

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-800 relative bg-slate-50/50 p-1 md:p-2 rounded-3xl">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border border-slate-700/80"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">check</span>
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR */}
      <div className="bg-white p-6 rounded-[28px] border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Stok Bahan & HPP Costing
            </h2>
            <span className="bg-[#5B4BFF]/10 text-[#5B4BFF] text-[10px] font-extrabold px-3 py-0.5 rounded-full border border-[#5B4BFF]/20">
              TEFA SaaS Inventory
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Manajemen persediaan bahan baku kreatif, kalkulasi HPP modal, harga acuan jual, dan pencatatan pergerakan stok.
          </p>
        </div>

        {/* Global Action Header Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleOpenAdjustmentModal()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-4 py-2.5 rounded-full flex items-center gap-2 border border-slate-200 transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-amber-600">tune</span>
            <span>Penyesuaian Stok</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="bg-[#5B4BFF] hover:bg-[#4a3ce6] text-white font-extrabold text-xs px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>+ Tambah Bahan Baru</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD SUMMARY: 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Material */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-2xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Total Jenis Bahan
            </p>
            <h3 className="text-2xl font-black text-slate-900">{totalMaterialTypes}</h3>
            <p className="text-[10px] font-bold text-slate-500">Katalog Bahan TEFA DKV</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center border border-[#5B4BFF]/20">
            <span className="material-symbols-outlined text-2xl">widgets</span>
          </div>
        </motion.div>

        {/* Card 2: Total Inventory Value */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-2xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Total Nilai Aset Stok
            </p>
            <h3 className="text-xl font-black text-emerald-700">{formatRupiah(totalInventoryValue)}</h3>
            <p className="text-[10px] font-bold text-emerald-600/80">Aset Lancar Fisik Modal</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
        </motion.div>

        {/* Card 3: Low Stock */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-2xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider">
              Stok Menipis
            </p>
            <h3 className="text-2xl font-black text-amber-700">{lowStockCount}</h3>
            <p className="text-[10px] font-bold text-amber-600/80">Mendekati Batas Min Stock</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
        </motion.div>

        {/* Card 4: Critical Stock */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-2xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-rose-600 uppercase tracking-wider">
              Stok Kritis / Habis
            </p>
            <h3 className="text-2xl font-black text-rose-700">{criticalStockCount}</h3>
            <p className="text-[10px] font-bold text-rose-600/80">Perlu Segera Di-Restock</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200/60">
            <span className="material-symbols-outlined text-2xl">error</span>
          </div>
        </motion.div>
      </div>

      {/* NAVIGATION TABS & VIEW TOGGLE SWITCHER */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 p-2 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-base">inventory_2</span>
            <span>Katalog Stok ({materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-base">history</span>
            <span>Riwayat Pergerakan ({stockMovements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('hpp_analysis')}
            className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'hpp_analysis'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-base">calculate</span>
            <span>Analisis HPP & Margin</span>
          </button>
        </div>

        {/* View Layout Toggle (Grid vs List) for Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Compact Card Layout"
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
              <span>Kartu</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Clean List Layout"
            >
              <span className="material-symbols-outlined text-base">view_list</span>
              <span>Daftar</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KATALOG STOK (COMPACT CARD / LIST HYBRID)                          */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* SEARCH & FILTER CONTROLS */}
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full lg:w-auto">
              <span className="text-xs font-extrabold text-slate-400 shrink-0">Status:</span>
              {['Semua', 'Aman', 'Menipis', 'Kritis'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-[#5B4BFF] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st} {st !== 'Semua' && `(${materials.filter((m) => m.status === st).length})`}
                </button>
              ))}
            </div>

            {/* Category Dropdown & Search Bar */}
            <div className="flex items-center gap-2.5 w-full lg:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden shrink-0 cursor-pointer"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <div className="relative w-full lg:w-72">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama bahan, kode, supplier..."
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#5B4BFF] focus:outline-hidden transition-all"
                />
              </div>
            </div>
          </div>

          {/* EMPTY STATE */}
          {filteredMaterials.length === 0 ? (
            <div className="bg-white rounded-[28px] border border-slate-200/80 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">search_off</span>
              </div>
              <p className="font-extrabold text-slate-800 text-sm">Bahan baku tidak ditemukan</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Coba ubah kata kunci pencarian atau bersihkan filter status dan kategori yang aktif.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* COMPACT CARDS GRID LAYOUT */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {paginatedMaterials.map((mat) => {
                const cost = mat.costPrice ?? mat.unitPrice;
                const sellRef = mat.sellingRefPrice ?? Math.round(cost * 1.5);
                const invVal = mat.currentStock * cost;

                return (
                  <motion.div
                    key={mat.id}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.15 }}
                    className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    {/* Item Top: Header & Badges */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {mat.image ? (
                              <img src={mat.image} alt={mat.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-lg text-slate-400 font-bold">inventory</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
                              {mat.code}
                            </span>
                            <h3
                              onClick={() => setDetailMaterial(mat)}
                              className="font-black text-slate-900 text-xs sm:text-sm hover:text-[#5B4BFF] transition-colors cursor-pointer line-clamp-1"
                              title={mat.name}
                            >
                              {mat.name}
                            </h3>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border shrink-0 ${
                            mat.status === 'Aman'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : mat.status === 'Menipis'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {mat.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200/60">
                          {mat.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          📍 {mat.location}
                        </span>
                      </div>
                    </div>

                    {/* Middle Section: Stock & Quick Edit Trigger */}
                    <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 space-y-2">
                      {/* Stock Quantity */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                          Stok Fisik
                        </span>
                        <button
                          onClick={(e) => handleOpenQuickEdit(mat, 'currentStock', e)}
                          className="font-black text-sm text-slate-900 hover:text-[#5B4BFF] transition-colors flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200/80 cursor-pointer"
                          title="Klik untuk ubah stok cepat"
                        >
                          <span>
                            {mat.currentStock} {mat.unit}
                          </span>
                          <span className="material-symbols-outlined text-xs text-slate-400">edit</span>
                        </button>
                      </div>

                      {/* Stock Gauge Progress Bar */}
                      <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            mat.status === 'Aman'
                              ? 'bg-emerald-500'
                              : mat.status === 'Menipis'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(8, (mat.currentStock / (mat.minStock * 3 || 1)) * 100)
                            )}%`,
                          }}
                        />
                      </div>

                      {/* Financial Pricing Cards */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200/60 text-[11px]">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400">Modal (HPP)</p>
                          <button
                            onClick={(e) => handleOpenQuickEdit(mat, 'costPrice', e)}
                            className="font-extrabold text-slate-900 hover:text-[#5B4BFF] transition-colors text-left cursor-pointer"
                          >
                            {formatRupiah(cost)}
                          </button>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400">Acuan Jual</p>
                          <button
                            onClick={(e) => handleOpenQuickEdit(mat, 'sellingRefPrice', e)}
                            className="font-extrabold text-emerald-700 hover:text-emerald-800 transition-colors text-left cursor-pointer"
                          >
                            {formatRupiah(sellRef)}
                          </button>
                        </div>
                      </div>

                      {/* Total Inventory Value */}
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60 font-bold">
                        <span className="text-slate-400">Nilai Aset:</span>
                        <span className="text-slate-900 font-extrabold">{formatRupiah(invVal)}</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      <button
                        onClick={() => setDetailMaterial(mat)}
                        className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] transition-all cursor-pointer text-center"
                      >
                        Detail
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(mat)}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-[#5B4BFF] font-extrabold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1"
                        title="Edit Semua Data"
                      >
                        <span className="material-symbols-outlined text-xs">edit</span>
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleOpenAdjustmentModal(mat)}
                        className="py-1.5 px-3 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3ce6] text-white font-extrabold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                        title="+ Tambah Stok / Penyesuaian"
                      >
                        <span className="material-symbols-outlined text-xs">add</span>
                        <span>Stok</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* CLEAN MINIMAL LIST LAYOUT */
            <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {paginatedMaterials.map((mat) => {
                  const cost = mat.costPrice ?? mat.unitPrice;
                  const sellRef = mat.sellingRefPrice ?? Math.round(cost * 1.5);
                  const invVal = mat.currentStock * cost;

                  return (
                    <div
                      key={mat.id}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Name & Badges */}
                      <div className="flex items-start gap-3 md:w-1/3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {mat.image ? (
                            <img src={mat.image} alt={mat.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-lg text-slate-400">inventory</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3
                              onClick={() => setDetailMaterial(mat)}
                              className="font-black text-slate-900 text-sm hover:text-[#5B4BFF] cursor-pointer transition-colors"
                            >
                              {mat.name}
                            </h3>
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {mat.code}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {mat.category} • 📍 {mat.location} • Supplier: {mat.supplier}
                          </p>
                        </div>
                      </div>

                      {/* Stock & Prices */}
                      <div className="grid grid-cols-3 gap-4 md:w-1/2 text-xs">
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase">
                            Stok Fisik
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <button
                              onClick={(e) => handleOpenQuickEdit(mat, 'currentStock', e)}
                              className="font-black text-slate-900 hover:text-[#5B4BFF] cursor-pointer"
                            >
                              {mat.currentStock} {mat.unit}
                            </button>
                            <span
                              className={`text-[9px] font-black px-2 py-0.2 rounded-full border ${
                                mat.status === 'Aman'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : mat.status === 'Menipis'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              {mat.status}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase">
                            Modal (HPP) / Jual
                          </p>
                          <p className="font-extrabold text-slate-900 mt-0.5">
                            {formatRupiah(cost)} /{' '}
                            <span className="text-emerald-700">{formatRupiah(sellRef)}</span>
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase">
                            Nilai Aset
                          </p>
                          <p className="font-black text-slate-900 mt-0.5">{formatRupiah(invVal)}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                          onClick={() => setDetailMaterial(mat)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold cursor-pointer transition-all"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(mat)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-800 hover:text-[#5B4BFF] text-xs font-extrabold cursor-pointer transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleOpenAdjustmentModal(mat)}
                          className="px-3 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3ce6] text-white text-xs font-extrabold cursor-pointer transition-all"
                        >
                          + Stok
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredMaterials.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemName="bahan baku"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RIWAYAT PERGERAKAN STOK (STOCK MOVEMENT HISTORY)                  */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-xs font-extrabold text-slate-400 shrink-0">Filter Tipe:</span>
              {['Semua', 'Masuk', 'Keluar'].map((tp) => (
                <button
                  key={tp}
                  onClick={() => setMovementFilterType(tp)}
                  className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                    movementFilterType === tp
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tp}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => handleOpenAdjustmentModal()}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-extrabold border border-amber-200 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">tune</span>
                <span>+ Catat Penyesuaian</span>
              </button>

              <div className="relative w-full md:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                  search
                </span>
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Cari riwayat..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-4">Waktu & Operator</th>
                    <th className="p-4">Nama Bahan</th>
                    <th className="p-4">Jenis Pergerakan</th>
                    <th className="p-4">Perubahan Stok</th>
                    <th className="p-4">Harga Modal Unit</th>
                    <th className="p-4">Total Nilai</th>
                    <th className="p-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400 font-bold">
                        Belum ada data riwayat pergerakan stok.
                      </td>
                    </tr>
                  ) : (
                    paginatedMovements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <p className="font-black text-slate-900">{mov.date}</p>
                          <p className="text-[10px] text-slate-400 font-medium">By: {mov.operator || 'Operator TEFA'}</p>
                        </td>
                        <td className="p-4 font-black text-slate-900">{mov.materialName}</td>
                        <td className="p-4">
                          <span
                            className={`text-[10px] font-black px-3 py-1 rounded-full border inline-flex items-center gap-1 ${
                              mov.type === 'Masuk'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : mov.type === 'Keluar'
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}
                          >
                            {mov.type === 'Masuk' ? '▲ Stok Masuk' : mov.type === 'Keluar' ? '▼ Pemakaian' : '◆ Koreksi'}
                          </span>
                        </td>
                        <td className="p-4 font-black text-sm text-slate-900">
                          {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity} {mov.unit}
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {formatRupiah(mov.unitCost)}
                        </td>
                        <td className="p-4 font-black text-slate-900">
                          {formatRupiah(mov.totalValue)}
                        </td>
                        <td className="p-4 text-slate-600">
                          <p className="font-semibold text-slate-800">{mov.notes || '-'}</p>
                          {mov.supplier && (
                            <p className="text-[10px] text-slate-400">Supplier: {mov.supplier}</p>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={historyPage}
            totalPages={totalHistoryPages}
            onPageChange={setHistoryPage}
            totalItems={filteredMovements.length}
            itemsPerPage={MOVEMENTS_PER_PAGE}
            itemName="pergerakan stok"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COSTING & HPP MARGIN ANALYSIS                                      */}
      {/* ========================================================================= */}
      {activeTab === 'hpp_analysis' && (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-[28px] shadow-lg border border-purple-800/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-[#5B4BFF]/20 text-purple-300 border border-purple-400/30 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">calculate</span>
                </span>
                <div>
                  <h3 className="font-black text-lg text-white">Analisis HPP & Margin Profit TEFA</h3>
                  <p className="text-xs text-purple-200/80 font-medium">
                    Kalkulasi estimasi margin keuntungan berdasarkan Harga Modal (HPP) vs Harga Jual Acuan.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 space-y-1">
                <p className="text-[10px] font-extrabold text-purple-300 uppercase">1. Pengadaan Bahan</p>
                <p className="text-xs font-bold text-white">
                  Harga beli modal otomatis tersinkron ke laporan keuangan sebagai biaya pengeluaran kasir.
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 space-y-1">
                <p className="text-[10px] font-extrabold text-purple-300 uppercase">2. Kalkulasi HPP Produksi</p>
                <p className="text-xs font-bold text-white">
                  Biaya bahan per unit digunakan sebagai dasar penetapan tarif cetak di POS Kasir TEFA.
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 space-y-1">
                <p className="text-[10px] font-extrabold text-purple-300 uppercase">3. Neraca Nilai Persediaan</p>
                <p className="text-xs font-bold text-white">
                  Total aset modal persediaan (<span className="text-emerald-300 font-extrabold">{formatRupiah(totalInventoryValue)}</span>) tercatat sebagai aset lancar.
                </p>
              </div>
            </div>
          </div>

          {/* Margin Analysis Table */}
          <div className="bg-white p-5 rounded-[28px] border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-black text-slate-900 text-sm">Simulasi Profit Margin Per Bahan Baku</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
                  <tr>
                    <th className="p-3">Nama Bahan</th>
                    <th className="p-3">Harga Beli Modal (HPP)</th>
                    <th className="p-3">Harga Jual Acuan</th>
                    <th className="p-3">Margin Nominal (Rp)</th>
                    <th className="p-3">Estimasi Margin (%)</th>
                    <th className="p-3 text-center">Aksi Quick Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.map((m) => {
                    const cost = m.costPrice ?? m.unitPrice;
                    const sell = m.sellingRefPrice ?? Math.round(cost * 1.5);
                    const marginNominal = Math.max(0, sell - cost);
                    const marginPercent = sell > 0 ? Number(((marginNominal / sell) * 100).toFixed(1)) : 0;

                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-extrabold text-slate-900">{m.name}</td>
                        <td className="p-3 font-bold text-slate-800">{formatRupiah(cost)} /{m.unit}</td>
                        <td className="p-3 font-bold text-emerald-700">{formatRupiah(sell)} /{m.unit}</td>
                        <td className="p-3 font-black text-[#5B4BFF]">+{formatRupiah(marginNominal)}</td>
                        <td className="p-3">
                          <span className="bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full text-[10px]">
                            {marginPercent}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleOpenEditModal(m)}
                            className="px-3 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5B4BFF] font-extrabold text-[11px] border border-purple-200 cursor-pointer"
                          >
                            Ubah HPP / Jual
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FULL ADD / EDIT MATERIAL MODAL                                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleSaveFullEdit}
              className="bg-white rounded-[28px] p-6 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl my-8 text-xs font-sans max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">
                      {editingMaterial ? 'edit_note' : 'post_add'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">
                      {editingMaterial ? 'Edit Data Bahan Baku' : 'Tambah Bahan Baku Baru'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Lengkapi detail informasi spesifikasi, stok, dan costing HPP
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {/* Name & Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block font-extrabold text-slate-700 mb-1">
                      Nama Bahan Baku *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kertas Art Paper 260gr A3+"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-[#5B4BFF] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Kode Bahan *</label>
                    <input
                      type="text"
                      required
                      value={editForm.code}
                      onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-extrabold text-slate-900"
                    />
                  </div>
                </div>

                {/* Category & Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Kategori *</label>
                    <select
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value as any })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                    >
                      <option value="Kertas & Stiker">Kertas & Stiker</option>
                      <option value="Bahan Banner & Cloth">Bahan Banner & Cloth</option>
                      <option value="Tinta & Solvent">Tinta & Solvent</option>
                      <option value="Bahan Sublim & Merchandise">Bahan Sublim & Merchandise</option>
                      <option value="Aksesoris Finishing">Aksesoris Finishing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Satuan Unit *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. lembar, roll, pack, pcs, liter"
                      value={editForm.unit}
                      onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Stock Quantity & Min Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">
                      Jumlah Stok Fisik *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={editForm.currentStock}
                      onChange={(e) =>
                        setEditForm({ ...editForm, currentStock: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">
                      Batas Stok Minimal (Min) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={editForm.minStock}
                      onChange={(e) =>
                        setEditForm({ ...editForm, minStock: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Cost Price & Selling Reference Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">
                      Harga Beli Modal / HPP (Rp) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={editForm.costPrice}
                      onChange={(e) =>
                        setEditForm({ ...editForm, costPrice: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">
                      Harga Jual Acuan (Rp) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={editForm.sellingRefPrice}
                      onChange={(e) =>
                        setEditForm({ ...editForm, sellingRefPrice: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-emerald-700 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Supplier & Storage Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Supplier / Mitra</label>
                    <input
                      type="text"
                      value={editForm.supplier}
                      onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Lokasi Penyimpanan</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                {!editingMaterial && editForm.currentStock > 0 && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-xs">
                      Catat biaya modal awal ({formatRupiah(editForm.currentStock * editForm.costPrice)}) ke Laporan Keuangan?
                    </span>
                    <input
                      type="checkbox"
                      checked={editForm.recordExpenseIfAdd}
                      onChange={(e) =>
                        setEditForm({ ...editForm, recordExpenseIfAdd: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-[#5B4BFF] cursor-pointer"
                    />
                  </div>
                )}

                {/* Foto Bahan / Barang Uploader */}
                <div className="pt-3 border-t border-slate-100">
                  <ImageUploader
                    images={editForm.image ? [editForm.image] : []}
                    onImagesChange={(imgs) => {
                      setEditForm({ ...editForm, image: imgs[0] || '' });
                    }}
                    maxImages={1}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3ce6] text-white font-extrabold shadow-md cursor-pointer"
                >
                  Simpan Data
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: STOCK ADJUSTMENT MODAL                                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAdjustmentModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleSubmitAdjustment}
              className="bg-white rounded-[28px] p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl my-8 text-xs font-sans"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">tune</span>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Penyesuaian Stok (Movement)</h3>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Tambah/kurangi stok fisik beserta alasan pergerakan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {/* Material Selection */}
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Pilih Bahan Baku *</label>
                  <select
                    value={adjMaterialId}
                    onChange={(e) => handleSelectAdjMaterial(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900 focus:bg-white focus:outline-hidden"
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Stok: {m.currentStock} {m.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Adjustment Direction Toggle: Increase vs Decrease */}
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Arah Pergerakan *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAdjAction('increase');
                        setAdjReason('Purchase');
                      }}
                      className={`py-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        adjAction === 'increase'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">add_circle</span>
                      <span>+ Tambah Stok</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAdjAction('decrease');
                        setAdjReason('Production usage');
                      }}
                      className={`py-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        adjAction === 'decrease'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">remove_circle</span>
                      <span>- Kurangi Stok</span>
                    </button>
                  </div>
                </div>

                {/* Reason Selection */}
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Alasan Pergerakan *</label>
                  <select
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                  >
                    {adjAction === 'increase' ? (
                      <>
                        <option value="Purchase">Pembelian Bahan Baru (Purchase)</option>
                        <option value="Correction">Koreksi Stok Opnam (Tambah)</option>
                      </>
                    ) : (
                      <>
                        <option value="Production usage">Pemakaian Produksi TEFA</option>
                        <option value="Damage">Kerusakan / Cacat / Basi (Damage)</option>
                        <option value="Correction">Koreksi Stok Opnam (Kurang)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Quantity & Unit Cost */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Jumlah (Qty) *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={adjQty}
                      onChange={(e) => setAdjQty(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Harga Modal Unit (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={adjUnitCost}
                      onChange={(e) => setAdjUnitCost(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                {adjAction === 'increase' && (
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Supplier / Pemasok</label>
                    <input
                      type="text"
                      value={adjSupplier}
                      onChange={(e) => setAdjSupplier(e.target.value)}
                      placeholder="e.g. PT. Laju Grafika"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Catatan / Keterangan</label>
                  <input
                    type="text"
                    value={adjNotes}
                    onChange={(e) => setAdjNotes(e.target.value)}
                    placeholder="e.g. Order POS-2025-0891 atau PO-001"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>

                {adjAction === 'increase' && adjReason === 'Purchase' && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-xs">
                      Catat ke Laporan Keuangan ({formatRupiah(adjQty * adjUnitCost)})?
                    </span>
                    <input
                      type="checkbox"
                      checked={adjRecordExpense}
                      onChange={(e) => setAdjRecordExpense(e.target.checked)}
                      className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-[#5B4BFF] cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl font-extrabold text-white shadow-md cursor-pointer ${
                    adjAction === 'increase'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Simpan Movement
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: QUICK EDIT POPOVER MODAL                                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {quickEditState.isOpen && quickEditState.material && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.form
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onSubmit={handleSaveQuickEdit}
              className="bg-white rounded-[24px] p-5 max-w-xs w-full space-y-3 border border-slate-200 shadow-2xl text-xs font-sans"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-black text-slate-900">
                  Quick Edit:{' '}
                  {quickEditState.field === 'currentStock'
                    ? 'Jumlah Stok'
                    : quickEditState.field === 'costPrice'
                    ? 'HPP Modal'
                    : 'Harga Jual Acuan'}
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setQuickEditState({ isOpen: false, material: null, field: null, value: 0 })
                  }
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-[11px] text-slate-500 font-semibold">
                {quickEditState.material.name} ({quickEditState.material.code})
              </p>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Nilai Baru *</label>
                <input
                  type="number"
                  min={0}
                  autoFocus
                  value={quickEditState.value}
                  onChange={(e) =>
                    setQuickEditState({ ...quickEditState, value: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 text-sm focus:bg-white focus:border-[#5B4BFF] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setQuickEditState({ isOpen: false, material: null, field: null, value: 0 })
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3ce6] text-white font-extrabold shadow-xs cursor-pointer"
                >
                  Update
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: MATERIAL DETAIL VIEW MODAL                                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {detailMaterial && (
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
                    <span className="material-symbols-outlined text-2xl">inventory_2</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-base">{detailMaterial.name}</h3>
                      <span
                        className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${
                          detailMaterial.status === 'Aman'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : detailMaterial.status === 'Menipis'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {detailMaterial.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      Kode: <span className="font-mono font-extrabold">{detailMaterial.code}</span> • Kategori: {detailMaterial.category}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailMaterial(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* 3 Metric Summary Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase">Stok Fisik Tersedia</p>
                  <p className="text-xl font-black text-slate-900">
                    {detailMaterial.currentStock} <span className="text-xs text-slate-500 font-bold">{detailMaterial.unit}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">Min stock: {detailMaterial.minStock} {detailMaterial.unit}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase">Harga Modal (HPP)</p>
                  <p className="text-xl font-black text-slate-900">
                    {formatRupiah(detailMaterial.costPrice ?? detailMaterial.unitPrice)}
                  </p>
                  <p className="text-[10px] text-slate-400">per {detailMaterial.unit}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase">Harga Jual Acuan</p>
                  <p className="text-xl font-black text-emerald-700">
                    {formatRupiah(detailMaterial.sellingRefPrice ?? Math.round((detailMaterial.costPrice ?? detailMaterial.unitPrice) * 1.5))}
                  </p>
                  <p className="text-[10px] text-slate-400">per {detailMaterial.unit}</p>
                </div>
              </div>

              {/* Material image cover */}
              {detailMaterial.image && (
                <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
                  <img src={detailMaterial.image} alt={detailMaterial.name} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Detail Specifications */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <h4 className="font-extrabold text-slate-900">Spesifikasi & Detail Lokasi</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <p><span className="text-slate-400 font-bold">Supplier Utama:</span> {detailMaterial.supplier}</p>
                  <p><span className="text-slate-400 font-bold">Lokasi Gudang:</span> {detailMaterial.location}</p>
                  <p><span className="text-slate-400 font-bold">Restock Terakhir:</span> {detailMaterial.lastRestocked || '-'}</p>
                  <p><span className="text-slate-400 font-bold">Total Nilai Aset:</span> {formatRupiah(detailMaterial.currentStock * (detailMaterial.costPrice ?? detailMaterial.unitPrice))}</p>
                </div>
              </div>

              {/* Stock Movement History for this material */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900">Riwayat Pergerakan Bahan Ini</h4>
                <div className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden">
                  {stockMovements.filter((m) => m.materialId === detailMaterial.id).length === 0 ? (
                    <p className="p-4 text-center text-slate-400 font-semibold">Belum ada catatan riwayat pergerakan untuk bahan ini.</p>
                  ) : (
                    <div className="divide-y divide-slate-200/60 max-h-48 overflow-y-auto">
                      {stockMovements
                        .filter((m) => m.materialId === detailMaterial.id)
                        .map((mov) => (
                          <div key={mov.id} className="p-3 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-extrabold text-slate-900">{mov.date} • <span className="font-normal text-slate-500">{mov.notes}</span></p>
                              <p className="text-[10px] text-slate-400">By: {mov.operator || 'Operator'}</p>
                            </div>
                            <span className={`font-black ${mov.quantity > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity} {mov.unit}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {onArchiveMaterial && (
                  <button
                    onClick={() => {
                      onArchiveMaterial(detailMaterial);
                      setDetailMaterial(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold cursor-pointer border border-rose-200"
                  >
                    Arsipkan Bahan
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const mat = detailMaterial;
                      setDetailMaterial(null);
                      handleOpenEditModal(mat);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold cursor-pointer"
                  >
                    Edit Data Full
                  </button>
                  <button
                    onClick={() => {
                      const mat = detailMaterial;
                      setDetailMaterial(null);
                      handleOpenAdjustmentModal(mat);
                    }}
                    className="px-5 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3ce6] text-white font-extrabold cursor-pointer shadow-md"
                  >
                    + Penyesuaian Stok
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

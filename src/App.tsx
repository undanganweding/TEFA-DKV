import React, { useState, useEffect } from 'react';
import {
  PageId,
  ProductionOrder,
  Product,
  CustomerFile,
  ToolInventory,
  MaterialStock,
  StockMovement,
  FinanceTransaction,
  AnnualProcurement,
  SystemSettings,
  OrderStatus,
  InboxFile,
  InboxFileStatus,
  CartItem,
  PaymentMethod,
  UserProfile,
} from './types';
import {
  getStoredSession,
  setStoredSession,
} from './utils/authStore';
import {
  initialSettings,
  initialProducts,
  initialOrders,
  initialCustomerFiles,
  initialTools,
  initialMaterials,
  initialStockMovements,
  initialTransactions,
  initialProcurements,
  initialInboxFiles,
} from './data/mockData';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GlobalCartSidebar } from './components/GlobalCartSidebar';

import { DashboardView } from './components/views/DashboardView';
import { LoginView } from './components/views/LoginView';
import { KasirView } from './components/views/KasirView';
import { FileInboxView } from './components/views/FileInboxView';
import { StudentPortalView } from './components/views/StudentPortalView';
import { GuestPlatformView } from './components/views/GuestPlatformView';
import { PesananView } from './components/views/PesananView';
import { ProdukView } from './components/views/ProdukView';
import { CustomerFileView } from './components/views/CustomerFileView';
import { InventarisAlatView } from './components/views/InventarisAlatView';
import { StokBahanView } from './components/views/StokBahanView';
import { KeuanganView } from './components/views/KeuanganView';
import { LaporanView } from './components/views/LaporanView';
import { PengadaanView } from './components/views/PengadaanView';
import { PengaturanView } from './components/views/PengaturanView';
import { ProfileView } from './components/views/ProfileView';
import { KelolaLoginView } from './components/views/KelolaLoginView';

import { ReceiptModal } from './components/modals/ReceiptModal';
import { NewOrderModal } from './components/modals/NewOrderModal';
import { AiAssistantModal } from './components/modals/AiAssistantModal';
import { PersistentCartConfirmModal } from './components/modals/PersistentCartConfirmModal';
import { GlobalDeleteModal, DeleteModalItemDetails } from './components/GlobalDeleteModal';

export function App() {
  // Global Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Global View Navigation State
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');

  // Master Data State
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<ProductionOrder[]>(initialOrders);
  const [inboxFiles, setInboxFiles] = useState<InboxFile[]>(initialInboxFiles);
  const [prefilledFile, setPrefilledFile] = useState<InboxFile | null>(null);
  const [customerFiles, setCustomerFiles] = useState<CustomerFile[]>(initialCustomerFiles);
  const [tools, setTools] = useState<ToolInventory[]>(initialTools);
  const [materials, setMaterials] = useState<MaterialStock[]>(initialMaterials);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialStockMovements);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(initialTransactions);
  const [procurements, setProcurements] = useState<AnnualProcurement[]>(initialProcurements);

  // GLOBAL PERSISTENT CART STATE
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCustomerName, setCartCustomerName] = useState<string>('');
  const [cartCustomerPhone, setCartCustomerPhone] = useState<string>('');
  const [cartOrderPriority, setCartOrderPriority] = useState<'Normal' | 'Mendesak'>('Normal');
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [cartPaymentMethod, setCartPaymentMethod] = useState<PaymentMethod>('Cash');
  const [cartPaidAmount, setCartPaidAmount] = useState<number>(0);
  const [cartNotes, setCartNotes] = useState<string>('');

  // Persistent Cart Restoration Modal
  const [showPersistentCartModal, setShowPersistentCartModal] = useState<boolean>(false);
  const [restoredCartData, setRestoredCartData] = useState<any>(null);

  // Global Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleteModalDetails, setDeleteModalDetails] = useState<DeleteModalItemDetails | null>(null);
  const [deleteConfirmAction, setDeleteConfirmAction] = useState<(() => void) | null>(null);

  // Global Search Query
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  // Modals Control State
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<ProductionOrder | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState<boolean>(false);
  const [showAiAssistantModal, setShowAiAssistantModal] = useState<boolean>(false);

  // Active Orders Count & Low Stock Count
  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'Selesai' && o.status !== 'Dibatalkan'
  ).length;

  const lowStockCount = materials.filter((m) => m.status !== 'Aman').length;

  // Restore Active User Auth Session on Mount
  useEffect(() => {
    const savedSession = getStoredSession();
    if (savedSession) {
      setCurrentUser(savedSession);
      setIsLoggedIn(true);
      if (savedSession.role === 'Siswa' || savedSession.role === 'Guest') {
        setCurrentPage('public_upload');
      } else {
        setCurrentPage(savedSession.defaultPage || 'dashboard');
      }
    }
  }, []);

  // 1. Check for persisted active transaction session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tefa_global_active_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
          setRestoredCartData(parsed);
          setShowPersistentCartModal(true);
        }
      }
    } catch (e) {
      console.error('Error loading persistent cart session', e);
    }
  }, []);

  // 2. Persist active transaction changes to localStorage automatically
  useEffect(() => {
    try {
      if (cartItems.length > 0) {
        localStorage.setItem(
          'tefa_global_active_cart',
          JSON.stringify({
            items: cartItems,
            customerName: cartCustomerName,
            customerPhone: cartCustomerPhone,
            orderPriority: cartOrderPriority,
            discount: cartDiscount,
            paymentMethod: cartPaymentMethod,
            paidAmount: cartPaidAmount,
            notes: cartNotes,
          })
        );
      } else {
        localStorage.removeItem('tefa_global_active_cart');
      }
    } catch (e) {
      console.error('Error storing persistent cart session', e);
    }
  }, [
    cartItems,
    cartCustomerName,
    cartCustomerPhone,
    cartOrderPriority,
    cartDiscount,
    cartPaymentMethod,
    cartPaidAmount,
    cartNotes,
  ]);

  // Persistent Cart Confirmation Handlers
  const handleContinuePersistentCart = () => {
    if (restoredCartData) {
      if (restoredCartData.items) setCartItems(restoredCartData.items);
      if (restoredCartData.customerName) setCartCustomerName(restoredCartData.customerName);
      if (restoredCartData.customerPhone) setCartCustomerPhone(restoredCartData.customerPhone);
      if (restoredCartData.orderPriority) setCartOrderPriority(restoredCartData.orderPriority);
      if (restoredCartData.discount) setCartDiscount(restoredCartData.discount);
      if (restoredCartData.paymentMethod) setCartPaymentMethod(restoredCartData.paymentMethod);
      if (restoredCartData.paidAmount) setCartPaidAmount(restoredCartData.paidAmount);
      if (restoredCartData.notes) setCartNotes(restoredCartData.notes);
    }
    setShowPersistentCartModal(false);
    setRestoredCartData(null);
  };

  const handleSaveDraftPersistentCart = () => {
    if (restoredCartData && restoredCartData.items && restoredCartData.items.length > 0) {
      const now = new Date();
      const orderNo = 'DRAFT-' + now.getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      const todayStr = now.toISOString().split('T')[0];
      const subtotal = restoredCartData.items.reduce((s: number, i: any) => s + (i.totalPrice || 0), 0);
      const disc = restoredCartData.discount || 0;
      const totalAmount = Math.max(0, subtotal - disc);

      const draftOrder: ProductionOrder = {
        id: 'ORD-DRAFT-' + Date.now(),
        orderNo,
        customerName: restoredCartData.customerName || 'Draft Order Kasir',
        customerPhone: restoredCartData.customerPhone || '',
        orderDate: todayStr,
        dueDate: todayStr + ' 16:00',
        status: 'Draft',
        paymentStatus: 'Belum Bayar',
        paymentMethod: restoredCartData.paymentMethod || 'Cash',
        items: restoredCartData.items,
        subtotal,
        discount: disc,
        taxAmount: 0,
        totalAmount,
        paidAmount: 0,
        balanceDue: totalAmount,
        operatorName: settings.activeShiftOperator || 'Kepala TEFA',
        priority: restoredCartData.orderPriority || 'Normal',
        statusHistory: [
          {
            status: 'Draft',
            timestamp: now.toLocaleString('id-ID'),
            updatedBy: settings.activeShiftOperator || 'Kepala TEFA',
            note: 'Disimpan sebagai draft dari sesi sebelumnya',
          },
        ],
      };

      setOrders((prev) => [draftOrder, ...prev]);
    }

    localStorage.removeItem('tefa_global_active_cart');
    setShowPersistentCartModal(false);
    setRestoredCartData(null);
  };

  const handleDiscardPersistentCart = () => {
    localStorage.removeItem('tefa_global_active_cart');
    setCartItems([]);
    setCartCustomerName('');
    setCartCustomerPhone('');
    setCartDiscount(0);
    setCartPaidAmount(0);
    setCartNotes('');
    setShowPersistentCartModal(false);
    setRestoredCartData(null);
  };

  // Global Cart Manipulation Handlers
  const handleAddToCartGlobal = (newItem: CartItem) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (ci) =>
          ci.productId === newItem.productId &&
          !ci.calculatedArea &&
          !ci.isCustomOrder &&
          !ci.notes
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].qty += newItem.qty || 1;
        updated[existingIndex].totalPrice =
          updated[existingIndex].qty * updated[existingIndex].unitPrice;
        return updated;
      }

      return [...prev, newItem];
    });
  };

  const handleUpdateCartQtyGlobal = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
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

  const handleRemoveCartItemGlobal = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearCartGlobal = () => {
    setCartItems([]);
    setCartCustomerName('');
    setCartCustomerPhone('');
    setCartDiscount(0);
    setCartPaidAmount(0);
    setCartNotes('');
    localStorage.removeItem('tefa_global_active_cart');
  };

  const handleSaveDraftGlobal = () => {
    if (cartItems.length === 0) {
      alert('Keranjang masih kosong.');
      return;
    }

    const now = new Date();
    const orderNo = 'DRAFT-' + now.getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const todayStr = now.toISOString().split('T')[0];
    const subtotal = cartItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const totalAmount = Math.max(0, subtotal - cartDiscount);

    const draftOrder: ProductionOrder = {
      id: 'ORD-DRAFT-' + Date.now(),
      orderNo,
      customerName: cartCustomerName.trim() || 'Pelanggan Draft',
      customerPhone: cartCustomerPhone,
      orderDate: todayStr,
      dueDate: todayStr + ' 16:00',
      status: 'Draft',
      paymentStatus: 'Belum Bayar',
      paymentMethod: cartPaymentMethod,
      items: cartItems,
      subtotal,
      discount: cartDiscount,
      taxAmount: 0,
      totalAmount,
      paidAmount: 0,
      balanceDue: totalAmount,
      operatorName: settings.activeShiftOperator || 'Kepala TEFA',
      priority: cartOrderPriority,
      notes: cartNotes,
      statusHistory: [
        {
          status: 'Draft',
          timestamp: now.toLocaleString('id-ID'),
          updatedBy: settings.activeShiftOperator || 'Kepala TEFA',
          note: 'Order disimpan sebagai Draft',
        },
      ],
    };

    setOrders((prev) => [draftOrder, ...prev]);
    handleClearCartGlobal();
    alert(`Order Draft #${orderNo} berhasil disimpan!`);
  };

  const handleCheckoutGlobal = () => {
    if (cartItems.length === 0) {
      alert('Keranjang transaksi masih kosong.');
      return;
    }
    if (!cartCustomerName.trim()) {
      alert('Mohon isi Nama Pemesan / Customer terlebih dahulu.');
      return;
    }

    const now = new Date();
    const orderNo =
      'POS-' + now.getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
    const todayStr = now.toISOString().split('T')[0];

    const subtotal = cartItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const totalAmount = Math.max(0, subtotal - cartDiscount);

    let paymentStatus: 'Belum Bayar' | 'DP' | 'Lunas' = 'Belum Bayar';
    if (cartPaidAmount >= totalAmount && totalAmount > 0) {
      paymentStatus = 'Lunas';
    } else if (cartPaidAmount > 0) {
      paymentStatus = 'DP';
    }

    const newOrder: ProductionOrder = {
      id: 'ORD-' + Date.now(),
      orderNo,
      customerName: cartCustomerName.trim(),
      customerPhone: cartCustomerPhone,
      orderDate: todayStr,
      dueDate: todayStr + ' 16:00',
      status: 'Menunggu Admin',
      paymentStatus,
      paymentMethod: cartPaymentMethod,
      items: cartItems,
      subtotal,
      discount: cartDiscount,
      taxAmount: 0,
      totalAmount,
      paidAmount: cartPaidAmount,
      balanceDue: Math.max(0, totalAmount - cartPaidAmount),
      operatorName: settings.activeShiftOperator || 'Kepala TEFA',
      priority: cartOrderPriority,
      notes: cartNotes,
      statusHistory: [
        {
          status: 'Menunggu Admin',
          timestamp: now.toLocaleString('id-ID'),
          updatedBy: settings.activeShiftOperator || 'Kepala TEFA',
          note: 'Transaksi Kasir POS Dibuat',
        },
      ],
    };

    handleAddOrder(newOrder);
    handleClearCartGlobal();
  };

  // Handlers for Orders
  const handleAddOrder = (newOrder: ProductionOrder) => {
    setOrders((prev) => [newOrder, ...prev]);

    // Auto add transaction if paid
    if (newOrder.paidAmount > 0) {
      const now = new Date();
      const transNo =
        'TRX-' +
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        '-' +
        Math.floor(10 + Math.random() * 90);
      const newTrx: FinanceTransaction = {
        id: 'TRX-' + Date.now(),
        transNo,
        date:
          now.toISOString().split('T')[0] +
          ' ' +
          now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: 'Pemasukan',
        category: 'Penjualan Cetak',
        description: `Pembayaran ${newOrder.paymentStatus} Order No ${newOrder.orderNo} (${newOrder.customerName})`,
        amount: newOrder.paidAmount,
        refOrderNo: newOrder.orderNo,
        paymentMethod: newOrder.paymentMethod || 'Cash',
        operator: settings.activeShiftOperator,
        status: 'Berhasil',
      };
      setTransactions((prev) => [newTrx, ...prev]);
    }

    setShowNewOrderModal(false);
    // Trigger thermal receipt modal
    setActiveReceiptOrder(newOrder);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const now = new Date();
          const updatedHistory = [
            ...(ord.statusHistory || []),
            {
              status: newStatus,
              timestamp: now.toLocaleString('id-ID'),
              updatedBy: settings.activeShiftOperator,
              note: `Status diperbarui menjadi ${newStatus}`,
            },
          ];
          return {
            ...ord,
            status: newStatus,
            statusHistory: updatedHistory,
          };
        }
        return ord;
      })
    );
  };

  const handleRecordPayment = (orderId: string, additionalAmount: number) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const newPaid = ord.paidAmount + additionalAmount;
          const newBalance = Math.max(0, ord.totalAmount - newPaid);
          let newPayStatus: 'Belum Bayar' | 'DP' | 'Lunas' = ord.paymentStatus;
          if (newPaid >= ord.totalAmount) {
            newPayStatus = 'Lunas';
          } else if (newPaid > 0) {
            newPayStatus = 'DP';
          }

          // Also record transaction
          const now = new Date();
          const transNo =
            'TRX-' +
            now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            '-' +
            Math.floor(10 + Math.random() * 90);
          const newTrx: FinanceTransaction = {
            id: 'TRX-' + Date.now(),
            transNo,
            date:
              now.toISOString().split('T')[0] +
              ' ' +
              now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            type: 'Pemasukan',
            category: 'Pelunasan / Angsuran',
            description: `Pelunasan Order No ${ord.orderNo} (${ord.customerName})`,
            amount: additionalAmount,
            refOrderNo: ord.orderNo,
            paymentMethod: ord.paymentMethod || 'Cash',
            operator: settings.activeShiftOperator,
            status: 'Berhasil',
          };
          setTransactions((prevTrx) => [newTrx, ...prevTrx]);

          return {
            ...ord,
            paidAmount: newPaid,
            balanceDue: newBalance,
            paymentStatus: newPayStatus,
          };
        }
        return ord;
      })
    );
  };

  // Handlers for File Inbox
  const handleUpdateInboxFileStatus = (fileId: string, status: InboxFileStatus) => {
    setInboxFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status } : f)));
  };

  const handleCreateTransactionFromFile = (file: InboxFile) => {
    setPrefilledFile(file);
    setCurrentPage('kasir');
  };

  const handleAddInboxFile = (newFile: InboxFile) => {
    setInboxFiles((prev) => [newFile, ...prev]);
  };

  // Master Data Add Handlers
  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
  };

  const handleAddTransaction = (newTrx: FinanceTransaction) => {
    setTransactions((prev) => [newTrx, ...prev]);
  };

  const handleRestockMaterial = (materialId: string, addedQty: number, totalPrice: number) => {
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id === materialId) {
          const newStock = m.currentStock + addedQty;
          let newStatus: MaterialStock['status'] = 'Aman';
          if (newStock <= m.minStock * 0.5) {
            newStatus = 'Kritis';
          } else if (newStock <= m.minStock) {
            newStatus = 'Menipis';
          }
          return {
            ...m,
            currentStock: newStock,
            status: newStatus,
            lastRestockDate: new Date().toISOString().split('T')[0],
          };
        }
        return m;
      })
    );
  };

  const handleAddMaterial = (newMat: MaterialStock) => {
    setMaterials((prev) => [newMat, ...prev]);
  };

  const handleAddProcurement = (newProc: AnnualProcurement) => {
    setProcurements((prev) => [newProc, ...prev]);
  };

  // Soft Archiving Handlers (Global Trash Management)
  const handleArchiveOrder = (id: string) => {
    const item = orders.find((o) => o.id === id);
    if (!item) return;
    setDeleteModalDetails({
      id,
      title: `Order No. ${item.orderNo}`,
      subtitle: `Pelanggan: ${item.customerName} | Rp ${item.totalAmount.toLocaleString('id-ID')}`,
      category: 'Pesanan / Order Produksi',
      impact: 'Order akan dipindahkan ke Sampah. Anda dapat mengembalikannya kapan saja dari Pengaturan.',
    });
    setDeleteConfirmAction(() => () => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, isArchived: true, archivedAt: new Date().toISOString() } : o))
      );
    });
    setDeleteModalOpen(true);
  };

  const handleArchiveInboxFile = (id: string) => {
    const item = inboxFiles.find((f) => f.id === id);
    if (!item) return;
    setDeleteModalDetails({
      id,
      title: `File Inbox: ${item.fileName}`,
      subtitle: `Pengirim: ${item.customerName} (${item.phone})`,
      category: 'File Inbox Publik',
      impact: 'File akan dipindahkan ke Sampah.',
    });
    setDeleteConfirmAction(() => () => {
      setInboxFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isArchived: true, archivedAt: new Date().toISOString() } : f))
      );
    });
    setDeleteModalOpen(true);
  };

  const handleArchiveProduct = (id: string) => {
    const item = products.find((p) => p.id === id);
    if (!item) return;
    setDeleteModalDetails({
      id,
      title: `Produk: ${item.name}`,
      subtitle: `Kode: ${item.code} | Rp ${item.basePrice.toLocaleString('id-ID')}/${item.unit}`,
      category: 'Katalog Produk & Tarif',
      impact: 'Produk akan disembunyikan dari Kasir POS dan Katalog.',
    });
    setDeleteConfirmAction(() => () => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isArchived: true, archivedAt: new Date().toISOString() } : p))
      );
    });
    setDeleteModalOpen(true);
  };

  const handleArchiveCustomerFolder = (id: string) => {
    const item = customerFiles.find((c) => c.id === id);
    if (!item) return;
    setDeleteModalDetails({
      id,
      title: `Folder Arsip: ${item.customerName}`,
      subtitle: `Instansi: ${item.institution || '-'} | ${item.totalFiles} File`,
      category: 'Folder Berkas Customer',
      impact: 'Folder arsip customer akan dipindahkan ke Sampah.',
    });
    setDeleteConfirmAction(() => () => {
      setCustomerFiles((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isArchived: true, archivedAt: new Date().toISOString() } : c))
      );
    });
    setDeleteModalOpen(true);
  };

  const handleArchiveTool = (id: string) => {
    const item = tools.find((t) => t.id === id);
    if (!item) return;
    setDeleteModalDetails({
      id,
      title: `Alat Studio: ${item.name}`,
      subtitle: `Merk: ${item.brandModel} | Lokasi: ${item.location}`,
      category: 'Inventaris & Mesin Studio',
      impact: 'Inventaris mesin akan dipindahkan ke Sampah.',
    });
    setDeleteConfirmAction(() => () => {
      setTools((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isArchived: true, archivedAt: new Date().toISOString() } : t))
      );
    });
    setDeleteModalOpen(true);
  };

  const handleArchiveMaterial = (id: string) => {
    const item = materials.find((m) => m.id === id);
    if (!item) return;
    setDeleteModalDetails({
      id,
      title: `Bahan Studio: ${item.name}`,
      subtitle: `Stok: ${item.currentStock} ${item.unit}`,
      category: 'Stok Bahan Cetak',
      impact: 'Bahan cetak akan dipindahkan ke Sampah.',
    });
    setDeleteConfirmAction(() => () => {
      setMaterials((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isArchived: true, archivedAt: new Date().toISOString() } : m))
      );
    });
    setDeleteModalOpen(true);
  };

  const handleArchiveTransaction = (id: string) => {
    const item = transactions.find((t) => t.id === id);
    if (!item) return;
    setDeleteModalDetails({
      id,
      title: `Transaksi No. ${item.transNo}`,
      subtitle: `${item.type} | Rp ${item.amount.toLocaleString('id-ID')}`,
      category: 'Arsip Keuangan Kas',
      impact: 'Pencatatan keuangan akan dipindahkan ke Sampah.',
    });
    setDeleteConfirmAction(() => () => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isArchived: true, archivedAt: new Date().toISOString() } : t))
      );
    });
    setDeleteModalOpen(true);
  };

  // Permanent Restore and Delete Operations
  const handleRestoreItem = (type: string, id: string) => {
    switch (type) {
      case 'orders':
        setOrders((prev) => prev.map((item) => (item.id === id ? { ...item, isArchived: false } : item)));
        break;
      case 'inboxFiles':
        setInboxFiles((prev) => prev.map((item) => (item.id === id ? { ...item, isArchived: false } : item)));
        break;
      case 'products':
        setProducts((prev) => prev.map((item) => (item.id === id ? { ...item, isArchived: false } : item)));
        break;
      case 'customerFiles':
        setCustomerFiles((prev) => prev.map((item) => (item.id === id ? { ...item, isArchived: false } : item)));
        break;
      case 'tools':
        setTools((prev) => prev.map((item) => (item.id === id ? { ...item, isArchived: false } : item)));
        break;
      case 'materials':
        setMaterials((prev) => prev.map((item) => (item.id === id ? { ...item, isArchived: false } : item)));
        break;
      case 'transactions':
        setTransactions((prev) => prev.map((item) => (item.id === id ? { ...item, isArchived: false } : item)));
        break;
    }
  };

  const handlePermanentDeleteItem = (type: string, id: string) => {
    switch (type) {
      case 'orders':
        setOrders((prev) => prev.filter((item) => item.id !== id));
        break;
      case 'inboxFiles':
        setInboxFiles((prev) => prev.filter((item) => item.id !== id));
        break;
      case 'products':
        setProducts((prev) => prev.filter((item) => item.id !== id));
        break;
      case 'customerFiles':
        setCustomerFiles((prev) => prev.filter((item) => item.id !== id));
        break;
      case 'tools':
        setTools((prev) => prev.filter((item) => item.id !== id));
        break;
      case 'materials':
        setMaterials((prev) => prev.filter((item) => item.id !== id));
        break;
      case 'transactions':
        setTransactions((prev) => prev.filter((item) => item.id !== id));
        break;
    }
  };

  if (!isLoggedIn) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setStoredSession(user);
          setCurrentUser(user);
          setIsLoggedIn(true);
          setCurrentPage(user.defaultPage || (user.role === 'Siswa' || user.role === 'Guest' ? 'public_upload' : 'dashboard'));
        }}
      />
    );
  }

  const handleLogout = () => {
    setStoredSession(null);
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    setStoredSession(updatedUser);
  };

  // 1. If page is Student / Customer Portal (public_upload), render Customer Platform
  // - Registered students see StudentPortalView with full dashboard
  // - Guest users see simple landing page style GuestPlatformView
  if (currentPage === 'public_upload') {
    // If Guest user, show simple Guest Platform
    if (currentUser?.role === 'Guest') {
      return (
        <GuestPlatformView
          orders={orders}
          onAddOrder={(newOrder) => setOrders((prev) => [newOrder, ...prev])}
          onSwitchToAdmin={handleLogout}
          onLogout={handleLogout}
        />
      );
    }
    // If registered student, show full Student Portal
    return (
      <StudentPortalView
        products={products.filter((p) => !p.isArchived)}
        orders={orders.filter((o) => !o.isArchived)}
        inboxFiles={inboxFiles.filter((f) => !f.isArchived)}
        onAddInboxFile={handleAddInboxFile}
        onAddOrder={handleAddOrder}
        onSwitchToAdmin={() => {
          alert('Akses Admin terbatas untuk Kepala TEFA & Admin TEFA. Silakan Logout & Login dengan akun Admin.');
        }}
        currentUser={currentUser}
        onUpdateProfile={handleUpdateProfile}
        onLogout={handleLogout}
      />
    );
  }

  // 2. Role-Based Access Control Protection for Admin Pages
  if (currentUser?.role === 'Siswa' || currentUser?.role === 'Guest') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 p-8 rounded-3xl text-center shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">Akses Admin Dibatasi</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Halaman Admin Platform khusus untuk <strong className="text-purple-400">Kepala TEFA</strong> & <strong className="text-blue-400">Admin TEFA</strong>. Anda saat ini masuk sebagai <strong className="text-amber-300">{currentUser.name} ({currentUser.role})</strong>.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => setCurrentPage('public_upload')}
              className="w-full py-3 bg-[#5B4BFF] hover:bg-[#4a3ce0] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Kembali ke Student TEFA Platform</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Logout & Ganti Akun Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      {/* 1. Left Fixed Navigation Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        activeOrdersCount={activeOrdersCount}
        lowStockCount={lowStockCount}
        activeOperator={currentUser?.name || settings.activeShiftOperator}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* 2. Main Workspace View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          currentPage={currentPage}
          operatorName={currentUser?.name || settings.activeShiftOperator}
          studioName={settings.studioName}
          onOpenAiAssistant={() => setShowAiAssistantModal(true)}
          searchQuery={globalSearchQuery}
          onSearchChange={setGlobalSearchQuery}
          activeOrdersCount={activeOrdersCount}
          lowStockCount={lowStockCount}
          inboxCount={inboxFiles.filter((f) => f.status === 'Menunggu Pemeriksaan' && !f.isArchived).length}
          onPageChange={setCurrentPage}
          products={products}
          orders={orders}
          customerFiles={customerFiles}
          inboxFiles={inboxFiles}
          tools={tools}
          onAddToCart={handleAddToCartGlobal}
          onOpenOrderReceipt={(ord) => setActiveReceiptOrder(ord)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 md:p-6">
          {currentPage === 'dashboard' && (
            <DashboardView
              orders={orders.filter((o) => !o.isArchived)}
              materials={materials.filter((m) => !m.isArchived)}
              inboxFiles={inboxFiles.filter((f) => !f.isArchived)}
              transactions={transactions.filter((t) => !t.isArchived)}
              onPageChange={setCurrentPage}
              onOpenOrderReceipt={(ord) => setActiveReceiptOrder(ord)}
              onOpenNewOrderModal={() => setShowNewOrderModal(true)}
              onOpenAiAssistant={() => setShowAiAssistantModal(true)}
              activeOperator={settings.activeShiftOperator}
            />
          )}

          {currentPage === 'kasir' && (
            <KasirView
              products={products.filter((p) => !p.isArchived)}
              orders={orders.filter((o) => !o.isArchived)}
              onCheckoutOrder={handleAddOrder}
              operatorName={settings.activeShiftOperator}
              prefilledFile={prefilledFile}
              onClearPrefilledFile={() => setPrefilledFile(null)}
              onAddProduct={handleAddProduct}
              onAddToCart={handleAddToCartGlobal}
              searchQuery={globalSearchQuery}
            />
          )}

          {currentPage === 'file_inbox' && (
            <FileInboxView
              inboxFiles={inboxFiles.filter((f) => !f.isArchived)}
              onUpdateFileStatus={handleUpdateInboxFileStatus}
              onCreateTransactionFromFile={handleCreateTransactionFromFile}
              onOpenPublicUpload={() => setCurrentPage('public_upload')}
              onArchiveFile={handleArchiveInboxFile}
            />
          )}

          {currentPage === 'pesanan' && (
            <PesananView
              orders={orders.filter((o) => !o.isArchived)}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onRecordPayment={handleRecordPayment}
              onOpenOrderReceipt={(ord) => setActiveReceiptOrder(ord)}
              onOpenNewOrderModal={() => setShowNewOrderModal(true)}
              onOpenPublicUpload={() => setCurrentPage('public_upload')}
              onArchiveOrder={handleArchiveOrder}
            />
          )}

          {currentPage === 'produk' && (
            <ProdukView
              products={products.filter((p) => !p.isArchived)}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onArchiveProduct={handleArchiveProduct}
            />
          )}

          {currentPage === 'customer_file' && (
            <CustomerFileView
              customerFiles={customerFiles.filter((c) => !c.isArchived)}
              onArchiveCustomerFolder={handleArchiveCustomerFolder}
            />
          )}

          {currentPage === 'inventaris_alat' && (
            <InventarisAlatView
              tools={tools.filter((t) => !t.isArchived)}
              onArchiveTool={handleArchiveTool}
            />
          )}

          {currentPage === 'stok_bahan' && (
            <StokBahanView
              materials={materials.filter((m) => !m.isArchived)}
              stockMovements={stockMovements}
              onArchiveMaterial={handleArchiveMaterial}
              onRestockMaterial={handleRestockMaterial}
              onAddMaterial={handleAddMaterial}
              onAddTransaction={handleAddTransaction}
              onAddStockMovement={(mov) => setStockMovements((prev) => [mov, ...prev])}
              onUpdateMaterial={(updated) =>
                setMaterials((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
              }
            />
          )}

          {currentPage === 'keuangan' && (
            <KeuanganView
              transactions={transactions.filter((t) => !t.isArchived)}
              onAddTransaction={handleAddTransaction}
              operatorName={settings.activeShiftOperator}
              onArchiveTransaction={handleArchiveTransaction}
            />
          )}

          {currentPage === 'laporan' && (
            <LaporanView
              orders={orders.filter((o) => !o.isArchived)}
              transactions={transactions.filter((t) => !t.isArchived)}
            />
          )}

          {currentPage === 'pengadaan' && (
            <PengadaanView
              procurements={procurements}
              onAddProcurement={handleAddProcurement}
            />
          )}

          {currentPage === 'pengaturan' && (
            <PengaturanView
              settings={settings}
              onSaveSettings={setSettings}
              orders={orders}
              transactions={transactions}
              inboxFiles={inboxFiles}
              customerFiles={customerFiles}
              products={products}
              tools={tools}
              materials={materials}
              onRestoreItem={handleRestoreItem}
              onPermanentDeleteItem={handlePermanentDeleteItem}
            />
          )}

          {currentPage === 'profile' && currentUser && (
            <ProfileView
              currentUser={currentUser}
              onUpdateProfile={handleUpdateProfile}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'kelola_login' && (
            <KelolaLoginView />
          )}
        </main>
      </div>

      {/* 3. Global Cashier Cart Sidebar (Fixed & Persistent Across ALL Pages) */}
      <GlobalCartSidebar
        cartItems={cartItems}
        customerName={cartCustomerName}
        customerPhone={cartCustomerPhone}
        orderPriority={cartOrderPriority}
        discount={cartDiscount}
        paymentMethod={cartPaymentMethod}
        paidAmount={cartPaidAmount}
        notes={cartNotes}
        onUpdateCustomerName={setCartCustomerName}
        onUpdateCustomerPhone={setCartCustomerPhone}
        onUpdateOrderPriority={setCartOrderPriority}
        onUpdateDiscount={setCartDiscount}
        onUpdatePaymentMethod={setCartPaymentMethod}
        onUpdatePaidAmount={setCartPaidAmount}
        onUpdateNotes={setCartNotes}
        onUpdateItemQty={handleUpdateCartQtyGlobal}
        onRemoveItem={handleRemoveCartItemGlobal}
        onClearCart={handleClearCartGlobal}
        onSaveDraft={handleSaveDraftGlobal}
        onCheckout={handleCheckoutGlobal}
        activeOperator={settings.activeShiftOperator}
      />

      {/* Global Modals */}
      {showPersistentCartModal && restoredCartData && (
        <PersistentCartConfirmModal
          restoredData={restoredCartData}
          onContinueOrder={handleContinuePersistentCart}
          onSaveDraft={handleSaveDraftPersistentCart}
          onDiscardOrder={handleDiscardPersistentCart}
        />
      )}

      {activeReceiptOrder && (
        <ReceiptModal
          order={activeReceiptOrder}
          settings={settings}
          onClose={() => setActiveReceiptOrder(null)}
        />
      )}

      {showNewOrderModal && (
        <NewOrderModal
          products={products.filter((p) => !p.isArchived)}
          operatorName={settings.activeShiftOperator}
          onAddOrder={handleAddOrder}
          onClose={() => setShowNewOrderModal(false)}
        />
      )}

      {showAiAssistantModal && (
        <AiAssistantModal
          orders={orders.filter((o) => !o.isArchived)}
          materials={materials.filter((m) => !m.isArchived)}
          transactions={transactions.filter((t) => !t.isArchived)}
          onClose={() => setShowAiAssistantModal(false)}
        />
      )}

      {/* Global Confirmation Delete Modal */}
      <GlobalDeleteModal
        isOpen={deleteModalOpen}
        itemDetails={deleteModalDetails}
        onConfirm={() => {
          if (deleteConfirmAction) deleteConfirmAction();
          setDeleteModalOpen(false);
          setDeleteModalDetails(null);
          setDeleteConfirmAction(null);
        }}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeleteModalDetails(null);
          setDeleteConfirmAction(null);
        }}
      />
    </div>
  );
}

export default App;

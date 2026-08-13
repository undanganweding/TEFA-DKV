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
  PaymentStatus,
  UserProfile,
} from './types';
import {
  getStoredSession,
  setStoredSession,
} from './utils/authStore';
import { initialSettings } from './data/mockData';

// Supabase Services
import * as authService from './services/authService';
import * as productService from './services/productService';
import * as materialService from './services/materialService';
import * as orderServiceModule from './services/orderService';
import * as financeService from './services/financeService';
import * as inventoryService from './services/inventoryService';
import * as procurementService from './services/procurementService';
import * as fileService from './services/fileService';
import { logActivity } from './services/notificationService';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GlobalCartSidebar } from './components/GlobalCartSidebar';

import { DashboardView } from './components/views/DashboardView';
import { LoginView } from './components/views/LoginView';
import { KasirView } from './components/views/KasirView';
import { FileInboxView } from './components/views/FileInboxView';
import { StudentPortalView } from './components/views/StudentPortalView';
import { GuestPlatformView } from './components/views/GuestPlatformView';
// Lazy loaded views for performance
const PesananView = React.lazy(() => import('./components/views/PesananView').then(m => ({ default: m.PesananView })));
const ProdukView = React.lazy(() => import('./components/views/ProdukView').then(m => ({ default: m.ProdukView })));
const CustomerFileView = React.lazy(() => import('./components/views/CustomerFileView').then(m => ({ default: m.CustomerFileView })));
const InventarisAlatView = React.lazy(() => import('./components/views/InventarisAlatView').then(m => ({ default: m.InventarisAlatView })));
const StokBahanView = React.lazy(() => import('./components/views/StokBahanView').then(m => ({ default: m.StokBahanView })));
const KeuanganView = React.lazy(() => import('./components/views/KeuanganView').then(m => ({ default: m.KeuanganView })));
const LaporanView = React.lazy(() => import('./components/views/LaporanView').then(m => ({ default: m.LaporanView })));
const PengadaanView = React.lazy(() => import('./components/views/PengadaanView').then(m => ({ default: m.PengadaanView })));
const PengaturanView = React.lazy(() => import('./components/views/PengaturanView').then(m => ({ default: m.PengaturanView })));
const ProfileView = React.lazy(() => import('./components/views/ProfileView').then(m => ({ default: m.ProfileView })));
const KelolaLoginView = React.lazy(() => import('./components/views/KelolaLoginView').then(m => ({ default: m.KelolaLoginView })));
const UserManagementView = React.lazy(() => import('./components/views/UserManagementView').then(m => ({ default: m.UserManagementView })));

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
  const [currentPage, setCurrentPage] = useState<PageId | 'login'>('dashboard');
  const [authInitializing, setAuthInitializing] = useState<boolean>(true);

  // Master Data State — initialized empty, loaded from Supabase
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [inboxFiles, setInboxFiles] = useState<InboxFile[]>([]);
  const [prefilledFile, setPrefilledFile] = useState<InboxFile | null>(null);
  const [customerFiles, setCustomerFiles] = useState<CustomerFile[]>([]);
  const [tools, setTools] = useState<ToolInventory[]>([]);
  const [materials, setMaterials] = useState<MaterialStock[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [procurements, setProcurements] = useState<AnnualProcurement[]>([]);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);

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
  const activeOrdersCount = React.useMemo(() => 
    orders.filter((o) => o.status !== 'Selesai' && o.status !== 'Dibatalkan').length,
    [orders]
  );

  const lowStockCount = React.useMemo(() => 
    materials.filter((m) => m.status !== 'Aman').length,
    [materials]
  );

  // Memoized Filtered Arrays for Views
  const activeOrders = React.useMemo(() => orders.filter((o) => !o.isArchived), [orders]);
  const activeMaterials = React.useMemo(() => materials.filter((m) => !m.isArchived), [materials]);
  const activeInboxFiles = React.useMemo(() => inboxFiles.filter((f) => !f.isArchived), [inboxFiles]);
  const activeTransactions = React.useMemo(() => transactions.filter((t) => !t.isArchived), [transactions]);
  const activeProducts = React.useMemo(() => products.filter((p) => !p.isArchived), [products]);
  const activeTools = React.useMemo(() => tools.filter((t) => !t.isArchived), [tools]);
  const pendingInboxCount = React.useMemo(() => inboxFiles.filter((f) => f.status === 'Menunggu Pemeriksaan' && !f.isArchived).length, [inboxFiles]);

  // Restore Active User Auth Session on Mount (Supabase only)
  useEffect(() => {
    const initAuth = async () => {
      // 1. Determine target page from URL path
      const path = window.location.pathname;
      let targetPage: PageId | 'login' = 'public_upload'; // Default Student Platform Homepage
      if (path === '/login') targetPage = 'login';
      else if (path.startsWith('/admin')) {
        const route = path.replace('/admin', '').substring(1) as PageId;
        targetPage = route || 'dashboard'; // e.g. /admin/pesanan -> pesanan
      }

      // 2. Fetch Supabase session
      const supabaseUser = await authService.getSession();
      
      if (supabaseUser) {
        setCurrentUser(supabaseUser);
        setIsLoggedIn(true);
        // If they are on a public path or login, redirect to their default
        if (targetPage === 'public_upload' || targetPage === 'login') {
          if (supabaseUser.role === 'Siswa' || supabaseUser.role === 'Guest') {
            setCurrentPage('public_upload');
          } else {
            setCurrentPage(supabaseUser.defaultPage || 'dashboard');
          }
        } else {
          // If they are already on /admin/something, keep them there if allowed
          if (supabaseUser.role === 'Siswa' || supabaseUser.role === 'Guest') {
            setCurrentPage('public_upload');
          } else {
            setCurrentPage(targetPage);
          }
        }
      } else {
        // No session: enforce routing protection
        if (path.startsWith('/admin')) {
          setCurrentPage('login');
          window.history.replaceState({}, '', '/login');
        } else {
          setCurrentPage(targetPage);
        }
      }
      
      setAuthInitializing(false);
    };
    initAuth();

    // Listen for Supabase auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
      } else {
        // Only log out if not initializing to prevent loop
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load all data from Supabase on mount / after login
  useEffect(() => {
    if (!isLoggedIn || dataLoaded) return;
    const loadData = async () => {
      try {
        const [prods, mats, movs, ords, trxs, tools_, procs, inbox, custFiles] = await Promise.all([
          productService.fetchProducts(),
          materialService.fetchMaterials(),
          materialService.fetchStockMovements(),
          orderServiceModule.fetchOrders(),
          financeService.fetchTransactions(),
          inventoryService.fetchInventory(),
          procurementService.fetchProcurements(),
          fileService.fetchInboxFiles(),
          fileService.fetchCustomerFiles(),
        ]);
        setProducts(prods);
        setMaterials(mats);
        setStockMovements(movs);
        setOrders(ords);
        setTransactions(trxs);
        setTools(tools_);
        setProcurements(procs);
        setInboxFiles(inbox);
        setCustomerFiles(custFiles);
        setDataLoaded(true);
      } catch (err) {
        console.error('Error loading data from Supabase:', err);
        // Data will remain as empty arrays — UI still renders
        setDataLoaded(true);
      }
    };
    loadData();
  }, [isLoggedIn, dataLoaded]);

  // Sync browser URL with currentPage State changes
  useEffect(() => {
    if (authInitializing) return; // Don't push state during initial load
    if (currentPage === 'login') {
      window.history.pushState({}, '', '/login');
    } else if (currentPage === 'public_upload') {
      window.history.pushState({}, '', '/');
    } else {
      window.history.pushState({}, '', `/admin/${currentPage === 'dashboard' ? '' : currentPage}`);
    }
  }, [currentPage, authInitializing]);

  // Handle browser back/forward buttons manually
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/login') setCurrentPage('login');
      else if (path === '/') setCurrentPage('public_upload');
      else if (path.startsWith('/admin')) {
        const route = path.replace('/admin', '').substring(1) as PageId;
        setCurrentPage(route || 'dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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

  // Warn user on reload if they have an active cart
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (cartItems.length > 0) {
        e.preventDefault();
        e.returnValue = 'Ada transaksi aktif di keranjang Anda yang belum selesai.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [cartItems]);

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
    const totalHpp = cartItems.reduce((acc, curr) => acc + ((curr.costPrice || 0) * curr.qty), 0);

    const actualPaid = cartPaidAmount > totalAmount ? totalAmount : cartPaidAmount;

    let paymentStatus: 'Belum Bayar' | 'DP' | 'Lunas' = 'Belum Bayar';
    if (actualPaid >= totalAmount && totalAmount > 0) {
      paymentStatus = 'Lunas';
    } else if (actualPaid > 0) {
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
      totalHpp,
      discount: cartDiscount,
      taxAmount: 0,
      totalAmount,
      paidAmount: actualPaid,
      balanceDue: Math.max(0, totalAmount - actualPaid),
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

  // Helper to handle material stock deduction and movement logging
  const processStockDeduction = (order: ProductionOrder) => {
    order.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product && product.recipe) {
        product.recipe.forEach((recipeItem) => {
          setMaterials((prev) =>
            prev.map((m) => {
              if (m.id === recipeItem.materialId) {
                const qtyToDeduct = recipeItem.qtyRequired * item.qty;
                const newStock = Math.max(0, Number((m.currentStock - qtyToDeduct).toFixed(4)));
                let newStatus: MaterialStock['status'] = 'Aman';
                if (newStock <= m.minStock * 0.5) {
                  newStatus = 'Kritis';
                } else if (newStock <= m.minStock) {
                  newStatus = 'Menipis';
                }

                // Add Stock Movement log
                const now = new Date();
                const newMovement: StockMovement = {
                  id: 'MOV-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                  materialId: m.id,
                  materialName: m.name,
                  date:
                    now.toISOString().split('T')[0] +
                    ' ' +
                    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                  type: 'Keluar',
                  quantity: -qtyToDeduct,
                  beforeStock: m.currentStock,
                  afterStock: newStock,
                  referenceId: order.orderNo,
                  unit: m.unit,
                  unitCost: m.unitPrice,
                  totalValue: Math.round(qtyToDeduct * m.unitPrice),
                  notes: `Pemakaian produksi Order No ${order.orderNo}`,
                  operator: currentUser?.name || 'Operator TEFA',
                };
                setStockMovements((prevMovements) => [newMovement, ...prevMovements]);

                return {
                  ...m,
                  currentStock: newStock,
                  status: newStatus,
                };
              }
              return m;
            })
          );
        });
      }
    });
  };

  // Helper to reverse material stock deduction on cancellation
  const processStockReversal = (order: ProductionOrder) => {
    order.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product && product.recipe) {
        product.recipe.forEach((recipeItem) => {
          setMaterials((prev) =>
            prev.map((m) => {
              if (m.id === recipeItem.materialId) {
                const qtyToRestore = recipeItem.qtyRequired * item.qty;
                const newStock = Number((m.currentStock + qtyToRestore).toFixed(4));
                let newStatus: MaterialStock['status'] = 'Aman';
                if (newStock <= m.minStock * 0.5) {
                  newStatus = 'Kritis';
                } else if (newStock <= m.minStock) {
                  newStatus = 'Menipis';
                }

                // Add Reversal Stock Movement log
                const now = new Date();
                const newMovement: StockMovement = {
                  id: 'MOV-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                  materialId: m.id,
                  materialName: m.name,
                  date:
                    now.toISOString().split('T')[0] +
                    ' ' +
                    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                  type: 'Penyesuaian',
                  quantity: qtyToRestore,
                  beforeStock: m.currentStock,
                  afterStock: newStock,
                  referenceId: order.orderNo,
                  unit: m.unit,
                  unitCost: m.unitPrice,
                  totalValue: Math.round(qtyToRestore * m.unitPrice),
                  notes: `REVERSAL pembatalan Order No ${order.orderNo}`,
                  operator: currentUser?.name || 'Operator TEFA',
                };
                setStockMovements((prevMovements) => [newMovement, ...prevMovements]);

                return {
                  ...m,
                  currentStock: newStock,
                  status: newStatus,
                };
              }
              return m;
            })
          );
        });
      }
    });
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

      const paymentRatio = newOrder.paidAmount / (newOrder.totalAmount || 1);
      const transactionCogs = Math.round((newOrder.totalHpp || 0) * paymentRatio);
      const transactionProfit = newOrder.paidAmount - transactionCogs;

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
        cogsAmount: transactionCogs,
        profitAmount: transactionProfit,
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

          // Trigger stock deduction if moving to Diproses and not yet deducted
          if (newStatus === 'Diproses' && !ord.stockDeducted) {
            setTimeout(() => processStockDeduction(ord), 50);
            return {
              ...ord,
              status: newStatus,
              statusHistory: updatedHistory,
              stockDeducted: true,
            };
          }

          // Trigger stock reversal if cancelled/rejected and was already deducted
          if ((newStatus === 'Dibatalkan' || newStatus === 'Ditolak') && ord.stockDeducted) {
            setTimeout(() => processStockReversal(ord), 50);
            return {
              ...ord,
              status: newStatus,
              statusHistory: updatedHistory,
              stockDeducted: false,
            };
          }

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
          const actualAdditional = additionalAmount > ord.balanceDue ? ord.balanceDue : additionalAmount;
          if (actualAdditional <= 0) return ord; // Nothing left to pay

          const newPaid = ord.paidAmount + actualAdditional;
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

          const paymentRatio = actualAdditional / (ord.totalAmount || 1);
          const transactionCogs = Math.round((ord.totalHpp || 0) * paymentRatio);
          const transactionProfit = actualAdditional - transactionCogs;

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
            amount: actualAdditional,
            cogsAmount: transactionCogs,
            profitAmount: transactionProfit,
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

  const handleRefundOrder = (orderId: string, refundAmount: number, reason: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const currentRefunded = ord.refundedAmount || 0;
          const refundAvailable = ord.paidAmount - currentRefunded;
          
          if (refundAmount > refundAvailable) {
            alert(`Jumlah refund melebihi batas yang tersedia (${refundAvailable.toLocaleString('id-ID')})`);
            return ord;
          }
          if (refundAmount <= 0) {
            alert('Jumlah refund harus lebih besar dari 0');
            return ord;
          }

          const newRefunded = currentRefunded + refundAmount;
          let newPayStatus: PaymentStatus = ord.paymentStatus;
          if (newRefunded >= ord.paidAmount) {
            newPayStatus = 'REFUNDED';
          } else {
            newPayStatus = 'PARTIALLY_REFUNDED';
          }

          // Create Refund FinanceTransaction
          const now = new Date();
          const transNo =
            'RFD-' +
            now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            '-' +
            Math.floor(10 + Math.random() * 90);

          const paymentRatio = refundAmount / (ord.totalAmount || 1);
          const transactionCogs = Math.round((ord.totalHpp || 0) * paymentRatio);
          const transactionProfit = refundAmount - transactionCogs;

          const newTrx: FinanceTransaction = {
            id: 'TRX-REFUND-' + Date.now(),
            transNo,
            date:
              now.toISOString().split('T')[0] +
              ' ' +
              now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            type: 'Pengeluaran',
            category: 'Lain-lain',
            description: `Refund (${reason}) Order No ${ord.orderNo} (${ord.customerName})`,
            amount: refundAmount,
            cogsAmount: transactionCogs,
            profitAmount: transactionProfit,
            refOrderNo: ord.orderNo,
            paymentMethod: ord.paymentMethod || 'Cash',
            operator: settings.activeShiftOperator,
            status: 'Berhasil',
          };
          setTransactions((prevTrx) => [newTrx, ...prevTrx]);

          const newRefundRecord = {
            id: 'RFD-' + Date.now(),
            date: now.toISOString().split('T')[0],
            amount: refundAmount,
            reason,
            operator: settings.activeShiftOperator,
          };

          return {
            ...ord,
            refundedAmount: newRefunded,
            paymentStatus: newPayStatus,
            refunds: [...(ord.refunds || []), newRefundRecord],
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

  const handleAddInboxFile = async (newFile: InboxFile) => {
    setInboxFiles((prev) => [newFile, ...prev]);
    // Persist to Supabase
    fileService.addInboxFile(newFile).catch(err => console.error('Error persisting inbox file:', err));
  };

  // Master Data Add Handlers
  const handleAddProduct = async (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    // Persist to Supabase
    productService.createProduct(newProd).catch(err => console.error('Error persisting product:', err));
  };

  const handleUpdateProduct = async (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
    productService.updateProduct(updatedProd).catch(err => console.error('Error updating product:', err));
  };

  const handleAddTransaction = async (newTrx: FinanceTransaction) => {
    setTransactions((prev) => [newTrx, ...prev]);
    financeService.createTransaction(newTrx).catch(err => console.error('Error persisting transaction:', err));
  };

  const handleRestockMaterial = async (materialId: string, addedQty: number, totalPrice: number) => {
    // Optimistic local update
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
    // Persist to Supabase
    materialService.restockMaterial(materialId, addedQty, totalPrice, settings.activeShiftOperator)
      .catch(err => console.error('Error persisting restock:', err));
  };

  const handleAddMaterial = async (newMat: MaterialStock) => {
    setMaterials((prev) => [newMat, ...prev]);
    materialService.createMaterial(newMat).catch(err => console.error('Error persisting material:', err));
  };

  const handleAddProcurement = async (newProc: AnnualProcurement) => {
    setProcurements((prev) => [newProc, ...prev]);
    procurementService.createProcurement(newProc).catch(err => console.error('Error persisting procurement:', err));
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
      subtitle: `Instansi: ${item.email || '-'} | ${item.files?.length || item.totalOrdersCount || 0} File`,
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

  const handleAddTool = async (newTool: ToolInventory) => {
    setTools((prev) => [newTool, ...prev]);
    inventoryService.createInventoryAsset(newTool).catch(err => console.error('Error persisting tool:', err));
  };

  const handleUpdateTool = async (updatedTool: ToolInventory) => {
    setTools((prev) => prev.map((t) => (t.id === updatedTool.id ? updatedTool : t)));
    inventoryService.updateInventoryAsset(updatedTool).catch(err => console.error('Error updating tool:', err));
  };

  const handleArchiveTool = (id: string) => {
    const item = tools.find((t) => t.id === id);
    if (!item) return;
    setDeleteModalDetails({
      id,
      title: `Alat Studio: ${item.name}`,
      subtitle: `Merk: ${item.brand || ''} ${item.model || ''} | Lokasi: ${item.location}`,
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

  if (authInitializing) {
    return (
      <div className="min-h-screen bg-[#0F1322] flex flex-col items-center justify-center p-6 text-white font-sans selection:bg-[#5B4BFF]/30">
        <div className="w-16 h-16 relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
          <div className="absolute inset-0 border-4 border-[#5B4BFF] rounded-full border-t-transparent animate-spin" />
        </div>
        <h2 className="text-xl font-black text-white tracking-tight mb-2">Memverifikasi Sesi...</h2>
        <p className="text-sm font-medium text-slate-500">Mempersiapkan Lingkungan Kerja TEFA DKV</p>
      </div>
    );
  }

  if (currentPage === 'login') {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
          const target = user.defaultPage || (user.role === 'Siswa' || user.role === 'Guest' ? 'public_upload' : 'dashboard');
          setCurrentPage(target);
        }}
        onBackToHome={() => setCurrentPage('public_upload')}
      />
    );
  }

  const handleLogout = async () => {
    // 1. Immediately switch view so guard doesn't trip and trap user in LoginView
    setCurrentPage('public_upload');
    
    // 2. Clear local state
    setIsLoggedIn(false);
    setCurrentUser(null);
    setDataLoaded(false); // Reset so data reloads on next login
    
    // 3. Fire supabase sign out
    await authService.signOut().catch(() => {});
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
  };

  // 1. If page is Student / Customer Portal (public_upload), render Customer Platform
  // - Registered students see StudentPortalView with full dashboard
  // - Guest users see simple landing page style GuestPlatformView
  if (currentPage === 'public_upload') {
    // If Guest user, show simple Guest Platform
    if (!currentUser || currentUser?.role === 'Guest') {
      return (
        <GuestPlatformView
          products={products.filter((p) => !p.isArchived)}
          orders={orders}
          onAddOrder={(newOrder) => setOrders((prev) => [newOrder, ...prev])}
          onSwitchToAdmin={() => setCurrentPage('login')}
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

  // 2. Unauthorized Admin Access Guard
  // Hard check before rendering Admin dashboard components
  if (!isLoggedIn || !currentUser) {
    if (currentPage !== 'public_upload' && currentPage !== 'login') {
      setCurrentPage('login');
      return null;
    }
  }

  // 3. Role-Based Access Control Protection for Admin Pages
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
          inboxCount={pendingInboxCount}
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
              orders={activeOrders}
              materials={activeMaterials}
              inboxFiles={activeInboxFiles}
              transactions={activeTransactions}
              onPageChange={setCurrentPage}
              onOpenOrderReceipt={(ord) => setActiveReceiptOrder(ord)}
              onOpenNewOrderModal={() => setShowNewOrderModal(true)}
              onOpenAiAssistant={() => setShowAiAssistantModal(true)}
              activeOperator={settings.activeShiftOperator}
            />
          )}

          {currentPage === 'kasir' && (
            <KasirView
              products={activeProducts}
              orders={activeOrders}
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
              inboxFiles={activeInboxFiles}
              onUpdateFileStatus={handleUpdateInboxFileStatus}
              onCreateTransactionFromFile={handleCreateTransactionFromFile}
              onOpenPublicUpload={() => setCurrentPage('public_upload')}
              onArchiveFile={handleArchiveInboxFile}
            />
          )}

          {currentPage === 'pesanan' && (
            <PesananView
              orders={activeOrders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onRecordPayment={handleRecordPayment}
              onRefundOrder={handleRefundOrder}
              onOpenOrderReceipt={(ord) => setActiveReceiptOrder(ord)}
              onOpenNewOrderModal={() => setShowNewOrderModal(true)}
              onOpenPublicUpload={() => setCurrentPage('public_upload')}
              onArchiveOrder={handleArchiveOrder}
            />
          )}

          {currentPage === 'produk' && (
            <ProdukView
              products={activeProducts}
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

          {currentPage === 'manajemen_user' && (
            <UserManagementView currentUser={currentUser} />
          )}

          {currentPage === 'inventaris_alat' && (
            <InventarisAlatView
              tools={activeTools}
              onArchiveTool={handleArchiveTool}
              onAddTool={handleAddTool}
              onUpdateTool={handleUpdateTool}
            />
          )}

          {currentPage === 'stok_bahan' && (
            <StokBahanView
              materials={activeMaterials}
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
              transactions={activeTransactions}
              onAddTransaction={handleAddTransaction}
              operatorName={settings.activeShiftOperator}
              onArchiveTransaction={handleArchiveTransaction}
            />
          )}

          {currentPage === 'laporan' && (
            <LaporanView
              orders={activeOrders}
              transactions={activeTransactions}
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
          isOpen={showPersistentCartModal}
          restoredCartItems={restoredCartData.items || []}
          customerName={restoredCartData.customerName || ''}
          onContinue={handleContinuePersistentCart}
          onSaveDraft={handleSaveDraftPersistentCart}
          onDiscard={handleDiscardPersistentCart}
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

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

// Helper to determine initial page from URL
const getInitialPage = (): PageId | 'login' => {
  const path = window.location.pathname;
  if (path === '/login') return 'login';
  if (path === '/') return 'public_upload';
  if (path.startsWith('/admin')) {
    const route = path.replace('/admin', '').substring(1) as PageId;
    return route || 'dashboard';
  }
  return 'public_upload';
};

export function App() {
  // Global Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Global View Navigation State
  const [currentPage, setCurrentPage] = useState<PageId | 'login'>(getInitialPage());
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

  // Controlled Hydration: Depend entirely on Supabase onAuthStateChange
  const [rawSession, setRawSession] = useState<any>(undefined);
  // Track last profile user ID to prevent duplicate fetches (useRef avoids stale closure)
  const lastProfileUserIdRef = React.useRef<string | null>(null);


  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setRawSession(session || null);
        // Only trigger data reload without blanking out existing orders immediately
        if (event === 'SIGNED_IN') {
          setDataLoaded(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setRawSession(null);
        setDataLoaded(false);
        setOrders([]);
        setProducts([]);
        lastProfileUserIdRef.current = null;
      }
    });
    return () => subscription.unsubscribe();
  }, []);


  // Fetch Profile independently when rawSession changes
  useEffect(() => {
    let isMounted = true;

    const hydrateProfile = async () => {
      if (rawSession === undefined) return; // Wait for initial event

      if (!rawSession?.user) {
        if (isMounted) {
          setIsLoggedIn(false);
          setCurrentUser(null);
          // Only redirect to login if auth initialization has completed or explicit signout
          if (!authInitializing && currentPage !== 'public_upload' && currentPage !== 'login') {
            setCurrentPage('login');
            window.history.replaceState({}, '', '/login');
          }
          setAuthInitializing(false);
        }
        return;
      }

      // Deduplicate: skip profile fetch if same user already loaded
      const userId = rawSession.user.id;
      if (userId === lastProfileUserIdRef.current && isLoggedIn && currentUser) {
        setAuthInitializing(false);
        return;
      }

      // We have a valid session. Now fetch the profile safely.
      try {
        const profile = await authService.fetchUserProfile(rawSession.user);
        
        if (isMounted) {
          if (profile) {
            console.log('[AUTH] Profile loaded:', profile.role, profile.defaultPage);
            lastProfileUserIdRef.current = rawSession.user.id;
            setCurrentUser(profile);
            setIsLoggedIn(true);
            // Redirect based on role when on login or public_upload page
            const isAdminRole = profile.role === 'Admin TEFA' || profile.role === 'Admin';
            if (currentPage === 'login' || currentPage === 'public_upload') {
              if (isAdminRole) {
                setCurrentPage('dashboard');
              }
              // Students stay on public_upload
            }
          } else {
            // Valid token but profile missing/inactive -> fallback profile from auth metadata
            const fallbackProfile = authService.mapProfileToUserProfile({
              id: rawSession.user.id,
              full_name: rawSession.user.user_metadata?.full_name || rawSession.user.email || 'Siswa TEFA',
              role: rawSession.user.user_metadata?.role || 'Student',
              status: rawSession.user.user_metadata?.status || 'Active',
              school_class: rawSession.user.user_metadata?.school_class || null,
              phone: rawSession.user.user_metadata?.phone || null,
              address: null,
              avatar_path: rawSession.user.user_metadata?.avatar_path || null,
              nis: rawSession.user.user_metadata?.nis || null,
              major: rawSession.user.user_metadata?.major || null,
              whatsapp: rawSession.user.user_metadata?.whatsapp || null,
              position: null,
              nip: null,
              employee_id: null,
              reject_reason: null,
              created_at: rawSession.user.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, rawSession.user.email || '');

            console.warn('[AUTH] Profile fallback used. role:', fallbackProfile.role, 'defaultPage:', fallbackProfile.defaultPage);
            setCurrentUser(fallbackProfile);
            setIsLoggedIn(true);
          }
          setAuthInitializing(false);
        }
      } catch (err: any) {
        console.warn('Error hydrating profile:', err);
        if (isMounted) {
          setAuthInitializing(false);
        }
      }
    };

    hydrateProfile();

    return () => {
      isMounted = false;
    };
  }, [rawSession]);

  // Load all data from Supabase on mount / after login based on user role
  useEffect(() => {
    if (!isLoggedIn || dataLoaded) return;
    const loadData = async () => {
      try {
        const isStudent = currentUser?.role === 'Siswa';

        // 1. Core tables needed for both Student & Admin
        const prods = await productService.fetchProducts().catch(() => []);
        setProducts(prods);

        let ords = await orderServiceModule.fetchOrders().catch(() => []);
        
        // Restore/Merge student orders from local persistence (essential when anon fallback is used)
        const storageKeys = [
          'tefa_student_orders_persisted',
          currentUser?.id ? `tefa_student_orders_${currentUser.id}` : null,
          'tefa_student_orders_guest'
        ].filter(Boolean) as string[];

        for (const k of storageKeys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as ProductionOrder[];
              if (Array.isArray(parsed) && parsed.length > 0) {
                const existingIds = new Set(ords.map(o => o.id));
                const existingNos = new Set(ords.map(o => o.orderNo));
                const toMerge = parsed.filter(lo => !existingIds.has(lo.id) && !existingNos.has(lo.orderNo));
                ords = [...ords, ...toMerge];
              }
            } catch (e) {
              console.warn('Error reading saved student orders from ' + k, e);
            }
          }
        }

        console.log('[DATA] Orders loaded:', ords.length);
        setOrders(ords);

        // 2. Admin-only tables (inbox_files, materials, stock_movements, dll dilindungi RLS Admin)
        if (!isStudent) {
          const inbox = await fileService.fetchInboxFiles().catch(() => []);
          setInboxFiles(inbox);
          const mats = await materialService.fetchMaterials().catch(() => []);
          setMaterials(mats);

          const movs = await materialService.fetchStockMovements().catch(() => []);
          setStockMovements(movs);

          const trxs = await financeService.fetchTransactions().catch(() => []);
          setTransactions(trxs);

          const tools_ = await inventoryService.fetchInventory().catch(() => []);
          setTools(tools_);

          const procs = await procurementService.fetchProcurements().catch(() => []);
          setProcurements(procs);

          const custFiles = await fileService.fetchCustomerFiles().catch(() => []);
          setCustomerFiles(custFiles);
        }

        setDataLoaded(true);
      } catch (err) {
        console.error('Error loading data from Supabase:', err);
        setDataLoaded(true);
      }
    };
    loadData();
  }, [isLoggedIn, currentUser, dataLoaded]);

  // Periodic Polling Realtime Sync for Orders & Status Updates (Every 5 seconds)
  // Ensures realtime status synchronization between Admin and Student Platform
  useEffect(() => {
    if (!isLoggedIn || !dataLoaded) return;

    const syncOrdersRealtime = async () => {
      try {
        const isStudent = currentUser?.role === 'Siswa';
        let freshOrders = await orderServiceModule.fetchOrders();
        
        // Safety guard: If student order fetch returns empty (due to RLS or token fallback),
        // do not wipe out valid orders already in memory!
        if (isStudent && (!freshOrders || freshOrders.length === 0)) {
          return;
        }

        if (freshOrders && Array.isArray(freshOrders)) {
          // If student has existing local backup orders, merge any missing ones
          if (isStudent) {
            const storageKeys = [
              'tefa_student_orders_persisted',
              currentUser?.id ? `tefa_student_orders_${currentUser.id}` : null,
            ].filter(Boolean) as string[];

            for (const k of storageKeys) {
              const raw = localStorage.getItem(k);
              if (raw) {
                try {
                  const parsed = JSON.parse(raw) as ProductionOrder[];
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    const existingIds = new Set(freshOrders.map(o => o.id));
                    const existingNos = new Set(freshOrders.map(o => o.orderNo));
                    const toMerge = parsed.filter(lo => !existingIds.has(lo.id) && !existingNos.has(lo.orderNo));
                    freshOrders = [...freshOrders, ...toMerge];
                  }
                } catch { /* ignore parse error */ }
              }
            }
          }

          setOrders((prev) => {
            // Check if there are real changes to avoid unnecessary re-renders
            const prevMap = new Map(prev.map(o => [o.id, `${o.status}-${o.paymentStatus}-${o.paidAmount}-${o.totalAmount}-${(o.statusHistory || []).length}`]));
            const freshMap = new Map(freshOrders.map(o => [o.id, `${o.status}-${o.paymentStatus}-${o.paidAmount}-${o.totalAmount}-${(o.statusHistory || []).length}`]));
            
            let hasChanges = freshOrders.length !== prev.length;
            if (!hasChanges) {
              for (const [id, hash] of freshMap) {
                if (prevMap.get(id) !== hash) {
                  hasChanges = true;
                  break;
                }
              }
            }

            if (hasChanges) {
              console.log('[REALTIME_SYNC] Syncing orders updates from database:', freshOrders.length);
              return freshOrders;
            }
            return prev;
          });
        }
      } catch (err) {
        // Silently skip transient polling errors
      }
    };

    const intervalId = setInterval(syncOrdersRealtime, 5000);
    return () => clearInterval(intervalId);
  }, [isLoggedIn, dataLoaded, currentUser]);

  // Load products for Guest users (does not require login)
  // RLS allows anonymous SELECT on visible, non-archived products
  const [guestProductsLoaded, setGuestProductsLoaded] = useState<boolean>(false);
  useEffect(() => {
    // Skip if: logged in, already loaded, OR auth is still initializing (prevent race with login)
    if (isLoggedIn || guestProductsLoaded || authInitializing || rawSession !== null) return;
    const loadGuestProducts = async () => {
      try {
        const prods = await productService.fetchProducts();
        setProducts(prods);
        // Also restore guest orders from localStorage
        const savedGuestOrders = localStorage.getItem('tefa_guest_orders');
        if (savedGuestOrders) {
          try {
            const parsed = JSON.parse(savedGuestOrders) as ProductionOrder[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              setOrders(parsed);
            }
          } catch { /* ignore parse errors */ }
        }
      } catch (err) {
        console.error('Error loading guest products:', err);
      }
      setGuestProductsLoaded(true);
    };
    loadGuestProducts();
  }, [isLoggedIn, guestProductsLoaded, authInitializing, rawSession]);


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
  const handleAddOrder = async (newOrder: ProductionOrder): Promise<{ success: boolean; orderId?: string; orderNo?: string; error?: string }> => {
    // Persist order directly to Supabase DB via RPC first
    try {
      const isUuid = (str?: string) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      const res = await orderServiceModule.createOrder({
        items: newOrder.items.map((it, idx) => ({
          id: it.id || `item-${Date.now()}-${idx}`,
          productId: isUuid(it.productId) ? it.productId : undefined,
          productName: it.productName,
          category: it.category || 'Cetak Outdoor',
          unitPrice: it.unitPrice,
          costPrice: it.costPrice || 0,
          qty: it.qty,
          unit: it.unit as any,
          totalPrice: it.totalPrice,
          notes: it.notes,
          fileName: it.fileName,
        })),
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone || '',
        discount: newOrder.discount || 0,
        paidAmount: newOrder.paidAmount || 0,
        paymentMethod: newOrder.paymentMethod || 'Cash',
        operatorName: newOrder.operatorName || 'Sistem Portal Siswa',
        priority: newOrder.priority || 'Normal',
        notes: newOrder.notes || '',
        status: newOrder.status || 'Menunggu Admin',
        createdBy: currentUser?.id || undefined,
        idempotencyKey: (newOrder as any).idempotencyKey || undefined,
        inboxFile: (newOrder as any).inboxFilePayload ? (newOrder as any).inboxFilePayload : undefined,
      });

      if (res.success && res.orderId) {
        const persistedOrder: ProductionOrder = {
          ...newOrder,
          id: res.orderId,
          orderNo: res.orderNo || newOrder.orderNo,
        };
        setOrders((prev) => [persistedOrder, ...prev]);

        // Save order to student local persistence for bulletproof reload retention
        try {
          const keysToSave = [
            'tefa_student_orders_persisted',
            currentUser?.id ? `tefa_student_orders_${currentUser.id}` : null
          ].filter(Boolean) as string[];

          for (const key of keysToSave) {
            const existingSaved = localStorage.getItem(key);
            const currentList: ProductionOrder[] = existingSaved ? JSON.parse(existingSaved) : [];
            const updatedList = [persistedOrder, ...currentList.filter(o => o.id !== persistedOrder.id && o.orderNo !== persistedOrder.orderNo)];
            localStorage.setItem(key, JSON.stringify(updatedList));
          }
        } catch (storageErr) {
          console.warn('Could not save to local student order backup:', storageErr);
        }

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
            description: `Pembayaran ${newOrder.paymentStatus} Order No ${persistedOrder.orderNo} (${newOrder.customerName})`,
            amount: newOrder.paidAmount,
            cogsAmount: transactionCogs,
            profitAmount: transactionProfit,
            refOrderNo: persistedOrder.orderNo,
            paymentMethod: newOrder.paymentMethod || 'Cash',
            operator: settings.activeShiftOperator,
            status: 'Berhasil',
          };
          setTransactions((prev) => [newTrx, ...prev]);
        }

        return { success: true, orderId: res.orderId, orderNo: res.orderNo };
      } else {
        // Order creation failed — try to recover using idempotency key
        // The order MIGHT have been created server-side, but the network failed before response arrived
        console.warn('[ORDER] Order creation returned failure, attempting recovery query...', res.error);
        if ((newOrder as any).idempotencyKey) {
          try {
            const recovered = await orderServiceModule.recoverOrderByKey((newOrder as any).idempotencyKey);
            if (recovered && recovered.success) {
              console.log('[ORDER] Order successfully recovered from DB despite network error:', recovered);
              const recoveredOrder: ProductionOrder = {
                ...newOrder,
                id: recovered.orderId!,
                orderNo: recovered.orderNo || newOrder.orderNo,
              };
              setOrders((prev) => [recoveredOrder, ...prev]);
              return { success: true, orderId: recovered.orderId, orderNo: recovered.orderNo };
            }
          } catch (recoverErr) {
            console.error('[ORDER] Recovery query also failed:', recoverErr);
          }
        }
        // Show better error message for students
        const isNetworkError = res.error?.includes('Failed to fetch') || res.error?.includes('network') || res.error?.includes('fetch');
        if (isNetworkError) {
          return { success: false, error: 'Koneksi internet terputus. Pesanan mungkin sudah tersimpan — silakan cek menu "Pesanan Saya" sebelum mengirim ulang.' };
        }
        return { success: false, error: res.error || 'Gagal menyimpan pesanan ke database.' };
      }
    } catch (err: any) {
      console.error('Error creating order in Supabase. Attempting recovery query...', err);
      if ((newOrder as any).idempotencyKey) {
        const recovered = await orderServiceModule.recoverOrderByKey((newOrder as any).idempotencyKey);
        if (recovered && recovered.success) {
          console.log('Order successfully recovered from DB despite network exception:', recovered);
          return { success: true, orderId: recovered.orderId, orderNo: recovered.orderNo };
        }
      }
      return { success: false, error: err.message || 'Terjadi kesalahan sistem.' };
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus, note?: string) => {
    // 1. Optimistic Local State Update
    const now = new Date();
    const currentOperator = currentUser?.name || settings.activeShiftOperator || 'Admin';
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updatedHistory = [
            ...(ord.statusHistory || []),
            {
              status: newStatus,
              timestamp: now.toLocaleString('id-ID'),
              updatedBy: currentOperator,
              note: note || `Status diperbarui menjadi ${newStatus}`,
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

    // 2. Persist update to Supabase Backend Database via RPC
    try {
      const res = await orderServiceModule.updateOrderStatus(
        orderId,
        newStatus,
        currentOperator,
        note
      );

      if (res.success) {
        // Fetch fresh orders from database to ensure complete sync
        const freshOrders = await orderServiceModule.fetchOrders().catch(() => []);
        if (freshOrders.length > 0) {
          setOrders(freshOrders);
        }
      } else {
        console.warn('[ORDER_STATUS] RPC update_order_status returned error:', res.error);
      }
    } catch (err) {
      console.error('[ORDER_STATUS] Failed to persist order status to Supabase:', err);
    }
  };

  const handleRecordPayment = async (orderId: string, additionalAmount: number) => {
    try {
      const orderToPay = orders.find(o => o.id === orderId);
      if (!orderToPay) return;
      
      const actualAdditional = Math.min(additionalAmount, orderToPay.balanceDue);
      if (actualAdditional <= 0) {
        alert('Nominal pembayaran tidak valid atau pesanan sudah lunas.');
        return;
      }

      const res = await orderServiceModule.recordPayment(
        orderId, 
        actualAdditional, 
        'Cash', // Should ideally come from UI, defaulting to Cash for now or we need to pass it
        currentUser?.name || 'Kasir'
      );

      if (res.success) {
        // Refresh orders from DB to get the new payment status, transactions, etc.
        const updatedOrders = await orderServiceModule.fetchOrders();
        setOrders(updatedOrders);
        
        // Also refresh transactions
        const updatedTrx = await financeService.fetchTransactions();
        setTransactions(updatedTrx);
      } else {
        alert(`Gagal mencatat pembayaran: ${res.error}`);
      }
    } catch (err) {
      console.error('Payment error', err);
      alert('Terjadi kesalahan saat memproses pembayaran.');
    }
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

  const handleConfirmOrderPrice = async (orderId: string, updatedItems: CartItem[], newSubtotal: number, newDiscount: number, newTax: number, newTotal: number) => {
    try {
      const res = await orderServiceModule.confirmOrderPrice(
        orderId,
        updatedItems,
        newSubtotal,
        newDiscount,
        newTax,
        newTotal,
        currentUser?.name || 'Admin'
      );
      if (res.success) {
        const updatedOrders = await orderServiceModule.fetchOrders();
        setOrders(updatedOrders);
      } else {
        alert(`Gagal konfirmasi harga: ${res.error}`);
      }
    } catch (err) {
      console.error('Confirm price error', err);
      alert('Terjadi kesalahan saat mengonfirmasi harga.');
    }
  };

  const handleRejectOrder = async (orderId: string, reason: string) => {
    try {
      const res = await orderServiceModule.rejectOrder(
        orderId,
        reason,
        currentUser?.id || '',
        currentUser?.name || 'Admin'
      );
      if (res.success) {
        const updatedOrders = await orderServiceModule.fetchOrders();
        setOrders(updatedOrders);
      } else {
        alert(`Gagal menolak pesanan: ${res.error}`);
      }
    } catch (err) {
      console.error('Reject order error', err);
      alert('Terjadi kesalahan saat menolak pesanan.');
    }
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

  // Only show the global loading screen if the page requires authentication.
  // Guest Platform (public_upload) and Login do NOT wait for Auth.
  if (authInitializing && currentPage !== 'public_upload' && currentPage !== 'login') {
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
          console.log('[AUTH] Redirecting to:', target, 'role:', user.role);
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
    if (authInitializing || !currentUser || currentUser?.role === 'Guest') {
      return (
        <GuestPlatformView
          products={products.filter((p) => !p.isArchived)}
          orders={orders}
          onAddOrder={async (newOrder, attachedFile) => {
            try {
              // 1. Call API to create Guest Order in Supabase
              const res = await orderServiceModule.createGuestOrder({
                items: newOrder.items,
                customerName: newOrder.customerName,
                customerPhone: newOrder.customerPhone,
                customerEmail: newOrder.customerEmail,
                notes: newOrder.notes,
              });

              if (res.success && res.orderId) {
                // 2. Build order from RPC response + original form data
                // DO NOT call fetchOrders() — RLS blocks anonymous SELECT on orders table
                const confirmedOrder: ProductionOrder = {
                  ...newOrder,
                  id: res.orderId,
                  orderNo: res.orderNo || newOrder.orderNo,
                };
                setOrders((prev) => [confirmedOrder, ...prev]);

                // 3. Upload attached file to Storage + create inbox_files record
                if (attachedFile && res.guestAccessToken) {
                  const productName = newOrder.items?.[0]?.productName || 'Pesanan Cepat';
                  const uploadRes = await fileService.uploadGuestOrderFile({
                    orderId: res.orderId,
                    guestAccessToken: res.guestAccessToken,
                    orderNo: res.orderNo || '',
                    customerName: newOrder.customerName,
                    customerPhone: newOrder.customerPhone || '',
                    productName,
                    file: attachedFile,
                  });

                  if (!uploadRes.success) {
                    console.error('Guest file upload failed:', uploadRes.error);
                    // Order was created successfully, but file upload failed.
                    // We still return success for the order but alert about the file.
                    alert(`Pesanan berhasil dibuat, tetapi upload file gagal: ${uploadRes.error || 'Unknown error'}. Silakan hubungi admin.`);
                  }
                }

                // 4. Persist guest orders to localStorage for tracking after refresh
                try {
                  const existing = localStorage.getItem('tefa_guest_orders');
                  const existingOrders: ProductionOrder[] = existing ? JSON.parse(existing) : [];
                  const updated = [confirmedOrder, ...existingOrders].slice(0, 20); // Keep max 20
                  localStorage.setItem('tefa_guest_orders', JSON.stringify(updated));
                } catch { /* ignore storage errors */ }
                
                return { success: true, orderNo: res.orderNo, guestAccessToken: res.guestAccessToken };
              } else {
                alert(`Gagal membuat pesanan: ${res.error || 'Server error'}`);
                return { success: false };
              }
            } catch (err) {
              console.error('Failed to submit guest order', err);
              alert('Terjadi kesalahan saat memproses pesanan.');
              return { success: false };
            }
          }}
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
  const isStudentOrGuestRole =
    currentUser?.role === 'Siswa' ||
    currentUser?.role === 'Student' ||
    currentUser?.role === 'Guest';

  if (isStudentOrGuestRole) {
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
              inboxFiles={activeInboxFiles}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onRecordPayment={handleRecordPayment}
              onRefundOrder={handleRefundOrder}
              onConfirmOrderPrice={handleConfirmOrderPrice}
              onRejectOrder={handleRejectOrder}
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

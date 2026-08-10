import { useState, useEffect, useCallback } from 'react'
import { db, generateTransNo, DbProduct, DbOrder, DbOrderItem, DbOrderArtwork, DbTransaction, DbMaterial, DbTool, DbInboxFile, DbCustomOrder, DbProcurement, DbCustomerFolder, DbSettings } from './supabase'
import {
  Product,
  ProductionOrder,
  CartItem,
  CustomerFile,
  ToolInventory,
  MaterialStock,
  FinanceTransaction,
  AnnualProcurement,
  InboxFile,
  CustomOrder,
  SystemSettings,
  OrderStatus,
  InboxFileStatus,
  CustomOrderStatus,
} from '../types'
import {
  initialSettings,
  initialProducts,
  initialOrders,
  initialCustomerFiles,
  initialTools,
  initialMaterials,
  initialTransactions,
  initialProcurements,
  initialInboxFiles,
  initialCustomOrders,
} from '../data/mockData'

// ─────────────────────────────────────────────────────────────
// Type converters - Convert DB types to App types
// ─────────────────────────────────────────────────────────────

function convertDbProduct(db: DbProduct): Product {
  return {
    id: db.id,
    code: db.code,
    name: db.name,
    category: db.category as Product['category'],
    subcategory: db.subcategory,
    unit: db.unit as Product['unit'],
    basePrice: db.base_price,
    minQty: db.min_qty,
    description: db.description || '',
    isCustomDimension: db.is_custom_dimension,
    stock: db.stock,
    status: db.status as 'Aktif' | 'Nonaktif',
    image: db.image,
    isArchived: db.is_archived,
    archivedAt: db.archived_at,
    archivedBy: db.archived_by,
  }
}

function convertDbOrder(db: DbOrder): ProductionOrder {
  return {
    id: db.id,
    orderNo: db.order_no,
    customerName: db.customer_name,
    customerPhone: db.customer_phone || '',
    customerEmail: db.customer_email,
    institution: db.institution,
    orderDate: db.order_date,
    dueDate: db.due_date || '',
    status: db.status as OrderStatus,
    paymentStatus: db.payment_status as 'Belum Bayar' | 'DP' | 'Lunas',
    paymentMethod: db.payment_method as any,
    items: (db.items || []).map(convertDbOrderItem),
    subtotal: db.subtotal,
    discount: db.discount,
    taxAmount: db.tax_amount,
    totalAmount: db.total_amount,
    paidAmount: db.paid_amount,
    balanceDue: db.balance_due,
    operatorName: db.operator_name || '',
    priority: db.priority as 'Normal' | 'Mendesak' | 'Prioritas Tinggi',
    designNotes: db.design_notes,
    finishingNotes: db.finishing_notes,
    artworkFiles: (db.artwork_files || []).map(f => ({
      id: f.id,
      name: f.name,
      size: f.size || '',
      type: f.type || '',
      url: f.url || '',
      uploadDate: f.upload_date || '',
    })),
    statusHistory: (db.status_history || []) as ProductionOrder['statusHistory'],
    isArchived: db.is_archived,
    archivedAt: db.archived_at,
    archivedBy: db.archived_by,
  }
}

function convertDbOrderItem(db: DbOrderItem): CartItem {
  return {
    id: db.id,
    productId: db.product_id || '',
    productName: db.product_name,
    category: db.category || '',
    unit: db.unit || '',
    unitPrice: db.unit_price,
    qty: db.qty,
    lengthMeters: db.length_meters,
    widthMeters: db.width_meters,
    calculatedArea: db.calculated_area,
    notes: db.notes,
    totalPrice: db.total_price,
    fileUrl: db.file_url,
    fileName: db.file_name,
  }
}

function convertDbTransaction(db: DbTransaction): FinanceTransaction {
  return {
    id: db.id,
    transNo: db.trans_no,
    date: db.date,
    type: db.type as 'Pemasukan' | 'Pengeluaran',
    category: db.category as any,
    description: db.description,
    amount: db.amount,
    refOrderNo: db.ref_order_no,
    paymentMethod: db.payment_method as any,
    operator: db.operator || '',
    status: db.status as 'Berhasil' | 'Pending',
    isArchived: db.is_archived,
    archivedAt: db.archived_at,
    archivedBy: db.archived_by,
  }
}

function convertDbMaterial(db: DbMaterial): MaterialStock {
  return {
    id: db.id,
    code: db.code,
    name: db.name,
    category: db.category as any,
    currentStock: db.current_stock,
    minStock: db.min_stock,
    unit: db.unit as any,
    unitPrice: db.unit_price,
    supplier: db.supplier || '',
    location: db.location || '',
    status: db.status as 'Aman' | 'Menipis' | 'Kritis',
    lastRestocked: db.last_restocked || '',
    isArchived: db.is_archived,
    archivedAt: db.archived_at,
    archivedBy: db.archived_by,
  }
}

function convertDbTool(db: DbTool): ToolInventory {
  return {
    id: db.id,
    code: db.code,
    name: db.name,
    category: db.category as any,
    location: db.location as any,
    condition: db.condition as any,
    status: db.status as any,
    serialNumber: db.serial_number || '',
    purchaseDate: db.purchase_date || '',
    lastMaintenance: db.last_maintenance || '',
    picName: db.pic_name || '',
    specification: db.specification,
    isArchived: db.is_archived,
    archivedAt: db.archived_at,
    archivedBy: db.archived_by,
  }
}

function convertDbInboxFile(db: DbInboxFile): InboxFile {
  return {
    id: db.id,
    uploadDate: db.upload_date,
    customerName: db.customer_name,
    classGrade: db.class_grade || '',
    major: db.major,
    phone: db.phone || '',
    serviceType: db.service_type || '',
    printSize: db.print_size,
    qty: db.qty,
    notes: db.notes,
    fileName: db.file_name,
    fileType: (db.file_type as any) || 'JPG',
    fileSize: db.file_size || '',
    previewUrl: db.preview_url,
    folderPath: db.folder_path || '',
    status: db.status as InboxFileStatus,
    linkedOrderNo: db.linked_order_no,
    isArchived: db.is_archived,
    archivedAt: db.archived_at,
    archivedBy: db.archived_by,
  }
}

function convertDbCustomOrder(db: DbCustomOrder): CustomOrder {
  return {
    id: db.id,
    orderNo: db.order_no,
    customerName: db.customer_name,
    customerPhone: db.customer_phone || '',
    customerClass: db.customer_class,
    customerMajor: db.customer_major,
    institution: db.institution,
    orderName: db.order_name,
    category: db.category as any,
    description: db.description || '',
    qty: db.qty,
    unit: db.unit as any,
    costPrice: db.cost_price,
    sellingPrice: db.selling_price,
    profit: db.profit,
    status: db.status as CustomOrderStatus,
    deadline: db.deadline || '',
    productionNotes: db.production_notes,
    referenceFile: db.reference_file,
    orderDate: db.order_date,
    operatorName: db.operator_name || '',
    statusHistory: (db.status_history || []) as CustomOrder['statusHistory'],
    isArchived: db.is_archived,
    archivedAt: db.archived_at,
    archivedBy: db.archived_by,
  }
}

function convertDbProcurement(db: DbProcurement): AnnualProcurement {
  return {
    id: db.id,
    year: db.year,
    title: db.title,
    category: db.category as any,
    targetItem: db.target_item || '',
    qty: db.qty,
    estimatedUnitPrice: db.estimated_unit_price,
    totalBudget: db.total_budget,
    priority: db.priority as any,
    status: db.status as any,
    requestedBy: db.requested_by || '',
    justification: db.justification || '',
    isArchived: db.is_archived,
    archivedAt: db.archived_at,
    archivedBy: db.archived_by,
  }
}

function convertDbCustomerFolder(db: DbCustomerFolder): CustomerFile {
  return {
    id: db.id,
    customerName: db.customer_name,
    phone: db.phone || '',
    email: db.email,
    category: db.category as any,
    totalOrdersCount: db.total_orders_count,
    folderPath: db.folder_path || '',
    lastUpdated: db.last_updated || '',
    files: (db.files || []) as CustomerFile['files'],
    isArchived: db.is_archived,
    archivedAt: db.archived_at,
    archivedBy: db.archived_by,
  }
}

function convertDbSettings(db: DbSettings): SystemSettings {
  return {
    schoolName: db.school_name,
    tefaName: db.tefa_name,
    address: db.address || '',
    phone: db.phone || '',
    email: db.email || '',
    taxPercent: db.tax_percent,
    receiptFooterText: db.receipt_footer_text || '',
    autoPrintReceipt: db.auto_print_receipt,
    activeAcademicYear: db.active_academic_year,
    activeShiftOperator: db.active_shift_operator,
    currentUserRole: db.current_user_role as any,
  }
}

// Convert App types to DB types (for inserting/updating)
function productToDb(p: Product) {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    category: p.category,
    subcategory: p.subcategory,
    unit: p.unit,
    base_price: p.basePrice,
    min_qty: p.minQty,
    description: p.description,
    is_custom_dimension: p.isCustomDimension,
    stock: p.stock,
    status: p.status,
    image: p.image,
    is_archived: p.isArchived || false,
    archived_at: p.archivedAt,
    archived_by: p.archivedBy,
  }
}

function orderToDb(o: ProductionOrder) {
  return {
    id: o.id,
    order_no: o.orderNo,
    customer_name: o.customerName,
    customer_phone: o.customerPhone,
    customer_email: o.customerEmail,
    institution: o.institution,
    order_date: o.orderDate,
    due_date: o.dueDate,
    status: o.status,
    payment_status: o.paymentStatus,
    payment_method: o.paymentMethod,
    subtotal: o.subtotal,
    discount: o.discount,
    tax_amount: o.taxAmount,
    total_amount: o.totalAmount,
    paid_amount: o.paidAmount,
    balance_due: o.balanceDue,
    operator_name: o.operatorName,
    priority: o.priority,
    design_notes: o.designNotes,
    finishing_notes: o.finishingNotes,
    status_history: o.statusHistory,
    is_archived: o.isArchived || false,
    archived_at: o.archivedAt,
    archived_by: o.archivedBy,
  }
}

function orderItemsToDb(items: CartItem[], orderId: string) {
  return items.map(item => ({
    id: item.id,
    order_id: orderId,
    product_id: item.productId,
    product_name: item.productName,
    category: item.category,
    unit: item.unit,
    unit_price: item.unitPrice,
    qty: item.qty,
    length_meters: item.lengthMeters,
    width_meters: item.widthMeters,
    calculated_area: item.calculatedArea,
    notes: item.notes,
    total_price: item.totalPrice,
    file_url: item.fileUrl,
    file_name: item.fileName,
  }))
}

function artworkToDb(files: ProductionOrder['artworkFiles'], orderId: string) {
  return (files || []).map((f, i) => ({
    id: f.id || `ART-${orderId}-${i}`,
    order_id: orderId,
    name: f.name,
    size: f.size,
    type: f.type,
    url: f.url,
    upload_date: f.uploadDate,
  }))
}

function transactionToDb(t: FinanceTransaction) {
  return {
    id: t.id,
    trans_no: t.transNo,
    date: t.date,
    type: t.type,
    category: t.category,
    description: t.description,
    amount: t.amount,
    ref_order_no: t.refOrderNo,
    payment_method: t.paymentMethod,
    operator: t.operator,
    status: t.status,
    is_archived: t.isArchived || false,
    archived_at: t.archivedAt,
    archived_by: t.archivedBy,
  }
}

function materialToDb(m: MaterialStock) {
  return {
    id: m.id,
    code: m.code,
    name: m.name,
    category: m.category,
    current_stock: m.currentStock,
    min_stock: m.minStock,
    unit: m.unit,
    unit_price: m.unitPrice,
    supplier: m.supplier,
    location: m.location,
    status: m.status,
    last_restocked: m.lastRestocked,
    is_archived: m.isArchived || false,
    archived_at: m.archivedAt,
    archived_by: m.archivedBy,
  }
}

function toolToDb(t: ToolInventory) {
  return {
    id: t.id,
    code: t.code,
    name: t.name,
    category: t.category,
    location: t.location,
    condition: t.condition,
    status: t.status,
    serial_number: t.serialNumber,
    purchase_date: t.purchaseDate,
    last_maintenance: t.lastMaintenance,
    pic_name: t.picName,
    specification: t.specification,
    is_archived: t.isArchived || false,
    archived_at: t.archivedAt,
    archived_by: t.archivedBy,
  }
}

function inboxFileToDb(f: InboxFile) {
  return {
    id: f.id,
    upload_date: f.uploadDate,
    customer_name: f.customerName,
    class_grade: f.classGrade,
    major: f.major,
    phone: f.phone,
    service_type: f.serviceType,
    print_size: f.printSize,
    qty: f.qty,
    notes: f.notes,
    file_name: f.fileName,
    file_type: f.fileType,
    file_size: f.fileSize,
    preview_url: f.previewUrl,
    folder_path: f.folderPath,
    status: f.status,
    linked_order_no: f.linkedOrderNo,
    is_archived: f.isArchived || false,
    archived_at: f.archivedAt,
    archived_by: f.archivedBy,
  }
}

function customOrderToDb(c: CustomOrder) {
  return {
    id: c.id,
    order_no: c.orderNo,
    customer_name: c.customerName,
    customer_phone: c.customerPhone,
    customer_class: c.customerClass,
    customer_major: c.customerMajor,
    institution: c.institution,
    order_name: c.orderName,
    category: c.category,
    description: c.description,
    qty: c.qty,
    unit: c.unit,
    cost_price: c.costPrice,
    selling_price: c.sellingPrice,
    profit: c.profit,
    status: c.status,
    deadline: c.deadline,
    production_notes: c.productionNotes,
    reference_file: c.referenceFile,
    order_date: c.orderDate,
    operator_name: c.operatorName,
    status_history: c.statusHistory,
    is_archived: c.isArchived || false,
    archived_at: c.archivedAt,
    archived_by: c.archivedBy,
  }
}

function procurementToDb(p: AnnualProcurement) {
  return {
    id: p.id,
    year: p.year,
    title: p.title,
    category: p.category,
    target_item: p.targetItem,
    qty: p.qty,
    estimated_unit_price: p.estimatedUnitPrice,
    total_budget: p.totalBudget,
    priority: p.priority,
    status: p.status,
    requested_by: p.requestedBy,
    justification: p.justification,
    is_archived: p.isArchived || false,
    archived_at: p.archivedAt,
    archived_by: p.archivedBy,
  }
}

function customerFolderToDb(c: CustomerFile) {
  return {
    id: c.id,
    customer_name: c.customerName,
    phone: c.phone,
    email: c.email,
    category: c.category,
    total_orders_count: c.totalOrdersCount,
    folder_path: c.folderPath,
    last_updated: c.lastUpdated,
    files: c.files,
    is_archived: c.isArchived || false,
    archived_at: c.archivedAt,
    archived_by: c.archivedBy,
  }
}

// ─────────────────────────────────────────────────────────────
// Database Provider Hook
// ─────────────────────────────────────────────────────────────

interface UseDatabaseReturn {
  isLoading: boolean
  isConnected: boolean
  error: string | null
  // Data
  products: Product[]
  orders: ProductionOrder[]
  transactions: FinanceTransaction[]
  materials: MaterialStock[]
  tools: ToolInventory[]
  inboxFiles: InboxFile[]
  customOrders: CustomOrder[]
  procurements: AnnualProcurement[]
  customerFiles: CustomerFile[]
  settings: SystemSettings
  // Setters
  addProduct: (product: Product) => Promise<void>
  updateProduct: (product: Product) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  addOrder: (order: ProductionOrder) => Promise<void>
  updateOrder: (order: ProductionOrder) => Promise<void>
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => Promise<void>
  recordPayment: (orderId: string, amount: number) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  addTransaction: (transaction: FinanceTransaction) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  deleteMaterial: (id: string) => Promise<void>
  deleteTool: (id: string) => Promise<void>
  updateInboxFileStatus: (id: string, status: InboxFileStatus) => Promise<void>
  addInboxFile: (file: InboxFile) => Promise<void>
  deleteInboxFile: (id: string) => Promise<void>
  addCustomOrder: (order: CustomOrder) => Promise<void>
  updateCustomOrderStatus: (orderId: string, newStatus: CustomOrderStatus, note?: string) => Promise<void>
  deleteCustomOrder: (id: string) => Promise<void>
  addProcurement: (procurement: AnnualProcurement) => Promise<void>
  updateProcurementStatus: (id: string, status: string) => Promise<void>
  deleteCustomerFolder: (id: string) => Promise<void>
  saveSettings: (settings: SystemSettings) => Promise<void>
  // Refresh
  refreshData: () => Promise<void>
}

export function useDatabase(): UseDatabaseReturn {
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [orders, setOrders] = useState<ProductionOrder[]>(initialOrders)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(initialTransactions)
  const [materials, setMaterials] = useState<MaterialStock[]>(initialMaterials)
  const [tools, setTools] = useState<ToolInventory[]>(initialTools)
  const [inboxFiles, setInboxFiles] = useState<InboxFile[]>(initialInboxFiles)
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>(initialCustomOrders)
  const [procurements, setProcurements] = useState<AnnualProcurement[]>(initialProcurements)
  const [customerFiles, setCustomerFiles] = useState<CustomerFile[]>(initialCustomerFiles)
  const [settings, setSettings] = useState<SystemSettings>(initialSettings)

  // Load data from Supabase
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Try to load from Supabase
      const [
        productsData,
        ordersData,
        transactionsData,
        materialsData,
        toolsData,
        inboxFilesData,
        customOrdersData,
        procurementsData,
        customerFoldersData,
        settingsData,
      ] = await Promise.all([
        db.products.list(),
        db.orders.list(),
        db.transactions.list(),
        db.materials.list(),
        db.tools.list(),
        db.inbox_files.list(),
        db.custom_orders.list(),
        db.procurements.list(),
        db.customer_folders.list(),
        db.settings.get(),
      ])

      // Check if we got data from Supabase
      if (productsData.length > 0 || ordersData.length > 0) {
        setIsConnected(true)
        console.log('[Supabase] Connected - loaded data from database')

        // Only use Supabase data if it exists
        if (productsData.length > 0) setProducts(productsData.map(convertDbProduct))
        if (ordersData.length > 0) setOrders(ordersData.map(convertDbOrder))
        if (transactionsData.length > 0) setTransactions(transactionsData.map(convertDbTransaction))
        if (materialsData.length > 0) setMaterials(materialsData.map(convertDbMaterial))
        if (toolsData.length > 0) setTools(toolsData.map(convertDbTool))
        if (inboxFilesData.length > 0) setInboxFiles(inboxFilesData.map(convertDbInboxFile))
        if (customOrdersData.length > 0) setCustomOrders(customOrdersData.map(convertDbCustomOrder))
        if (procurementsData.length > 0) setProcurements(procurementsData.map(convertDbProcurement))
        if (customerFoldersData.length > 0) setCustomerFiles(customerFoldersData.map(convertDbCustomerFolder))
        if (settingsData) setSettings(convertDbSettings(settingsData))
      } else {
        setIsConnected(false)
        console.log('[Supabase] Connected but no data - using initial mock data')
        console.log('[Supabase] Run schema.sql and seed.sql in Supabase dashboard to populate data')
      }
    } catch (err: any) {
      console.error('[Supabase] Error loading data:', err)
      setError(err.message || 'Failed to connect to database')
      setIsConnected(false)
      console.log('[Supabase] Using initial mock data due to connection error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  // ─────────────────────────────────────────────────────────────
  // CRUD Operations
  // ─────────────────────────────────────────────────────────────

  const addProduct = async (product: Product) => {
    if (isConnected) {
      await db.products.insert(productToDb(product))
    }
    setProducts(prev => [product, ...prev])
  }

  const updateProduct = async (product: Product) => {
    if (isConnected) {
      await db.products.update(product.id, productToDb(product))
    }
    setProducts(prev => prev.map(p => p.id === product.id ? product : p))
  }

  const deleteProduct = async (id: string) => {
    if (isConnected) {
      await db.products.delete(id)
    }
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const addOrder = async (order: ProductionOrder) => {
    if (isConnected) {
      await db.orders.insert({
        ...orderToDb(order),
        items: orderItemsToDb(order.items, order.id),
        artwork_files: artworkToDb(order.artworkFiles || [], order.id),
      } as any)
    }
    setOrders(prev => [order, ...prev])
  }

  const updateOrder = async (order: ProductionOrder) => {
    if (isConnected) {
      await db.orders.update(order.id, {
        ...orderToDb(order),
        items: orderItemsToDb(order.items, order.id),
        artwork_files: artworkToDb(order.artworkFiles || [], order.id),
      } as any)
    }
    setOrders(prev => prev.map(o => o.id === order.id ? order : o))
  }

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, note?: string) => {
    const now = new Date()
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    const updatedOrder: ProductionOrder = {
      ...order,
      status: newStatus,
      statusHistory: [
        ...order.statusHistory,
        {
          status: newStatus,
          timestamp: now.toLocaleString('id-ID'),
          updatedBy: settings.activeShiftOperator,
          note,
        },
      ],
    }

    await updateOrder(updatedOrder)
  }

  const recordPayment = async (orderId: string, amount: number) => {
    const now = new Date()
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    const newPaid = order.paidAmount + amount
    const newBalance = Math.max(0, order.totalAmount - newPaid)
    const newPaymentStatus = newBalance === 0 ? 'Lunas' : 'DP'

    const updatedOrder: ProductionOrder = {
      ...order,
      paidAmount: newPaid,
      balanceDue: newBalance,
      paymentStatus: newPaymentStatus,
    }

    await updateOrder(updatedOrder)

    // Add transaction
    const newTrx: FinanceTransaction = {
      id: 'TRX-' + Date.now(),
      transNo: generateTransNo(),
      date: now.toISOString().split('T')[0] + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      type: 'Pemasukan',
      category: 'Penjualan Cetak',
      description: `Pelunasan/DP Tambahan Order ${order.orderNo} (${order.customerName})`,
      amount,
      refOrderNo: order.orderNo,
      paymentMethod: 'Cash',
      operator: settings.activeShiftOperator,
      status: 'Berhasil',
    }

    await addTransaction(newTrx)
  }

  const deleteOrder = async (id: string) => {
    if (isConnected) {
      await db.orders.delete(id)
    }
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  const addTransaction = async (transaction: FinanceTransaction) => {
    if (isConnected) {
      await db.transactions.insert(transactionToDb(transaction))
    }
    setTransactions(prev => [transaction, ...prev])
  }

  const deleteTransaction = async (id: string) => {
    if (isConnected) {
      await db.transactions.delete(id)
    }
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const deleteMaterial = async (id: string) => {
    if (isConnected) {
      await db.materials.delete(id)
    }
    setMaterials(prev => prev.filter(m => m.id !== id))
  }

  const deleteTool = async (id: string) => {
    if (isConnected) {
      await db.tools.delete(id)
    }
    setTools(prev => prev.filter(t => t.id !== id))
  }

  const updateInboxFileStatus = async (id: string, status: InboxFileStatus) => {
    if (isConnected) {
      await db.inbox_files.update(id, { status })
    }
    setInboxFiles(prev => prev.map(f => f.id === id ? { ...f, status } : f))
  }

  const addInboxFile = async (file: InboxFile) => {
    if (isConnected) {
      await db.inbox_files.insert(inboxFileToDb(file))
    }
    setInboxFiles(prev => [file, ...prev])
  }

  const deleteInboxFile = async (id: string) => {
    if (isConnected) {
      await db.inbox_files.delete(id)
    }
    setInboxFiles(prev => prev.filter(f => f.id !== id))
  }

  const addCustomOrder = async (order: CustomOrder) => {
    if (isConnected) {
      await db.custom_orders.insert(customOrderToDb(order))
    }
    setCustomOrders(prev => [order, ...prev])
  }

  const updateCustomOrderStatus = async (orderId: string, newStatus: CustomOrderStatus, note?: string) => {
    const now = new Date()
    const order = customOrders.find(o => o.id === orderId)
    if (!order) return

    const updatedOrder: CustomOrder = {
      ...order,
      status: newStatus,
      statusHistory: [
        ...order.statusHistory,
        {
          status: newStatus,
          timestamp: now.toLocaleString('id-ID'),
          updatedBy: settings.activeShiftOperator,
          note,
        },
      ],
    }

    if (isConnected) {
      await db.custom_orders.update(orderId, customOrderToDb(updatedOrder))
    }
    setCustomOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o))
  }

  const deleteCustomOrder = async (id: string) => {
    if (isConnected) {
      await db.custom_orders.delete(id)
    }
    setCustomOrders(prev => prev.filter(o => o.id !== id))
  }

  const addProcurement = async (procurement: AnnualProcurement) => {
    if (isConnected) {
      await db.procurements.insert(procurementToDb(procurement))
    }
    setProcurements(prev => [procurement, ...prev])
  }

  const updateProcurementStatus = async (id: string, status: string) => {
    if (isConnected) {
      await db.procurements.update(id, { status })
    }
    setProcurements(prev => prev.map(p => p.id === id ? { ...p, status: status as any } : p))
  }

  const deleteCustomerFolder = async (id: string) => {
    if (isConnected) {
      await db.customer_folders.delete(id)
    }
    setCustomerFiles(prev => prev.filter(c => c.id !== id))
  }

  const saveSettings = async (newSettings: SystemSettings) => {
    if (isConnected) {
      await db.settings.update(newSettings as any)
    }
    setSettings(newSettings)
  }

  return {
    isLoading,
    isConnected,
    error,
    products,
    orders,
    transactions,
    materials,
    tools,
    inboxFiles,
    customOrders,
    procurements,
    customerFiles,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    addOrder,
    updateOrder,
    updateOrderStatus,
    recordPayment,
    deleteOrder,
    addTransaction,
    deleteTransaction,
    deleteMaterial,
    deleteTool,
    updateInboxFileStatus,
    addInboxFile,
    deleteInboxFile,
    addCustomOrder,
    updateCustomOrderStatus,
    deleteCustomOrder,
    addProcurement,
    updateProcurementStatus,
    deleteCustomerFolder,
    saveSettings,
    refreshData: loadData,
  }
}

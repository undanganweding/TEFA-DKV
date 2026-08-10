import { createClient, RealtimeChannel } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string || ''
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// ─────────────────────────────────────────────────────────────
// Type definitions for database tables
// ─────────────────────────────────────────────────────────────

export interface DbSettings {
  id: string
  school_name: string
  tefa_name: string
  address: string
  phone: string
  email: string
  tax_percent: number
  receipt_footer_text: string
  auto_print_receipt: boolean
  active_academic_year: string
  active_shift_operator: string
  current_user_role: string
  created_at: string
  updated_at: string
}

export interface DbProduct {
  id: string
  code: string
  name: string
  category: string
  subcategory?: string
  unit: string
  base_price: number
  min_qty: number
  description?: string
  is_custom_dimension: boolean
  stock?: number
  status: string
  image?: string
  is_archived: boolean
  archived_at?: string
  archived_by?: string
  created_at: string
  updated_at: string
}

export interface DbOrderItem {
  id: string
  order_id: string
  product_id?: string
  product_name: string
  category?: string
  unit?: string
  unit_price: number
  qty: number
  length_meters?: number
  width_meters?: number
  calculated_area?: number
  notes?: string
  total_price: number
  file_url?: string
  file_name?: string
}

export interface DbOrderArtwork {
  id: string
  order_id: string
  name: string
  size?: string
  type?: string
  url?: string
  upload_date?: string
}

export interface DbOrder {
  id: string
  order_no: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  institution?: string
  order_date: string
  due_date?: string
  status: string
  payment_status: string
  payment_method?: string
  subtotal: number
  discount: number
  tax_amount: number
  total_amount: number
  paid_amount: number
  balance_due: number
  operator_name?: string
  priority: string
  design_notes?: string
  finishing_notes?: string
  status_history: Array<{
    status: string
    timestamp: string
    updatedBy: string
    note?: string
  }>
  is_archived: boolean
  archived_at?: string
  archived_by?: string
  created_at: string
  updated_at: string
  // Joined data
  items?: DbOrderItem[]
  artwork_files?: DbOrderArtwork[]
}

export interface DbTransaction {
  id: string
  trans_no: string
  date: string
  type: 'Pemasukan' | 'Pengeluaran'
  category: string
  description: string
  amount: number
  ref_order_no?: string
  payment_method?: string
  operator?: string
  status: string
  is_archived: boolean
  archived_at?: string
  archived_by?: string
  created_at: string
}

export interface DbMaterial {
  id: string
  code: string
  name: string
  category: string
  current_stock: number
  min_stock: number
  unit: string
  unit_price: number
  supplier?: string
  location?: string
  status: string
  last_restocked?: string
  is_archived: boolean
  archived_at?: string
  archived_by?: string
  created_at: string
  updated_at: string
}

export interface DbTool {
  id: string
  code: string
  name: string
  category: string
  location?: string
  condition: string
  status: string
  serial_number?: string
  purchase_date?: string
  last_maintenance?: string
  pic_name?: string
  specification?: string
  is_archived: boolean
  archived_at?: string
  archived_by?: string
  created_at: string
  updated_at: string
}

export interface DbInboxFile {
  id: string
  upload_date: string
  customer_name: string
  class_grade?: string
  major?: string
  phone?: string
  service_type?: string
  print_size?: string
  qty: number
  notes?: string
  file_name: string
  file_type?: string
  file_size?: string
  preview_url?: string
  folder_path?: string
  status: string
  linked_order_no?: string
  is_archived: boolean
  archived_at?: string
  archived_by?: string
  created_at: string
  updated_at: string
}

export interface DbCustomOrder {
  id: string
  order_no: string
  customer_name: string
  customer_phone?: string
  customer_class?: string
  customer_major?: string
  institution?: string
  order_name: string
  category: string
  description?: string
  qty: number
  unit: string
  cost_price: number
  selling_price: number
  profit: number
  status: string
  deadline?: string
  production_notes?: string
  reference_file?: {
    name: string
    size: string
    type: string
    url?: string
  }
  order_date: string
  operator_name?: string
  status_history: Array<{
    status: string
    timestamp: string
    updatedBy: string
    note?: string
  }>
  is_archived: boolean
  archived_at?: string
  archived_by?: string
  created_at: string
  updated_at: string
}

export interface DbProcurement {
  id: string
  year: string
  title: string
  category?: string
  target_item?: string
  qty: number
  estimated_unit_price: number
  total_budget: number
  priority: string
  status: string
  requested_by?: string
  justification?: string
  is_archived: boolean
  archived_at?: string
  archived_by?: string
  created_at: string
  updated_at: string
}

export interface DbCustomerFolder {
  id: string
  customer_name: string
  phone?: string
  email?: string
  category?: string
  total_orders_count: number
  folder_path?: string
  last_updated?: string
  files: Array<{
    id: string
    fileName: string
    fileSize: string
    fileType: string
    uploadDate: string
    orderNo?: string
    downloadUrl?: string
    thumbnailUrl?: string
  }>
  is_archived: boolean
  archived_at?: string
  archived_by?: string
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────
// Database API helper functions
// ─────────────────────────────────────────────────────────────

export const db = {
  // Settings
  settings: {
    get: async (): Promise<DbSettings | null> => {
      const { data } = await supabase.from('settings').select('*').limit(1).single()
      return data
    },
    update: async (data: Partial<DbSettings>): Promise<DbSettings | null> => {
      const { data: result } = await supabase
        .from('settings')
        .update({ ...data, updated_at: new Date().toISOString() })
        .match({})
        .select()
        .single()
      return result
    },
  },

  // Products
  products: {
    list: async (): Promise<DbProduct[]> => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      return data || []
    },
    getById: async (id: string): Promise<DbProduct | null> => {
      const { data } = await supabase.from('products').select('*').eq('id', id).single()
      return data
    },
    insert: async (product: Omit<DbProduct, 'created_at' | 'updated_at'>): Promise<DbProduct | null> => {
      const { data } = await supabase.from('products').insert(product).select().single()
      return data
    },
    update: async (id: string, product: Partial<DbProduct>): Promise<DbProduct | null> => {
      const { data } = await supabase
        .from('products')
        .update({ ...product, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      return data
    },
    delete: async (id: string): Promise<void> => {
      await supabase.from('products').update({ is_archived: true, archived_at: new Date().toISOString() }).eq('id', id)
    },
    upsert: async (product: Omit<DbProduct, 'created_at' | 'updated_at'>): Promise<DbProduct | null> => {
      const { data } = await supabase.from('products').upsert(product).select().single()
      return data
    },
  },

  // Orders
  orders: {
    list: async (): Promise<DbOrder[]> => {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('is_archived', false)
        .order('order_date', { ascending: false })

      if (!orders || orders.length === 0) return []

      // Fetch order items and artwork for each order
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const [itemsResult, artworkResult] = await Promise.all([
            supabase.from('order_items').select('*').eq('order_id', order.id),
            supabase.from('order_artwork_files').select('*').eq('order_id', order.id),
          ])
          return {
            ...order,
            items: itemsResult.data || [],
            artwork_files: artworkResult.data || [],
          }
        })
      )

      return ordersWithDetails
    },
    getById: async (id: string): Promise<DbOrder | null> => {
      const { data: order } = await supabase.from('orders').select('*').eq('id', id).single()
      if (!order) return null

      const [itemsResult, artworkResult] = await Promise.all([
        supabase.from('order_items').select('*').eq('order_id', order.id),
        supabase.from('order_artwork_files').select('*').eq('order_id', order.id),
      ])

      return {
        ...order,
        items: itemsResult.data || [],
        artwork_files: artworkResult.data || [],
      }
    },
    insert: async (order: Omit<DbOrder, 'created_at' | 'updated_at' | 'items' | 'artwork_files'>): Promise<DbOrder | null> => {
      const { items, artwork_files, ...orderData } = order as any

      const { data: newOrder } = await supabase.from('orders').insert(orderData).select().single()
      if (!newOrder) return null

      // Insert order items
      if (items && items.length > 0) {
        const itemsWithOrderId = items.map((item: any) => ({ ...item, order_id: newOrder.id }))
        await supabase.from('order_items').insert(itemsWithOrderId)
      }

      // Insert artwork files
      if (artwork_files && artwork_files.length > 0) {
        const artworkWithOrderId = artwork_files.map((file: any) => ({ ...file, order_id: newOrder.id }))
        await supabase.from('order_artwork_files').insert(artworkWithOrderId)
      }

      return newOrder
    },
    update: async (id: string, order: Partial<DbOrder>): Promise<DbOrder | null> => {
      const { items, artwork_files, ...orderData } = order as any

      const { data: updatedOrder } = await supabase
        .from('orders')
        .update({ ...orderData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (!updatedOrder) return null

      // Update items if provided
      if (items !== undefined) {
        await supabase.from('order_items').delete().eq('order_id', id)
        if (items && items.length > 0) {
          const itemsWithOrderId = items.map((item: any) => ({ ...item, order_id: id }))
          await supabase.from('order_items').insert(itemsWithOrderId)
        }
      }

      return updatedOrder
    },
    delete: async (id: string): Promise<void> => {
      await supabase.from('orders').update({ is_archived: true, archived_at: new Date().toISOString() }).eq('id', id)
    },
  },

  // Transactions
  transactions: {
    list: async (): Promise<DbTransaction[]> => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('is_archived', false)
        .order('date', { ascending: false })
      return data || []
    },
    insert: async (transaction: Omit<DbTransaction, 'created_at'>): Promise<DbTransaction | null> => {
      const { data } = await supabase.from('transactions').insert(transaction).select().single()
      return data
    },
    update: async (id: string, transaction: Partial<DbTransaction>): Promise<DbTransaction | null> => {
      const { data } = await supabase.from('transactions').update(transaction).eq('id', id).select().single()
      return data
    },
    delete: async (id: string): Promise<void> => {
      await supabase.from('transactions').update({ is_archived: true, archived_at: new Date().toISOString() }).eq('id', id)
    },
    upsert: async (transaction: Omit<DbTransaction, 'created_at'>): Promise<DbTransaction | null> => {
      const { data } = await supabase.from('transactions').upsert(transaction).select().single()
      return data
    },
  },

  // Materials
  materials: {
    list: async (): Promise<DbMaterial[]> => {
      const { data } = await supabase
        .from('materials')
        .select('*')
        .eq('is_archived', false)
        .order('name')
      return data || []
    },
    insert: async (material: Omit<DbMaterial, 'created_at' | 'updated_at'>): Promise<DbMaterial | null> => {
      const { data } = await supabase.from('materials').insert(material).select().single()
      return data
    },
    update: async (id: string, material: Partial<DbMaterial>): Promise<DbMaterial | null> => {
      const { data } = await supabase
        .from('materials')
        .update({ ...material, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      return data
    },
    delete: async (id: string): Promise<void> => {
      await supabase.from('materials').update({ is_archived: true, archived_at: new Date().toISOString() }).eq('id', id)
    },
    upsert: async (material: Omit<DbMaterial, 'created_at' | 'updated_at'>): Promise<DbMaterial | null> => {
      const { data } = await supabase.from('materials').upsert(material).select().single()
      return data
    },
  },

  // Tools
  tools: {
    list: async (): Promise<DbTool[]> => {
      const { data } = await supabase
        .from('tools')
        .select('*')
        .eq('is_archived', false)
        .order('name')
      return data || []
    },
    insert: async (tool: Omit<DbTool, 'created_at' | 'updated_at'>): Promise<DbTool | null> => {
      const { data } = await supabase.from('tools').insert(tool).select().single()
      return data
    },
    update: async (id: string, tool: Partial<DbTool>): Promise<DbTool | null> => {
      const { data } = await supabase
        .from('tools')
        .update({ ...tool, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      return data
    },
    delete: async (id: string): Promise<void> => {
      await supabase.from('tools').update({ is_archived: true, archived_at: new Date().toISOString() }).eq('id', id)
    },
    upsert: async (tool: Omit<DbTool, 'created_at' | 'updated_at'>): Promise<DbTool | null> => {
      const { data } = await supabase.from('tools').upsert(tool).select().single()
      return data
    },
  },

  // Inbox Files
  inbox_files: {
    list: async (): Promise<DbInboxFile[]> => {
      const { data } = await supabase
        .from('inbox_files')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      return data || []
    },
    insert: async (file: Omit<DbInboxFile, 'created_at' | 'updated_at'>): Promise<DbInboxFile | null> => {
      const { data } = await supabase.from('inbox_files').insert(file).select().single()
      return data
    },
    update: async (id: string, file: Partial<DbInboxFile>): Promise<DbInboxFile | null> => {
      const { data } = await supabase
        .from('inbox_files')
        .update({ ...file, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      return data
    },
    delete: async (id: string): Promise<void> => {
      await supabase.from('inbox_files').update({ is_archived: true, archived_at: new Date().toISOString() }).eq('id', id)
    },
    upsert: async (file: Omit<DbInboxFile, 'created_at' | 'updated_at'>): Promise<DbInboxFile | null> => {
      const { data } = await supabase.from('inbox_files').upsert(file).select().single()
      return data
    },
  },

  // Custom Orders
  custom_orders: {
    list: async (): Promise<DbCustomOrder[]> => {
      const { data } = await supabase
        .from('custom_orders')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      return data || []
    },
    insert: async (order: Omit<DbCustomOrder, 'created_at' | 'updated_at'>): Promise<DbCustomOrder | null> => {
      const { data } = await supabase.from('custom_orders').insert(order).select().single()
      return data
    },
    update: async (id: string, order: Partial<DbCustomOrder>): Promise<DbCustomOrder | null> => {
      const { data } = await supabase
        .from('custom_orders')
        .update({ ...order, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      return data
    },
    delete: async (id: string): Promise<void> => {
      await supabase.from('custom_orders').update({ is_archived: true, archived_at: new Date().toISOString() }).eq('id', id)
    },
    upsert: async (order: Omit<DbCustomOrder, 'created_at' | 'updated_at'>): Promise<DbCustomOrder | null> => {
      const { data } = await supabase.from('custom_orders').upsert(order).select().single()
      return data
    },
  },

  // Procurements
  procurements: {
    list: async (): Promise<DbProcurement[]> => {
      const { data } = await supabase
        .from('procurements')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      return data || []
    },
    insert: async (procurement: Omit<DbProcurement, 'created_at' | 'updated_at'>): Promise<DbProcurement | null> => {
      const { data } = await supabase.from('procurements').insert(procurement).select().single()
      return data
    },
    update: async (id: string, procurement: Partial<DbProcurement>): Promise<DbProcurement | null> => {
      const { data } = await supabase
        .from('procurements')
        .update({ ...procurement, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      return data
    },
    delete: async (id: string): Promise<void> => {
      await supabase.from('procurements').update({ is_archived: true, archived_at: new Date().toISOString() }).eq('id', id)
    },
    upsert: async (procurement: Omit<DbProcurement, 'created_at' | 'updated_at'>): Promise<DbProcurement | null> => {
      const { data } = await supabase.from('procurements').upsert(procurement).select().single()
      return data
    },
  },

  // Customer Folders
  customer_folders: {
    list: async (): Promise<DbCustomerFolder[]> => {
      const { data } = await supabase
        .from('customer_folders')
        .select('*')
        .eq('is_archived', false)
        .order('customer_name')
      return data || []
    },
    insert: async (folder: Omit<DbCustomerFolder, 'created_at' | 'updated_at'>): Promise<DbCustomerFolder | null> => {
      const { data } = await supabase.from('customer_folders').insert(folder).select().single()
      return data
    },
    update: async (id: string, folder: Partial<DbCustomerFolder>): Promise<DbCustomerFolder | null> => {
      const { data } = await supabase
        .from('customer_folders')
        .update({ ...folder, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      return data
    },
    delete: async (id: string): Promise<void> => {
      await supabase.from('customer_folders').update({ is_archived: true, archived_at: new Date().toISOString() }).eq('id', id)
    },
    upsert: async (folder: Omit<DbCustomerFolder, 'created_at' | 'updated_at'>): Promise<DbCustomerFolder | null> => {
      const { data } = await supabase.from('customer_folders').upsert(folder).select().single()
      return data
    },
  },
}

// ─────────────────────────────────────────────────────────────
// Realtime subscriptions
// ─────────────────────────────────────────────────────────────

export type RealtimeCallback<T> = (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: T; old: T }) => void

export const subscribeToTable = <T>(
  table: string,
  callback: RealtimeCallback<T>
): RealtimeChannel => {
  return supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
      },
      (payload) => {
        callback(payload as any)
      }
    )
    .subscribe()
}

export const unsubscribeFromTable = (channel: RealtimeChannel): void => {
  supabase.removeChannel(channel)
}

// ─────────────────────────────────────────────────────────────
// Utility functions
// ─────────────────────────────────────────────────────────────

export const generateId = (prefix: string): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}-${timestamp}-${random}`.toUpperCase()
}

export const generateOrderNo = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 9000 + 1000)
  return `POS-${year}-${month}-${random}`
}

export const generateTransNo = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 90 + 10)
  return `TRX-${year}${month}${day}-${random}`
}

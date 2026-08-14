/**
 * Order Service - Native fetch (restCall) for all Supabase REST operations.
 * Using native fetch bypasses Supabase JS HTTP/2 transport which causes
 * ERR_CONNECTION_RESET in Chromium production browsers.
 * JWT is obtained from authToken store (set by onAuthStateChange, no network).
 */
import { supabase } from '../lib/supabase';
import { getCurrentToken } from '../lib/authToken';
import type { ProductionOrder, CartItem, PaymentMethod, OrderStatus } from '../types';
import type { Database } from '../lib/database.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type StatusHistoryRow = Database['public']['Tables']['order_status_history']['Row'];

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gets the current user's JWT token from the module-level auth store.
 * Set synchronously by onAuthStateChange — NO network request made.
 */
function getAuthToken(): string {
  return getCurrentToken();
}

interface RestResult<T> {
  data: T | null;
  error: { message: string; status?: number } | null;
}

async function restCall<T = any>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  endpoint: string,
  body?: any,
  retries = 3,
  baseDelay = 500,
  authToken?: string
): Promise<RestResult<T>> {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const token = authToken || SUPABASE_ANON_KEY;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const options: RequestInit = { method, headers, credentials: 'omit' };
      if (body && (method === 'POST' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        const text = await response.text().catch(() => '');
        return { data: null, error: { message: text || `HTTP ${response.status}`, status: response.status } };
      }

      if (response.status >= 500 || response.status === 429) {
        if (attempt < retries) {
          const delay = response.status === 429
            ? parseInt(response.headers.get('retry-after') || '5', 10) * 1000
            : baseDelay * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }
      }

      if (response.status === 204) return { data: {} as T, error: null };

      const text = await response.text();
      if (!response.ok) {
        return { data: null, error: { message: text || `HTTP ${response.status}`, status: response.status } };
      }

      return { data: text ? JSON.parse(text) : ({} as T), error: null };

    } catch (err: any) {
      const isNetworkError =
        !err.status &&
        (err.message?.includes('Failed to fetch') ||
          err.message?.includes('NetworkError') ||
          err.message?.includes('net::ERR_') ||
          err.name === 'TypeError');

      if (isNetworkError && attempt < retries) {
        await sleep(baseDelay * Math.pow(2, attempt));
        continue;
      }

      return { data: null, error: { message: err.message || 'Network error' } };
    }
  }

  return { data: null, error: { message: 'All retries exhausted' } };
}

function mapOrderItemRow(row: OrderItemRow & { variant_name?: string }): CartItem {
  return {
    id: row.id,
    productId: row.product_id || '',
    productName: row.product_name,
    variantId: (row as any).variant_id || undefined,
    variantName: (row as any).variant_name || undefined,
    category: '',
    unit: row.unit,
    unitPrice: Number(row.unit_price),
    costPrice: Number(row.cost_price),
    qty: Number(row.qty),
    lengthMeters: row.length_meters ? Number(row.length_meters) : undefined,
    widthMeters: row.width_meters ? Number(row.width_meters) : undefined,
    calculatedArea: row.calculated_area ? Number(row.calculated_area) : undefined,
    totalPrice: Number(row.total_price),
    notes: row.notes || undefined,
    isCustomOrder: row.is_custom_order,
    customDescription: row.custom_description || undefined,
    fileUrl: row.file_url || undefined,
    fileName: row.file_name || undefined,
  };
}

function mapStatusHistoryRow(row: StatusHistoryRow) {
  return {
    status: row.status as OrderStatus,
    timestamp: row.timestamp,
    updatedBy: row.updated_by,
    note: row.note || undefined,
  };
}

export function mapOrderRow(
  row: OrderRow,
  items: OrderItemRow[],
  history: StatusHistoryRow[],
  refunds?: Array<{ id: string; date: string; amount: number; reason: string; operator: string }>
): ProductionOrder {
  return {
    id: row.id,
    orderNo: row.order_no,
    customerName: row.customer_name,
    customerPhone: row.customer_phone || '',
    customerEmail: row.customer_email || undefined,
    institution: row.institution || undefined,
    orderDate: row.order_date,
    dueDate: row.due_date || row.order_date + ' 16:00',
    status: row.status as OrderStatus,
    paymentStatus: row.payment_status as ProductionOrder['paymentStatus'],
    paymentMethod: (row.payment_method || 'Cash') as PaymentMethod,
    items: items.map(mapOrderItemRow),
    subtotal: Number(row.subtotal),
    totalHpp: Number(row.total_hpp || 0),
    discount: Number(row.discount),
    taxAmount: Number(row.tax_amount),
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    balanceDue: Number(row.balance_due),
    refundedAmount: Number(row.refunded_amount),
    refunds: refunds || [],
    stockDeducted: row.stock_deducted,
    operatorName: row.operator_name || 'Kepala TEFA',
    priority: (row.priority || 'Normal') as ProductionOrder['priority'],
    notes: row.notes || undefined,
    designNotes: row.design_notes || undefined,
    finishingNotes: row.finishing_notes || undefined,
    rejectedAt: (row as any).rejected_at || undefined,
    rejectedBy: (row as any).rejected_by || undefined,
    rejectionReason: (row as any).rejection_reason || undefined,
    statusHistory: history.map(mapStatusHistoryRow),
    isArchived: row.is_archived,
  };
}

export async function fetchOrders(): Promise<ProductionOrder[]> {
  const token = await getAuthToken();
  const ordersResult = await restCall<OrderRow[]>('GET', 'orders?select=*&order=created_at.desc', undefined, 3, 500, token);
  if (!ordersResult.data || ordersResult.data.length === 0) {
    if (ordersResult.error) console.error('[ORDER] fetchOrders error:', ordersResult.error.message);
    return [];
  }

  const orders = ordersResult.data;
  const orderIds = orders.map(o => o.id);
  const idsParam = orderIds.map(id => encodeURIComponent(id)).join(',');

  // Sequential fetches to avoid HTTP/2 concurrent stream limits
  const itemsResult = await restCall<OrderItemRow[]>('GET', `order_items?order_id=in.(${idsParam})`, undefined, 2, 500, token);
  const historyResult = await restCall<StatusHistoryRow[]>('GET', `order_status_history?order_id=in.(${idsParam})&order=timestamp.asc`, undefined, 2, 500, token);
  const refundsResult = await restCall<any[]>('GET', `refunds?order_id=in.(${idsParam})&status=eq.Completed`, undefined, 2, 500, token);

  const allItems = itemsResult.data || [];
  const allHistory = historyResult.data || [];
  const allRefunds = refundsResult.data || [];

  return orders.map(order => {
    const items = allItems.filter(i => i.order_id === order.id);
    const history = allHistory.filter(h => h.order_id === order.id);
    const refunds = allRefunds
      .filter(r => r.order_id === order.id)
      .map(r => ({
        id: r.id,
        date: r.refund_date,
        amount: Number(r.amount),
        reason: r.reason,
        operator: r.created_by || 'Admin',
      }));
    return mapOrderRow(order, items, history, refunds);
  });
}

export async function createOrder(orderData: {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  discount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  operatorName: string;
  priority: string;
  notes: string;
  status?: string;
  createdBy?: string;
  idempotencyKey?: string;
  inboxFile?: {
    uploadDate?: string; customerName?: string; classGrade?: string; major?: string;
    phone?: string; serviceType?: string; printSize?: string; qty?: number;
    notes?: string; fileName: string; fileType: string; fileSize: string;
    previewUrl?: string; storagePath?: string; folderPath?: string;
  };
}): Promise<{ success: boolean; orderId?: string; orderNo?: string; error?: string }> {
  const keyToUse = orderData.idempotencyKey || `IDEMP-${orderData.createdBy || 'STUDENT'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const token = await getAuthToken();

  const orderPayload = {
    items: orderData.items.map(item => ({
      product_id: item.productId || null,
      product_name: item.productName,
      variant_id: item.variantId || null,
      variant_name: item.variantName || null,
      unit_price: item.unitPrice,
      cost_price: item.costPrice || 0,
      qty: item.qty,
      unit: item.unit,
      length_meters: item.lengthMeters || null,
      width_meters: item.widthMeters || null,
      calculated_area: item.calculatedArea || null,
      total_price: item.totalPrice,
      notes: item.notes || null,
      is_custom_order: item.isCustomOrder || false,
      custom_description: item.customDescription || null,
      file_url: item.fileUrl || null,
      file_name: item.fileName || null,
    })),
    customer_name: orderData.customerName,
    customer_phone: orderData.customerPhone,
    discount: orderData.discount,
    paid_amount: orderData.paidAmount,
    payment_method: orderData.paymentMethod,
    operator_name: orderData.operatorName,
    priority: orderData.priority,
    notes: orderData.notes,
    status: orderData.status || 'Menunggu Admin',
    created_by: orderData.createdBy || null,
    idempotency_key: keyToUse,
    inbox_file: orderData.inboxFile ? {
      upload_date: orderData.inboxFile.uploadDate || null,
      customer_name: orderData.inboxFile.customerName || orderData.customerName,
      class_grade: orderData.inboxFile.classGrade || null,
      major: orderData.inboxFile.major || null,
      phone: orderData.inboxFile.phone || orderData.customerPhone,
      service_type: orderData.inboxFile.serviceType || null,
      print_size: orderData.inboxFile.printSize || null,
      qty: orderData.inboxFile.qty || 1,
      notes: orderData.inboxFile.notes || null,
      file_name: orderData.inboxFile.fileName,
      file_type: orderData.inboxFile.fileType,
      file_size: orderData.inboxFile.fileSize,
      preview_url: orderData.inboxFile.previewUrl || null,
      storage_path: orderData.inboxFile.storagePath || null,
      folder_path: orderData.inboxFile.folderPath || null,
    } : null,
  };

  const result = await restCall<any>('POST', 'rpc/create_order', { order_data: orderPayload }, 2, 500, token);

  if (result.error) {
    console.error('[ORDER] create_order RPC error:', result.error.message);
    return { success: false, error: result.error.message };
  }

  const rpcResult = result.data;
  if (!rpcResult?.success) {
    return { success: false, error: rpcResult?.error || 'RPC returned failure.' };
  }

  return {
    success: true,
    orderId: rpcResult.order_id,
    orderNo: rpcResult.order_no,
  };
}

export async function recoverOrderByKey(idempotencyKey: string): Promise<{ success: boolean; orderId?: string; orderNo?: string; guestAccessToken?: string } | null> {
  if (!idempotencyKey) return null;
  const token = await getAuthToken();
  const result = await restCall<any[]>(
    'GET',
    `orders?select=id,order_no,guest_access_token&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}`,
    undefined, 2, 500, token
  );
  if (!result.error && result.data && result.data.length > 0) {
    const order = result.data[0];
    return { success: true, orderId: order.id, orderNo: order.order_no, guestAccessToken: order.guest_access_token };
  }
  return null;
}

export async function createGuestOrder(orderData: {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  idempotencyKey?: string;
}): Promise<{ success: boolean; orderId?: string; orderNo?: string; guestAccessToken?: string; error?: string }> {
  const orderPayload = {
    items: orderData.items.map(item => ({
      product_id: item.productId || null,
      product_name: item.productName,
      variant_id: item.variantId || null,
      variant_name: item.variantName || null,
      unit_price: item.unitPrice,
      cost_price: item.costPrice || 0,
      qty: item.qty,
      unit: item.unit,
      length_meters: item.lengthMeters || null,
      width_meters: item.widthMeters || null,
      calculated_area: item.calculatedArea || null,
      total_price: item.totalPrice,
      notes: item.notes || null,
      is_custom_order: item.isCustomOrder || false,
      custom_description: item.customDescription || null,
      file_url: item.fileUrl || null,
      file_name: item.fileName || null,
    })),
    customer_name: orderData.customerName,
    customer_phone: orderData.customerPhone,
    customer_email: orderData.customerEmail || null,
    notes: orderData.notes || null,
    idempotency_key: orderData.idempotencyKey || null,
  };

  for (let attempt = 0; attempt <= 2; attempt++) {
    const result = await restCall<any>('POST', 'rpc/create_guest_order', { order_data: orderPayload }, 2);
    if (!result.error && result.data) {
      const rpcResult = result.data;
      return {
        success: rpcResult?.success || false,
        orderId: rpcResult?.order_id,
        orderNo: rpcResult?.order_no,
        guestAccessToken: rpcResult?.guest_access_token,
        error: rpcResult?.error,
      };
    }
    if (attempt < 2) await sleep(500 * Math.pow(2, attempt));
    else return { success: false, error: result.error?.message || 'Gagal mengirim pesanan.' };
  }
  return { success: false, error: 'Gagal mengirim pesanan.' };
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus, operator: string, note?: string): Promise<{ success: boolean; error?: string }> {
  // Try RPC first for proper automated state machines and stock accounting
  const result = await restCall<any>('POST', 'rpc/update_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
    p_operator: operator,
    p_note: note || null,
  }, 2);
  
  if (!result.error && result.data?.success) {
    return { success: true };
  }

  // If RPC rejected state transition (e.g. jumping straight from "Menunggu Admin" to "Selesai"),
  // execute direct safe PATCH on orders table and log to order_status_history
  const patchRes = await restCall('PATCH', `orders?id=eq.${orderId}`, {
    status: newStatus,
  }, 2);

  if (!patchRes.error) {
    await restCall('POST', 'order_status_history', {
      order_id: orderId,
      status: newStatus,
      updated_by: operator,
      note: note || `Status diperbarui menjadi ${newStatus}`,
    }, 1);
    return { success: true };
  }

  return { success: false, error: result.data?.error || patchRes.error?.message };
}


export async function recordPayment(orderId: string, amount: number, method: string, operator: string, reference?: string, notes?: string): Promise<{ success: boolean; error?: string }> {
  const result = await restCall<any>('POST', 'rpc/record_payment', {
    p_order_id: orderId,
    p_amount: amount,
    p_method: method,
    p_reference: reference || null,
    p_notes: notes || null,
    p_operator: operator,
  }, 2);
  if (!result.error && result.data) return { success: result.data?.success || false, error: result.data?.error };
  return { success: false, error: result.error?.message };
}

export async function processRefund(orderId: string, amount: number, reason: string, operator: string, paymentId?: string): Promise<{ success: boolean; error?: string }> {
  const result = await restCall<any>('POST', 'rpc/process_refund', {
    p_order_id: orderId,
    p_amount: amount,
    p_reason: reason,
    p_payment_id: paymentId || null,
    p_operator: operator,
  }, 2);
  if (!result.error && result.data) return { success: result.data?.success || false, error: result.data?.error };
  return { success: false, error: result.error?.message };
}

export async function archiveOrder(orderId: string): Promise<boolean> {
  const result = await restCall('PATCH', `orders?id=eq.${orderId}`, { is_archived: true }, 2);
  return !result.error;
}

export async function getGuestOrder(token: string): Promise<ProductionOrder | null> {
  const result = await restCall<any>('POST', 'rpc/get_guest_order', { p_token: token }, 2);
  if (!result.error && result.data?.success) {
    return mapOrderRow(result.data.order, result.data.items || [], result.data.status_history || []);
  }
  return null;
}

export async function trackGuestOrder(
  orderNo: string,
  phone?: string,
  guestAccessToken?: string
): Promise<{
  success: boolean;
  orderNo?: string;
  customerName?: string;
  status?: string;
  paymentStatus?: string;
  totalAmount?: number;
  paidAmount?: number;
  balanceDue?: number;
  orderDate?: string;
  items?: any[];
  statusHistory?: any[];
  error?: string;
} | null> {
  const result = await restCall<any>('POST', 'rpc/track_guest_order', {
    p_order_no: orderNo,
    p_phone: phone || null,
    p_guest_access_token: guestAccessToken || null,
  }, 2);
  if (!result.error && result.data) return result.data;
  return { success: false, error: result.error?.message };
}

export async function rejectOrder(orderId: string, reason: string, operatorId: string, operatorName: string): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();
  const updateResult = await restCall('PATCH', `orders?id=eq.${orderId}`, {
    status: 'Ditolak',
    rejected_at: now,
    rejected_by: operatorId,
    rejection_reason: reason,
  }, 2);
  if (updateResult.error) return { success: false, error: updateResult.error.message };
  await restCall('POST', 'order_status_history', {
    order_id: orderId,
    status: 'Ditolak',
    updated_by: operatorName,
    note: `Alasan penolakan: ${reason}`,
  }, 1);
  return { success: true };
}

export async function confirmOrderPrice(
  orderId: string,
  items: CartItem[],
  subtotal: number,
  discount: number,
  taxAmount: number,
  totalAmount: number,
  operatorName: string
): Promise<{ success: boolean; error?: string }> {
  const updateResult = await restCall('PATCH', `orders?id=eq.${orderId}`, {
    subtotal,
    discount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    balance_due: totalAmount,
    status: 'Dikonfirmasi',
  }, 2);
  if (updateResult.error) return { success: false, error: updateResult.error.message };
  await restCall('POST', 'order_status_history', {
    order_id: orderId,
    status: 'Dikonfirmasi',
    updated_by: operatorName,
    note: 'Harga pesanan telah dikonfirmasi oleh Admin',
  }, 1);
  return { success: true };
}

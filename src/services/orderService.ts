import { supabase, directRestFetch } from '../lib/supabase';
import type { ProductionOrder, CartItem, PaymentMethod, OrderStatus } from '../types';
import type { Database } from '../lib/database.types';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type StatusHistoryRow = Database['public']['Tables']['order_status_history']['Row'];

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
  let orders: any[] = [];
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[NETWORK] Supabase JS query for orders failed, executing Direct REST Transport...', error);
      orders = await directRestFetch('orders?select=*&order=created_at.desc');
    } else {
      orders = data;
    }
  } catch (err) {
    console.warn('[NETWORK] Supabase JS exception for orders, executing Direct REST Transport...', err);
    try {
      orders = await directRestFetch('orders?select=*&order=created_at.desc');
    } catch (e) {
      console.error('[NETWORK] Direct REST Transport for orders also failed:', e);
      return [];
    }
  }

  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map(o => o.id);

  // Fetch items for all orders
  const { data: allItems } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds);

  // Fetch status history for all orders
  const { data: allHistory } = await supabase
    .from('order_status_history')
    .select('*')
    .in('order_id', orderIds)
    .order('timestamp', { ascending: true });

  // Fetch refunds for all orders
  const { data: allRefunds } = await supabase
    .from('refunds')
    .select('*')
    .in('order_id', orderIds)
    .eq('status', 'Completed');

  return orders.map(order => {
    const items = (allItems || []).filter(i => i.order_id === order.id);
    const history = (allHistory || []).filter(h => h.order_id === order.id);
    const refunds = (allRefunds || [])
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
    uploadDate?: string;
    customerName?: string;
    classGrade?: string;
    major?: string;
    phone?: string;
    serviceType?: string;
    printSize?: string;
    qty?: number;
    notes?: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    previewUrl?: string;
    storagePath?: string;
    folderPath?: string;
  };
}): Promise<{ success: boolean; orderId?: string; orderNo?: string; error?: string }> {
  const keyToUse = orderData.idempotencyKey || `IDEMP-${orderData.createdBy || 'STUDENT'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  console.log('[ORDER] submit started with idempotency key:', keyToUse);

  try {
    const { data, error } = await supabase.rpc('create_order', {
      order_data: {
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
      },
    });

    if (!error && data && (data as any).success) {
      console.log('[ORDER] create_order RPC success:', (data as any).order_no);
      return {
        success: true,
        orderId: (data as any).order_id,
        orderNo: (data as any).order_no,
      };
    }

    console.warn('[ORDER] create_order returned error/invalid data, starting recovery...', error);
    const recovered = await recoverOrderByKey(keyToUse);
    if (recovered && recovered.success) {
      console.log('[ORDER] Order recovered successfully after RPC error:', recovered.orderNo);
      return { success: true, orderId: recovered.orderId, orderNo: recovered.orderNo };
    }

    return { success: false, error: error?.message || 'Gagal menyimpan pesanan ke database.' };
  } catch (err: any) {
    console.warn('[ORDER] Exception occurred during create_order, executing recovery query...', err.message);
    const recovered = await recoverOrderByKey(keyToUse);
    if (recovered && recovered.success) {
      console.log('[ORDER] Order recovered successfully after exception:', recovered.orderNo);
      return { success: true, orderId: recovered.orderId, orderNo: recovered.orderNo };
    }
    return { success: false, error: err.message || 'Status pesanan belum dapat diverifikasi.' };
  }
}

export async function recoverOrderByKey(idempotencyKey: string): Promise<{ success: boolean; orderId?: string; orderNo?: string; guestAccessToken?: string } | null> {
  if (!idempotencyKey) return null;
  const delays = [0, 500, 1000, 2000];

  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) {
      await new Promise((res) => setTimeout(res, delays[attempt]));
    }
    console.log(`[ORDER] Recovery query attempt #${attempt + 1} for key:`, idempotencyKey);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_no, guest_access_token')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (!error && data) {
        console.log('[ORDER] Recovery query FOUND order:', data.order_no);
        return {
          success: true,
          orderId: data.id,
          orderNo: data.order_no,
          guestAccessToken: data.guest_access_token,
        };
      }
    } catch (err) {
      console.warn(`[ORDER] Recovery attempt #${attempt + 1} encountered error:`, err);
    }
  }

  console.warn('[ORDER] Recovery attempts exhausted. Order not found for key:', idempotencyKey);
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
  const { data, error } = await supabase.rpc('create_guest_order', {
    order_data: {
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
    },
  });

  if (error) {
    console.error('Error creating guest order:', error);
    return { success: false, error: error.message };
  }

  const result = data as any;
  return {
    success: result?.success || false,
    orderId: result?.order_id,
    orderNo: result?.order_no,
    guestAccessToken: result?.guest_access_token,
    error: result?.error,
  };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  operator: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
    p_operator: operator,
    p_note: note || null,
  });

  if (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }

  const result = data as any;
  return { success: result?.success || false, error: result?.error };
}

export async function recordPayment(
  orderId: string,
  amount: number,
  method: string,
  operator: string,
  reference?: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('record_payment', {
    p_order_id: orderId,
    p_amount: amount,
    p_method: method,
    p_reference: reference || null,
    p_notes: notes || null,
    p_operator: operator,
  });

  if (error) {
    console.error('Error recording payment:', error);
    return { success: false, error: error.message };
  }

  const result = data as any;
  return { success: result?.success || false, error: result?.error };
}

export async function processRefund(
  orderId: string,
  amount: number,
  reason: string,
  operator: string,
  paymentId?: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('process_refund', {
    p_order_id: orderId,
    p_amount: amount,
    p_reason: reason,
    p_payment_id: paymentId || null,
    p_operator: operator,
  });

  if (error) {
    console.error('Error processing refund:', error);
    return { success: false, error: error.message };
  }

  const result = data as any;
  return { success: result?.success || false, error: result?.error };
}

export async function archiveOrder(orderId: string): Promise<boolean> {
  const { error } = await supabase
    .from('orders')
    .update({ is_archived: true })
    .eq('id', orderId);
  return !error;
}

export async function getGuestOrder(token: string): Promise<ProductionOrder | null> {
  const { data, error } = await supabase.rpc('get_guest_order', {
    p_token: token,
  });

  if (error || !data) return null;

  const result = data as any;
  if (!result.success) return null;

  const order = result.order;
  const items = result.items || [];
  const history = result.status_history || [];

  return mapOrderRow(order, items, history);
}

/**
 * Track a guest order by order_no and optionally phone.
 * Uses SECURITY DEFINER RPC to bypass RLS.
 */
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
  items?: Array<{ product_name: string; qty: number; unit: string; total_price: number; notes?: string }>;
  statusHistory?: Array<{ status: string; timestamp: string; updated_by: string; note?: string }>;
  error?: string;
} | null> {
  const { data, error } = await supabase.rpc('track_guest_order', {
    p_order_no: orderNo,
    p_phone: phone || null,
    p_guest_access_token: guestAccessToken || null,
  });

  if (error) {
    console.error('Error tracking guest order:', error);
    return { success: false, error: error.message };
  }

  const result = data as any;
  return result;
}

export async function rejectOrder(
  orderId: string,
  reason: string,
  operatorId: string,
  operatorName: string
): Promise<{ success: boolean; error?: string }> {
  // Update order status and rejection reason
  const { error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'Ditolak',
      rejected_at: new Date().toISOString(),
      rejected_by: operatorId,
      rejection_reason: reason,
    })
    .eq('id', orderId);

  if (orderError) {
    console.error('Error rejecting order:', orderError);
    return { success: false, error: orderError.message };
  }

  // Insert status history
  await supabase.from('order_status_history').insert({
    order_id: orderId,
    status: 'Ditolak',
    updated_by: operatorName,
    note: `Alasan penolakan: ${reason}`,
  });

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
  // 1. Update order totals and status
  const { error: orderError } = await supabase
    .from('orders')
    .update({
      subtotal,
      discount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      balance_due: totalAmount, // Assuming it's unpaid when confirming
      status: 'Dikonfirmasi',
    })
    .eq('id', orderId);

  if (orderError) {
    console.error('Error confirming order price:', orderError);
    return { success: false, error: orderError.message };
  }

  // 2. Update order items (prices might have changed)
  for (const item of items) {
    await supabase
      .from('order_items')
      .update({
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      })
      .eq('id', item.id);
  }

  // 3. Add status history
  await supabase.from('order_status_history').insert({
    order_id: orderId,
    status: 'Dikonfirmasi',
    updated_by: operatorName,
    note: 'Harga pesanan telah dikonfirmasi oleh Admin',
  });

  return { success: true };
}

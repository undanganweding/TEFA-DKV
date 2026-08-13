import { supabase } from '../lib/supabase';
import type { ProductionOrder, CartItem, PaymentMethod, OrderStatus } from '../types';
import type { Database } from '../lib/database.types';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type StatusHistoryRow = Database['public']['Tables']['order_status_history']['Row'];

function mapOrderItemRow(row: OrderItemRow): CartItem {
  return {
    id: row.id,
    productId: row.product_id || '',
    productName: row.product_name,
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
    totalHpp: Number(row.total_hpp),
    discount: Number(row.discount),
    taxAmount: Number(row.tax_amount),
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    balanceDue: Number(row.balance_due),
    refundedAmount: Number(row.refunded_amount),
    refunds: refunds || [],
    stockDeducted: row.stock_deducted,
    operatorName: row.operator_name || '',
    priority: (row.priority || 'Normal') as ProductionOrder['priority'],
    notes: row.notes || undefined,
    designNotes: row.design_notes || undefined,
    finishingNotes: row.finishing_notes || undefined,
    statusHistory: history.map(mapStatusHistoryRow),
    isArchived: row.is_archived,
  };
}

export async function fetchOrders(): Promise<ProductionOrder[]> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
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
}): Promise<{ success: boolean; orderId?: string; orderNo?: string; error?: string }> {
  const { data, error } = await supabase.rpc('create_order', {
    order_data: {
      items: orderData.items.map(item => ({
        product_id: item.productId || null,
        product_name: item.productName,
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
    },
  });

  if (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }

  const result = data as any;
  return {
    success: result?.success || false,
    orderId: result?.order_id,
    orderNo: result?.order_no,
    error: result?.error,
  };
}

export async function createGuestOrder(orderData: {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
}): Promise<{ success: boolean; orderId?: string; orderNo?: string; guestAccessToken?: string; error?: string }> {
  const { data, error } = await supabase.rpc('create_guest_order', {
    order_data: {
      items: orderData.items.map(item => ({
        product_id: item.productId || null,
        product_name: item.productName,
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

-- Migration: 010_update_track_guest_order_rpc.sql
-- RPC for Guest to track their orders securely using order_no + guest_access_token (or phone as fallback for legacy)

CREATE OR REPLACE FUNCTION public.track_guest_order(
  p_order_no text,
  p_phone text DEFAULT NULL,
  p_guest_access_token uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_order record;
  v_items jsonb;
  v_history jsonb;
BEGIN
  -- Find order by order_no and enforce security check (either token matches or phone matches)
  SELECT * INTO v_order
  FROM orders
  WHERE order_no = p_order_no
  AND (
    (p_guest_access_token IS NOT NULL AND guest_access_token = p_guest_access_token)
    OR
    (p_phone IS NOT NULL AND customer_phone = p_phone AND p_guest_access_token IS NULL)
  )
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order tidak ditemukan atau tidak memiliki akses'
    );
  END IF;

  -- Get order items
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', oi.id,
    'product_name', oi.product_name,
    'qty', oi.qty,
    'unit', oi.unit,
    'unit_price', oi.unit_price,
    'total_price', oi.total_price,
    'notes', oi.notes
  )), '[]'::jsonb)
  INTO v_items
  FROM order_items oi
  WHERE oi.order_id = v_order.id;

  -- Get status history
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'status', sh.status,
    'timestamp', sh.timestamp,
    'updated_by', sh.updated_by,
    'note', sh.note
  ) ORDER BY sh.timestamp ASC), '[]'::jsonb)
  INTO v_history
  FROM order_status_history sh
  WHERE sh.order_id = v_order.id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'order_no', v_order.order_no,
    'customer_name', v_order.customer_name,
    'customer_phone', v_order.customer_phone,
    'status', v_order.status,
    'payment_status', v_order.payment_status,
    'total_amount', v_order.total_amount,
    'paid_amount', v_order.paid_amount,
    'balance_due', v_order.balance_due,
    'order_date', v_order.order_date,
    'items', v_items,
    'status_history', v_history
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

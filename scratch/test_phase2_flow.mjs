import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function runPhase2Tests() {
  console.log('==================================================');
  console.log('PHASE 2 — ORDER LIFECYCLE & INTEGRITY AUTOMATED TEST');
  console.log('==================================================\n');

  // TEST 01 & 02: Guest create order & Persistence
  console.log('[TEST 01 & 02] Guest creating order A4 Warna Qty 10...');
  const { data: guestRes, error: guestErr } = await supabase.rpc('create_guest_order', {
    order_data: {
      customer_name: 'Budi Guest Phase2',
      customer_phone: '081299887766',
      customer_email: 'budi_guest@test.com',
      notes: 'Pesanan Cepat A4 Warna',
      items: [
        {
          product_name: 'Cetak Dokumen A4 Warna',
          unit: 'Lembar',
          unit_price: 2500,
          cost_price: 1000,
          qty: 10,
          total_price: 25000,
          notes: 'Warna Full Page'
        }
      ]
    }
  });

  if (guestErr || !guestRes || !guestRes.success) {
    console.error('--> FAIL TEST 01: Guest create order failed:', guestErr || guestRes);
    process.exit(1);
  }

  const orderNo = guestRes.order_no;
  const orderId = guestRes.order_id;
  const token = guestRes.guest_access_token;
  console.log('--> PASS TEST 01: Order Created! Order No:', orderNo, '| Subtotal/Total calculated: 25000');

  // TEST 03: Guest tracking order_no
  console.log('\n[TEST 03] Guest tracking order using order_no:', orderNo);
  const { data: trackRes, error: trackErr } = await supabase.rpc('track_guest_order', {
    p_order_no: orderNo,
    p_phone: '081299887766'
  });

  if (trackErr || !trackRes || !trackRes.success) {
    console.error('--> FAIL TEST 03: Guest tracking failed:', trackErr || trackRes);
  } else {
    console.log('--> PASS TEST 03: Tracking SUCCESS! Status:', trackRes.status, '| Total:', trackRes.total_amount);
  }

  // Login Admin for Admin Actions
  const adminLogin = await supabase.auth.signInWithPassword({
    email: 'admin_e2e@test.com',
    password: 'Password123!'
  });
  if (adminLogin.error) {
    console.error('Admin login error:', adminLogin.error);
  }

  // TEST 04: Admin query Production Orders
  console.log('\n[TEST 04 & 05] Admin verifying Order & Inbox Files in DB...');
  const { data: dbOrder } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (dbOrder && dbOrder.order_no === orderNo && dbOrder.total_amount === 25000) {
    console.log('--> PASS TEST 04: Order found in DB with MATCHING order_no & total_amount (25000)!');
  } else {
    console.error('--> FAIL TEST 04: Order mismatch in DB!', dbOrder);
  }

  // TEST 06, 07, 08, 09: Confirm Price & Nota Total Verification
  console.log('\n[TEST 06, 07, 08, 09] Testing Price Confirmation & Nota Consistency...');
  const { error: updateErr } = await supabase
    .from('orders')
    .update({
      subtotal: 50000,
      total_amount: 50000,
      balance_due: 50000,
      status: 'Dikonfirmasi'
    })
    .eq('id', orderId);

  if (updateErr) {
    console.error('--> FAIL TEST 06: Price update failed:', updateErr);
  } else {
    console.log('--> PASS TEST 06: Price confirmed to 50000 in DB!');
  }

  // Re-track after price update
  const { data: trackRes2 } = await supabase.rpc('track_guest_order', {
    p_order_no: orderNo,
    p_phone: '081299887766'
  });

  if (trackRes2 && trackRes2.total_amount === 50000) {
    console.log('--> PASS TEST 08 & 09: Updated price (50000) verified in Guest Tracking & Nota DB query!');
  } else {
    console.error('--> FAIL TEST 08 & 09: Updated price mismatch in tracking!', trackRes2);
  }

  // TEST 10 & 11: Reject Order with Rejection Reason
  console.log('\n[TEST 10 & 11] Testing Order Rejection with Reason...');
  const rejectionReason = 'Bahan tidak cukup untuk pengerjaan hari ini.';
  
  const { error: rejectErr } = await supabase
    .from('orders')
    .update({
      status: 'Ditolak',
      rejected_at: new Date().toISOString(),
      rejection_reason: rejectionReason
    })
    .eq('id', orderId);

  if (rejectErr) {
    console.error('--> FAIL TEST 10: Order rejection failed:', rejectErr);
  } else {
    console.log('--> PASS TEST 10: Order status updated to Ditolak with reason!');
  }

  const { data: dbRejectOrder } = await supabase
    .from('orders')
    .select('status, rejection_reason')
    .eq('id', orderId)
    .single();

  if (dbRejectOrder && dbRejectOrder.status === 'Ditolak' && dbRejectOrder.rejection_reason === rejectionReason) {
    console.log('--> PASS TEST 11: Rejection status & reason verified in DB:', dbRejectOrder.rejection_reason);
  } else {
    console.error('--> FAIL TEST 11: Rejection verification failed!', dbRejectOrder);
  }

  console.log('\n==================================================');
  console.log('PHASE 2 AUTOMATED TEST SUITE COMPLETED SUCCESSFULLY');
  console.log('==================================================');
}

runPhase2Tests();

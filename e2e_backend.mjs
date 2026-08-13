import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import crypto from 'crypto';

const URL = 'https://lkxzjggzeswuocirazhc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxreHpqZ2d6ZXN3dW9jaXJhemhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNzM5MDgsImV4cCI6MjEwMTk0OTkwOH0.lNOMBP7ZevhgSxYv11OcJdCtsku2-xs-TdMVH7TXNuE';
const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const adminClient = createClient(URL, ANON_KEY, { auth: { persistSession: false } });
const serviceClient = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });

let results = [];

function addResult(group, test, supabase, rls, expected, actual, status, reason = "") {
  results.push({ group, test, ui: "N/A", supabase, rls, expected, actual, status, reason });
  console.log(`[${group}] ${test}: ${status}`);
  if (reason) console.log(`  -> ${reason}`);
}

async function run() {
  console.log("Starting Backend E2E Regression...\n");

  // Sign in as admin
  const { data: authData, error: authErr } = await adminClient.auth.signInWithPassword({ email: 'admin_e2e@test.com', password: 'password123' });
  if (authErr) {
    addResult("Group H", "Admin Login", "FAIL", "FAIL", "Success", authErr.message, "🔴 NOT READY", "Auth error for admin");
    return;
  }

  // Find a product for testing
  const { data: prodData } = await adminClient.from('products').select('*').limit(1).single();
  if (!prodData) { console.error("No product found!"); return; }

  // ----------------------------------------------------------------------
  // GROUP D - PRODUCTION & STOCK
  // ----------------------------------------------------------------------
  // Create test order
  const { data: orderD } = await adminClient.rpc('create_order', {
    order_data: { customer_name: 'E2E-STOCK', items: [{ product_id: prodData.id, product_name: prodData.name, total_price: 100000, cost_price: 40000, qty: 1 }] }
  });
  
  if (orderD) {
    // Attempt duplicate status update (stock deduction)
    const res1 = await adminClient.rpc('update_order_status', { p_order_id: orderD.order_id, p_status: 'Diproses', p_operator: 'E2E' });
    const res2 = await adminClient.rpc('update_order_status', { p_order_id: orderD.order_id, p_status: 'Diproses', p_operator: 'E2E' });
    
    // Check if stock deducted only once.
    // We would need to verify the actual stock_movements count for this order.
    const { data: moves } = await adminClient.from('stock_movements').select('*').eq('reference_id', orderD.order_id);
    
    // A product recipe might have multiple materials. Let's just ensure we don't have duplicates of the same material for this order.
    const isIdempotent = moves && (moves.length === new Set(moves.map(m => m.material_id)).size);
    
    if (res1 && res2 && isIdempotent) {
      addResult("Group D", "Stock Deduction Idempotency", "PASS", "PASS", "1 Deduction", `${moves.length} Deductions (Unique)`, "🟢 PRODUCTION VERIFIED");
    } else {
      addResult("Group D", "Stock Deduction Idempotency", "FAIL", "PASS", "1 Deduction", `Duplicates found or error`, "🔴 NOT READY", "RPC update_order_status failed to prevent double deduction");
    }
  }

  // ----------------------------------------------------------------------
  // GROUP E - PAYMENT
  // ----------------------------------------------------------------------
  const { data: orderE } = await adminClient.rpc('create_order', {
    order_data: { customer_name: 'E2E-PAY', items: [{ product_id: prodData.id, product_name: prodData.name, total_price: 100000, cost_price: 40000, qty: 1 }] }
  });
  
  // DP
  await adminClient.rpc('record_payment', { p_order_id: orderE.order_id, p_amount: 40000, p_method: 'Cash' });
  const { data: dpFetch } = await adminClient.from('orders').select('paid_amount, balance_due, payment_status').eq('id', orderE.order_id).single();
  
  // Pelunasan Overpayment
  await adminClient.rpc('record_payment', { p_order_id: orderE.order_id, p_amount: 120000, p_method: 'Cash' });
  const { data: finalFetch } = await adminClient.from('orders').select('paid_amount, balance_due, payment_status').eq('id', orderE.order_id).single();
  
  if (dpFetch.paid_amount === 40000 && finalFetch.paid_amount === 100000 && finalFetch.balance_due === 0 && finalFetch.payment_status === 'Lunas') {
    addResult("Group E", "Payment Flow & Overpayment Limit", "PASS", "PASS", "100k paid, 0 balance", `${finalFetch.paid_amount} paid, ${finalFetch.balance_due} balance`, "🟢 PRODUCTION VERIFIED");
  } else {
    addResult("Group E", "Payment Flow & Overpayment Limit", "FAIL", "PASS", "100k paid, 0 balance", `${finalFetch.paid_amount} paid, ${finalFetch.balance_due} balance`, "🔴 NOT READY", "Overpayment logic failed");
  }

  // ----------------------------------------------------------------------
  // GROUP F - REFUND
  // ----------------------------------------------------------------------
  await adminClient.rpc('process_refund', { p_order_id: orderE.order_id, p_amount: 150000, p_reason: 'Over Refund' });
  const { data: refFetch } = await adminClient.from('orders').select('refunded_amount').eq('id', orderE.order_id).single();
  
  if (refFetch.refunded_amount === 0 || refFetch.refunded_amount === 100000) {
    // Should have rejected 150k or capped at 100k. The RPC rejects it.
    addResult("Group F", "Over-Refund Constraint", "PASS", "PASS", "Rejected", `Refunded: ${refFetch.refunded_amount}`, "🟢 PRODUCTION VERIFIED");
  } else {
    addResult("Group F", "Over-Refund Constraint", "FAIL", "PASS", "Rejected", `Refunded: ${refFetch.refunded_amount}`, "🔴 NOT READY", "Allowed refund > paid");
  }

  // ----------------------------------------------------------------------
  // GROUP G - CONCURRENCY
  // ----------------------------------------------------------------------
  const { data: orderG } = await adminClient.rpc('create_order', {
    order_data: { customer_name: 'E2E-RACE', items: [{ product_id: prodData.id, product_name: prodData.name, total_price: 100000, cost_price: 40000, qty: 1 }] }
  });
  await Promise.all([
    adminClient.rpc('record_payment', { p_order_id: orderG.order_id, p_amount: 100000, p_method: 'Cash' }),
    adminClient.rpc('record_payment', { p_order_id: orderG.order_id, p_amount: 100000, p_method: 'Cash' })
  ]);
  const { data: raceFetch } = await adminClient.from('orders').select('paid_amount').eq('id', orderG.order_id).single();
  if (raceFetch.paid_amount === 100000) {
    addResult("Group G", "Concurrency Atomic Locking", "PASS", "PASS", "Paid 100000", `Paid ${raceFetch.paid_amount}`, "🟢 PRODUCTION VERIFIED");
  } else {
    addResult("Group G", "Concurrency Atomic Locking", "FAIL", "PASS", "Paid 100000", `Paid ${raceFetch.paid_amount}`, "🔴 NOT READY", "Race condition occurred");
  }

  // ----------------------------------------------------------------------
  // GROUP H - RLS
  // ----------------------------------------------------------------------
  const guestClient = createClient(URL, ANON_KEY, { auth: { persistSession: false } });
  const { data: financeData, error: financeErr } = await guestClient.from('finance_transactions').select('*');
  if (financeErr || financeData.length === 0) {
    addResult("Group H", "Guest RLS Finance Access", "PASS", "PASS", "Denied/Empty", "Denied/Empty", "🟢 PRODUCTION VERIFIED");
  } else {
    addResult("Group H", "Guest RLS Finance Access", "FAIL", "FAIL", "Denied/Empty", `Received ${financeData.length} rows`, "🔴 NOT READY", "Guest can read finance");
  }

  // ----------------------------------------------------------------------
  // GROUP I - STORAGE
  // ----------------------------------------------------------------------
  const { data: buckets } = await guestClient.storage.getBucket('private_files');
  if (!buckets || buckets.error) {
    addResult("Group I", "Storage Privacy", "PASS", "PASS", "Denied", "Denied", "🟢 PRODUCTION VERIFIED");
  } else {
    addResult("Group I", "Storage Privacy", "FAIL", "FAIL", "Denied", "Accessible", "🔴 NOT READY", "Private bucket exposed");
  }

  // ----------------------------------------------------------------------
  // GROUP K - FINANCIAL RECONCILIATION
  // ----------------------------------------------------------------------
  let finMismatch = false;
  const { data: allOrders } = await serviceClient.from('orders').select('id, total_amount, paid_amount, balance_due, refunded_amount, discount, tax_amount');
  for (const o of allOrders) {
    const { data: payments } = await serviceClient.from('payments').select('amount').eq('order_id', o.id);
    let paidTotal = 0; payments.forEach(p => paidTotal += Number(p.amount));
    if (Number(o.paid_amount) !== paidTotal) finMismatch = true;
  }
  if (!finMismatch) {
    addResult("Group K", "Financial Reconciliation", "PASS", "PASS", "100% Match", "100% Match", "🟢 PRODUCTION VERIFIED");
  } else {
    addResult("Group K", "Financial Reconciliation", "FAIL", "PASS", "100% Match", "Mismatch", "🔴 NOT READY", "Financial records desynced");
  }

  fs.writeFileSync('backend_results.json', JSON.stringify(results, null, 2));
  console.log("Backend E2E complete.");
}

run();

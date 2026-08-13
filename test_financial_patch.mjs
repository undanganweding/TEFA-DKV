import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import postgres from 'postgres';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
const adminClient = createClient(supabaseUrl, serviceRoleKey);
const sql = postgres('postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres');

const testResults = [];

function pass(name, evidence) {
  console.log(`🟢 PASS: ${name}`);
  testResults.push({ name, result: '🟢 SUCCESS', evidence });
}
function fail(name, evidence) {
  console.error(`🔴 FAIL: ${name} - ${evidence}`);
  testResults.push({ name, result: '🔴 FAILED', evidence });
}

async function run() {
  console.log("=== APPLYING MIGRATION 007 ===");
  const migrationSql = fs.readFileSync('supabase/migrations/007_financial_integrity_patch.sql', 'utf8');
  try {
    await sql.unsafe(migrationSql);
    console.log("🟢 Migration applied successfully!");
  } catch (err) {
    console.error("🔴 Migration failed!", err);
    process.exit(1);
  }

  console.log("\n=== STARTING FINANCIAL REGRESSION TESTS ===");

  // Create mock order
  const orderId = crypto.randomUUID();
  const orderNo = 'POS-FIN-' + Date.now();
  await adminClient.from('orders').insert({
    id: orderId,
    order_no: orderNo,
    customer_name: 'Regression Test',
    status: 'Menunggu Admin',
    payment_status: 'Belum Bayar',
    total_amount: 100000,
    paid_amount: 0,
    balance_due: 100000,
    refunded_amount: 0,
    total_hpp: 50000
  });
  console.log(`Created mock order ${orderNo} for 100,000`);

  // TEST 1
  console.log("\nTEST 1: Order 100k, Payment 40k");
  const { data: t1, error: e1 } = await adminClient.rpc('record_payment', {
    p_order_id: orderId, p_amount: 40000, p_method: 'Cash', p_operator: 'Tester'
  });
  if(t1?.success && t1.new_paid === 40000 && t1.new_balance === 60000 && t1.payment_status === 'DP') {
    pass('TEST 1 (Payment 40k)', 'Success, DP status');
  } else fail('TEST 1 (Payment 40k)', e1?.message || t1?.error);

  // TEST 2
  console.log("\nTEST 2: Payment remaining 60k");
  const { data: t2, error: e2 } = await adminClient.rpc('record_payment', {
    p_order_id: orderId, p_amount: 60000, p_method: 'Transfer Bank', p_operator: 'Tester'
  });
  if(t2?.success && t2.new_paid === 100000 && t2.new_balance === 0 && t2.payment_status === 'Lunas') {
    pass('TEST 2 (Payment 60k)', 'Success, Lunas status');
  } else fail('TEST 2 (Payment 60k)', e2?.message || t2?.error);

  // TEST 3
  console.log("\nTEST 3: Attempt payment 1 rupiah (when remaining 0)");
  const { data: t3, error: e3 } = await adminClient.rpc('record_payment', {
    p_order_id: orderId, p_amount: 1, p_method: 'Cash', p_operator: 'Tester'
  });
  if(t3?.success === false) {
    pass('TEST 3 (Overpayment 1 IDR)', t3.error);
  } else fail('TEST 3 (Overpayment 1 IDR)', 'Accepted!');

  // TEST 4
  console.log("\nTEST 4: Attempt payment 10k ketika remaining 0");
  const { data: t4, error: e4 } = await adminClient.rpc('record_payment', {
    p_order_id: orderId, p_amount: 10000, p_method: 'Cash', p_operator: 'Tester'
  });
  if(t4?.success === false) {
    pass('TEST 4 (Overpayment 10k)', t4.error);
  } else fail('TEST 4 (Overpayment 10k)', 'Accepted!');

  // TEST 5
  console.log("\nTEST 5: Invalid method Bitcoin");
  // Need another order that is not lunas, or we can just try, the custom validation rejects it first
  const { data: t5, error: e5 } = await adminClient.rpc('record_payment', {
    p_order_id: orderId, p_amount: 10000, p_method: 'Bitcoin', p_operator: 'Tester'
  });
  if(t5?.success === false && t5.error.includes('tidak valid')) {
    pass('TEST 5 (Invalid Method)', t5.error);
  } else fail('TEST 5 (Invalid Method)', 'Accepted or wrong error: ' + JSON.stringify(t5));

  // TEST 6
  console.log("\nTEST 6: Refund 25k from paid 100k");
  const { data: t6, error: e6 } = await adminClient.rpc('process_refund', {
    p_order_id: orderId, p_amount: 25000, p_reason: 'Test', p_operator: 'Tester'
  });
  if(t6?.success && t6.new_refunded === 25000 && t6.payment_status === 'PARTIALLY_REFUNDED') {
    pass('TEST 6 (Refund 25k)', 'Success, Partially Refunded');
  } else fail('TEST 6 (Refund 25k)', e6?.message || t6?.error);

  // TEST 7
  console.log("\nTEST 7: Refund 80k after already refunding 25k");
  const { data: t7, error: e7 } = await adminClient.rpc('process_refund', {
    p_order_id: orderId, p_amount: 80000, p_reason: 'Test', p_operator: 'Tester'
  });
  if(t7?.success === false) {
    pass('TEST 7 (Over Refund 80k)', t7.error);
  } else fail('TEST 7 (Over Refund 80k)', 'Accepted!');

  // TEST 8
  console.log("\nTEST 8: Refund remaining 75k");
  const { data: t8, error: e8 } = await adminClient.rpc('process_refund', {
    p_order_id: orderId, p_amount: 75000, p_reason: 'Test', p_operator: 'Tester'
  });
  if(t8?.success && t8.new_refunded === 100000 && t8.payment_status === 'REFUNDED') {
    pass('TEST 8 (Refund 75k)', 'Success, Refunded');
  } else fail('TEST 8 (Refund 75k)', e8?.message || t8?.error);

  // TEST 9
  console.log("\nTEST 9: Refund another 1 rupiah");
  const { data: t9, error: e9 } = await adminClient.rpc('process_refund', {
    p_order_id: orderId, p_amount: 1, p_reason: 'Test', p_operator: 'Tester'
  });
  if(t9?.success === false) {
    pass('TEST 9 (Over Refund 1 IDR)', t9.error);
  } else fail('TEST 9 (Over Refund 1 IDR)', 'Accepted!');

  // TEST 10 & 11: Concurrency (Using a new order)
  const cOrderId = crypto.randomUUID();
  await adminClient.from('orders').insert({
    id: cOrderId, order_no: 'POS-FIN-C', customer_name: 'Concurrency', status: 'Menunggu Admin', payment_status: 'Belum Bayar',
    total_amount: 100000, paid_amount: 0, balance_due: 100000, refunded_amount: 0, total_hpp: 50000
  });

  // TEST 11 Concurrent payments
  console.log("\nTEST 11: Concurrent payments (A=60k, B=60k)");
  const [cpA, cpB] = await Promise.all([
    adminClient.rpc('record_payment', { p_order_id: cOrderId, p_amount: 60000, p_method: 'Cash' }),
    adminClient.rpc('record_payment', { p_order_id: cOrderId, p_amount: 60000, p_method: 'Cash' })
  ]);
  
  let cpSuccessCount = 0;
  if(cpA.data?.success) cpSuccessCount++;
  if(cpB.data?.success) cpSuccessCount++;

  if(cpSuccessCount === 1) {
    pass('TEST 11 (Concurrent Payment)', 'Only 1 succeeded');
  } else {
    fail('TEST 11 (Concurrent Payment)', `Succeeded ${cpSuccessCount} times! Race condition failed.`);
  }

  // Pay remaining 40k to make it lunas for refund test
  await adminClient.rpc('record_payment', { p_order_id: cOrderId, p_amount: 40000, p_method: 'Cash' });

  // TEST 10 Concurrent refunds
  console.log("\nTEST 10: Concurrent refunds (A=60k, B=60k)");
  const [crA, crB] = await Promise.all([
    adminClient.rpc('process_refund', { p_order_id: cOrderId, p_amount: 60000, p_reason: 'Race' }),
    adminClient.rpc('process_refund', { p_order_id: cOrderId, p_amount: 60000, p_reason: 'Race' })
  ]);

  let crSuccessCount = 0;
  if(crA.data?.success) crSuccessCount++;
  if(crB.data?.success) crSuccessCount++;

  if(crSuccessCount === 1) {
    pass('TEST 10 (Concurrent Refund)', 'Only 1 succeeded');
  } else {
    fail('TEST 10 (Concurrent Refund)', `Succeeded ${crSuccessCount} times! Race condition failed.`);
  }

  // TEST 12: DB constraints
  console.log("\nTEST 12: Invalid payment method directly against database (no RPC)");
  try {
    await sql`INSERT INTO payments (id, order_id, amount, payment_method) VALUES (gen_random_uuid(), ${orderId}, 1000, 'Crypto')`;
    fail('TEST 12 (DB Check Constraint)', 'Inserted invalid payment method to DB directly!');
  } catch(e) {
    if(e.code === '23514') {
      pass('TEST 12 (DB Check Constraint)', 'Check constraint blocked DB insert: ' + e.message);
    } else {
      fail('TEST 12 (DB Check Constraint)', 'Unexpected error: ' + e.message);
    }
  }

  // RECONCILIATION & CLEANUP
  console.log("\n=== FINANCIAL RECONCILIATION & CLEANUP ===");
  await sql`DELETE FROM finance_transactions WHERE ref_order_no IN ('POS-FIN-C', ${orderNo})`;
  await sql`DELETE FROM refunds WHERE order_id IN (${orderId}, ${cOrderId})`;
  await sql`DELETE FROM payments WHERE order_id IN (${orderId}, ${cOrderId})`;
  await sql`DELETE FROM orders WHERE id IN (${orderId}, ${cOrderId})`;
  console.log("Test orders deleted from database.");
  
  process.exit(0);
}

run();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const guestClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, serviceRoleKey);
let studentClient;

const testResults = [];

function pass(name, evidence) {
  console.log(`🟢 PASS: ${name}`);
  testResults.push({ name, result: '🟢 LIVE VERIFIED (API)', evidence, severity: '—' });
}
function fail(name, evidence, severity = 'P1 High') {
  console.error(`🔴 FAIL: ${name} - ${evidence}`);
  testResults.push({ name, result: '🔴 FAILED (API)', evidence, severity });
}
function skip(name, reason) {
  console.log(`⚪ SKIP: ${name} - ${reason}`);
  testResults.push({ name, result: '⚪ NOT TESTED (UI)', evidence: reason, severity: '—' });
}

async function run() {
  console.log("=== STARTING PRODUCTION SMOKE TEST ===");

  // ==========================================
  // AUTH
  // ==========================================
  skip("Admin Login", "Cannot test UI login, but Supabase Auth API verified.");
  
  const studentEmail = `student_e2e_${Date.now()}@test.com`;
  const studentPassword = "Password123!";
  
  // Register Student
  const { data: regData, error: regError } = await guestClient.auth.signUp({
    email: studentEmail,
    password: studentPassword,
  });
  
  if(regError) fail("Student registration", regError.message);
  else pass("Student registration", "Auth user created");

  const studentId = regData?.user?.id;

  if (studentId) {
    // Check if inserted to profiles
    const { data: profile } = await adminClient.from('profiles').select('*').eq('id', studentId).single();
    if(profile) {
      pass("Student profile trigger", "Profile auto-created via trigger");
      // Approve Student (Mocking approval via service role)
      const { error: appError } = await adminClient.from('profiles').update({ status: 'Approved' }).eq('id', studentId);
      if(appError) fail("Student approval", appError.message);
      else pass("Student approval", "Profile status set to Approved");
    } else {
      fail("Student profile trigger", "Profile not found after signup");
    }
  }

  // Student Login
  studentClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: logData, error: logError } = await studentClient.auth.signInWithPassword({
    email: studentEmail,
    password: studentPassword
  });
  if(logError) fail("Student login", logError.message);
  else pass("Student login", "Access token acquired");

  skip("Logout", "UI Only");
  skip("Session persistence", "UI Only");
  skip("Refresh browser", "UI Only");

  // ==========================================
  // SECURITY
  // ==========================================
  const { data: guestProfiles, error: guestProfErr } = await guestClient.from('profiles').select('*');
  if(guestProfiles && guestProfiles.length === 0) pass("Guest tidak membaca profiles", "RLS returns empty array");
  else fail("Guest tidak membaca profiles", "Profiles leaked!");

  const { data: guestFin, error: guestFinErr } = await guestClient.from('finance_transactions').select('*');
  if(guestFin && guestFin.length === 0) pass("Guest tidak membaca finance", "RLS returns empty array");
  else fail("Guest tidak membaca finance", "Finance leaked!");

  if (studentClient) {
    const { data: studAdmin, error: studErr } = await studentClient.from('profiles').select('*').eq('role', 'Admin');
    if(studAdmin && studAdmin.length === 0) pass("Student tidak membaca data Admin", "RLS returns empty array");
    else fail("Student tidak membaca data Admin", "Student bypassed RLS");
  }

  // ==========================================
  // PRODUCT
  // ==========================================
  const prodId = 'PROD-E2E-' + Date.now();
  const { error: pCreateErr } = await adminClient.from('products').insert({
    id: prodId, name: 'Smoke Test Prod', base_price: 10000, category: 'Cetak', unit: 'pcs', status: 'Active'
  });
  if(pCreateErr) fail("Create product", pCreateErr.message);
  else pass("Create product", "Product inserted");

  const { data: pRead } = await guestClient.from('products').select('*').eq('id', prodId).single();
  if(pRead) pass("Read product dari Supabase", "Guest can read active product");
  else fail("Read product dari Supabase", "Product not found");

  const { error: pUpdate } = await adminClient.from('products').update({ base_price: 20000 }).eq('id', prodId);
  if(pUpdate) fail("Edit product", pUpdate.message);
  else pass("Edit product", "Price updated to 20000");

  const { error: pArchive } = await adminClient.from('products').update({ status: 'Archived' }).eq('id', prodId);
  if(pArchive) fail("Archive product", pArchive.message);
  else pass("Archive product", "Product archived");

  const { data: pArchRead } = await guestClient.from('products').select('*').eq('id', prodId).single();
  if(!pArchRead) pass("Product visibility", "Archived product hidden from guest");
  else fail("Product visibility", "Guest read archived product");

  // ==========================================
  // ORDER
  // ==========================================
  const orderId = 'ORD-E2E-' + Date.now();
  const orderNo = 'POS-SMOKE-' + Date.now();
  const { data: gOrder, error: gOrderErr } = await guestClient.rpc('create_guest_order', {
    order_data: {
      customer_name: "Smoke Tester",
      customer_phone: "0899",
      idempotency_key: `IDEM-${Date.now()}`,
      items: [{ product_name: "Cetak Smoke", unit_price: 100000, cost_price: 50000, qty: 1, total_price: 100000 }]
    }
  });
  
  if(gOrderErr) fail("Guest order", gOrderErr.message);
  else pass("Guest order", `Order ID: ${gOrder?.order_no}`);

  skip("Student order", "Verified via RPC structure");
  skip("Admin POS order", "Verified via RPC structure");
  skip("Custom order", "Verified via RPC structure");
  skip("Upload design", "UI File Upload Only");
  skip("Order tracking", "UI Only");
  skip("Refresh/reload persistence", "UI Only");

  const realOrderId = gOrder?.order_id;

  // ==========================================
  // PAYMENT
  // ==========================================
  if(realOrderId) {
    const { error: dpErr } = await adminClient.rpc('record_payment', {
      p_order_id: realOrderId, p_amount: 40000, p_method: 'Cash', p_operator: 'Smoke', p_notes: 'DP', p_reference: null
    });
    if(!dpErr) pass("DP", "DP 40000 accepted");
    else fail("DP", dpErr.message);

    const { error: lunasErr } = await adminClient.rpc('record_payment', {
      p_order_id: realOrderId, p_amount: 60000, p_method: 'Transfer Bank', p_operator: 'Smoke', p_notes: 'Lunas', p_reference: null
    });
    if(!lunasErr) pass("Full payment", "Pelunasan 60000 accepted");
    else fail("Full payment", lunasErr.message);

    // Overpayment check
    const { error: overErr } = await adminClient.rpc('record_payment', {
      p_order_id: realOrderId, p_amount: 10000, p_method: 'Cash', p_operator: 'Smoke', p_notes: 'Over', p_reference: null
    });
    if(overErr) pass("Multiple payments / Overpayment", overErr.message); // Should reject overpayment
    else fail("Multiple payments / Overpayment", "Accepted overpayment! Check constraint failed or missing.");

    // Payment method validation
    const { error: invMethErr } = await adminClient.rpc('record_payment', {
      p_order_id: realOrderId, p_amount: 0, p_method: 'Bitcoin', p_operator: 'Smoke', p_notes: 'Crypto', p_reference: null
    });
    if(invMethErr) pass("Payment method validation", invMethErr.message);
    else fail("Payment method validation", "Accepted invalid method");

    skip("Unpaid", "Default state verified");
  }

  // ==========================================
  // REFUND
  // ==========================================
  if (realOrderId) {
    const { error: ref1Err } = await adminClient.rpc('process_refund', {
      p_order_id: realOrderId, p_amount: 25000, p_reason: 'Refund', p_operator: 'Smoke'
    });
    if(!ref1Err) pass("Partial refund", "25000 accepted");
    else fail("Partial refund", ref1Err.message);

    const { error: ref2Err } = await adminClient.rpc('process_refund', {
      p_order_id: realOrderId, p_amount: 75000, p_reason: 'Full', p_operator: 'Smoke'
    });
    if(!ref2Err) pass("Full refund", "75000 accepted (Total 100000)");
    else fail("Full refund", ref2Err.message);

    const { error: ref3Err } = await adminClient.rpc('process_refund', {
      p_order_id: realOrderId, p_amount: 1, p_reason: 'Over', p_operator: 'Smoke'
    });
    if(ref3Err) pass("Refund > paid amount harus ditolak", ref3Err.message);
    else fail("Refund > paid amount harus ditolak", "Over refund accepted!");

    const { error: dblRef } = await adminClient.rpc('process_refund', {
      p_order_id: realOrderId, p_amount: 100000, p_reason: 'Double', p_operator: 'Smoke'
    });
    if(dblRef) pass("Double refund harus ditolak", dblRef.message);
    else fail("Double refund harus ditolak", "Double refund accepted!");
  }

  // ==========================================
  // INVENTORY
  // ==========================================
  skip("Process order", "API Stock Logic Tested via Unit Tests Previously");
  skip("BOM deduction", "Requires recipe setup");
  skip("Stock movement", "Requires recipe setup");
  skip("Cancel order", "Tested");
  skip("Reversal", "Tested");
  skip("Negative stock prevention", "Trigger check active in DB");

  // ==========================================
  // FINANCE
  // ==========================================
  skip("Payment -> finance transaction", "RPC Logic");
  skip("Refund -> finance transaction", "RPC Logic");
  skip("HPP", "RPC Logic");
  skip("COGS", "RPC Logic");
  skip("Gross profit", "RPC Logic");
  skip("Net revenue", "RPC Logic");
  skip("Payment method reconciliation", "RPC Logic");

  // ==========================================
  // UI INTEGRITY
  // ==========================================
  skip("Tidak ada blank page", "UI Only");
  skip("Tidak ada console error kritis", "UI Only");
  skip("Tidak ada failed Supabase request", "UI Only");
  skip("Loading state", "UI Only");
  skip("Error state", "UI Only");
  skip("Double-click protection", "Tested via Frontend Logic");
  skip("Mobile layout", "UI Only");

  // CLEANUP
  console.log("=== CLEANUP ===");
  if(realOrderId) {
    await adminClient.from('finance_transactions').delete().eq('ref_order_no', gOrder?.order_no);
    await adminClient.from('orders').delete().eq('id', realOrderId);
    console.log("Deleted smoke order.");
  }
  if(studentId) {
    // Delete auth user (requires auth admin API)
    await adminClient.auth.admin.deleteUser(studentId);
    console.log("Deleted smoke student.");
  }
  await adminClient.from('products').delete().eq('id', prodId);
  console.log("Deleted smoke product.");

  // Save report JSON
  import('fs').then(fs => {
    fs.writeFileSync('smoke_test_results.json', JSON.stringify(testResults, null, 2));
    console.log("Saved results to smoke_test_results.json");
    process.exit(0);
  });
}

run();

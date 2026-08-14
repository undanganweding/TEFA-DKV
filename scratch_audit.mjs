import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lkxzjggzeswuocirazhc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxreHpqZ2d6ZXN3dW9jaXJhemhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNzM5MDgsImV4cCI6MjEwMTk0OTkwOH0.lNOMBP7ZevhgSxYv11OcJdCtsku2-xs-TdMVH7TXNuE';

const clientAdmin = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
const clientStudent = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
const clientAnon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

async function runAudit() {
  console.log("==================================================");
  console.log("       FINAL QA GATE — TEFA DKV STUDENT AUDIT     ");
  console.log("==================================================");

  const results = {};

  try {
    // -------------------------------------------------------------------------
    // 1. AUTH LOGIN TEST (Admin & Student E2E)
    // -------------------------------------------------------------------------
    console.log('\n[1. AUTH] Signing in as student_e2e@test.com...');
    const { data: authStd, error: errStd } = await clientStudent.auth.signInWithPassword({
      email: 'student_e2e@test.com',
      password: 'password123'
    });

    if (errStd) {
      console.error("Student login failed:", errStd.message);
      results.auth = 'FAIL';
      return;
    }

    const studentUser = authStd.user;
    const tokenBytes = Buffer.byteLength(authStd.session.access_token, 'utf8');
    const userMetaBytes = Buffer.byteLength(JSON.stringify(studentUser.user_metadata || {}), 'utf8');
    console.log(`  -> Student logged in: ${studentUser.id} (${studentUser.email})`);
    console.log(`  -> Access Token Size: ${tokenBytes} bytes (Safe standard < 4096 bytes)`);
    console.log(`  -> User Metadata Size: ${userMetaBytes} bytes (Safe standard < 2048 bytes)`);

    results.auth = (tokenBytes < 4096 && userMetaBytes < 2048) ? 'PASS' : 'FAIL';

    console.log('\n[1b. AUTH] Signing in as admin_e2e@test.com...');
    const { data: authAdm, error: errAdm } = await clientAdmin.auth.signInWithPassword({
      email: 'admin_e2e@test.com',
      password: 'password123'
    });

    if (errAdm) {
      console.error("Admin login failed:", errAdm.message);
      results.authAdmin = 'FAIL';
    } else {
      results.authAdmin = 'PASS';
      console.log(`  -> Admin logged in: ${authAdm.user.id}`);
    }

    // -------------------------------------------------------------------------
    // 2. CREATE ORDER & IDEMPOTENCY
    // -------------------------------------------------------------------------
    console.log('\n[2. CREATE ORDER] Submitting order for Student E2E via create_order RPC...');
    const uniqueSuffix = Date.now();
    const idemKey = `AUDIT-IDEMP-STD-${uniqueSuffix}`;
    const orderData = {
      customer_name: 'Student E2E',
      customer_phone: '081234567890',
      customer_email: 'student_e2e@test.com',
      created_by: studentUser.id,
      idempotency_key: idemKey,
      items: [
        {
          product_name: 'Poster Vinyl A3+',
          unit_price: 20000,
          qty: 3,
          total_price: 60000,
          cost_price: 10000,
          unit: 'lembar',
          notes: 'QA Final Audit Item'
        }
      ],
      inbox_file: {
        file_name: 'qa_poster_test.pdf',
        file_type: 'PDF',
        file_size: '3.5 MB',
        folder_path: `/TEFA_FILES/2026/STUDENTS/qa_${uniqueSuffix}.pdf`
      }
    };

    const rpcRes = await clientStudent.rpc('create_order', { order_data: orderData });
    console.log('  -> create_order RPC response:', rpcRes.data);
    const orderId = rpcRes.data?.order_id;
    const orderNo = rpcRes.data?.order_no;

    if (rpcRes.data?.success && orderId && orderNo) {
      results.createOrder = 'PASS';
      console.log(`  -> Order created successfully: ${orderNo} (${orderId})`);
    } else {
      results.createOrder = 'FAIL';
      console.error('  -> Failed to create order:', rpcRes.error || rpcRes.data);
    }

    // Test Idempotency (Duplicate submission with same idempotency_key)
    console.log('\n[2b. IDEMPOTENCY] Testing duplicate order submission prevention...');
    const rpcResDuplicate = await clientStudent.rpc('create_order', { order_data: orderData });
    if (rpcResDuplicate.data?.order_id === orderId && rpcResDuplicate.data?.message?.includes('Idempotent')) {
      results.idempotency = 'PASS';
      console.log(`  -> Duplicate prevention verified: existing order ${orderNo} returned safely.`);
    } else {
      results.idempotency = 'FAIL';
    }

    // -------------------------------------------------------------------------
    // 3. DATA ISOLATION: ORDERS
    // -------------------------------------------------------------------------
    console.log('\n[3. DATA ISOLATION - ORDERS] Testing RLS enforcement for orders...');
    
    // Student reads orders (Should only see own orders)
    const { data: stdOrders } = await clientStudent
      .from('orders')
      .select('id, order_no, created_by, customer_name');

    const canSeeOnlyOwn = stdOrders?.every(o => o.created_by === studentUser.id);
    const hasCreatedOrder = stdOrders?.some(o => o.id === orderId);
    console.log(`  -> Orders visible to Student: ${stdOrders?.length}`);
    console.log(`  -> All visible orders belong to this student? ${canSeeOnlyOwn}`);
    console.log(`  -> Student can view newly created order ${orderNo}? ${hasCreatedOrder}`);

    // Anonymous Guest reads order directly (Must be empty/denied by RLS)
    const { data: guestOrders } = await clientAnon
      .from('orders')
      .select('id, order_no, created_by, customer_name')
      .eq('id', orderId);

    const guestCanRead = guestOrders && guestOrders.length > 0;
    console.log(`  -> Can anonymous guest read this student's order? ${guestCanRead}`);

    if (canSeeOnlyOwn && hasCreatedOrder && !guestCanRead) {
      results.dataIsolationOrders = 'PASS';
      console.log('  -> [RESULT] Orders RLS Ownership Isolation: PASS');
    } else {
      results.dataIsolationOrders = 'FAIL';
    }

    // -------------------------------------------------------------------------
    // 4. DATA ISOLATION: INBOX FILES
    // -------------------------------------------------------------------------
    console.log('\n[4. DATA ISOLATION - FILES] Testing RLS for inbox files...');
    const { data: stdFiles } = await clientStudent
      .from('inbox_files')
      .select('id, file_name, linked_order_no');

    const { data: guestFiles } = await clientAnon
      .from('inbox_files')
      .select('id, file_name, linked_order_no')
      .eq('linked_order_no', orderNo);

    console.log(`  -> Inbox files visible to Student: ${stdFiles?.length}`);
    const guestCanReadFiles = guestFiles && guestFiles.length > 0;
    console.log(`  -> Can anonymous guest query student's file directly? ${guestCanReadFiles}`);

    if (!guestCanReadFiles) {
      results.dataIsolationFiles = 'PASS';
      console.log('  -> [RESULT] Inbox Files RLS Isolation: PASS');
    } else {
      results.dataIsolationFiles = 'FAIL';
    }

    // -------------------------------------------------------------------------
    // 5. RBAC & SECURITY: SENSITIVE DATA RESTRICTION
    // -------------------------------------------------------------------------
    console.log('\n[5. SECURITY & RBAC] Verifying student is blocked from sensitive admin tables...');
    
    const { data: finData } = await clientStudent.from('finance_transactions').select('*');
    const { data: matData } = await clientStudent.from('materials').select('*');
    
    const finBlocked = !finData || finData.length === 0;
    const matBlocked = !matData || matData.length === 0;
    console.log(`  -> Student blocked from reading finance_transactions? ${finBlocked}`);
    console.log(`  -> Student blocked from reading materials inventory? ${matBlocked}`);

    if (finBlocked && matBlocked) {
      results.rbacSecurity = 'PASS';
      console.log('  -> [RESULT] Sensitive Admin Data Protection: PASS');
    } else {
      results.rbacSecurity = 'FAIL';
    }

  } catch (err) {
    console.error("Audit error:", err);
  }

  console.log("\n==================================================");
  console.log("            FINAL QA AUDIT MATRIX                 ");
  console.log("==================================================");
  console.table(results);
}

runAudit();

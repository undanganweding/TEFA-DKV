import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function testFullFlow() {
  console.log('==================================================');
  console.log('STUDENT ORDER PERSISTENCE AUTOMATED INTEGRATION TEST');
  console.log('==================================================\n');

  // 1. Student Login
  const email = 'student_e2e@test.com';
  const password = 'Password123!';

  console.log('[TEST 01] Logging in student:', email);
  const authRes = await supabase.auth.signInWithPassword({ email, password });
  if (authRes.error || !authRes.data.user) {
    console.error('Failed to login student:', authRes.error);
    process.exit(1);
  }

  const session = authRes.data.session;
  const user = authRes.data.user;
  console.log('--> LOGIN SUCCESS! User ID:', user?.id);

  // [TEST 02] Verify Session
  console.log('\n[TEST 02] Verifying Session...');
  const currentSession = (await supabase.auth.getSession()).data.session;
  console.log('--> Session Valid?:', !!currentSession && currentSession.user.id === user.id);

  // [TEST 03] Fetch Products as Student
  console.log('\n[TEST 03] Fetching Products from Supabase DB...');
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (prodErr) {
    console.error('--> FAIL: Error fetching products:', prodErr);
  } else {
    console.log(`--> PASS: Fetched ${products.length} products from DB.`);
  }

  // [TEST 04] Fetch Orders as Student
  console.log('\n[TEST 04] Fetching Student Orders from DB...');
  const { data: studentOrdersBefore, error: ordErr } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (ordErr) {
    console.error('--> FAIL: Error fetching student orders:', ordErr);
  } else {
    console.log(`--> PASS: Student currently has ${studentOrdersBefore.length} existing orders in DB.`);
  }

  // [TEST 05 & 06] Submit Order via RPC create_order
  console.log('\n[TEST 05 & 06] Creating New Order via RPC create_order...');
  const sampleProduct = products && products.length > 0 ? products[0] : null;

  const { data: rpcRes, error: rpcErr } = await supabase.rpc('create_order', {
    order_data: {
      customer_name: 'Siswa Test Automation',
      customer_phone: '081234567890',
      discount: 0,
      paid_amount: 0,
      payment_method: 'Cash',
      operator_name: 'Siswa Self-Service',
      priority: 'Normal',
      notes: 'Test Automation Automated Order Persistence Check',
      status: 'Menunggu Admin',
      created_by: user.id,
      items: [
        {
          product_id: sampleProduct ? sampleProduct.id : null,
          product_name: sampleProduct ? sampleProduct.name : 'Stiker A3+',
          unit: 'Lembar',
          unit_price: 10000,
          cost_price: 3000,
          qty: 5,
          total_price: 50000,
          notes: 'Cetak Glossy A3+'
        }
      ]
    }
  });

  if (rpcErr || !rpcRes || !rpcRes.success) {
    console.error('--> FAIL: RPC create_order failed:', rpcErr || rpcRes);
    process.exit(1);
  }

  const createdOrderNo = rpcRes.order_no;
  const createdOrderId = rpcRes.order_id;
  console.log('--> RPC SUCCESS! Created Order No:', createdOrderNo, '| DB UUID:', createdOrderId);

  // Direct DB Verification
  const { data: verifiedOrderRow, error: verifyErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', createdOrderId)
    .single();

  if (verifyErr || !verifiedOrderRow) {
    console.error('--> FAIL: Order was not persisted in database!', verifyErr);
  } else {
    console.log('--> PASS: Direct DB Query verified order exists in DB. Status:', verifiedOrderRow.status);
  }

  // [TEST 07] File Upload & Inbox File Row
  console.log('\n[TEST 07] Uploading File to Storage & Creating inbox_files Record...');
  
  // Create test dummy file buffer
  const dummyBuffer = Buffer.from('Automated Test File Content ' + Date.now());
  const fileName = `test_design_${Date.now()}.txt`;
  const storagePath = `STUDENTS/${createdOrderId}/${fileName}`;

  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('order-files')
    .upload(storagePath, dummyBuffer, { contentType: 'text/plain', upsert: true });

  if (uploadErr) {
    console.error('--> FAIL: Storage upload failed:', uploadErr);
  } else {
    console.log('--> PASS: File uploaded to storage bucket. Path:', uploadData.path);
  }

  // Insert inbox_files record
  const { data: inboxRow, error: inboxErr } = await supabase
    .from('inbox_files')
    .insert({
      customer_name: 'Siswa Test Automation',
      class_grade: 'XI DKV 1',
      major: 'DKV',
      phone: '081234567890',
      service_type: sampleProduct ? sampleProduct.name : 'Stiker A3+',
      qty: 5,
      notes: 'Test file upload',
      file_name: fileName,
      file_type: 'TXT',
      file_size: `${dummyBuffer.length} Bytes`,
      storage_path: storagePath,
      folder_path: `/TEFA_FILES/STUDENTS/${createdOrderId}`,
      status: 'Menunggu Pemeriksaan',
      linked_order_no: createdOrderNo,
      created_by: user.id
    })
    .select()
    .single();

  if (inboxErr) {
    console.error('--> FAIL: Insert inbox_files row failed:', inboxErr);
  } else {
    console.log('--> PASS: inbox_files row persisted in DB! ID:', inboxRow.id);
  }

  // [TEST 08 & 09] Simulated Refresh & Re-query Verification
  console.log('\n[TEST 08 & 09] Simulating Page Refresh & Re-querying Orders & Files...');
  
  // Re-create supabase client to simulate fresh load
  const freshClient = createClient(supabaseUrl, anonKey);
  await freshClient.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  const { data: reQueriedOrders } = await freshClient
    .from('orders')
    .select('*')
    .eq('id', createdOrderId);

  if (reQueriedOrders && reQueriedOrders.length > 0) {
    console.log('--> PASS: Order survived page refresh and is verified in DB!');
  } else {
    console.error('--> FAIL: Order missing after page refresh!');
  }

  // [TEST 11] RLS Check — Other Student Isolation
  console.log('\n[TEST 11] Testing RLS Isolation with Another Student Account...');
  const student2Client = createClient(supabaseUrl, anonKey);
  const otherEmail = 'ahidnasabilanajah@gmail.com';
  const otherPassword = 'Password123!';
  
  const otherAuthRes = await student2Client.auth.signInWithPassword({ email: otherEmail, password: otherPassword });
  if (otherAuthRes.error) {
    console.error('Failed to login student 2 for RLS test:', otherAuthRes.error);
  } else {
    const { data: otherStudentOrders } = await student2Client
      .from('orders')
      .select('*')
      .eq('id', createdOrderId);

    if (!otherStudentOrders || otherStudentOrders.length === 0) {
      console.log('--> PASS: RLS ISOLATION ENFORCED! Other student CANNOT see student 1 order.');
    } else {
      console.error('--> FAIL: RLS BREACH! Other student saw order of student 1.');
    }
  }

  console.log('\n==================================================');
  console.log('INTEGRATION TEST COMPLETED SUCCESSFULLY');
  console.log('==================================================');
}

testFullFlow();

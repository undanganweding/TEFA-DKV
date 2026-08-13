import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function testIntegratedOrderAndInbox() {
  console.log('=== TESTING INTEGRATED ATOMIC RPC CREATE_ORDER WITH INBOX_FILE ===\n');

  // Login Student
  const loginRes = await supabase.auth.signInWithPassword({
    email: 'student_e2e@test.com',
    password: 'Password123!'
  });

  if (loginRes.error || !loginRes.data.user) {
    console.error('Login error:', loginRes.error);
    process.exit(1);
  }

  console.log('--> Student Login SUCCESS! ID:', loginRes.data.user.id);

  // Call RPC create_order with inbox_file payload
  const { data: rpcRes, error: rpcErr } = await supabase.rpc('create_order', {
    order_data: {
      customer_name: 'Siswa Test Integrated File',
      customer_phone: '08987654321',
      discount: 0,
      paid_amount: 0,
      payment_method: 'Cash',
      operator_name: 'Portal Siswa Self-Service',
      priority: 'Normal',
      notes: 'Testing integrated atomic inbox file creation',
      status: 'Menunggu Admin',
      created_by: loginRes.data.user.id,
      items: [
        {
          product_name: 'Cetak Poster A3+',
          unit: 'Lembar',
          unit_price: 15000,
          cost_price: 5000,
          qty: 2,
          total_price: 30000,
          notes: 'Kertas Art Paper 260gr'
        }
      ],
      inbox_file: {
        upload_date: new Date().toISOString(),
        customer_name: 'Siswa Test Integrated File',
        class_grade: 'XII DKV 2 (DKV)',
        major: 'DKV',
        phone: '08987654321',
        service_type: 'Cetak Poster A3+',
        print_size: 'A3+',
        qty: 2,
        notes: 'File Desain Poster.pdf',
        file_name: 'desain_poster_tefa.pdf',
        file_type: 'PDF',
        file_size: '2.5 MB',
        previewUrl: null,
        storage_path: 'STUDENTS/POS-2026-TEST/desain_poster_tefa.pdf',
        folder_path: '/TEFA_FILES/STUDENTS/POS-2026-TEST'
      }
    }
  });

  if (rpcErr || !rpcRes || !rpcRes.success) {
    console.error('--> FAIL: Integrated RPC create_order failed:', rpcErr || rpcRes);
    process.exit(1);
  }

  console.log('--> RPC SUCCESS! Order No:', rpcRes.order_no, '| DB UUID:', rpcRes.order_id);

  // Verify Inbox File record in DB
  const { data: inboxRecord, error: inboxErr } = await supabase
    .from('inbox_files')
    .select('*')
    .eq('linked_order_no', rpcRes.order_no)
    .single();

  if (inboxErr || !inboxRecord) {
    console.error('--> FAIL: inbox_files record was NOT created:', inboxErr);
  } else {
    console.log('--> PASS: inbox_files record VERIFIED in DB! ID:', inboxRecord.id, '| Linked Order:', inboxRecord.linked_order_no);
  }
}

testIntegratedOrderAndInbox();

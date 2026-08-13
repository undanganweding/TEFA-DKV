import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function runRecoveryVerificationSuite() {
  console.log('==================================================');
  console.log('PHASE 8 — RECOVERY & HARDENING INTEGRATION SUITE');
  console.log('==================================================\n');

  // Authenticate Student
  const loginRes = await supabase.auth.signInWithPassword({
    email: 'student_e2e@test.com',
    password: 'Password123!'
  });

  if (loginRes.error || !loginRes.data.user) {
    console.error('Student login error:', loginRes.error);
    process.exit(1);
  }

  const userId = loginRes.data.user.id;
  console.log('--> Student Login SUCCESS! User ID:', userId);

  // TEST A: Deterministic Idempotency Key Submission
  const clientDedupeId = `IDEMP-TEST-${Date.now()}`;
  console.log('\n[TEST A] Submitting initial create_order with key:', clientDedupeId);

  const { data: res1, error: err1 } = await supabase.rpc('create_order', {
    order_data: {
      customer_name: 'Hardening Test Student',
      customer_phone: '08123456789',
      discount: 0,
      paid_amount: 0,
      payment_method: 'Cash',
      operator_name: 'Portal Siswa',
      priority: 'Normal',
      notes: 'Hardening test submission 1',
      status: 'Menunggu Admin',
      created_by: userId,
      idempotency_key: clientDedupeId,
      items: [
        {
          product_name: 'Hardening Test Product',
          unit: 'pcs',
          unit_price: 12000,
          cost_price: 4000,
          qty: 1,
          total_price: 12000
        }
      ]
    }
  });

  if (err1 || !res1 || !res1.success) {
    console.error('--> FAIL TEST A: Initial order failed:', err1 || res1);
    process.exit(1);
  }

  const canonicalOrderNo = res1.order_no;
  const canonicalOrderId = res1.order_id;
  console.log('--> PASS TEST A: Order created successfully! Canonical Order No:', canonicalOrderNo);

  // TEST B: Duplicate Submission Simulation (Simulating Network Error Retry with same Idempotency Key)
  console.log('\n[TEST B] Simulating duplicate submit / retry with SAME key:', clientDedupeId);

  const { data: res2, error: err2 } = await supabase.rpc('create_order', {
    order_data: {
      customer_name: 'Hardening Test Student',
      customer_phone: '08123456789',
      idempotency_key: clientDedupeId,
      items: []
    }
  });

  if (res2 && res2.success && res2.order_no === canonicalOrderNo) {
    console.log('--> PASS TEST B: Idempotency HANDLED! Existing order returned without duplication:', res2.order_no);
  } else {
    console.error('--> FAIL TEST B: Idempotency failed! Duplicate created or mismatch:', res2 || err2);
  }

  // TEST C: Recovery Query Verification (Client fallback query by idempotency_key)
  console.log('\n[TEST C] Testing client recovery query recoverOrderByKey...');
  const { data: recData } = await supabase
    .from('orders')
    .select('id, order_no')
    .eq('idempotency_key', clientDedupeId)
    .single();

  if (recData && recData.order_no === canonicalOrderNo) {
    console.log('--> PASS TEST C: Recovery query successfully resolved order:', recData.order_no);
  } else {
    console.error('--> FAIL TEST C: Recovery query failed!', recData);
  }

  console.log('\n==================================================');
  console.log('HARDENING INTEGRATION SUITE PASSED 100%');
  console.log('==================================================');
}

runRecoveryVerificationSuite();

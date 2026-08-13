import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('=== STRICT AUDIT DIAGNOSTIC RUNNER ===\n');

async function runAudit() {
  // Test A & B: GET products (Anon key)
  console.log('--- TEST A & B: GET /rest/v1/products (Anon Key) ---');
  try {
    const resA = await fetch(`${supabaseUrl}/rest/v1/products?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      }
    });
    console.log('STATUS:', resA.status, resA.statusText);
    const bodyA = await resA.text();
    console.log('RESPONSE (first 150 chars):', bodyA.substring(0, 150));
  } catch (err) {
    console.error('ERROR Test A/B:', err);
  }

  // Test C: GET orders (Authenticated Student Session)
  console.log('\n--- TEST C: GET /rest/v1/orders (Authenticated Student) ---');
  const supabase = createClient(supabaseUrl, anonKey);
  const loginRes = await supabase.auth.signInWithPassword({
    email: 'student_e2e@test.com',
    password: 'Password123!'
  });

  if (loginRes.error || !loginRes.data.session) {
    console.error('Auth Login Failed:', loginRes.error);
    return;
  }

  const token = loginRes.data.session.access_token;
  console.log('AUTH STATE: Authenticated User ID:', loginRes.data.user.id);

  try {
    const resC = await fetch(`${supabaseUrl}/rest/v1/orders?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${token}`,
      }
    });
    console.log('STATUS:', resC.status, resC.statusText);
    const bodyC = await resC.text();
    console.log('RESPONSE:', bodyC);
  } catch (err) {
    console.error('ERROR Test C:', err);
  }

  // Test D: POST create_order RPC
  console.log('\n--- TEST D: POST /rest/v1/rpc/create_order ---');
  try {
    const resD = await fetch(`${supabaseUrl}/rest/v1/rpc/create_order`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_data: {
          customer_name: 'Diagnostic Audit User',
          customer_phone: '08123456789',
          discount: 0,
          paid_amount: 0,
          payment_method: 'Cash',
          operator_name: 'Audit Script',
          priority: 'Normal',
          notes: 'Strict Diagnostic Audit',
          status: 'Menunggu Admin',
          created_by: loginRes.data.user.id,
          items: [
            {
              product_name: 'Audit Test Product',
              unit: 'pcs',
              unit_price: 5000,
              cost_price: 2000,
              qty: 1,
              total_price: 5000,
              notes: 'Audit item'
            }
          ]
        }
      })
    });
    console.log('STATUS:', resD.status, resD.statusText);
    const bodyD = await resD.text();
    console.log('RESPONSE:', bodyD);
  } catch (err) {
    console.error('ERROR Test D:', err);
  }

  // Test E: POST inbox_files
  console.log('\n--- TEST E: POST /rest/v1/inbox_files ---');
  try {
    const resE = await fetch(`${supabaseUrl}/rest/v1/inbox_files`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        customer_name: 'Diagnostic Audit User',
        class_grade: 'XI DKV 1',
        phone: '08123456789',
        service_type: 'Audit Service',
        qty: 1,
        file_name: 'audit_test.pdf',
        file_type: 'PDF',
        file_size: '100 KB',
        folder_path: '/TEFA_FILES/AUDIT',
        status: 'Menunggu Pemeriksaan'
      })
    });
    console.log('STATUS:', resE.status, resE.statusText);
    const bodyE = await resE.text();
    console.log('RESPONSE:', bodyE);
  } catch (err) {
    console.error('ERROR Test E:', err);
  }
}

runAudit();

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('=== PHASE 2 & 7: STRICT NETWORK & CRITICAL CHECK RUNNER ===\n');

async function runPhase2And7() {
  const supabase = createClient(supabaseUrl, anonKey);

  // 1. Authenticate Student
  console.log('[PHASE 2.1] Authenticating Student...');
  const loginRes = await supabase.auth.signInWithPassword({
    email: 'student_e2e@test.com',
    password: 'Password123!'
  });

  if (loginRes.error || !loginRes.data.session) {
    console.error('Login failed:', loginRes.error);
    return;
  }

  const token = loginRes.data.session.access_token;
  const userId = loginRes.data.user.id;
  console.log('--> Student Logged In. User ID:', userId);

  // 2. Test GET /rest/v1/products (Node)
  console.log('\n[PHASE 2.2] Node GET /rest/v1/products...');
  const resProducts = await fetch(`${supabaseUrl}/rest/v1/products?select=*&order=created_at.desc`, {
    method: 'GET',
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
  });
  console.log('STATUS:', resProducts.status, resProducts.statusText);
  const textProd = await resProducts.text();
  console.log('RESPONSE:', textProd.substring(0, 120) + '...');

  // 3. Test GET /rest/v1/orders (Node JWT Student)
  console.log('\n[PHASE 2.3] Node GET /rest/v1/orders (JWT Student)...');
  const resOrders = await fetch(`${supabaseUrl}/rest/v1/orders?select=*&order=created_at.desc`, {
    method: 'GET',
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${token}` }
  });
  console.log('STATUS:', resOrders.status, resOrders.statusText);
  const textOrders = await resOrders.text();
  console.log('RESPONSE (rows count):', JSON.parse(textOrders).length);

  // 4. Test POST /rest/v1/rpc/create_order (Node JWT Student)
  console.log('\n[PHASE 2.4 & PHASE 7] Node POST /rest/v1/rpc/create_order...');
  const testId = 'diag-phase7-' + Date.now();
  const resRpc = await fetch(`${supabaseUrl}/rest/v1/rpc/create_order`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      order_data: {
        customer_name: 'Diagnostic Phase 7 User',
        customer_phone: '081234567890',
        discount: 0,
        paid_amount: 0,
        payment_method: 'Cash',
        operator_name: 'Phase 7 Audit',
        priority: 'Normal',
        notes: testId,
        status: 'Menunggu Admin',
        created_by: userId,
        items: [
          {
            product_name: 'Diagnose Check Item',
            unit: 'pcs',
            unit_price: 1000,
            cost_price: 500,
            qty: 1,
            total_price: 1000
          }
        ]
      }
    })
  });
  console.log('RPC STATUS:', resRpc.status, resRpc.statusText);
  const textRpc = await resRpc.text();
  console.log('RPC RESPONSE:', textRpc);

  const rpcData = JSON.parse(textRpc);
  if (rpcData.success && rpcData.order_id) {
    console.log('\n[PHASE 7 CRITICAL CHECK] Checking Database for created order ID:', rpcData.order_id);
    const { data: dbOrder, error: dbErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', rpcData.order_id)
      .single();

    if (dbOrder) {
      console.log('--> DB VERIFICATION RESULT: Order EXISTS IN POSTGRESQL DB! Order No:', dbOrder.order_no);
      console.log('--> CONCLUSION FOR PHASE 7: Request actually succeeded in Database! If browser receives ERR_CONNECTION_CLOSED, it is a RESPONSE LOST issue, NOT a database failure!');
    } else {
      console.error('--> DB VERIFICATION RESULT: Order NOT found in DB!', dbErr);
    }
  }
}

runPhase2And7();

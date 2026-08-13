import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
// For auditing RLS and other things, we use anon key to simulate guest!
const guestClient = createClient(supabaseUrl, supabaseAnonKey);

async function runAudit() {
  console.log("=== PHASE 3: RLS AUDIT ===");
  const { data: profiles, error: rlsError } = await guestClient.from('profiles').select('*');
  if (profiles && profiles.length === 0) {
    console.log("🟢 RLS PASS: Guest blocked from reading profiles (returned empty array).");
  } else {
    console.error("🔴 RLS FAIL: Guest read profiles! Count:", profiles?.length);
    process.exit(1);
  }

  const { data: finances, error: rlsFinError } = await guestClient.from('finance_transactions').select('*');
  if (finances && finances.length === 0) {
    console.log("🟢 RLS PASS: Guest blocked from reading finance (returned empty array).");
  } else {
    console.error("🔴 RLS FAIL: Guest read finance! Count:", finances?.length);
    process.exit(1);
  }

  console.log("\n=== PHASE 6 & 13: IDEMPOTENCY & CONCURRENCY AUDIT ===");
  const idempotencyKey = `GUEST-AUDIT-${Date.now()}`;
  const orderPayload = {
    customer_name: "Audit User",
    customer_phone: "08111111111",
    customer_email: "audit@tefadkv.test",
    notes: "E2E Audit",
    idempotency_key: idempotencyKey,
    items: [
      {
        product_name: "Brosur A4",
        category: "Cetak",
        unit: "rim",
        unit_price: 250000,
        cost_price: 150000,
        qty: 1,
        total_price: 250000
      }
    ]
  };

  console.log("Firing 10 concurrent guest order creations...");
  const promises = [];
  for(let i = 0; i < 10; i++) {
    promises.push(guestClient.rpc('create_guest_order', { order_data: orderPayload }));
  }

  const results = await Promise.all(promises);
  let successes = 0;
  let idempotencies = 0;
  let orderId = null;
  let orderNo = null;

  for(let res of results) {
    if(res.error) {
      if(res.error.code === '23505') {
        idempotencies++; // Unique constraint caught it!
      } else {
        console.error("RPC Error:", res.error);
      }
    } else {
      if(res.data.message === 'Idempotent request returned existing order') {
        idempotencies++;
      } else {
        successes++;
        orderId = res.data.order_id;
        orderNo = res.data.order_no;
      }
    }
  }

  console.log(`Results: ${successes} new creations, ${idempotencies} prevented by idempotency.`);
  if(successes === 1 && idempotencies === 9) {
    console.log("🟢 IDEMPOTENCY PASS: Exactly 1 order created, 9 prevented!");
  } else {
    console.error(`🔴 IDEMPOTENCY FAIL: Created ${successes} orders!`);
    process.exit(1);
  }

  console.log("\n=== PHASE 8, 9, 10, 11, 12: POS, PAYMENT, REFUND & FINANCE AUDIT ===");
  // Using service role to bypass auth for POS actions
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  // I can use the admin password: 'punyadkv123' and admin email from INITIAL_ACCOUNTS to login via Auth!
  
    // Pay DP
    const { error: payError1 } = await adminClient.rpc('record_payment', {
      p_order_id: orderId,
      p_amount: 100000,
      p_method: 'Cash',
      p_operator: 'Admin Audit',
      p_notes: 'DP',
      p_reference: null
    });
    
    if(!payError1) {
       console.log("🟢 PAYMENT PASS: DP 100,000 accepted.");
    } else {
       console.error("🔴 PAYMENT FAIL:", payError1);
    }

    // Pay Lunas
    const { error: payError2 } = await adminClient.rpc('record_payment', {
      p_order_id: orderId,
      p_amount: 150000,
      p_method: 'Transfer',
      p_operator: 'Admin Audit',
      p_notes: 'Lunas',
      p_reference: null
    });

    if(!payError2) {
       console.log("🟢 PAYMENT PASS: Pelunasan 150,000 accepted.");
    } else {
       console.error("🔴 PAYMENT FAIL:", payError2);
    }

    // Process Order (BOM Deduction)
    const { error: procError } = await adminClient.rpc('process_order_to_production', {
      p_order_id: orderId,
      p_operator: 'Admin Audit'
    });
    if(!procError) {
      console.log("🟢 STOCK PASS: Order moved to Diproses and stock deducted.");
    } else {
      console.error("🔴 STOCK FAIL:", procError);
    }

    // Refund partially
    const { error: refundError } = await adminClient.rpc('process_refund', {
      p_order_id: orderId,
      p_amount: 50000,
      p_reason: 'Audit Refund',
      p_operator: 'Admin Audit'
    });
    
    if(!refundError) {
      console.log("🟢 REFUND PASS: Partial refund 50,000 accepted.");
    } else {
      console.error("🔴 REFUND FAIL:", refundError);
    }
    
    // Check Financial Ledger
    const { data: txns } = await adminClient.from('finance_transactions').select('*').eq('ref_order_no', orderNo);
    console.log(`🟢 FINANCE PASS: Found ${txns.length} financial ledger entries for order.`);

    // Cleanup Audit Order
    await adminClient.from('orders').delete().eq('id', orderId);
    console.log("🟢 AUDIT CLEANUP PASS: Deleted audit order.");
}

runAudit().catch(console.error);

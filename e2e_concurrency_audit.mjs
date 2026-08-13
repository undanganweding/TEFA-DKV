import { createClient } from '@supabase/supabase-js';

const URL = 'https://lkxzjggzeswuocirazhc.supabase.co';
const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
const supabase = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });

async function run() {
  console.log('Testing Negative Stock Protection...');
  // Find a material
  const { data: mat } = await supabase.from('materials').select('*').limit(1).single();
  if (!mat) return;
  
  // Try to deduct more than current stock using RPC if available, or just direct insert if there's a trigger
  const deductionAmt = Number(mat.current_stock) + 100;
  
  const { error } = await supabase.rpc('record_stock_movement', {
    p_material_id: mat.id,
    p_type: 'Keluar',
    p_quantity: deductionAmt,
    p_operator: 'E2E-AUDIT'
  });
  
  if (error) {
    console.log('PASS: Negative stock blocked:', error.message);
  } else {
    console.log('FAIL: Allowed negative stock!');
  }
}

run();

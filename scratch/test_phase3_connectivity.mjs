import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing connectivity to:', supabaseUrl);

async function testConnectivity() {
  try {
    // 1. Raw GET products
    console.log('\n--- 1. Testing GET /rest/v1/products ---');
    const resProducts = await fetch(`${supabaseUrl}/rest/v1/products?select=*&order=created_at.desc`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    console.log('Products Status:', resProducts.status, resProducts.statusText);
    const textProducts = await resProducts.text();
    console.log('Products Data (first 200 chars):', textProducts.substring(0, 200));

    // 2. Raw GET orders (Anonymous - should be empty or RLS restricted)
    console.log('\n--- 2. Testing GET /rest/v1/orders (Anon) ---');
    const resOrders = await fetch(`${supabaseUrl}/rest/v1/orders?select=*&order=created_at.desc`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    console.log('Orders Status:', resOrders.status, resOrders.statusText);
    const textOrders = await resOrders.text();
    console.log('Orders Data (first 200 chars):', textOrders.substring(0, 200));

  } catch (err) {
    console.error('Connectivity test error:', err);
  }
}

testConnectivity();

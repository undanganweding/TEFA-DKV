import { supabase } from '../lib/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function runSupabaseNetworkDiagnostic() {
  console.log('=== NETWORK DIAGNOSTIC RUNNER STARTED ===');
  const results: any = {};

  // 1. TEST A: Native fetch -> /rest/v1/products
  const startTimeA = performance.now();
  try {
    const resA = await fetch(`${supabaseUrl}/rest/v1/products?select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    });
    const elapsedA = performance.now() - startTimeA;
    const bodyA = await resA.text();
    results.nativeProducts = {
      status: resA.status,
      ok: resA.ok,
      contentType: resA.headers.get('content-type'),
      elapsed_ms: Math.round(elapsedA),
      bodyLength: bodyA.length,
    };
    console.log('[NATIVE FETCH PRODUCTS] SUCCESS:', results.nativeProducts);
  } catch (err: any) {
    results.nativeProducts = {
      status: 'FAILED',
      error_name: err.name,
      error_message: err.message,
    };
    console.error('[NATIVE FETCH PRODUCTS] ERROR:', err);
  }

  // 2. TEST B: Supabase Client -> products
  const startTimeB = performance.now();
  try {
    const { data: dataB, error: errB, status: statusB } = await supabase.from('products').select('*');
    const elapsedB = performance.now() - startTimeB;
    results.clientProducts = {
      status: statusB,
      ok: !errB,
      elapsed_ms: Math.round(elapsedB),
      count: dataB ? dataB.length : 0,
      error: errB ? errB.message : null,
    };
    console.log('[SUPABASE CLIENT PRODUCTS] SUCCESS:', results.clientProducts);
  } catch (err: any) {
    results.clientProducts = {
      status: 'FAILED',
      error_name: err.name,
      error_message: err.message,
    };
    console.error('[SUPABASE CLIENT PRODUCTS] ERROR:', err);
  }

  // 3. Get session token if logged in
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token || anonKey;

  // 4. TEST C: Native fetch -> /rest/v1/orders
  const startTimeC = performance.now();
  try {
    const resC = await fetch(`${supabaseUrl}/rest/v1/orders?select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${token}`,
      },
    });
    const elapsedC = performance.now() - startTimeC;
    const bodyC = await resC.text();
    results.nativeOrders = {
      status: resC.status,
      ok: resC.ok,
      contentType: resC.headers.get('content-type'),
      elapsed_ms: Math.round(elapsedC),
      bodyLength: bodyC.length,
    };
    console.log('[NATIVE FETCH ORDERS] SUCCESS:', results.nativeOrders);
  } catch (err: any) {
    results.nativeOrders = {
      status: 'FAILED',
      error_name: err.name,
      error_message: err.message,
    };
    console.error('[NATIVE FETCH ORDERS] ERROR:', err);
  }

  // 5. TEST D: Supabase Client -> orders
  const startTimeD = performance.now();
  try {
    const { data: dataD, error: errD, status: statusD } = await supabase.from('orders').select('*');
    const elapsedD = performance.now() - startTimeD;
    results.clientOrders = {
      status: statusD,
      ok: !errD,
      elapsed_ms: Math.round(elapsedD),
      count: dataD ? dataD.length : 0,
      error: errD ? errD.message : null,
    };
    console.log('[SUPABASE CLIENT ORDERS] SUCCESS:', results.clientOrders);
  } catch (err: any) {
    results.clientOrders = {
      status: 'FAILED',
      error_name: err.name,
      error_message: err.message,
    };
    console.error('[SUPABASE CLIENT ORDERS] ERROR:', err);
  }

  return results;
}

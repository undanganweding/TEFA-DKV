import { createClient } from '@supabase/supabase-js';
import { supabase as normalClient } from '../lib/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Diagnostic Client without X-Client-Info header
const customClientNoXHeader = createClient(supabaseUrl, anonKey, {
  global: {
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      headers.delete('X-Client-Info');
      headers.delete('x-client-info');
      return window.fetch(input, {
        ...init,
        headers,
      });
    },
  },
});

export async function runDefinitiveABTest() {
  console.log('=== DEFINITIVE A/B TEST: SUPABASE JS vs NATIVE FETCH ===\n');
  const results: any = {};

  // 1. Native Fetch Test
  const urlNative = `${supabaseUrl}/rest/v1/products?select=*`;
  console.log('[TEST 1] Executing Native Fetch ->', urlNative);
  const startNative = performance.now();
  try {
    const res = await fetch(urlNative, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    });
    const text = await res.text();
    results.nativeFetch = {
      status: res.status,
      ok: res.ok,
      elapsed_ms: Math.round(performance.now() - startNative),
      length: text.length,
    };
    console.log('--> Native Fetch Result:', results.nativeFetch);
  } catch (err: any) {
    results.nativeFetch = { status: 'FAILED', error: err.message };
    console.error('--> Native Fetch Error:', err);
  }

  // 2. Normal Supabase JS Client Test
  console.log('\n[TEST 2] Executing Normal Supabase JS Client...');
  const startNormal = performance.now();
  try {
    const { data, error, status } = await normalClient.from('products').select('*');
    results.normalClient = {
      status: status,
      ok: !error,
      elapsed_ms: Math.round(performance.now() - startNormal),
      count: data ? data.length : 0,
      error: error ? error.message : null,
    };
    console.log('--> Normal Supabase Client Result:', results.normalClient);
  } catch (err: any) {
    results.normalClient = { status: 'FAILED', error: err.message };
    console.error('--> Normal Supabase Client Error:', err);
  }

  // 3. Custom Supabase JS Client (Without X-Client-Info Header) Test
  console.log('\n[TEST 3] Executing Custom Client (Without X-Client-Info)...');
  const startCustom = performance.now();
  try {
    const { data, error, status } = await customClientNoXHeader.from('products').select('*');
    results.customClient = {
      status: status,
      ok: !error,
      elapsed_ms: Math.round(performance.now() - startCustom),
      count: data ? data.length : 0,
      error: error ? error.message : null,
    };
    console.log('--> Custom Client (No X-Header) Result:', results.customClient);
  } catch (err: any) {
    results.customClient = { status: 'FAILED', error: err.message };
    console.error('--> Custom Client Error:', err);
  }

  // 4. Header & URL Integrity Check
  results.urlIdentical = urlNative === `${supabaseUrl}/rest/v1/products?select=*`;
  results.apikeyPresent = !!anonKey;
  results.apikeyLength = anonKey.length;

  console.log('\n=== A/B TEST MATRIX SUMMARY ===');
  console.table(results);
  return results;
}

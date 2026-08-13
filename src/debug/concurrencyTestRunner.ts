import { supabase } from '../lib/supabase';
import { fetchProducts } from '../services/productService';
import { fetchOrders } from '../services/orderService';

export async function runConcurrencyAndSequentialTests() {
  console.log('=== PHASE 12: LIFECYCLE & CONCURRENCY DIAGNOSTIC RUNNER ===\n');
  const log: any[] = [];

  // Instrument Native Fetch Counter
  let fetchCallCount = 0;
  const originalFetch = window.fetch;
  const instrumentedFetch = async (input: any, init: any) => {
    fetchCallCount++;
    const currentId = fetchCallCount;
    const urlStr = typeof input === 'string' ? input : input.url;
    const shortUrl = urlStr.replace(import.meta.env.VITE_SUPABASE_URL, '');
    const startTime = performance.now();
    
    console.log(`[NET TRACE #${currentId} START] ${init?.method || 'GET'} ${shortUrl}`);
    try {
      const response = await originalFetch(input, init);
      const duration = Math.round(performance.now() - startTime);
      console.log(`[NET TRACE #${currentId} END] Status: ${response.status} | Duration: ${duration}ms`);
      log.push({ id: currentId, url: shortUrl, status: response.status, duration });
      return response;
    } catch (err: any) {
      const duration = Math.round(performance.now() - startTime);
      console.error(`[NET TRACE #${currentId} ERROR] ${err.message} | Duration: ${duration}ms`);
      log.push({ id: currentId, url: shortUrl, status: 'ERROR', error: err.message, duration });
      throw err;
    }
  };

  // TEST 3 & 4: CONCURRENCY vs SEQUENTIAL EXPERIMENT
  console.log('\n--- TEST A: Sequential Request (products THEN orders) ---');
  fetchCallCount = 0;
  const startSeq = performance.now();
  let seqSuccess = false;
  try {
    const prods = await fetchProducts();
    const ords = await fetchOrders();
    const durSeq = Math.round(performance.now() - startSeq);
    seqSuccess = true;
    console.log(`--> SEQUENTIAL RESULT: SUCCESS 200 | Total Duration: ${durSeq}ms | Products: ${prods.length}, Orders: ${ords.length}`);
  } catch (err: any) {
    console.error('--> SEQUENTIAL RESULT: FAILED | Error:', err.message);
  }

  console.log('\n--- TEST B: Parallel Concurrent Request (Promise.all([products, orders])) ---');
  const startPar = performance.now();
  let parSuccess = false;
  try {
    const [prods, ords] = await Promise.all([
      fetchProducts(),
      fetchOrders(),
    ]);
    const durPar = Math.round(performance.now() - startPar);
    parSuccess = true;
    console.log(`--> PARALLEL RESULT: SUCCESS 200 | Total Duration: ${durPar}ms | Products: ${prods.length}, Orders: ${ords.length}`);
  } catch (err: any) {
    console.error('--> PARALLEL RESULT: FAILED | Error:', err.message);
  }

  return {
    sequentialSuccess: seqSuccess,
    parallelSuccess: parSuccess,
    traceLog: log,
  };
}

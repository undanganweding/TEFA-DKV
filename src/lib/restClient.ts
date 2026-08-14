/**
 * Shared Direct REST API client for Supabase.
 * Uses native fetch() with exponential backoff retry.
 * Bypasses Supabase JS to avoid HTTP/2 connection pooling issues.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function getRestHeaders(): Record<string, string> {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface RestResult<T> {
  data: T | null;
  error: { message: string; status?: number } | null;
}

/**
 * Execute a REST call with exponential backoff retry.
 */
export async function restCall<T = any>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  endpoint: string,
  body?: any,
  retries = 3,
  baseDelay = 500
): Promise<RestResult<T>> {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const options: RequestInit = {
        method,
        headers: getRestHeaders(),
        credentials: 'omit',
      };

      if (body && (method === 'POST' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        const text = await response.text().catch(() => '');
        return { data: null, error: { message: text || `HTTP ${response.status}`, status: response.status } };
      }

      if (response.status >= 500 || response.status === 429) {
        if (attempt < retries) {
          const delay = response.status === 429
            ? parseInt(response.headers.get('retry-after') || '5', 10) * 1000
            : baseDelay * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }
      }

      if (response.status === 204) {
        return { data: {} as T, error: null };
      }

      const text = await response.text();
      if (!response.ok) {
        return { data: null, error: { message: text || `HTTP ${response.status}`, status: response.status } };
      }

      return { data: text ? JSON.parse(text) : ({} as T), error: null };

    } catch (err: any) {
      const isNetworkError =
        !err.status &&
        (err.message?.includes('Failed to fetch') ||
          err.message?.includes('NetworkError') ||
          err.message?.includes('net::ERR_') ||
          err.name === 'TypeError');

      if (isNetworkError && attempt < retries) {
        await sleep(baseDelay * Math.pow(2, attempt));
        continue;
      }

      return { data: null, error: { message: err.message || 'Network error' } };
    }
  }

  return { data: null, error: { message: 'All retries exhausted' } };
}

/**
 * Execute multiple REST calls in parallel.
 */
export async function restAll<T>(calls: Array<() => Promise<RestResult<T>>>): Promise<RestResult<T>[]> {
  return Promise.all(calls.map(call => call()));
}

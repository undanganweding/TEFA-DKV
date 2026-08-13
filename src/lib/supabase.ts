import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

// Stable Browser Native Transport Implementation
// Using native window.fetch directly to avoid socket reset issues in HTTP/2 Chromium browser engine
const stableBrowserFetch = (input: any, init: any) => {
  return window.fetch(input, init);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: stableBrowserFetch,
  },
});

// REST Direct Fetch Utility for High-Reliability Student Operations
export async function directRestFetch(endpoint: string, options: { method?: string; body?: any; token?: string } = {}) {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'apikey': supabaseAnonKey,
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  } else {
    headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
  }

  const response = await window.fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`REST Transport Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

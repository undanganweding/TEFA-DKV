import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lkxzjggzeswuocirazhc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxreHpqZ2d6ZXN3dW9jaXJhemhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNzM5MDgsImV4cCI6MjEwMTk0OTkwOH0.lNOMBP7ZevhgSxYv11OcJdCtsku2-xs-TdMVH7TXNuE';


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

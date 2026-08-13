import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing admin-manage-users...');
  
  const { data, error } = await supabase.functions.invoke('admin-manage-users', {
    body: { action: 'list' }
  });
  
  console.log('Error:', error?.message || error);
  console.log('Data:', data);
}

test();

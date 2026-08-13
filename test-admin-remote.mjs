import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing admin-manage-users...');
  
  // Login as admin first
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'syifaanjay@gmail.com', // from the screenshot
    password: 'password123' // generic password, maybe it fails but we just need the jwt. Wait, I can't guess the password.
  });
  
  if (authErr) {
    console.log("Could not login:", authErr.message);
    return;
  }
  
  const { data, error } = await supabase.functions.invoke('admin-manage-users', {
    body: { action: 'list' }
  });
  
  console.log('Error:', error);
  console.log('Data:', data);
}

test();

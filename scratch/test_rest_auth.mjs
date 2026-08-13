import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFlow() {
  const newEmail = 'test_fetch_7@test.com';
  console.log('Signing up new user:', newEmail);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: newEmail,
    password: 'password123',
    options: {
      data: { full_name: 'Fetch Test', role: 'Student', status: 'Active' }
    }
  });

  if (signUpError) {
    console.error('SignUp Error:', signUpError);
    return;
  }
  
  const token = signUpData.session?.access_token;
  if (!token) {
    console.error('No token received');
    return;
  }
  console.log('Session acquired for user:', signUpData.user.id);

  const url = `${supabaseUrl}/rest/v1/profiles?select=*&id=eq.${signUpData.user.id}`;
  console.log('Fetching:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`HTTP STATUS: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log(`RESPONSE BODY:`, text);
  } catch (err) {
    console.error(`FETCH ERROR:`, err.message);
  }
}

testFlow();

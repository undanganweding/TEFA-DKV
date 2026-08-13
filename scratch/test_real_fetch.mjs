import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealUserFetch() {
  const email = 'kingbim2@gmail.com';
  const password = 'Password123!';

  console.log('Logging in as kingbim2@gmail.com...');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Login error:', error);
    return;
  }

  console.log('Login success! User ID:', data.user.id);
  console.log('Access token acquired. Testing fetch to /rest/v1/profiles via fetch()...');

  const targetId = data.user.id;
  const profileUrl = `${supabaseUrl}/rest/v1/profiles?select=*&id=eq.${targetId}`;

  try {
    const res = await fetch(profileUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${data.session.access_token}`
      }
    });

    console.log('HTTP Status:', res.status, res.statusText);
    const body = await res.text();
    console.log('Response Body:', body);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testRealUserFetch();

import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMetadataAndTest() {
  const email = 'kingbim2@gmail.com';
  console.log('1. Cleaning raw_user_meta_data in auth.users...');
  
  // Remove base64 avatar_path from user_metadata
  await sql`
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data - 'avatar_path'
    WHERE email = ${email}
  `;
  
  console.log('Cleaned user metadata successfully.');

  console.log('2. Logging in again as kingbim2@gmail.com...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: 'Password123!'
  });

  if (error) {
    console.error('Login error:', error);
    await sql.end();
    return;
  }

  console.log('Login success! User ID:', data.user.id);
  console.log('Access Token Length:', data.session.access_token.length, 'bytes');

  console.log('3. Fetching /rest/v1/profiles with new clean JWT token...');
  const profileUrl = `${supabaseUrl}/rest/v1/profiles?select=*&id=eq.${data.user.id}`;
  
  try {
    const res = await fetch(profileUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${data.session.access_token}`
      }
    });

    console.log('HTTP Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response Body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  } finally {
    await sql.end();
  }
}

fixMetadataAndTest();

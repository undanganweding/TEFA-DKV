import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runAvatarPersistenceTest() {
  console.log('=== TEST PHOTO PERSISTENCE ===');
  const email = 'kingbim2@gmail.com';
  const password = 'Password123!';

  console.log('1. Logging in as student...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  if (loginError) {
    console.error('Login failed:', loginError);
    await sql.end();
    return;
  }
  const userId = loginData.user.id;
  console.log('Login success! User ID:', userId);

  // 2. Upload photo to Supabase Storage
  console.log('2. Simulating avatar upload to Supabase Storage...');
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const fileBuf = Buffer.from(sampleBase64.split(',')[1], 'base64');
  const path = `${userId}/avatar-${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(path, fileBuf, { contentType: 'image/png', upsert: true });

  if (uploadError) {
    console.error('Storage Upload Error:', uploadError);
    await sql.end();
    return;
  }

  const { data: publicData } = supabase.storage.from('profile-images').getPublicUrl(path);
  const publicUrl = publicData.publicUrl;
  console.log('Storage Upload SUCCESS! Public URL:', publicUrl);

  // 3. Update database profiles.avatar_path
  console.log('3. Updating profiles.avatar_path in database...');
  const { error: dbError } = await supabase
    .from('profiles')
    .update({ avatar_path: publicUrl })
    .eq('id', userId);

  if (dbError) {
    console.error('DB Update Error:', dbError);
    await sql.end();
    return;
  }

  // 4. Verify in PostgreSQL directly
  console.log('4. Querying PostgreSQL directly for profiles.avatar_path...');
  const dbRow = await sql`SELECT id, avatar_path FROM profiles WHERE id = ${userId}`;
  console.log('DB Row BEFORE refresh:', dbRow[0]);
  if (dbRow[0].avatar_path !== publicUrl) {
    console.error('FAIL: Database avatar_path does not match uploaded URL!');
    await sql.end();
    return;
  }

  // 5. Simulate Browser Refresh by calling fetchUserProfile (API fetch)
  console.log('5. Simulating Browser Refresh: Fetching profile via Supabase PostgREST API...');
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*&id=eq.${userId}`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${loginData.session.access_token}`
    }
  });

  const fetchedProfiles = await profileRes.json();
  console.log('Fetched Profile AFTER Refresh:', fetchedProfiles[0]);

  if (fetchedProfiles[0].avatar_path === publicUrl) {
    console.log('✅ PERSISTENCE VERIFIED SUCCESS: Photo URL remains unchanged after refresh!');
  } else {
    console.error('❌ FAIL: Photo URL changed or lost after refresh!');
  }

  await sql.end();
}

runAvatarPersistenceTest();

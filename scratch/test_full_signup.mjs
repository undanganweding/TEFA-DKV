import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFullAvatarSignupAndLogin() {
  const timestamp = Date.now();
  const email = `test_avatar_${timestamp}@gmail.com`;
  const password = 'Password123!';
  // Small 1x1 transparent PNG base64
  const sampleAvatarBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  console.log('1. Registering user with avatar:', email);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Avatar Test',
        role: 'Student',
        status: 'Active',
        nis: '999',
        school_class: 'XII',
        major: 'DKV',
        whatsapp: '08123456789',
        phone: '08123456789',
        avatar_path: null // Fixed logic
      }
    }
  });

  if (signUpError) {
    console.error('SignUp Error:', signUpError);
    return;
  }
  console.log('User signed up successfully. User ID:', signUpData.user?.id);

  console.log('2. Uploading avatar to profile-images storage bucket...');
  const fileBuf = Buffer.from(sampleAvatarBase64.split(',')[1], 'base64');
  const path = `${signUpData.user.id}/avatar-${timestamp}.png`;
  
  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(path, fileBuf, { contentType: 'image/png', upsert: true });

  if (uploadError) {
    console.error('Storage Upload Error:', uploadError);
    return;
  }
  console.log('Storage upload SUCCESS!');

  const { data: publicData } = supabase.storage.from('profile-images').getPublicUrl(path);
  console.log('Public avatar URL:', publicData.publicUrl);

  console.log('3. Logging in as new user...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  if (loginError) {
    console.error('Login Error:', loginError);
    return;
  }

  console.log('Login SUCCESS! Token length:', loginData.session.access_token.length, 'bytes');

  console.log('4. Fetching profile for new user...');
  const profileUrl = `${supabaseUrl}/rest/v1/profiles?select=*&id=eq.${loginData.user.id}`;
  const res = await fetch(profileUrl, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${loginData.session.access_token}`
    }
  });

  console.log('HTTP Status:', res.status, res.statusText);
  const profileJson = await res.json();
  console.log('Profile Data:', profileJson);
}

testFullAvatarSignupAndLogin();

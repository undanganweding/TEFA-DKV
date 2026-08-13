import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAvatarUploadExistingUser() {
  const email = 'kingbim2@gmail.com';
  const password = 'Password123!';

  console.log('Logging in as kingbim2@gmail.com...');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Login error:', error);
    return;
  }

  console.log('Login SUCCESS! User ID:', data.user.id);
  const sampleAvatarBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const fileBuf = Buffer.from(sampleAvatarBase64.split(',')[1], 'base64');
  const path = `${data.user.id}/avatar-${Date.now()}.png`;

  console.log('Uploading avatar to profile-images storage bucket...');
  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(path, fileBuf, { contentType: 'image/png', upsert: true });

  if (uploadError) {
    console.error('Storage Upload Error:', uploadError);
    return;
  }
  console.log('Storage upload SUCCESS! Path:', path);

  const { data: publicData } = supabase.storage.from('profile-images').getPublicUrl(path);
  console.log('Public avatar URL:', publicData.publicUrl);

  // Update profile with public URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_path: publicData.publicUrl })
    .eq('id', data.user.id);

  if (updateError) {
    console.error('Profile update error:', updateError);
    return;
  }
  console.log('Profile avatar_path updated SUCCESS!');
}

testAvatarUploadExistingUser();

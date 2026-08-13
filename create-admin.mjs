import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing SUPABASE credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
  const email = 'syifaanjay@gmail.com';
  const password = 'punyadkv123';
  const fullName = 'Syifa Admin';

  console.log(`Trying to login ${email}...`);
  const loginRes = await supabase.auth.signInWithPassword({ email, password });
  let userId;

  if (loginRes.error) {
    console.log("Login failed:", loginRes.error.message);
    console.log("Attempting sign up...");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error("Signup error:", error.message);
      return;
    }
    userId = data.user.id;
  } else {
    userId = loginRes.data.user.id;
  }
  console.log(`User ID: ${userId}`);

  // Create Profile
  console.log("Creating/Updating profile as Admin...");
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: fullName,
      role: 'Admin',
      status: 'Active'
    });

  if (profileError) {
    console.error("Profile creation error:", profileError.message);
  } else {
    console.log("SUCCESS! User created and set as Admin.");
  }
}

createAdmin();

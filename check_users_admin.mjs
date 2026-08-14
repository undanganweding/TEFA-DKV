import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lkxzjggzeswuocirazhc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxreHpqZ2d6ZXN3dW9jaXJhemhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNzM5MDgsImV4cCI6MjEwMTk0OTkwOH0.lNOMBP7ZevhgSxYv11OcJdCtsku2-xs-TdMVH7TXNuE';

const clientAdmin = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

async function checkUsers() {
  console.log("Signing in as Admin (syifaanjay@gmail.com)...");
  const { data: authAdm, error: errAdm } = await clientAdmin.auth.signInWithPassword({
    email: 'syifaanjay@gmail.com',
    password: 'punyadkv123'
  });

  if (errAdm) {
    console.error("Admin signin failed:", errAdm);
    return;
  }

  console.log("Admin logged in successfully! User ID:", authAdm.user.id);

  // Invoke admin-manage-users edge function to list registered users
  const { data, error } = await clientAdmin.functions.invoke('admin-manage-users', {
    body: { action: 'list' }
  });

  if (error) {
    console.error("Failed to invoke admin-manage-users:", error);
    return;
  }

  console.log(`Retrieved ${data?.data?.length || 0} users from backend.`);
  const students = (data?.data || []).filter(u => u.role === 'Student' || u.role === 'Siswa');
  console.log("Active Students in DB:", students.map(s => ({ id: s.id, email: s.email, name: s.full_name, role: s.role, status: s.status })));
}

checkUsers();

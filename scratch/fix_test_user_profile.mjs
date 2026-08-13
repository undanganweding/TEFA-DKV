import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function checkProfile() {
  const targetId = 'ef6b5aa6-d5d5-453b-896a-aa67fb464802';
  const profile = await sql`SELECT * FROM public.profiles WHERE id = ${targetId}`;
  console.log('Profile for student_e2e@test.com:', profile);
  
  if (profile.length === 0) {
    console.log('Inserting missing profile row for student_e2e@test.com...');
    await sql`INSERT INTO public.profiles (id, full_name, role, status) VALUES (${targetId}, 'Siswa E2E Test', 'Siswa', 'Active')`;
    console.log('Profile inserted successfully!');
  }
  await sql.end();
}

checkProfile();

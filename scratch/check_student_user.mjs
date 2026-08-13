import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function inspectStudentUser() {
  const targetId = '4a3c89c7-7fd4-4cf4-a208-873fd21a8abb';
  const profile = await sql`SELECT id, full_name, role FROM public.profiles WHERE id = ${targetId}`;
  console.log('Profile User (ahidnasabilanajah@gmail.com):', profile);
  await sql.end();
}

inspectStudentUser();

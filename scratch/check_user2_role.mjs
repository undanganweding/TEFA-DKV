import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function inspectRole() {
  const user2Id = 'c4e7c17d-841f-4ef8-8154-6c1489a4b281';
  const profile2 = await sql`SELECT id, full_name, role FROM public.profiles WHERE id = ${user2Id}`;
  console.log('Profile User 2 (syifaanjay@gmail.com):', profile2);
  await sql.end();
}

inspectRole();

import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function setPassword2() {
  const targetId = 'c4e7c17d-841f-4ef8-8154-6c1489a4b281';
  await sql`UPDATE auth.users SET encrypted_password = crypt('Password123!', gen_salt('bf')) WHERE id = ${targetId}`;
  console.log('Password for syifaanjay@gmail.com updated to Password123!');
  await sql.end();
}

setPassword2();

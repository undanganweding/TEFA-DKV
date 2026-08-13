import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function setPasswordStudent2() {
  const targetId = '4a3c89c7-7fd4-4cf4-a208-873fd21a8abb';
  await sql`UPDATE auth.users SET encrypted_password = crypt('Password123!', gen_salt('bf')) WHERE id = ${targetId}`;
  console.log('Password for ahidnasabilanajah@gmail.com updated to Password123!');
  await sql.end();
}

setPasswordStudent2();

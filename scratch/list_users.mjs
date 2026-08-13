import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function listUsers() {
  const users = await sql`SELECT id, email, encrypted_password FROM auth.users LIMIT 10`;
  console.log('Existing users in DB:');
  for (const u of users) {
    console.log(`- ID: ${u.id} | Email: ${u.email}`);
  }
  await sql.end();
}

listUsers();

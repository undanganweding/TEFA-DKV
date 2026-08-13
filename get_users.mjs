import postgres from 'postgres';

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function run() {
  try {
    const users = await sql`SELECT id, email, encrypted_password FROM auth.users LIMIT 5`;
    console.log('Users:', users);
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await sql.end();
  }
}

run();

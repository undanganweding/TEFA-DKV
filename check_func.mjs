import postgres from 'postgres';

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function run() {
  try {
    const funcs = await sql`SELECT proname FROM pg_proc WHERE proname = 'handle_new_user_profile'`;
    console.log('Functions:', funcs);
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await sql.end();
  }
}

run();

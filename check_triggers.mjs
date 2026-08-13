import postgres from 'postgres';

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function run() {
  try {
    const triggers = await sql`
      SELECT tgname, relname 
      FROM pg_trigger 
      JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid 
      WHERE relname = 'users'
    `;
    console.log('Triggers on auth.users:', triggers);
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await sql.end();
  }
}

run();

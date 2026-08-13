import postgres from 'postgres';

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function run() {
  try {
    const migrations = await sql`SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10`;
    console.log('Applied migrations:', migrations.map(m => m.version));
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await sql.end();
  }
}

run();

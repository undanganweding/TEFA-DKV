import postgres from 'postgres';

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function run() {
  try {
    const profiles = await sql`SELECT * FROM profiles WHERE id = '38bc3c49-cbad-40a4-91cc-f827944c7730'`;
    console.log('Profiles:', profiles);
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await sql.end();
  }
}

run();

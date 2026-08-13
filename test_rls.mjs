import postgres from 'postgres';

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function run() {
  try {
    await sql.unsafe(`
      set local role authenticated;
      set local request.jwt.claim.sub = 'fe1319ce-cc6d-4175-aa98-1d1a8ef6e6fc';
      set local request.jwt.claims = '{"sub":"fe1319ce-cc6d-4175-aa98-1d1a8ef6e6fc", "role":"authenticated"}';
    `);
    
    const profiles = await sql`SELECT * FROM profiles`;
    console.log('Profiles as authenticated:', profiles);
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await sql.end();
  }
}

run();

import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function checkQuery() {
  try {
    await sql.unsafe(`
      set local role authenticated;
      set local request.jwt.claim.sub = '38bc3c49-cbad-40a4-91cc-f827944c7730';
      set local request.jwt.claims = '{"sub":"38bc3c49-cbad-40a4-91cc-f827944c7730", "role":"authenticated"}';
    `);
    
    console.log('Running query as authenticated user...');
    
    // Using simple query
    const res = await sql`
      SELECT * FROM profiles WHERE id = '38bc3c49-cbad-40a4-91cc-f827944c7730'
    `;
    console.log('Query result:', res);
  } catch (error) {
    console.error('Database query error:', error);
  } finally {
    await sql.end();
  }
}

checkQuery();

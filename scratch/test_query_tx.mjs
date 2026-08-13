import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function checkQueryTx() {
  try {
    console.log('Running query as authenticated user IN TRANSACTION...');
    
    const res = await sql.begin(async sql => {
      await sql`set local role authenticated;`;
      await sql`set local request.jwt.claim.sub = '38bc3c49-cbad-40a4-91cc-f827944c7730';`;
      await sql`set local request.jwt.claims = '{"sub":"38bc3c49-cbad-40a4-91cc-f827944c7730", "role":"authenticated"}';`;
      
      return await sql`SELECT * FROM profiles WHERE id = '38bc3c49-cbad-40a4-91cc-f827944c7730'`;
    });
    
    console.log('Query result:', res);
  } catch (error) {
    console.error('Database query error:', error);
  } finally {
    await sql.end();
  }
}

checkQueryTx();

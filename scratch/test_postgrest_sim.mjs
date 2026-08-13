import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function testPostgrestQuery() {
  try {
    console.log('Simulating exact PostgREST query...');
    const result = await sql.begin(async tx => {
      await tx`SET LOCAL role = authenticated`;
      await tx`SET LOCAL "request.jwt.claim.sub" = '38bc3c49-cbad-40a4-91cc-f827944c7730'`;
      await tx`SET LOCAL "request.jwt.claims" = '{"sub":"38bc3c49-cbad-40a4-91cc-f827944c7730","role":"authenticated"}'`;
      
      const res = await tx`
        SELECT coalesce(json_agg(t), '[]')::text as data FROM (
          SELECT profiles.* FROM public.profiles WHERE profiles.id = '38bc3c49-cbad-40a4-91cc-f827944c7730'
        ) t
      `;
      return res;
    });
    console.log('Result:', result);
  } catch (err) {
    console.error('PostgREST query error:', err);
  } finally {
    await sql.end();
  }
}

testPostgrestQuery();

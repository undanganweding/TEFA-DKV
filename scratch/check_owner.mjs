import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function checkOwner() {
  try {
    const res = await sql`
      SELECT proowner::regrole, prosecdef 
      FROM pg_proc 
      WHERE proname = 'is_admin'
    `;
    console.log('is_admin owner:', res);
  } catch (error) {
    console.error('Database query error:', error);
  } finally {
    await sql.end();
  }
}

checkOwner();

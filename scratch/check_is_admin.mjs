import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function checkFunc() {
  try {
    const res = await sql`
      SELECT prosrc, prolang, l.lanname
      FROM pg_proc p
      JOIN pg_language l ON p.prolang = l.oid
      WHERE proname = 'is_admin'
    `;
    console.log('is_admin function definition:', res);
  } catch (error) {
    console.error('Database query error:', error);
  } finally {
    await sql.end();
  }
}

checkFunc();

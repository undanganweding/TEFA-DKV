import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function checkInboxRecords() {
  const records = await sql`SELECT id, linked_order_no, file_name, customer_name, created_at FROM inbox_files ORDER BY created_at DESC LIMIT 5`;
  console.log('Latest inbox_files records in DB:', records);
  await sql.end();
}

checkInboxRecords();

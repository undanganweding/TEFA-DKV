import postgres from 'postgres';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function applyMigration020() {
  console.log('Applying Migration 020: Integrate inbox_files into create_order RPC...');
  const sqlContent = fs.readFileSync('supabase/migrations/020_integrate_inbox_files_into_create_order.sql', 'utf8');
  try {
    await sql.unsafe(sqlContent);
    console.log('Migration 020 applied SUCCESSFULLY to Supabase DB!');
  } catch (err) {
    console.error('Failed to apply migration 020:', err);
  } finally {
    await sql.end();
  }
}

applyMigration020();

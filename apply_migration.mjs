import postgres from 'postgres';
import fs from 'fs';

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function run() {
  try {
    const migration = fs.readFileSync('./supabase/migrations/006_idempotency_keys.sql', 'utf8');
    await sql.unsafe(migration);
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

run();

import postgres from 'postgres';
import fs from 'fs';

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function run() {
  try {
    const migration = fs.readFileSync('./supabase/migrations/013_fix_tracking_and_registration.sql', 'utf8');
    await sql.unsafe(migration);
    console.log('Migration 013 applied successfully!');
  } catch (error) {
    console.error('Migration 013 failed:', error);
  } finally {
    await sql.end();
  }
}

run();

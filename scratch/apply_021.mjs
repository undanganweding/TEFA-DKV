import postgres from 'postgres';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function applyMigration021() {
  console.log('Applying Migration 021: Secure Student RLS for inbox_files...');
  const sqlContent = fs.readFileSync('supabase/migrations/021_secure_inbox_files_student_rls.sql', 'utf8');
  try {
    await sql.unsafe(sqlContent);
    console.log('Migration 021 applied SUCCESSFULLY to Supabase DB!');
  } catch (err) {
    console.error('Failed to apply migration 021:', err);
  } finally {
    await sql.end();
  }
}

applyMigration021();

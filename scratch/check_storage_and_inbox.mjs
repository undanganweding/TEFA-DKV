import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function inspectStorageAndInbox() {
  const buckets = await sql`SELECT id, name, public FROM storage.buckets`;
  console.log('Storage Buckets:', buckets);
  
  const columns = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'inbox_files'`;
  console.log('inbox_files columns:', columns);

  const policies = await sql`SELECT policyname, qual, cmd FROM pg_policies WHERE tablename = 'inbox_files'`;
  console.log('inbox_files policies:', policies);

  await sql.end();
}

inspectStorageAndInbox();

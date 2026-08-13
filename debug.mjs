import postgres from 'postgres';
const sql = postgres('postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres');

async function debug() {
  const prodCols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'`;
  console.log("Products cols:", prodCols);
  
  process.exit(0);
}
debug();

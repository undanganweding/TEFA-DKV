import postgres from 'postgres';
const sql = postgres('postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres');

async function checkIdempotency() {
  const result = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'idempotency_key';
  `;
  console.log("Idempotency Column Check:");
  console.log(result);
  process.exit(0);
}
checkIdempotency();

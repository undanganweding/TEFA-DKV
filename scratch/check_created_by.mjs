import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function inspectOrder() {
  const orderId = 'eafe733a-3a30-4fd2-9c1e-a980c095612d';
  const order = await sql`SELECT id, order_no, created_by, customer_email FROM orders WHERE id = ${orderId}`;
  console.log('Inserted Order:', order);
  
  const policies = await sql`SELECT policyname, qual FROM pg_policies WHERE tablename = 'orders'`;
  console.log('Active Orders Policies:', policies);
  
  await sql.end();
}

inspectOrder();

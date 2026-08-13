import postgres from 'postgres';
const sql = postgres('postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres');

async function cleanup() {
  const dummyOrders = await sql`
    SELECT id, customer_name, order_no FROM orders 
    WHERE customer_name ILIKE '%test%' 
       OR customer_name ILIKE '%dummy%' 
       OR customer_name ILIKE '%e2e%' 
       OR customer_name ILIKE '%mock%'
       OR customer_name ILIKE '%demo%';
  `;
  console.log("Dummy Orders Found:", dummyOrders);

  if (dummyOrders.length > 0) {
    const ids = dummyOrders.map(o => o.id);
    await sql`DELETE FROM order_items WHERE order_id IN ${sql(ids)}`;
    await sql`DELETE FROM payments WHERE order_id IN ${sql(ids)}`;
    await sql`DELETE FROM order_status_history WHERE order_id IN ${sql(ids)}`;
    await sql`DELETE FROM finance_transactions WHERE ref_order_no IN ${sql(dummyOrders.map(o => o.order_no))}`;
    await sql`DELETE FROM orders WHERE id IN ${sql(ids)}`;
    console.log(`Deleted ${ids.length} test records.`);
  } else {
    console.log("No test records found.");
  }
  process.exit(0);
}
cleanup();

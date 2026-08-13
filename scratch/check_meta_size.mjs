import postgres from 'postgres';
const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function checkMetadata() {
  const user = await sql`SELECT id, email, raw_user_meta_data, raw_app_meta_data FROM auth.users WHERE email = 'kingbim2@gmail.com'`;
  console.log('User metadata:', JSON.stringify(user, null, 2));
  console.log('Metadata size in bytes:', JSON.stringify(user[0].raw_user_meta_data).length);
  await sql.end();
}

checkMetadata();

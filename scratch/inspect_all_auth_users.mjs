import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function inspectAllUsers() {
  const users = await sql`
    SELECT u.id, u.email, u.email_confirmed_at, u.raw_user_meta_data, p.full_name, p.role, p.status 
    FROM auth.users u 
    LEFT JOIN public.profiles p ON u.id = p.id
  `;
  console.log('--- ALL USERS IN DB ---');
  for (const u of users) {
    console.log(`Email: ${u.email} | Role DB: ${u.role} | Meta Role: ${u.raw_user_meta_data?.role} | Status DB: ${u.status} | Email Confirmed: ${!!u.email_confirmed_at}`);
  }
  await sql.end();
}

inspectAllUsers();

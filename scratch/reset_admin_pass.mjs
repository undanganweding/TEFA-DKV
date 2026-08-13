import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function setAdminPassword() {
  const targetId = '69516492-4dd5-4892-91d5-3d9b391986ae';
  await sql`UPDATE auth.users SET encrypted_password = crypt('Password123!', gen_salt('bf')) WHERE id = ${targetId}`;
  console.log('Password for admin_e2e@test.com updated to Password123!');
  await sql.end();
}

setAdminPassword();

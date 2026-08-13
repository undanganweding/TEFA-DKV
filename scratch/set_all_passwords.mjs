import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function setAllPasswordsToKnown() {
  console.log('Resetting passwords for all main users to: Password123!');
  
  // 1. Reset passwords and confirm emails
  await sql`
    UPDATE auth.users 
    SET encrypted_password = crypt('Password123!', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now())
  `;

  const users = await sql`SELECT u.email, p.role FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id`;
  console.log('\n==================================================');
  console.log('DAFTAR AKUN & PASSWORD RESMI TEFA DKV');
  console.log('==================================================');
  console.log('Password untuk SEMUA akun di bawah ini: Password123!\n');
  for (const u of users) {
    console.log(`- Email: ${u.email} | Role: ${u.role || 'Student'}`);
  }
  console.log('==================================================\n');

  await sql.end();
}

setAllPasswordsToKnown();

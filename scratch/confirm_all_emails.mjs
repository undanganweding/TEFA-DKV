import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function autoConfirmAllEmails() {
  console.log('Confirming emails for all users in auth.users...');
  await sql`UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL`;
  console.log('All user emails confirmed successfully!');
  await sql.end();
}

autoConfirmAllEmails();

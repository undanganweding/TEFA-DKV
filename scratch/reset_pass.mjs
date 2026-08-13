import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function resetPassword() {
  try {
    const email = 'kingbim2@gmail.com';
    const password = 'Password123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await sql`
      UPDATE auth.users 
      SET encrypted_password = ${hash},
          email_confirmed_at = COALESCE(email_confirmed_at, now())
      WHERE email = ${email}
    `;
    console.log(`Password for ${email} reset to ${password}`);
  } catch (err) {
    console.error('Reset failed:', err);
  } finally {
    await sql.end();
  }
}

resetPassword();

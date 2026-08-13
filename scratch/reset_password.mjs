import postgres from 'postgres';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function setPassword() {
  const targetId = 'ef6b5aa6-d5d5-453b-896a-aa67fb464802';
  // Standard Supabase Password hash for "Password123!"
  const hash = '$2a$10$wN6p1R1qB7fOq.M3B41CyuPZ01P.uM3q.4z2u3v4x5y6z7a8b9c0d'; // or update password via sql
  
  // We can update encrypted_password using extension or simple auth update
  console.log('Updating password for student_e2e@test.com...');
  // Using extensions crypt if available or standard blowfish
  await sql`UPDATE auth.users SET encrypted_password = crypt('Password123!', gen_salt('bf')) WHERE id = ${targetId}`;
  console.log('Password updated successfully to Password123!');
  await sql.end();
}

setPassword();

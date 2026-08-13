import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function run() {
  try {
    const email = 'login_test@gmail.com';
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    // Check if exists
    const existing = await sql`SELECT id FROM auth.users WHERE email = ${email}`;
    if (existing.length > 0) {
      await sql`DELETE FROM auth.users WHERE id = ${existing[0].id}`;
    }

    const res = await sql`
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        ${email}, ${hash}, now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Login Test","role":"Student","status":"Active","nis":"123","school_class":"X","major":"DKV"}',
        now(), now()
      ) RETURNING id
    `;
    console.log('Inserted auth user:', res[0].id);

    const profile = await sql`SELECT * FROM profiles WHERE id = ${res[0].id}`;
    console.log('Profile created:', profile);
  } catch (error) {
    console.error('Trigger test failed:', error);
  } finally {
    await sql.end();
  }
}

run();

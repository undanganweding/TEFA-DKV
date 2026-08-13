import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function checkExistence() {
  const targetId = '38bc3c49-cbad-40a4-91cc-f827944c7730';
  
  console.log('--- 3. TEST PROFILE EXISTENCE ---');
  try {
    const authUser = await sql`SELECT id, email FROM auth.users WHERE id = ${targetId}`;
    console.log('auth.users:', authUser.length > 0 ? 'EXISTS' : 'DOES NOT EXIST', authUser);
    
    const profile = await sql`SELECT id, full_name, role, status FROM profiles WHERE id = ${targetId}`;
    console.log('profiles:', profile.length > 0 ? 'EXISTS' : 'DOES NOT EXIST', profile);
    
  } catch (error) {
    console.error('Database query error:', error);
  } finally {
    await sql.end();
  }
}

checkExistence();

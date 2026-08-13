import postgres from 'postgres';

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function run() {
  try {
    await sql.unsafe(`
      INSERT INTO public.profiles (
        id, full_name, role, status, nis, school_class, major, whatsapp, phone, avatar_path
      )
      SELECT 
        u.id,
        COALESCE(u.raw_user_meta_data->>'full_name', u.email),
        COALESCE(u.raw_user_meta_data->>'role', 'Student'),
        COALESCE(u.raw_user_meta_data->>'status', 'Active'),
        u.raw_user_meta_data->>'nis',
        u.raw_user_meta_data->>'school_class',
        u.raw_user_meta_data->>'major',
        u.raw_user_meta_data->>'whatsapp',
        u.raw_user_meta_data->>'phone',
        u.raw_user_meta_data->>'avatar_path'
      FROM auth.users u
      LEFT JOIN public.profiles p ON p.id = u.id
      WHERE p.id IS NULL;
    `);
    console.log('Profiles backfilled successfully!');
  } catch (error) {
    console.error('Backfill failed:', error);
  } finally {
    await sql.end();
  }
}

run();

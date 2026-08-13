import postgres from 'postgres';
const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function cleanAllBloatedMetadata() {
  try {
    console.log('Cleaning up bloated raw_user_meta_data in auth.users...');
    
    // Remove avatar_path if it starts with data: or is longer than 500 chars
    const res = await sql`
      UPDATE auth.users 
      SET raw_user_meta_data = raw_user_meta_data - 'avatar_path'
      WHERE raw_user_meta_data->>'avatar_path' LIKE 'data:%'
         OR length(raw_user_meta_data->>'avatar_path') > 500
    `;
    
    console.log('Cleaned users:', res.count);

    // Also check profiles table: if profiles table avatar_path has base64 string, set it to NULL
    const profileRes = await sql`
      UPDATE public.profiles
      SET avatar_path = NULL
      WHERE avatar_path LIKE 'data:%'
         OR length(avatar_path) > 500
    `;
    console.log('Cleaned profiles:', profileRes.count);

  } catch (err) {
    console.error('Cleanup error:', err);
  } finally {
    await sql.end();
  }
}

cleanAllBloatedMetadata();

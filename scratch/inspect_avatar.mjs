import postgres from 'postgres';
const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function inspectAvatar() {
  const user = await sql`SELECT raw_user_meta_data FROM auth.users WHERE email = 'kingbim2@gmail.com'`;
  const meta = user[0].raw_user_meta_data;
  console.log('Keys in user_metadata:', Object.keys(meta));
  if (meta.avatar_path) {
    console.log('avatar_path start:', meta.avatar_path.substring(0, 50));
    console.log('avatar_path length:', meta.avatar_path.length);
  }
  await sql.end();
}

inspectAvatar();

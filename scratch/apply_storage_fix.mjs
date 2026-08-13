import postgres from 'postgres';
const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function applyStoragePolicyFix() {
  try {
    console.log('Applying Storage Policy Fix for profile-images...');
    
    await sql.unsafe(`
      DROP POLICY IF EXISTS "Users can upload own profile image" ON storage.objects;
      DROP POLICY IF EXISTS "Anyone can upload profile image" ON storage.objects;

      CREATE POLICY "Anyone can upload profile image"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'profile-images');

      DROP POLICY IF EXISTS "Users can update own profile image" ON storage.objects;
      DROP POLICY IF EXISTS "Anyone can update profile image" ON storage.objects;

      CREATE POLICY "Anyone can update profile image"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'profile-images');
    `);
    
    console.log('Storage policy updated successfully!');
  } catch (err) {
    console.error('Policy update error:', err);
  } finally {
    await sql.end();
  }
}

applyStoragePolicyFix();

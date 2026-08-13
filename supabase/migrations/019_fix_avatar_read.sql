-- 019_fix_avatar_read.sql

-- 1. Ensure bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'profile-images';

-- 2. Drop existing select policy if any
DROP POLICY IF EXISTS "Anyone can read profile images" ON storage.objects;

-- 3. Create permissive select policy
CREATE POLICY "Anyone can read profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

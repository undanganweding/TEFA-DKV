-- 014_public_profile_images.sql

-- Make the profile-images bucket public to avoid expiring signed URLs
UPDATE storage.buckets
SET public = true
WHERE id = 'profile-images';

-- Add public read access policy
DROP POLICY IF EXISTS "Give public access to profile images" ON storage.objects;
CREATE POLICY "Give public access to profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

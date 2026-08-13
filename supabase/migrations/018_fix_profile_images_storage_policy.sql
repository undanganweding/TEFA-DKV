-- 018_fix_profile_images_storage_policy.sql

-- Fix RLS policy on storage.objects for profile-images bucket so avatar uploads during signup/profile edit never fail with 403 AccessDenied
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

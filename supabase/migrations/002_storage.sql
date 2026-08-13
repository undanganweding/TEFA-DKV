-- ==========================================================
-- TEFA DKV — STORAGE BUCKETS
-- ==========================================================
-- Execute in Supabase Dashboard > SQL Editor
-- ==========================================================

-- 1. Profile Images (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-images', 'profile-images', false, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- 2. Product Images (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- 3. Inventory Images (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('inventory-images', 'inventory-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- 4. Design Files (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('design-files', 'design-files', false, 10485760, ARRAY[
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'application/x-coreldraw', 'application/cdr',
  'application/postscript', 'application/illustrator',
  'application/octet-stream'
])
ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- STORAGE POLICIES
-- ==========================================================

-- Profile Images: Owner upload/update, Admin manage
CREATE POLICY "Users can upload own profile image"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own profile image"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own profile image"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin')
  ));

CREATE POLICY "Admin can delete profile images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin'));

-- Product Images: Public read, Admin manage
CREATE POLICY "Anyone can read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admin can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin'));

CREATE POLICY "Admin can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin'));

CREATE POLICY "Admin can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin'));

-- Inventory Images: Admin only
CREATE POLICY "Admin can manage inventory images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'inventory-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin'));

-- Design Files: Student own, Guest own order, Admin all
CREATE POLICY "Authenticated users can upload design files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'design-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can read own design files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'design-files' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin')
  ));

CREATE POLICY "Admin can delete design files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'design-files' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin'));

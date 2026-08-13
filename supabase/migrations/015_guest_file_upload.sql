-- 015_guest_file_upload.sql
-- Allow anonymous guest users to upload files to design-files bucket
-- scoped to guest-orders/{order_id}/{guest_access_token}/ path pattern.
-- The policy validates that the order_id and guest_access_token are valid.

-- ==========================================================
-- HELPER FUNCTION: Verify guest order token
-- ==========================================================
CREATE OR REPLACE FUNCTION public.verify_guest_order_token(
  p_order_id text,
  p_token text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM orders
    WHERE id::text = p_order_id
      AND guest_access_token::text = p_token
  );
END;
$$;

-- ==========================================================
-- STORAGE POLICY: Allow anonymous guest uploads to design-files
-- Path pattern: guest-orders/{order_uuid}/{guest_access_token}/{filename}
-- ==========================================================
DROP POLICY IF EXISTS "Guest can upload design files for their order" ON storage.objects;
CREATE POLICY "Guest can upload design files for their order"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'design-files'
  AND (storage.foldername(name))[1] = 'guest-orders'
  AND public.verify_guest_order_token(
    (storage.foldername(name))[2],
    (storage.foldername(name))[3]
  )
);

-- ==========================================================
-- STORAGE POLICY: Allow Admin to read all design-files (including guest-orders/)
-- The existing policy already covers this if admin check works,
-- but we add an explicit one for guest-orders path for safety.
-- ==========================================================
DROP POLICY IF EXISTS "Admin can read all design files including guest" ON storage.objects;
CREATE POLICY "Admin can read all design files including guest"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'design-files'
  AND (storage.foldername(name))[1] = 'guest-orders'
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin')
);

-- ==========================================================
-- Update design-files bucket allowed_mime_types to include common document types
-- ==========================================================
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'application/x-coreldraw', 'application/cdr',
  'application/postscript', 'application/illustrator',
  'application/octet-stream'
]
WHERE id = 'design-files';

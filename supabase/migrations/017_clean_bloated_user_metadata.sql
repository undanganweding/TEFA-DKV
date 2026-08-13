-- Migration 017: Clean up bloated base64 avatar strings from auth.users metadata and profiles table
-- Storing base64 images in user_metadata bloats the Supabase Auth JWT token (>100KB), causing Cloudflare to throw 400 Request Header Or Cookie Too Large or net::ERR_CONNECTION_CLOSED.

UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data - 'avatar_path'
WHERE raw_user_meta_data->>'avatar_path' LIKE 'data:%'
   OR length(raw_user_meta_data->>'avatar_path') > 500;

UPDATE public.profiles
SET avatar_path = NULL
WHERE avatar_path LIKE 'data:%'
   OR length(avatar_path) > 500;

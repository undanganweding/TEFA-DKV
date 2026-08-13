-- Migration: 013_fix_tracking_and_registration.sql

-- ==========================================================
-- 1. FIX TRACKING: EXPOSE RPC TO GUESTS
-- ==========================================================
-- Supabase PostgREST requires explicit GRANT to allow the anon 
-- role to discover and execute custom schema functions.
GRANT EXECUTE ON FUNCTION public.track_guest_order(text, text, uuid) TO anon, authenticated;


-- ==========================================================
-- 2. FIX REGISTRATION: TRIGGER-BASED PROFILE CREATION
-- ==========================================================
-- This function runs implicitly as superuser when a new row 
-- is inserted into auth.users. It safely bypasses the RLS 
-- 401/403 constraints encountered when email confirm is enabled 
-- and data.session is null in the frontend.

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- We ONLY want to auto-create profiles for students. 
  -- Admins might be created differently, but we can default to Student 
  -- if raw_user_meta_data explicitly requests it.
  
  -- Insert into profiles using data from raw_user_meta_data
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    status, 
    nis, 
    school_class, 
    major, 
    whatsapp, 
    phone, 
    avatar_path
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Student'),
    COALESCE(NEW.raw_user_meta_data->>'status', 'Active'),
    NEW.raw_user_meta_data->>'nis',
    NEW.raw_user_meta_data->>'school_class',
    NEW.raw_user_meta_data->>'major',
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_path'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow idempotent migration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user_profile();

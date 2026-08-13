-- Migration 017: Fix profiles role constraint and trigger for signup
-- Execute in Supabase SQL Editor if needed

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('Admin', 'Student', 'Kepala TEFA', 'Admin TEFA', 'Guru / Operator', 'Siswa', 'Guest'));

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
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
EXCEPTION WHEN OTHERS THEN
  -- Fallback if duplicate insert or trigger issue
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

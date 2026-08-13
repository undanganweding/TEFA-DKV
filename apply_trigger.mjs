import postgres from 'postgres';
import fs from 'fs';

const DB_URL = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const sql = postgres(DB_URL);

async function run() {
  try {
    await sql.unsafe(`
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user_profile();
    `);
    console.log('Trigger applied successfully!');
  } catch (error) {
    console.error('Trigger creation failed:', error);
  } finally {
    await sql.end();
  }
}

run();

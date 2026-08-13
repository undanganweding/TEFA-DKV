import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

/**
 * Profile row shape returned from Supabase profiles table
 */
interface ProfileRow {
  id: string;
  full_name: string;
  role: string;
  status: string;
  school_class: string | null;
  phone: string | null;
  address: string | null;
  avatar_path: string | null;
  nis: string | null;
  major: string | null;
  whatsapp: string | null;
  position: string | null;
  nip: string | null;
  employee_id: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Maps a Supabase profile row + auth user to the existing UserProfile interface.
 * This adapter ensures the rest of the app can use the same UserProfile type.
 */
export function mapProfileToUserProfile(
  profile: ProfileRow,
  email: string
): UserProfile {
  const isAdmin = profile.role === 'Admin';
  return {
    id: profile.id,
    name: profile.full_name,
    email: email,
    role: isAdmin ? 'Admin TEFA' : 'Siswa',
    avatar: profile.avatar_path || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
    defaultPage: isAdmin ? 'dashboard' : 'public_upload',
    statusAkun: profile.status === 'Active' ? 'Active' : profile.status === 'Pending' ? 'Pending' : profile.status === 'Rejected' ? 'Rejected' : 'Active',
    phone: profile.phone || '',
    address: profile.address || undefined,
    whatsapp: profile.whatsapp || undefined,
    nis: profile.nis || undefined,
    studentClass: profile.school_class || undefined,
    major: profile.major || undefined,
    position: profile.position || undefined,
    nip: profile.nip || undefined,
    employeeId: profile.employee_id || undefined,
    rejectReason: profile.reject_reason || undefined,
    createdAt: profile.created_at,
    theme: 'light',
    notifications: { orderNotif: true, fileInboxNotif: true, productionNotif: true, stockNotif: true },
  };
}

// ===== AUTH OPERATIONS =====

export async function signIn(email: string, password: string): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { success: false, message: error.message === 'Invalid login credentials' ? 'Email atau password yang Anda masukkan salah.' : error.message };
  }

  if (!data.user) {
    return { success: false, message: 'Login gagal. Silakan coba lagi.' };
  }

  // Fetch profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profileData) {
    return { success: false, message: 'Profil tidak ditemukan. Hubungi admin.' };
  }

  const profile = profileData as ProfileRow;

  // Check account status
  if (profile.status === 'Pending') {
    await supabase.auth.signOut();
    return { success: false, message: 'Akun Anda sedang menunggu persetujuan admin TEFA. Silakan hubungi pengelola.' };
  }
  if (profile.status === 'Rejected') {
    await supabase.auth.signOut();
    return { success: false, message: `Akun Anda ditolak. ${profile.reject_reason ? 'Alasan: ' + profile.reject_reason : 'Silakan hubungi Admin untuk informasi lebih lanjut.'}` };
  }

  const userProfile = mapProfileToUserProfile(profile, data.user.email || email);
  return { success: true, user: userProfile };
}

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
  nis: string;
  studentClass: string;
  major: string;
  whatsapp: string;
  avatar?: string;
}): Promise<{ success: boolean; message?: string; user?: any }> {
  const cleanEmail = input.email.trim().toLowerCase();

  // Create auth user and pass profile metadata to the database trigger
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: input.password,
    options: {
      data: {
        full_name: input.name.trim(),
        role: 'Student',
        status: 'Active',
        nis: input.nis.trim(),
        school_class: input.studentClass.trim(),
        major: input.major.trim() || 'Desain Komunikasi Visual',
        whatsapp: input.whatsapp.trim(),
        phone: input.whatsapp.trim(),
        avatar_path: input.avatar || null,
      },
    },
  });

  if (error) {
    if (error.status === 429 || error.message?.toLowerCase().includes('rate limit') || error.message?.toLowerCase().includes('too many requests')) {
      return { success: false, message: 'Terlalu banyak percobaan pendaftaran. Silakan tunggu beberapa saat sebelum mencoba lagi.' };
    }
    if (error.message?.includes('already registered')) {
      return { success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' };
    }
    return { success: false, message: error.message };
  }

  if (!data.user) {
    return { success: false, message: 'Registrasi gagal. Silakan coba lagi.' };
  }

  // Handle Supabase Email Enumeration Protection: if identities is empty, the email was already taken
  if (data.user.identities && data.user.identities.length === 0) {
    return { success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' };
  }

  // The Postgres trigger `on_auth_user_created` automatically creates the profile securely.
  
  // Sign out after registration so they can explicitly login with the success screen,
  // or gracefully handle if the session is null due to email confirmation rules.
  if (data.session) {
    await supabase.auth.signOut();
  }

  return { success: true, message: 'Registrasi berhasil!', user: data.user };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<any> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('getSession error:', error);
      return null;
    }
    return session;
  } catch (err) {
    console.error('getSession exception:', err);
    return null;
  }
}

export async function fetchUserProfile(user: any): Promise<UserProfile | null> {
  try {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profileData) {
      console.warn('Profile not found or error fetching profile:', error);
      return null;
    }

    const profile = profileData as ProfileRow;
    if (profile.status !== 'Active') return null;

    return mapProfileToUserProfile(profile, user.email || '');
  } catch (err) {
    console.error('fetchUserProfile error:', err);
    return null;
  }
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

export async function resetPassword(email: string): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true, message: 'Email reset password telah dikirim. Silakan periksa inbox Anda.' };
}

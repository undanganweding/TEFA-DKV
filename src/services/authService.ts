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

const ADMIN_ROLES = ['Admin', 'Super Admin', 'Kepala TEFA', 'Guru', 'Staff'];

/**
 * Maps a Supabase profile row + auth user to the existing UserProfile interface.
 * This adapter ensures the rest of the app can use the same UserProfile type.
 */
export function mapProfileToUserProfile(
  profile: ProfileRow,
  email: string
): UserProfile {
  const isAdmin = ADMIN_ROLES.includes(profile.role);
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
    if (error.status === 429) {
      return { success: false, message: 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat.' };
    }
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, message: 'Email atau password yang Anda masukkan salah.' };
    }
    if (error.message.includes('Email not confirmed')) {
      return { success: false, message: 'Email belum dikonfirmasi. Silakan konfirmasi email Anda.' };
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
      return { success: false, message: 'Koneksi jaringan terputus. Pastikan internet Anda stabil.' };
    }
    return { success: false, message: error.message };
  }

  if (!data.user) {
    return { success: false, message: 'Login gagal. Silakan coba lagi.' };
  }

  try {
    // Fetch profile using the deduplicated method
    const userProfile = await fetchUserProfile(data.user);

    if (!userProfile) {
      return { success: false, message: 'Profil tidak ditemukan. Registrasi mungkin tidak selesai sempurna. Hubungi admin.' };
    }

    // Check account status
    if (userProfile.statusAkun === 'Pending') {
      await supabase.auth.signOut();
      return { success: false, message: 'Akun Anda sedang menunggu persetujuan admin TEFA. Silakan hubungi pengelola.' };
    }
    if (userProfile.statusAkun === 'Rejected') {
      await supabase.auth.signOut();
      return { success: false, message: `Akun Anda ditolak. Silakan hubungi Admin untuk informasi lebih lanjut.` };
    }

    return { success: true, user: userProfile };
  } catch (err: any) {
    if (err.message === 'NETWORK_ERROR') {
      return { success: false, message: 'Koneksi terputus saat mengambil data profil.' };
    }
    return { success: false, message: 'Gagal memuat profil: ' + (err.message || 'Data kosong') };
  }
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

  // Upload avatar if provided
  if (input.avatar && input.avatar.startsWith('data:image')) {
    try {
      const arr = input.avatar.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (mimeMatch) {
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const file = new File([u8arr], `avatar-${Date.now()}.${mime.split('/')[1] || 'png'}`, { type: mime });
        const path = `${data.user.id}/${file.name}`;
        
        const { error: uploadError } = await supabase.storage.from('profile-images').upload(path, file, { upsert: true });
        
        if (!uploadError) {
          const { data: publicData } = supabase.storage.from('profile-images').getPublicUrl(path);
          if (publicData) {
            await supabase.from('profiles').update({ avatar_path: publicData.publicUrl }).eq('id', data.user.id);
          }
        } else {
          console.error("Avatar upload error:", uploadError);
        }
      }
    } catch (e) {
      console.error("Error uploading avatar during signup", e);
    }
  }

  // Sign out after registration so they can explicitly login with the success screen
  if (data.session) {
    await supabase.auth.signOut();
  }

  const resultUser = {
    ...data.user,
    full_name: data.user.user_metadata?.full_name || input.name,
    school_class: data.user.user_metadata?.school_class || input.studentClass,
    major: data.user.user_metadata?.major || input.major,
    whatsapp: data.user.user_metadata?.whatsapp || input.whatsapp,
    avatar_path: input.avatar || data.user.user_metadata?.avatar_path || null,
  };

  return { success: true, message: 'Registrasi berhasil!', user: resultUser };
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // Fallback: try direct REST logout
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      if (token) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/logout?scope=global`, {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'omit',
        });
      }
    } catch {
      // Ignore network errors during signout
    }
  }
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
  if (!user) return null;

  // Try to fetch actual profile from database first
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profileError && profileData) {
      console.log('[AUTH] Profile fetched from DB:', profileData.role);
      return mapProfileToUserProfile(profileData as ProfileRow, user.email || '');
    }

    if (profileError) {
      console.warn('[AUTH] Profile DB fetch error, falling back to user_metadata:', profileError.message);
    }
  } catch (err: any) {
    console.warn('[AUTH] Profile fetch exception, using user_metadata fallback:', err.message);
  }

  // Fallback to user_metadata if DB fetch fails
  const meta = user.user_metadata || {};
  const fallbackProfile: ProfileRow = {
    id: user.id,
    full_name: meta.full_name || user.email || 'Pengguna TEFA',
    role: meta.role || 'Student',
    status: meta.status || 'Active',
    school_class: meta.school_class || null,
    phone: meta.phone || null,
    address: null,
    avatar_path: meta.avatar_path || null,
    nis: meta.nis || null,
    major: meta.major || null,
    whatsapp: meta.whatsapp || null,
    position: null,
    nip: null,
    employee_id: null,
    reject_reason: null,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return mapProfileToUserProfile(fallbackProfile, user.email || '');
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

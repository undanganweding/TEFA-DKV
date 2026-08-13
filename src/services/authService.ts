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
      // It might be a network error or missing profile.
      // We rely on fetchUserProfile to throw if it's a network error, otherwise it returns null if missing or inactive.
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
        role: 'Siswa',
        status: 'Active',
        nis: input.nis.trim(),
        school_class: input.studentClass.trim(),
        major: input.major.trim() || 'Desain Komunikasi Visual',
        whatsapp: input.whatsapp.trim(),
        phone: input.whatsapp.trim(),
        avatar_path: null,
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

// Single-flight deduplication tracker for profile fetches
let inFlightProfileRequest: Promise<UserProfile | null> | null = null;

export async function fetchUserProfile(user: any): Promise<UserProfile | null> {
  // If there's an ongoing fetch for a profile, return that same promise
  if (inFlightProfileRequest) {
    return inFlightProfileRequest;
  }

  inFlightProfileRequest = (async () => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profileData) {
        // Distinguish between network errors and not found
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Network') || error?.message?.includes('ERR_CONNECTION_CLOSED')) {
          console.error('NETWORK_ERROR: Koneksi terputus saat mengambil data profil:', error);
          throw new Error('NETWORK_ERROR'); 
        }
        if (error?.code === 'PGRST116') {
          console.warn('PROFILE_NOT_FOUND: Profil tidak ditemukan di database.', error);
          return null;
        }
        
        console.warn('DB_ERROR: Error fetching profile:', error);
        return null;
      }

      const profile = profileData as ProfileRow;
      if (profile.status !== 'Active') return null;

      return mapProfileToUserProfile(profile, user.email || '');
    } catch (err: any) {
      console.error('fetchUserProfile error:', err);
      if (err.message === 'NETWORK_ERROR') throw err; // propagate network error
      return null;
    } finally {
      // Clear the in-flight request when done
      inFlightProfileRequest = null;
    }
  })();

  return inFlightProfileRequest;
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

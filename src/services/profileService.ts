/**
 * Profile Service — Mixed: REST for database, Supabase JS for Edge Functions.
 */

import { supabase } from '../lib/supabase';
import { restCall } from '../lib/restClient';
import type { UserProfile } from '../types';
import { mapProfileToUserProfile } from './authService';

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
  email?: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
}

// ===== PROFILE / USER MANAGEMENT =====

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    // Try RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_users_admin');

    let usersList: any[] = [];

    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      usersList = rpcData;
    } else {
      // Fallback to Edge Function
      const { data } = await supabase.functions.invoke('admin-manage-users', {
        body: { action: 'list' }
      });

      if (!data?.error && data?.success && Array.isArray(data.data)) {
        usersList = data.data;
      } else {
        // Last resort: REST direct
        const result = await restCall<ProfileRow[]>('GET', 'profiles?select=*&order=created_at.desc');
        if (result.data) {
          usersList = result.data.map(p => ({ ...p, email: '' }));
        }
      }
    }

    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();

    return usersList.map((u: any) => {
      const profile = mapProfileToUserProfile(u, '');
      const createdDate = new Date(u.created_at || new Date()).getTime();
      return {
        ...profile,
        email: u.email || profile.email || '',
        emailConfirmedAt: u.email_confirmed_at,
        lastSignInAt: u.last_sign_in_at,
        isNewUser: (now - createdDate) <= SEVEN_DAYS
      };
    });
  } catch (err) {
    console.error('Failed to get all users:', err);
    return [];
  }
}

export async function getUsersByFilter(filter: 'all' | 'pending' | 'active' | 'admin' | 'inactive'): Promise<UserProfile[]> {
  let filterQuery = '';
  switch (filter) {
    case 'pending': filterQuery = '&status=eq.Pending'; break;
    case 'active': filterQuery = '&status=eq.Active'; break;
    case 'admin': filterQuery = '&role=eq.Admin'; break;
    case 'inactive': filterQuery = '&status=eq.Rejected'; break;
  }
  const result = await restCall<ProfileRow[]>(
    'GET',
    `profiles?select=*&order=created_at.desc${filterQuery}`
  );
  if (!result.data) return [];
  return result.data.map(p => mapProfileToUserProfile(p, ''));
}

export async function activateUser(userId: string): Promise<boolean> {
  const result = await restCall('PATCH', `profiles?id=eq.${userId}`, { status: 'Active', reject_reason: null });
  return !result.error;
}

export async function suspendUser(userId: string, reason: string = 'Melanggar ketentuan'): Promise<boolean> {
  const result = await restCall('PATCH', `profiles?id=eq.${userId}`, { status: 'Inactive', reject_reason: reason });
  return !result.error;
}

export async function uploadAvatar(userId: string, file: File): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    const ext = file.name.split('.').pop() || 'png';
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      return { success: false, message: 'Gagal mengunggah gambar ke storage: ' + uploadError.message };
    }

    const { data: publicData } = supabase.storage.from('profile-images').getPublicUrl(path);
    const publicUrl = publicData.publicUrl;

    const result = await restCall('PATCH', `profiles?id=eq.${userId}`, { avatar_path: publicUrl });
    if (result.error) {
      return { success: false, message: 'Gagal memperbarui profil di database: ' + result.error.message };
    }

    return { success: true, url: publicUrl };
  } catch (err: any) {
    return { success: false, message: 'Terjadi kesalahan saat mengunggah foto profil.' };
  }
}

export async function updateProfile(userId: string, updates: {
  full_name?: string;
  phone?: string;
  address?: string;
  school_class?: string;
  major?: string;
  whatsapp?: string;
  nis?: string;
  avatar_path?: string | null;
  position?: string;
  nip?: string;
  employee_id?: string;
  role?: string;
  status?: string;
}): Promise<boolean> {
  const result = await restCall('PATCH', `profiles?id=eq.${userId}`, updates);
  return !result.error;
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  const result = await restCall('DELETE', `profiles?id=eq.${userId}`);
  if (result.error) {
    return { success: false, message: 'Gagal menghapus user: ' + result.error.message };
  }
  return { success: true, message: 'Akun berhasil dihapus.' };
}

export async function getPendingCount(): Promise<number> {
  const result = await restCall<ProfileRow[]>('GET', 'profiles?status=eq.Pending&select=id');
  return result.data?.length || 0;
}

export async function adminSetPassword(targetUserId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-manage-users', {
      body: { action: 'reset_password', targetUserId, newPassword }
    });
    if (error) return { success: false, message: error.message || 'Gagal menghubungi server.' };
    if (data?.error) return { success: false, message: data.error };
    return { success: true, message: 'Password berhasil diubah.' };
  } catch (err: any) {
    return { success: false, message: 'Terjadi kesalahan internal.' };
  }
}

export async function adminChangeEmail(targetUserId: string, newEmail: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-manage-users', {
      body: { action: 'update_email', targetUserId, newEmail }
    });
    if (error) return { success: false, message: error.message || 'Gagal联系的服务器.' };
    if (data?.error) return { success: false, message: data.error };
    return { success: true, message: 'Email berhasil diperbarui.' };
  } catch (err: any) {
    return { success: false, message: 'Terjadi kesalahan internal.' };
  }
}

export async function adminDeleteUserSecure(targetUserId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-manage-users', {
      body: { action: 'delete_user', targetUserId }
    });
    if (error) return { success: false, message: error.message || 'Gagal联系的服务器.' };
    if (data?.error) return { success: false, message: data.error };
    return { success: true, message: 'Akun berhasil dihapus secara permanen.' };
  } catch (err: any) {
    return { success: false, message: 'Terjadi kesalahan internal.' };
  }
}

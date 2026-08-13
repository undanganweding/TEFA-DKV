import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';
import { mapProfileToUserProfile } from './authService';

// ===== PROFILE / USER MANAGEMENT =====

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-manage-users', {
      body: { action: 'list' }
    });

    if (error || !data?.success) {
      console.error('Error fetching users from edge function:', error || data?.error);
      return [];
    }

    const usersList = data.data || [];
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();

    return usersList.map((u: any) => {
      const profile = mapProfileToUserProfile(u, '');
      const createdDate = new Date(u.created_at || new Date()).getTime();
      return {
        ...profile,
        email: u.email || '',
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
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

  switch (filter) {
    case 'pending':
      query = query.eq('status', 'Pending');
      break;
    case 'active':
      query = query.eq('status', 'Active');
      break;
    case 'admin':
      query = query.eq('role', 'Admin');
      break;
    case 'inactive':
      query = query.eq('status', 'Rejected');
      break;
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching filtered users:', error);
    return [];
  }

  return (data || []).map(p => mapProfileToUserProfile(p, ''));
}

export async function activateUser(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'Active', reject_reason: null })
    .eq('id', userId);

  if (error) {
    console.error('Error activating user:', error);
    return false;
  }
  return true;
}

export async function suspendUser(userId: string, reason: string = 'Melanggar ketentuan'): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'Inactive', reject_reason: reason })
    .eq('id', userId);

  if (error) {
    console.error('Error suspending user:', error);
    return false;
  }
  return true;
}

export async function uploadAvatar(userId: string, file: File): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    const ext = file.name.split('.').pop() || 'png';
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return { success: false, message: 'Gagal mengunggah gambar ke storage: ' + uploadError.message };
    }

    const { data: publicData } = supabase.storage.from('profile-images').getPublicUrl(path);
    const publicUrl = publicData.publicUrl;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_path: publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating avatar_path in profile:', updateError);
      return { success: false, message: 'Gagal memperbarui profil di database: ' + updateError.message };
    }

    return { success: true, url: publicUrl };
  } catch (err: any) {
    console.error('Unexpected avatar upload error:', err);
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
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    return false;
  }
  return true;
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  // Delete profile (cascades from auth.users via ON DELETE CASCADE)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: 'Gagal menghapus user: ' + error.message };
  }
  return { success: true, message: 'Akun berhasil dihapus.' };
}

export async function getPendingCount(): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Pending');

  if (error) return 0;
  return count || 0;
}

export async function adminSetPassword(targetUserId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-manage-users', {
      body: { action: 'reset_password', targetUserId, newPassword }
    });

    if (error) {
      console.error('Edge function error:', error);
      return { success: false, message: error.message || 'Gagal menghubungi server untuk mengubah password.' };
    }

    if (data?.error) {
      return { success: false, message: data.error };
    }

    return { success: true, message: 'Password berhasil diubah.' };
  } catch (err: any) {
    console.error('Unexpected error setting password:', err);
    return { success: false, message: 'Terjadi kesalahan internal.' };
  }
}

export async function adminChangeEmail(targetUserId: string, newEmail: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-manage-users', {
      body: { action: 'update_email', targetUserId, newEmail }
    });

    if (error) return { success: false, message: error.message || 'Gagal menghubungi server.' };
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

    if (error) return { success: false, message: error.message || 'Gagal menghubungi server.' };
    if (data?.error) return { success: false, message: data.error };

    return { success: true, message: 'Akun berhasil dihapus secara permanen.' };
  } catch (err: any) {
    return { success: false, message: 'Terjadi kesalahan internal.' };
  }
}

import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';
import { mapProfileToUserProfile } from './authService';

// ===== PROFILE / USER MANAGEMENT =====

export async function getAllUsers(): Promise<UserProfile[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  // We need emails from auth - fetch via admin or join approach
  // For now, map profiles without emails (admin can see from Supabase dashboard)
  return (profiles || []).map(p => mapProfileToUserProfile(p, ''));
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

export async function approveUser(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'Active', reject_reason: null })
    .eq('id', userId);

  if (error) {
    console.error('Error approving user:', error);
    return false;
  }
  return true;
}

export async function rejectUser(userId: string, reason: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'Rejected', reject_reason: reason })
    .eq('id', userId);

  if (error) {
    console.error('Error rejecting user:', error);
    return false;
  }
  return true;
}

export async function updateProfile(userId: string, updates: {
  full_name?: string;
  phone?: string;
  address?: string;
  school_class?: string;
  major?: string;
  whatsapp?: string;
  nis?: string;
  avatar_path?: string;
  position?: string;
  nip?: string;
  employee_id?: string;
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

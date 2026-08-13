import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    referenceType: row.reference_type || undefined,
    referenceId: row.reference_id || undefined,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}

export async function createNotification(notif: {
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceType?: string;
  referenceId?: string;
}): Promise<boolean> {
  const { error } = await supabase.from('notifications').insert({
    user_id: notif.userId,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    reference_type: notif.referenceType || null,
    reference_id: notif.referenceId || null,
  });
  return !error;
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  return !error;
}

export async function markAllAsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  return !error;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) return 0;
  return count || 0;
}

// ===== ACTIVITY LOGS =====

export async function logActivity(log: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const { error } = await supabase.from('activity_logs').insert({
    actor_id: log.actorId || null,
    action: log.action,
    entity_type: log.entityType,
    entity_id: log.entityId,
    description: log.description || null,
    metadata: log.metadata || null,
  });
  if (error) {
    console.error('Error logging activity:', error);
  }
  return !error;
}

export async function fetchActivityLogs(limit: number = 50): Promise<Array<{
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}>> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    actorId: row.actor_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    description: row.description,
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.created_at,
  }));
}

/**
 * Notification Service — Direct REST API client.
 */

import { restCall } from '../lib/restClient';

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

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
  const result = await restCall<NotificationRow[]>(
    'GET',
    `notifications?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc&limit=50`
  );
  if (!result.data) return [];
  return result.data.map(row => ({
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
  const result = await restCall('POST', 'notifications', {
    user_id: notif.userId,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    reference_type: notif.referenceType || null,
    reference_id: notif.referenceId || null,
  });
  return !result.error;
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  const result = await restCall('PATCH', `notifications?id=eq.${notificationId}`, { is_read: true });
  return !result.error;
}

export async function markAllAsRead(userId: string): Promise<boolean> {
  const result = await restCall('PATCH', `notifications?user_id=eq.${encodeURIComponent(userId)}&is_read=eq.false`, { is_read: true });
  return !result.error;
}

// ===== ACTIVITY LOGS =====

interface ActivityLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function logActivity(log: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const result = await restCall('POST', 'activity_logs', {
    actor_id: log.actorId || null,
    action: log.action,
    entity_type: log.entityType,
    entity_id: log.entityId,
    description: log.description || null,
    metadata: log.metadata || null,
  });
  return !result.error;
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
  const result = await restCall<ActivityLogRow[]>(
    'GET',
    `activity_logs?select=*&order=created_at.desc&limit=${limit}`
  );
  if (!result.data) return [];
  return result.data.map(row => ({
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

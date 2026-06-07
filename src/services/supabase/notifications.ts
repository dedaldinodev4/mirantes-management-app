import { supabase } from './client'
import type { AppNotification, NotificationType } from '@/types'
import type { TablesInsert } from './database.types'

//* ── Row mapper *//
function rowToNotification(row: {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  read: boolean
  task_id: string | null
  project_id: string | null
  actor_id: string | null
  created_at: string
}): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    read: row.read,
    taskId: row.task_id,
    projectId: row.project_id,
    actorId: row.actor_id,
    createdAt: row.created_at,
  }
}

//* ── Get notifications for user *//
export async function getUserNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToNotification)
}

//* ── Get unread count *//
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) return 0
  return count ?? 0
}

//* ── Mark as read *//
export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
  if (error) throw new Error(error.message)
}

//* ── Mark all as read *//
export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw new Error(error.message)
}

//* ── Delete a notification *//
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
  if (error) throw new Error(error.message)
}

//* ── Delete all notifications for user *//
export async function deleteAllNotifications(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}

//* ── Create notification (internal helper) *//
export async function createNotification(
  payload: Omit<AppNotification, 'id' | 'createdAt'>,
): Promise<void> {
  const insert: TablesInsert<'notifications'> = {
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    read: false,
    task_id: payload.taskId ?? null,
    project_id: payload.projectId ?? null,
    actor_id: payload.actorId ?? null,
  }
  const { error } = await supabase.from('notifications').insert(insert)
  if (error) console.warn('createNotification error:', error.message)
}

//* ── Notify all project members except the actor *//
export async function notifyProjectMembers(params: {
  memberIds: string[]
  actorId: string
  type: NotificationType
  title: string
  body: string
  taskId?: string
  projectId?: string
}): Promise<void> {
  const targets = params.memberIds.filter((id) => id !== params.actorId)
  if (!targets.length) return

  const inserts: TablesInsert<'notifications'>[] = targets.map((userId) => ({
    user_id: userId,
    type: params.type,
    title: params.title,
    body: params.body,
    read: false,
    task_id: params.taskId ?? null,
    project_id: params.projectId ?? null,
    actor_id: params.actorId,
  }))

  const { error } = await supabase.from('notifications').insert(inserts)
  if (error) console.warn('notifyProjectMembers error:', error.message)
}

//* ── Subscribe to realtime notifications *//
export function subscribeToNotifications(
  userId: string,
  onNew: (notification: AppNotification) => void,
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNew(rowToNotification(payload.new as any))
      },
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

import { supabase } from './client'
import type { AppNotification, NotificationType } from '@/types'
import type { TablesInsert } from './database.types'

// ── Singleton channel — garantia de canal único por sessão ────────────────────
let activeChannel: ReturnType<typeof supabase.channel> | null = null
let activeUserId: string | null = null

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
// Uses service role via RPC to bypass RLS — see schema.sql for the function
export async function createNotification(
  payload: Omit<AppNotification, 'id' | 'createdAt'>,
): Promise<void> {
  // Call a Postgres function that runs with SECURITY DEFINER (bypasses RLS)
  const { error } = await supabase.rpc('create_notification', {
    p_user_id:   payload.userId,
    p_type:      payload.type,
    p_title:     payload.title,
    p_body:      payload.body,
    p_task_id:   payload.taskId ?? null,
    p_project_id:payload.projectId ?? null,
    p_actor_id:  payload.actorId ?? null,
  })
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

  // Call for each target (RPC handles RLS bypass)
  await Promise.allSettled(
    targets.map((userId) =>
      createNotification({
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        read: false,
        taskId: params.taskId ?? null,
        projectId: params.projectId ?? null,
        actorId: params.actorId,
      }),
    ),
  )
}

//* ── Subscribe to realtime notifications *//
export function subscribeToNotifications(
  userId: string,
  onNew: (notification: AppNotification) => void,
): () => void {
  // Se já existe canal activo para este utilizador, não criar outro
  if (activeChannel && activeUserId === userId) {
    return () => {} // cleanup vazio — o canal é gerido globalmente
  }

  // Limpar canal anterior se existia para outro utilizador
  if (activeChannel) {
    supabase.removeChannel(activeChannel)
    activeChannel = null
    activeUserId = null
  }

  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNew(rowToNotification(payload.new as Parameters<typeof rowToNotification>[0]))
      },
    )
    .subscribe()

  activeChannel = channel
  activeUserId = userId

  return () => {
    if (activeChannel === channel) {
      supabase.removeChannel(channel)
      activeChannel = null
      activeUserId = null
    }
  }
}

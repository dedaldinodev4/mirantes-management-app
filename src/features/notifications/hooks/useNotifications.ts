'use client'

import { useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationsStore } from '@/stores/notifications.store'
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  subscribeToNotifications,
} from '@/services/supabase/notifications'

export function useNotifications() {
  const { sessionUser } = useAuthStore()
  const store = useNotificationsStore()
  const loadedRef = useRef(false)
   // Track the cleanup function so we only subscribe once across re-renders
   const cleanupRef = useRef<(() => void) | null>(null)


  //* ── Load once per session *//
  const load = useCallback(async () => {
    if (!sessionUser || loadedRef.current) return
    loadedRef.current = true
    store.setLoading(true)
    try {
      const data = await getUserNotifications(sessionUser.id)
      store.setNotifications(data)
    } catch {
      // silent
    } finally {
      store.setLoading(false)
    }
  }, [sessionUser?.id])

  useEffect(() => { load() }, [load])

  //* ── Single realtime subscription per user session *//
  useEffect(() => {
    if (!sessionUser) return
    // Already subscribed — do nothing
    if (cleanupRef.current) return

    const cleanup = subscribeToNotifications(sessionUser.id, (newNotif) => {
      store.addNotification(newNotif)
      toast(newNotif.title, {
        description: newNotif.body,
        icon: '🔔',
        duration: 5000,
      })
    })

    cleanupRef.current = cleanup

    return () => {
      cleanup()
      cleanupRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser?.id])

  //* ── Actions *//
  const handleMarkAsRead = async (id: string) => {
    store.markAsRead(id)
    await markAsRead(id).catch(() => {})
  }

  const handleMarkAllAsRead = async () => {
    if (!sessionUser) return
    store.markAllAsRead()
    await markAllAsRead(sessionUser.id).catch(() => {})
  }

  const handleDelete = async (id: string) => {
    store.removeNotification(id)
    await deleteNotification(id).catch(() => {})
  }

  const handleDeleteAll = async () => {
    if (!sessionUser) return
    store.clearAll()
    await deleteAllNotifications(sessionUser.id).catch(() => {})
  }

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    loading: store.loading,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    delete: handleDelete,
    deleteAll: handleDeleteAll,
    refetch: () => { loadedRef.current = false; load() },
  }
}

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AppNotification } from '@/types'

interface NotificationsState {
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  subscribed: boolean

  setNotifications: (n: AppNotification[]) => void
  addNotification: (n: AppNotification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  setLoading: (v: boolean) => void
  setSubscribed: (v: boolean) => void
}

export const useNotificationsStore = create<NotificationsState>()(
  devtools(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      loading: true,
      subscribed: false,

      setNotifications: (notifications) =>
        set({ notifications, unreadCount: notifications.filter((n) => !n.read).length }),

      addNotification: (n) =>
        set((s) => ({
          notifications: [n, ...s.notifications],
          unreadCount: s.unreadCount + 1,
        })),

      markAsRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
          unreadCount: Math.max(0, s.unreadCount - 1),
        })),

      markAllAsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),

      removeNotification: (id) =>
        set((s) => {
          const notif = s.notifications.find((n) => n.id === id)
          return {
            notifications: s.notifications.filter((n) => n.id !== id),
            unreadCount: notif && !notif.read
              ? Math.max(0, s.unreadCount - 1)
              : s.unreadCount,
          }
        }),

      clearAll: () => set({ notifications: [], unreadCount: 0 }),
      setLoading: (loading) => set({ loading }),
      setSubscribed: (subscribed) => set({ subscribed }),
    }),
    { name: 'notifications-store' },
  ),
)

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, AlertCircle, MessageSquare, UserPlus,
  CheckCircle2, X, Clock, Activity, Loader2,
  CheckCheck, Trash2,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { EmptyState } from '@/components/shared/EmptyState'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { useProjectsStore } from '@/stores/projects.store'
import { useAuthStore } from '@/stores/auth.store'
import { cn, formatRelative, isOverdue } from '@/utils'
import type { AppNotification, NotificationType } from '@/types'

//* ── Notification config *//
const NOTIF_CONFIG: Record<NotificationType, {
  icon: React.ElementType
  color: string
  bg: string
}> = {
  task_assigned:      { icon: UserPlus,      color: 'text-violet-400', bg: 'bg-violet-500/10' },
  task_overdue:       { icon: AlertCircle,   color: 'text-red-400',    bg: 'bg-red-500/10'    },
  comment_added:      { icon: MessageSquare, color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  project_invite:     { icon: UserPlus,      color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  task_completed:     { icon: CheckCircle2,  color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
  task_status_changed:{ icon: Clock,         color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
}

type Tab = 'notifications' | 'activity'

//* ── Activity item (derived from tasks in store) *//
function useActivityFeed() {
  const { tasks, projects } = useProjectsStore()
  const { sessionUser } = useAuthStore()

  //* Build a simple activity feed from recently updated tasks *//
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 20)

  return recentTasks.map((task) => {
    const project = projects.find((p) => p.id === task.projectId)
    const isOwn = task.reporterId === sessionUser?.id || task.assigneeId === sessionUser?.id
    const icon = task.status === 'Done' ? CheckCircle2
      : task.status === 'Review' ? Clock
      : isOverdue(task.dueDate) ? AlertCircle
      : Activity

    const color = task.status === 'Done' ? 'text-emerald-400'
      : task.status === 'Review' ? 'text-amber-400'
      : isOverdue(task.dueDate) ? 'text-red-400'
      : 'text-blue-400'

    const bg = task.status === 'Done' ? 'bg-emerald-500/10'
      : task.status === 'Review' ? 'bg-amber-500/10'
      : isOverdue(task.dueDate) ? 'bg-red-500/10'
      : 'bg-blue-500/10'

    const label = task.status === 'Done' ? 'concluída'
      : task.status === 'Review' ? 'em revisão'
      : isOverdue(task.dueDate) ? 'em atraso'
      : `em ${task.status}`

    return {
      id: task.id,
      icon,
      color,
      bg,
      title: task.title,
      body: `"${task.title}" está ${label} em ${project?.name ?? 'projeto'}`,
      time: task.updatedAt,
      isOwn,
      overdue: isOverdue(task.dueDate) && task.status !== 'Done',
    }
  })
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('notifications')
  const {
    notifications, unreadCount, loading,
    markAsRead, markAllAsRead,
    delete: deleteNotif, deleteAll,
  } = useNotifications()

  const activityFeed = useActivityFeed()
  const unread = notifications.filter((n) => !n.read)
  const read   = notifications.filter((n) => n.read)

  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          title="Notificações"
          breadcrumbs={[{ label: 'Notificações' }]}
          actions={
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex h-7 items-center gap-1.5 rounded-md border border-border/60 bg-secondary/50 px-2.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                >
                  <CheckCheck size={11} /> Marcar todas como lidas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={deleteAll}
                  className="flex h-7 items-center gap-1.5 rounded-md border border-border/60 bg-secondary/50 px-2.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                >
                  <Trash2 size={11} /> Limpar tudo
                </button>
              )}
            </div>
          }
        />

        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-2xl px-4 py-6">
            {/* Header */}
            <div className="mb-4 flex items-center gap-2.5">
              <h1 className="text-base font-semibold text-foreground">Centro de Notificações</h1>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="mb-5 flex border-b border-border">
              <button
                onClick={() => setActiveTab('notifications')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px',
                  activeTab === 'notifications'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Bell size={13} /> Notificações
                {unreadCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px',
                  activeTab === 'activity'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Activity size={13} /> Atividade
              </button>
            </div>

            {/* ── Notifications tab ── */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 size={18} className="animate-spin mr-2" /> A carregar…
                  </div>
                ) : notifications.length === 0 ? (
                  <EmptyState
                    icon={<Bell size={20} />}
                    title="Tudo em dia!"
                    description="Não tem notificações novas."
                  />
                ) : (
                  <>
                    {/* unread notifications */}
                    {unread.length > 0 && (
                      <div>
                        <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                          Não lidas ({unread.length})
                        </p>
                        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                          <AnimatePresence initial={false}>
                            {unread.map((n) => (
                              <NotificationRow
                                key={n.id}
                                notification={n}
                                onRead={() => markAsRead(n.id)}
                                onDelete={() => deleteNotif(n.id)}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {/* read notifications */}
                    {read.length > 0 && (
                      <div>
                        <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                          Anteriores
                        </p>
                        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border opacity-70">
                          <AnimatePresence initial={false}>
                            {read.map((n) => (
                              <NotificationRow
                                key={n.id}
                                notification={n}
                                onRead={() => markAsRead(n.id)}
                                onDelete={() => deleteNotif(n.id)}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Activity tab ── */}
            {activeTab === 'activity' && (
              <div>
                {activityFeed.length === 0 ? (
                  <EmptyState
                    icon={<Activity size={20} />}
                    title="Sem atividade recente"
                    description="As ações da equipa nos projetos aparecem aqui."
                  />
                ) : (
                  <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                    {activityFeed.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-start gap-3 px-4 py-3.5"
                      >
                        <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', item.bg)}>
                          <item.icon size={14} className={item.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground line-clamp-1">{item.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{item.body}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground/60">
                            {formatRelative(item.time)}
                          </p>
                        </div>
                        {item.overdue && (
                          <span className="flex-shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                            Atrasada
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

//* ── Notification row component *//
function NotificationRow({
  notification: n,
  onRead,
  onDelete,
}: {
  notification: AppNotification
  onRead: () => void
  onDelete: () => void
}) {
  const config = NOTIF_CONFIG[n.type] ?? NOTIF_CONFIG.task_status_changed

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-start gap-3 px-4 py-3.5 group transition-colors',
        !n.read && 'bg-primary/[0.02]',
        'hover:bg-secondary/30',
      )}
    >
      {/* Unread dot */}
      <div className="flex-shrink-0 pt-2">
        {!n.read ? (
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        ) : (
          <div className="h-1.5 w-1.5" />
        )}
      </div>

      <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', config.bg)}>
        <config.icon size={14} className={config.color} />
      </div>

      <div className="flex-1 min-w-0" onClick={!n.read ? onRead : undefined} style={{ cursor: !n.read ? 'pointer' : 'default' }}>
        <p className={cn('text-sm', n.read ? 'text-muted-foreground' : 'font-medium text-foreground')}>
          {n.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
        <p className="mt-1 text-[10px] text-muted-foreground/60">{formatRelative(n.createdAt)}</p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!n.read && (
          <button
            onClick={onRead}
            title="Marcar como lida"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/50 hover:bg-secondary hover:text-foreground transition-all"
          >
            <CheckCheck size={12} />
          </button>
        )}
        <button
          onClick={onDelete}
          title="Eliminar"
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <X size={12} />
        </button>
      </div>
    </motion.div>
  )
}

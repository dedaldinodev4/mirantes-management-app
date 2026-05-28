'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, AlertCircle, MessageSquare, UserPlus, CheckCircle2, X } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/utils'

const INITIAL_NOTIFS = [
  { id: '1', type: 'overdue', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', title: 'Task overdue', body: '"Navigation redesign" is 8 days past due', time: '3h ago' },
  { id: '2', type: 'overdue', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', title: 'Task overdue', body: '"GraphQL schema" is 3 days past due', time: '6h ago' },
  { id: '3', type: 'comment', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'New comment', body: 'Alex Kim commented on "Design token system"', time: '18m ago' },
  { id: '4', type: 'assigned', icon: UserPlus, color: 'text-purple-400', bg: 'bg-purple-500/10', title: 'Task assigned', body: 'You were assigned to "Button component variants"', time: '1d ago' },
]

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS)

  const dismiss = (id: string) => setNotifs((n) => n.filter((x) => x.id !== id))
  const dismissAll = () => setNotifs([])

  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          title="Notifications"
          breadcrumbs={[{ label: 'Notifications' }]}
          actions={
            notifs.length > 0 ? (
              <button
                onClick={dismissAll}
                className="flex h-7 items-center gap-1.5 rounded-md border border-border/60 bg-secondary/50 px-2.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
              >
                Dismiss all
              </button>
            ) : undefined
          }
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-xl">
            <div className="mb-4 flex items-center gap-2">
              <h1 className="text-base font-semibold text-foreground">Notifications</h1>
              {notifs.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                  {notifs.length}
                </span>
              )}
            </div>

            {notifs.length === 0 ? (
              <EmptyState
                icon={<Bell size={20} />}
                title="All caught up!"
                description="You have no new notifications."
              />
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                <AnimatePresence>
                  {notifs.map((n) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-3 px-4 py-3.5 group"
                    >
                      <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', n.bg)}>
                        <n.icon size={15} className={n.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground/60">{n.time}</p>
                      </div>
                      <button
                        onClick={() => dismiss(n.id)}
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:bg-secondary hover:text-muted-foreground transition-all"
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

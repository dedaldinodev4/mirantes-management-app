'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Calendar, User, Tag, Flag, Trash2, MessageSquare, Loader2 } from 'lucide-react'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { Avatar } from '@/components/shared/Avatar'
import { useProjectsStore } from '@/stores/projects.store'
import { PRIORITY_CONFIG, COLUMN_COLORS, LABEL_COLORS, ROUTES } from '@/constants'
import { cn, formatDate, isOverdue, getDueDateLabel } from '@/utils'
import type { UpdateTaskInput } from '@/types'

interface TaskModalProps {
  taskId: string | null
  open: boolean
  onClose: () => void
  onUpdate: (taskId: string, input: Partial<UpdateTaskInput>) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
}

export function TaskModal({ taskId, open, onClose, onUpdate, onDelete }: TaskModalProps) {
  const { tasks } = useProjectsStore()
  const task = tasks.find((t) => t.id === taskId)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) setComment('')
  }, [open])

  const handleDelete = async () => {
    if (!task || !confirm('Delete this task? This cannot be undone.')) return
    await onDelete(task.id)
    onClose()
  }

  const handleStatusChange = async (status: string) => {
    if (!task) return
    await onUpdate(task.id, { status: status as any })
  }

  if (!task && open) return null

  const overdue = task ? isOverdue(task.dueDate) : false
  const dueLabel = task ? getDueDateLabel(task.dueDate) : null
  const labelColor = LABEL_COLORS[task?.label ?? ''] ?? { bg: 'bg-secondary', text: 'text-muted-foreground' }

  return (
    <AnimatePresence>
      {open && task && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-[600px] max-w-[95vw] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-foreground leading-relaxed">
                  {task.title}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <PriorityBadge priority={task.priority} />
                  {task.label && (
                    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium', labelColor.bg, labelColor.text)}>
                      {task.label}
                    </span>
                  )}
                  {overdue && (
                    <span className="inline-flex items-center rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                      ⚠ Overdue
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
              >
                <X size={13} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Main */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Description */}
                <div>
                  <h3 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                    Description
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {task.description || 'No description provided.'}
                  </p>
                </div>

                {/* Status selector */}
                <div>
                  <h3 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                    Status
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(['Backlog', 'Todo', 'In Progress', 'Review', 'Done'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={cn(
                          'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all',
                          task.status === s
                            ? 'border-transparent text-white'
                            : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground',
                        )}
                        style={task.status === s ? { background: COLUMN_COLORS[s] } : {}}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <h3 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                    Add Comment
                  </h3>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Write a comment…"
                    className="w-full resize-none rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      disabled={!comment.trim() || submitting}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
                    >
                      {submitting && <Loader2 size={11} className="animate-spin" />}
                      Post comment
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar meta */}
              <div className="w-44 flex-shrink-0 border-l border-border bg-secondary/20 p-4 space-y-4">
                <MetaRow icon={<Flag size={12} />} label="Priority">
                  <span className={cn('text-xs', PRIORITY_CONFIG[task.priority].color)}>
                    {PRIORITY_CONFIG[task.priority].label}
                  </span>
                </MetaRow>
                <MetaRow icon={<Calendar size={12} />} label="Due date">
                  <span className={cn('text-xs', dueLabel?.urgent ? 'text-red-400' : 'text-muted-foreground')}>
                    {task.dueDate ? formatDate(task.dueDate) : '—'}
                  </span>
                </MetaRow>
                <MetaRow icon={<User size={12} />} label="Assignee">
                  <span className="text-xs text-muted-foreground">Unassigned</span>
                </MetaRow>
                <MetaRow icon={<Tag size={12} />} label="Label">
                  {task.label ? (
                    <span className={cn('text-xs font-medium', labelColor.text)}>{task.label}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </MetaRow>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <Trash2 size={12} /> Delete task
              </button>
              <button
                onClick={onClose}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function MetaRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
        {icon} {label}
      </div>
      {children}
    </div>
  )
}

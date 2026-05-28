'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { taskSchema, type TaskFormData } from '@/features/tasks/schemas'
import { useProjectsStore } from '@/stores/projects.store'
import { TASK_LABELS, KANBAN_COLUMNS } from '@/constants'
import { cn } from '@/utils'
import type { CreateTaskInput } from '@/types'

interface CreateTaskModalProps {
  open: boolean
  onClose: () => void
  onCreate: (input: CreateTaskInput) => Promise<string | undefined>
  projectId: string
}

export function CreateTaskModal({ open, onClose, onCreate, projectId }: CreateTaskModalProps) {
  const { projects } = useProjectsStore()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<TaskFormData>({
      resolver: zodResolver(taskSchema),
      defaultValues: { projectId, status: 'Todo', priority: 'medium' },
    })

  const onSubmit = async (data: TaskFormData) => {
    await onCreate({ ...data, projectId: data.projectId })
    reset()
    onClose()
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.18 }}
            className="fixed left-1/2 top-1/2 z-50 w-[480px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Create Task</h2>
              <button
                onClick={handleClose}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
              >
                <X size={12} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title *</label>
                <input
                  {...register('title')}
                  placeholder="What needs to be done?"
                  autoFocus
                  className={cn(
                    'w-full rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all',
                    'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                    errors.title ? 'border-destructive/60' : 'border-border/60',
                  )}
                />
                {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Add more details…"
                  className="w-full resize-none rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Priority</label>
                  <select
                    {...register('priority')}
                    className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-all focus:border-primary/60"
                  >
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🔵 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    {...register('status')}
                    className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-all focus:border-primary/60"
                  >
                    {KANBAN_COLUMNS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Label</label>
                  <select
                    {...register('label')}
                    className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-all focus:border-primary/60"
                  >
                    <option value="">No label</option>
                    {TASK_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Due date</label>
                  <input
                    {...register('dueDate')}
                    type="date"
                    className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-all focus:border-primary/60"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all"
                >
                  {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                  Create task
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

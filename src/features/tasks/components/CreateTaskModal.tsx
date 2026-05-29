'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { taskSchema, type TaskFormData } from '@/features/tasks/schemas'
import { TASK_LABELS, KANBAN_COLUMNS } from '@/constants'
import { cn } from '@/utils'
import type { CreateTaskInput } from '@/types'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { useEscapeKey } from '../hooks/useEscapeKey'

interface CreateTaskModalProps {
  open: boolean
  onClose: () => void
  onCreate: (input: CreateTaskInput) => Promise<string | undefined>
  projectId: string
}

export function CreateTaskModal({ open, onClose, onCreate, projectId }: CreateTaskModalProps) {
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<TaskFormData>({
      resolver: zodResolver(taskSchema),
      defaultValues: { projectId, status: 'Todo', priority: 'medium' },
    })

  const handleClose = () => { reset(); onClose() }

  // Lock body scroll
  useLockBodyScroll(open)

  useEscapeKey(handleClose, open)

  // Reset on close
  useEffect(() => {
    if (open) return
    reset()
  }, [open, reset])


  const onSubmit = async (data: TaskFormData) => {
    await onCreate({ ...data })
    reset()
    onClose()
  }



  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

    
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="pointer-events-auto w-full max-w-[480px] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">Nova Tarefa</h2>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all disabled:opacity-50"
                >
                  <X size={12} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                {/* Title */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Título *</label>
                  <input
                    {...register('title')}
                    placeholder="O que deve ser feito?"
                    autoFocus
                    disabled={isSubmitting}
                    className={cn(
                      'w-full rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all disabled:opacity-60',
                      'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                      errors.title ? 'border-destructive/60' : 'border-border/60',
                    )}
                  />
                  {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Descrição</label>
                  <textarea
                    {...register('description')}
                    rows={2}
                    placeholder="Adicionar mais detalhes…"
                    disabled={isSubmitting}
                    className="w-full resize-none rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                  />
                </div>

                {/* Priority + Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Prioridade</label>
                    <select
                      {...register('priority')}
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-all focus:border-primary/60 disabled:opacity-60"
                    >
                      <option value="urgent">🔴 Urgente</option>
                      <option value="high">🟠 Alta</option>
                      <option value="medium">🔵 Média</option>
                      <option value="low">🟢 Baixa</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</label>
                    <select
                      {...register('status')}
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-all focus:border-primary/60 disabled:opacity-60"
                    >
                      {KANBAN_COLUMNS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Label + Due date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Etiqueta</label>
                    <select
                      {...register('label')}
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-all focus:border-primary/60 disabled:opacity-60"
                    >
                      <option value="">Sem Etiqueta</option>
                      {TASK_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Prazo</label>
                    <input
                      {...register('dueDate')}
                      type="date"
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-all focus:border-primary/60 disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Criando…
                      </>
                    ) : (
                      'Criar tarefa'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchema, type ProjectFormData } from '@/features/projects/schemas'
import { PROJECT_COLORS } from '@/constants'
import { cn } from '@/utils'
import type { Project } from '@/types'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { useEscapeKey } from '@/hooks/useEscapeKey'

interface EditProjectModalProps {
  open: boolean
  onClose: () => void
  onSave: (projectId: string, data: Partial<ProjectFormData>) => Promise<void>
  project: Project | null
}

export function EditProjectModal({ open, onClose, onSave, project }: EditProjectModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  })

  const selectedColor = watch('color')

  // Populate form when project changes
  useEffect(() => {
    if (project && open) {
      reset({
        name: project.name,
        description: project.description,
        color: project.color,
        dueDate: project.dueDate
          ? new Date(project.dueDate).toISOString().split('T')[0]
          : '',
      })
    }
  }, [project, open, reset])

  // Lock body scroll
  useLockBodyScroll(open)

  // Close on Escape
  useEscapeKey(onClose, open)


  if (!project) return null

  const onSubmit = async (data: ProjectFormData) => {
    await onSave(project.id, data)
    onClose()
  }

  const inputCls = (hasError?: boolean) => cn(
    'w-full rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all',
    'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
    hasError ? 'border-destructive/60' : 'border-border/60',
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="pointer-events-auto w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ background: selectedColor || project.color }}
                  />
                  <h2 className="text-sm font-semibold text-foreground">Editar Projeto</h2>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                >
                  <X size={13} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Nome *
                  </label>
                  <input
                    {...register('name')}
                    placeholder="Nome do projeto"
                    disabled={isSubmitting}
                    className={inputCls(!!errors.name)}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Descrição
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    placeholder="Sobre o que é este projeto?"
                    disabled={isSubmitting}
                    className={cn(inputCls(), 'resize-none')}
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
                  )}
                </div>

                {/* Color */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">Cor</label>
                  <div className="flex gap-2 flex-wrap">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setValue('color', color)}
                        style={{ backgroundColor: color }}
                        className={cn(
                          'h-7 w-7 rounded-full transition-all disabled:cursor-not-allowed',
                          selectedColor === color
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-110'
                            : 'hover:scale-105 opacity-70 hover:opacity-100',
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Due date */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Data limite
                  </label>
                  <input
                    {...register('dueDate')}
                    type="date"
                    disabled={isSubmitting}
                    className={inputCls()}
                  />
                </div>

                {/* Footer */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
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
                      <><Loader2 size={13} className="animate-spin" />A guardar…</>
                    ) : 'Guardar alterações'}
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

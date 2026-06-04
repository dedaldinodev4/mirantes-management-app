'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, Calendar, User, Tag, Flag, Trash2, MessageSquare, Loader2,
  Send
} from 'lucide-react'

import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { useProjectsStore } from '@/stores/projects.store'
import { PRIORITY_CONFIG, COLUMN_COLORS, LABEL_COLORS } from '@/constants'
import { cn, formatDate, isOverdue, getDueDateLabel, formatRelative } from '@/utils'
import type { UpdateTaskInput } from '@/types'
import { toast } from 'sonner'

import { createComment, getTaskComments, deleteComment } from '@/services/supabase/comments'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { useAuthStore } from '@/stores/auth.store'
import { TaskComment } from '@/types'

interface TaskModalProps {
  taskId: string | null
  open: boolean
  onClose: () => void
  onUpdate: (taskId: string, input: Partial<UpdateTaskInput>) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
}

export function TaskModal({ taskId, open, onClose, onUpdate, onDelete }: TaskModalProps) {
  const { tasks } = useProjectsStore()
  const { sessionUser, profile } = useAuthStore()
  const task = tasks.find((t) => t.id === taskId)

  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [comments, setComments] = useState<TaskComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const loadedForRef = useRef<string | null>(null)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) {
      setComment(''); setDeleting(false); setUpdatingStatus(null)
      setComments([]); loadedForRef.current = null
    }
  }, [open])

  // Load comments once per taskId
  useEffect(() => {
    if (!open || !taskId || loadedForRef.current === taskId) return
    loadedForRef.current = taskId
    setLoadingComments(true)
    getTaskComments(taskId)
      .then(setComments)
      .catch(() => { })
      .finally(() => setLoadingComments(false))
  }, [open, taskId])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleDelete = async () => {
    toast.warning(
      'Deseja apagar esta tarefa?',
      {
        description: 'Esta ação não pode ser revertida.',
        action: {
          label: 'Confirmar',
          onClick: async () => {
            setDeleting(true)
            try {
              if (task) {
                await onDelete(task.id); onClose()
              }
            } finally {
              setDeleting(false)
            }
          }
        },
        duration: 3000,
        position: 'top-center'
      }
    )

  }


  const handleStatusChange = async (status: string) => {
    if (!task || updatingStatus) return
    setUpdatingStatus(status)
    try { await onUpdate(task.id, { status: status as any }) }
    finally { setUpdatingStatus(null) }
  }

  // Optimistic comment post
  const handlePostComment = async () => {
    const content = comment.trim()
    if (!content || !sessionUser || !task) return

    const tempId = `temp-${Date.now()}`
    const optimistic: TaskComment = {
      id: tempId, taskId: task.id, projectId: task.projectId,
      authorId: sessionUser.id, content,
      edited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setComments((prev) => [...prev, optimistic])
    setComment('')
    setSubmittingComment(true)

    try {
      const saved = await createComment(
        { taskId: task.id, projectId: task.projectId, content },
        sessionUser.id,
      )
      setComments((prev) => prev.map((c) => (c.id === tempId ? saved : c)))
    } catch (err: any) {
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      setComment(content)
      toast.error('Falha ao postar o comentário', { description: err?.message })
    } finally {
      setSubmittingComment(false)
    }
  }

  // Optimistic comment delete
  const handleDeleteComment = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    try {
      await deleteComment(commentId)
    } catch (err: any) {
      toast.error('Falha ao apagar o comentário', { description: err?.message })
      if (taskId) getTaskComments(taskId).then(setComments).catch(() => { })
    }
  }

  const overdue = task ? isOverdue(task.dueDate) : false
  const dueLabel = task ? getDueDateLabel(task.dueDate) : null
  const labelColor = LABEL_COLORS[task?.label ?? ''] ?? { bg: 'bg-secondary', text: 'text-muted-foreground' }

  return (
    <AnimatePresence>
      {open && task && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="pointer-events-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
              style={{ maxHeight: 'min(88vh, 680px)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start gap-3 border-b border-border px-5 py-4 flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-foreground leading-relaxed">{task.title}</h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <PriorityBadge priority={task.priority} />
                    {task.label && (
                      <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium', labelColor.bg, labelColor.text)}>
                        {task.label}
                      </span>
                    )}
                    {overdue && (
                      <span className="inline-flex items-center rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                        ⚠ Atrasada
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={onClose}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                  <X size={13} />
                </button>
              </div>

              {/* Body */}
              <div className="flex flex-1 overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Description */}
                  <div>
                    <h3 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">Descrição</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{task.description || 'Sem descrição.'}</p>
                  </div>

                  {/* Status */}
                  <div>
                    <h3 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">Status</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(['Backlog', 'Todo', 'In Progress', 'Review', 'Done'] as const).map((s) => (
                        <button key={s} onClick={() => handleStatusChange(s)} disabled={!!updatingStatus}
                          className={cn('flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all disabled:cursor-not-allowed',
                            task.status === s ? 'border-transparent text-white' : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground')}
                          style={task.status === s ? { background: COLUMN_COLORS[s] } : {}}>
                          {updatingStatus === s && <Loader2 size={10} className="animate-spin" />}
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comments */}
                  <div>
                    <h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                      Comentários {comments.length > 0 && `(${comments.length})`}
                    </h3>

                    {loadingComments ? (
                      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                        <Loader2 size={12} className="animate-spin" /> Carregando…
                      </div>
                    ) : comments.length > 0 ? (
                      <div className="mb-4 space-y-3">
                        {comments.map((c) => {
                          const isTemp = c.id.startsWith('temp-')
                          return (
                            <div key={c.id} className={cn('group flex gap-2.5', isTemp && 'opacity-60')}>
                              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[9px] font-semibold text-white">
                                {c.authorId === sessionUser?.id ? (profile?.displayName?.[0]?.toUpperCase() ?? '?') : '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-medium text-foreground">
                                    {c.authorId === sessionUser?.id ? (profile?.displayName ?? 'Você') : 'Membro'}
                                  </span>
                                  {!isTemp && (
                                    <span className="text-[10px] text-muted-foreground/60">
                                      {formatRelative(c.createdAt)}{c.edited && ' · editado'}
                                    </span>
                                  )}
                                  {isTemp && <span className="text-[10px] text-muted-foreground/60">postando…</span>}
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{c.content}</p>
                              </div>
                              {c.authorId === sessionUser?.id && !isTemp && (
                                <button onClick={() => handleDeleteComment(c.id)}
                                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all p-0.5">
                                  <X size={11} />
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="mb-4 text-xs text-muted-foreground/60">Sem comentários ainda.</p>
                    )}

                    {/* New comment */}
                    <div className="flex gap-2">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[9px] font-semibold text-white mt-1.5">
                        {profile?.displayName?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handlePostComment() } }}
                          rows={2} placeholder="Escreva um comentário..." disabled={submittingComment}
                          className="w-full resize-none rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20 disabled:opacity-60" />
                        <div className="mt-1.5 flex justify-end">
                          <button onClick={handlePostComment} disabled={!comment.trim() || submittingComment}
                            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                            <Send size={11} /> Postar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="hidden sm:flex w-44 flex-shrink-0 flex-col border-l border-border bg-secondary/20 p-4 space-y-4 overflow-y-auto">
                  <MetaRow icon={<Flag size={12} />} label="Prioridade">
                    <span className={cn('text-xs', PRIORITY_CONFIG[task.priority].color)}>
                      {PRIORITY_CONFIG[task.priority].label}
                    </span>
                  </MetaRow>
                  <MetaRow icon={<Calendar size={12} />} label="Prazo">
                    <span className={cn('text-xs', dueLabel?.urgent ? 'text-red-400' : 'text-muted-foreground')}>
                      {task.dueDate ? formatDate(task.dueDate) : '—'}
                    </span>
                  </MetaRow>
                  <MetaRow icon={<User size={12} />} label="Responsável">
                    <span className="text-xs text-muted-foreground">Não atribuído</span>
                  </MetaRow>
                  <MetaRow icon={<Tag size={12} />} label="Etiqueta">
                    {task.label ? <span className={cn('text-xs font-medium', labelColor.text)}>{task.label}</span>
                      : <span className="text-xs text-muted-foreground">—</span>}
                  </MetaRow>
                  <MetaRow icon={<MessageSquare size={12} />} label="Comentários">
                    <span className="text-xs text-muted-foreground">{comments.length}</span>
                  </MetaRow>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-5 py-3 flex-shrink-0">
                <button onClick={handleDelete} disabled={deleting}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-60 transition-all">
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  {deleting ? 'Apagando…' : 'Apagar tarefa'}
                </button>
                <button onClick={onClose}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}


function MetaRow({ icon, label, children }: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
        {icon} {label}
      </div>
      {children}
    </div>
  )
}

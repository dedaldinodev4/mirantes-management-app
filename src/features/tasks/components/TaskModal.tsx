'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, Calendar, Tag, Flag, Trash2, MessageSquare, Loader2,
  Send,
  UserCircle,
  Check,
  Pencil
} from 'lucide-react'

import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { useProjectsStore } from '@/stores/projects.store'
import { PRIORITY_CONFIG, COLUMN_COLORS, LABEL_COLORS, TASK_LABELS } from '@/constants'
import { cn, formatDate, isOverdue, getDueDateLabel, formatRelative } from '@/utils'

import { toast } from 'sonner'

import {
  createComment, getTaskComments, deleteComment
} from '@/services/supabase/comments'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { useAuthStore } from '@/stores/auth.store'
import type { UpdateTaskInput, TaskComment, User } from '@/types'
import { getUserProfiles } from '@/services/supabase/auth'
import { Avatar } from '@/components/shared/Avatar'
import { taskSchema, type TaskFormData } from '../schemas'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'


interface TaskModalProps {
  taskId: string | null
  open: boolean
  onClose: () => void
  onUpdate: (taskId: string, input: Partial<UpdateTaskInput>) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
}

export function TaskModal({ taskId, open, onClose, onUpdate, onDelete }: TaskModalProps) {
  const { tasks, projects } = useProjectsStore()
  const { sessionUser, profile } = useAuthStore()
  const task = tasks.find((t) => t.id === taskId) ?? null

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [comments, setComments] = useState<TaskComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [updatingAssignee, setUpdatingAssignee] = useState(false)
  const [members, setMembers] = useState<User[]>([])
  const loadedForRef = useRef<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  })


  // Populate form when task changes or edit mode opens
  useEffect(() => {
    if (task && editing) {
      reset({
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        status: task.status,
        priority: task.priority,
        label: task.label,
        assigneeId: task.assigneeId ?? '',
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split('T')[0]
          : '',
      })
    }
  }, [editing, task, reset])

  // Lock body scroll
  useLockBodyScroll(open)

  // Reset on close
  useEffect(() => {
    if (!open) {
      setComment('');
      setEditing(false);
      setSaving(false);
      setDeleting(false);
      setUpdatingStatus(null)
      setComments([]);
      setMembers([])
      loadedForRef.current = null
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

  // Load project members
  useEffect(() => {
    if (!open || !task) return
    const project = projects.find((p) => p.id === task.projectId)
    if (!project?.memberIds.length) return
    getUserProfiles(project.memberIds)
      .then(setMembers)
      .catch(() => setMembers([]))
  }, [open, task?.projectId])

  // Close on Escape (but not while editing)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editing) setEditing(false)
        else onClose()
      }
    }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, editing, onClose])

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
                await onDelete(task.id);
                onClose()
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

  if (!task) return null

  const handleSaveEdit = async (data: TaskFormData) => {
    setSaving(true)
    try {
      await onUpdate(task.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        label: data.label,
        assigneeId: data.assigneeId || undefined,
        dueDate: data.dueDate || undefined,
      })
      setEditing(false)
      toast.success('Tarefa atualizada')
    } catch (err: any) {
      toast.error('Falha ao guardar', { description: err?.message })
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (updatingStatus) return
    setUpdatingStatus(status)
    try {
      await onUpdate(task.id, { status: status as UpdateTaskInput['status'] })
    }
    finally {
      setUpdatingStatus(null)
    }
  }

  const handleAssigneeChange = async (assigneeId: string) => {
    setUpdatingAssignee(true)
    try {
      await onUpdate(task.id, { assigneeId: assigneeId || undefined })
    } finally {
      setUpdatingAssignee(false)
    }
  }


  // Optimistic comment post
  const handlePostComment = async () => {
    const content = comment.trim()
    if (!content || !sessionUser) return

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
      toast.error('Falha ao publicar comentário', { description: err?.message })
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
      toast.error('Falha ao apagar comentário', { description: err?.message })
      if (taskId) getTaskComments(taskId).then(setComments).catch(() => { })
    }
  }

  const overdue = isOverdue(task.dueDate)
  const dueLabel = getDueDateLabel(task.dueDate)
  const labelColor = LABEL_COLORS[task?.label ?? ''] ?? { bg: 'bg-secondary', text: 'text-muted-foreground' }
  const assignee = members.find((m) => m.uid === task.assigneeId) ?? null

  const inputCls = (hasError?: boolean) => cn(
    'w-full rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-all',
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
            onClick={() => { if (!editing) onClose() }}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="pointer-events-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
              style={{ maxHeight: 'min(88vh, 700px)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start gap-3 border-b border-border px-5 py-4 flex-shrink-0">
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <input
                      {...register('title')}
                      autoFocus
                      className={cn(inputCls(!!errors.title), 'font-semibold')}
                      placeholder="Título da tarefa"
                    />
                  ) : (
                    <h2 className="text-sm font-semibold text-foreground leading-relaxed">
                      {task.title}
                    </h2>
                  )}
                  {!editing && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <PriorityBadge priority={task.priority} />
                      {task.label && (
                        <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium', labelColor.bg, labelColor.text)}>
                          {task.label}
                        </span>
                      )}
                      {overdue && (
                        <span className="inline-flex items-center rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                          ⚠ Em atraso
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      title="Editar tarefa"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                    >
                      <Pencil size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditing(false)}
                      title="Cancelar edição"
                      className="flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                    >
                      <X size={11} /> Cancelar
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <form
                onSubmit={editing ? handleSubmit(handleSaveEdit) : undefined}
                className="flex flex-1 overflow-hidden min-h-0"
              >
                {/* Main */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">

                  {/* ── EDIT MODE ── */}
                  {editing ? (
                    <>
                      {/* Description */}
                      <div>
                        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                          Descrição
                        </label>
                        <textarea
                          {...register('description')}
                          rows={3}
                          placeholder="Descrição da tarefa…"
                          className={cn(inputCls(), 'resize-none')}
                        />
                      </div>

                      {/* Priority + Status */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                            Prioridade
                          </label>
                          <select {...register('priority')} className={inputCls()}>
                            <option value="urgent">🔴 Urgente</option>
                            <option value="high">🟠 Alta</option>
                            <option value="medium">🔵 Média</option>
                            <option value="low">🟢 Baixa</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                            Etiqueta
                          </label>
                          <select {...register('label')} className={inputCls()}>
                            <option value="">Sem etiqueta</option>
                            {TASK_LABELS.map((label) => (
                              <option key={label} value={label}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Assignee + Due date */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                            Responsável
                          </label>
                          <select {...register('assigneeId')} className={inputCls()}>
                            <option value="">Sem responsável</option>
                            {members.map((m) => (
                              <option key={m.uid} value={m.uid}>{m.displayName}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                            Data limite
                          </label>
                          <input {...register('dueDate')} type="date" className={inputCls()} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* VIEW MODE — Description */}
                      <div>
                        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">Descrição</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {task.description || 'Sem descrição.'}
                        </p>
                      </div>

                      {/* Status */}
                      <div>
                        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">Estado</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {(['Backlog', 'Todo', 'In Progress', 'Review', 'Done'] as const).map((s) => (
                            <button
                              key={s} type="button"
                              onClick={() => handleStatusChange(s)}
                              disabled={!!updatingStatus}
                              className={cn(
                                'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all disabled:cursor-not-allowed',
                                task.status === s
                                  ? 'border-transparent text-white'
                                  : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground',
                              )}
                              style={task.status === s ? { background: COLUMN_COLORS[s] } : {}}
                            >
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
                            <Loader2 size={12} className="animate-spin" /> A carregar…
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
                                      {isTemp && <span className="text-[10px] text-muted-foreground/60">a publicar…</span>}
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{c.content}</p>
                                  </div>
                                  {c.authorId === sessionUser?.id && !isTemp && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComment(c.id)}
                                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all p-0.5"
                                    >
                                      <X size={11} />
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="mb-4 text-xs text-muted-foreground/60">Ainda sem comentários.</p>
                        )}

                        <div className="flex gap-2">
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[9px] font-semibold text-white mt-1.5">
                            {profile?.displayName?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <textarea
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                  e.preventDefault()
                                  handlePostComment()
                                }
                              }}
                              rows={2}
                              placeholder="Escreva um comentário… (⌘Enter para publicar)"
                              disabled={submittingComment}
                              className="w-full resize-none rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                            />
                            <div className="mt-1.5 flex justify-end">
                              <button
                                type="button"
                                onClick={handlePostComment}
                                disabled={!comment.trim() || submittingComment}
                                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              >
                                <Send size={11} /> Publicar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Sidebar */}
                <div className="hidden sm:flex w-48 flex-shrink-0 flex-col border-l border-border bg-secondary/20 p-4 space-y-4 overflow-y-auto">
                  <MetaRow icon={<Flag size={12} />} label="Prioridade">
                    <span className={cn('text-xs', PRIORITY_CONFIG[task.priority].color)}>
                      {PRIORITY_CONFIG[task.priority].label}
                    </span>
                  </MetaRow>

                  <MetaRow icon={<UserCircle size={12} />} label="Responsável">
                    <div className="relative mt-1">
                      {updatingAssignee ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Loader2 size={11} className="animate-spin" /> A atualizar…
                        </div>
                      ) : assignee ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={assignee.displayName} photoURL={assignee.photoURL} size="xs" />
                          <span className="text-xs text-foreground truncate">{assignee.displayName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem responsável</span>
                      )}
                      {!editing && (
                        <select
                          value={task.assigneeId ?? ''}
                          onChange={(e) => handleAssigneeChange(e.target.value)}
                          disabled={updatingAssignee}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          title="Alterar responsável"
                        >
                          <option value="">Sem responsável</option>
                          {members.map((m) => (
                            <option key={m.uid} value={m.uid}>{m.displayName}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    {!editing && <p className="text-[10px] text-muted-foreground/50 mt-1">Clique para alterar</p>}
                  </MetaRow>

                  <MetaRow icon={<Calendar size={12} />} label="Data limite">
                    <span className={cn('text-xs', dueLabel.urgent ? 'text-red-400' : 'text-muted-foreground')}>
                      {task.dueDate ? formatDate(task.dueDate) : '—'}
                    </span>
                  </MetaRow>

                  <MetaRow icon={<Tag size={12} />} label="Etiqueta">
                    {task.label
                      ? <span className={cn('text-xs font-medium', labelColor.text)}>{task.label}</span>
                      : <span className="text-xs text-muted-foreground">—</span>}
                  </MetaRow>

                  <MetaRow icon={<MessageSquare size={12} />} label="Comentários">
                    <span className="text-xs text-muted-foreground">{comments.length}</span>
                  </MetaRow>
                </div>
              </form>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-5 py-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || editing}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40 transition-all"
                >
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  {deleting ? 'A eliminar…' : 'Eliminar'}
                </button>

                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        disabled={saving}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all disabled:opacity-60"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        form=""
                        onClick={handleSubmit(handleSaveEdit)}
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all"
                      >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        {saving ? 'A guardar…' : 'Guardar'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                    >
                      Fechar
                    </button>
                  )}
                </div>
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

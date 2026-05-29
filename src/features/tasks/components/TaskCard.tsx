'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { Calendar, MessageSquare, Trash2, GripVertical } from 'lucide-react'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { Avatar } from '@/components/shared/Avatar'
import { LABEL_COLORS } from '@/constants'
import { cn, getDueDateLabel, isOverdue } from '@/utils'
import type { TaskWithMeta, Task } from '@/types'
import { toast } from 'sonner'

interface TaskCardProps {
  task: TaskWithMeta | Task
  onClick?: () => void
  onDelete?: () => void
  isDragging?: boolean
}

export function TaskCard({ task, onClick, onDelete, isDragging = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const overdue = isOverdue(task.dueDate)
  const dueLabel = getDueDateLabel(task.dueDate)
  const labelColor = LABEL_COLORS[task.label ?? ''] ?? { bg: 'bg-secondary', text: 'text-muted-foreground' }
  const assignee = 'assignee' in task ? task.assignee : null
  const commentCount = 'commentCount' in task ? task.commentCount : 0

  const handleDelete = (e: any) => {
    e.stopPropagation()
    toast.warning(
      'Deseja apagar esta tarefa?',
      {
        description: 'Esta ação não pode ser revertida.',
        action: {
          label: 'Confirmar',
          onClick: () => {
            if (onDelete) onDelete()
          }
        },
        duration: 3000,
        position: 'top-center'
      }
    )

  }



  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-xl border border-border bg-card p-3 cursor-pointer transition-all select-none',
        'hover:border-border/80 hover:shadow-sm hover:-translate-y-0.5',
        isSortableDragging && 'opacity-40 scale-95',
        overdue && 'border-l-2 border-l-red-500/60',
        isDragging && 'shadow-2xl rotate-1 opacity-90',
      )}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 flex h-5 w-4 cursor-grab items-center justify-center rounded text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={12} />
      </div>

      <div className="pl-3">
        {/* Title */}
        <p className="mb-2 text-[12px] font-medium leading-relaxed text-foreground line-clamp-2">
          {task.title}
        </p>

        {/* Badges */}
        <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          {task.label && (
            <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium', labelColor.bg, labelColor.text)}>
              {task.label}
            </span>
          )}
          {overdue && (
            <span className="inline-flex items-center rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
              Prazo atrasado
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {assignee && (
              <Avatar name={assignee.displayName} photoURL={assignee.photoURL} size="xs" />
            )}
            {commentCount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <MessageSquare size={9} /> {commentCount}
              </span>
            )}
          </div>
          {task.dueDate && (
            <span className={cn('flex items-center gap-1 text-[10px]', dueLabel.urgent ? 'text-red-400' : 'text-muted-foreground')}>
              <Calendar size={9} />
              {dueLabel.label}
            </span>
          )}
        </div>
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={ (e) => handleDelete(e)}
          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  )
}

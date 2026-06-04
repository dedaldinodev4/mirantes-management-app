'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { TaskCard } from './TaskCard'
import { cn } from '@/utils'
import type { Task, TaskStatus, TaskWithMeta } from '@/types'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: TaskWithMeta[] | Task[]
  color: string
  onAddTask: () => void
  onTaskClick: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
}

export function KanbanColumn({
  status, tasks, color, onAddTask, onTaskClick, onDeleteTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex w-[240px] flex-shrink-0 flex-col">
      {/* Header */}
      <div className="mb-2.5 flex items-center gap-2 px-0.5">
        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-[12px] font-medium text-foreground">{status}</span>
        <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded bg-secondary px-1 text-[10px] font-medium text-muted-foreground">
          {tasks.length}
        </span>
        <button
          onClick={onAddTask}
          className="ml-auto flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-1 flex-col gap-2 rounded-xl p-2 transition-colors min-h-[120px]',
          isOver ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-secondary/30',
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-6">
            <p className="text-[11px] text-muted-foreground/50">Arraste tarefas aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}

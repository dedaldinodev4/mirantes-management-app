'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent, closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Filter, SlidersHorizontal, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { KanbanColumn } from '@/features/tasks/components/KanbanColumn'
import { TaskCard } from '@/features/tasks/components/TaskCard'
import { TaskModal } from '@/features/tasks/components/TaskModal'
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal'
import { KanbanColumnSkeleton } from '@/components/shared/Skeleton'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { useProjectsStore } from '@/stores/projects.store'
import { useUIStore } from '@/stores/ui.store'
import { KANBAN_COLUMNS, ROUTES } from '@/constants'
import { cn } from '@/utils'
import type { Task, TaskStatus } from '@/types'

export default function KanbanPage() {
  const params = useParams()
  const projectId = params.id as string
  const { tasks, columns, create, update, delete: deleteTask, move } = useTasks(projectId)
  const { projects } = useProjectsStore()
  const { taskModalOpen, activeTaskId, openTaskModal, closeTaskModal } = useUIStore()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)

  const project = projects.find((p) => p.id === projectId)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }, [tasks])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    // Dropped on a column
    if (KANBAN_COLUMNS.includes(overId as TaskStatus)) {
      const newStatus = overId as TaskStatus
      const task = tasks.find((t) => t.id === taskId)
      if (task && task.status !== newStatus) {
        const colTasks = tasks.filter((t) => t.status === newStatus)
        await move(taskId, newStatus, colTasks.length)
      }
      return
    }

    // Dropped on another task
    const overTask = tasks.find((t) => t.id === overId)
    if (!overTask) return
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === overTask.status) return
    await move(taskId, overTask.status, overTask.order)
  }, [tasks, move])

  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          title={project?.name ?? 'Kanban'}
          breadcrumbs={[
            { label: 'Projetos', href: ROUTES.projects },
            { label: project?.name ?? '…' },
            { label: 'Quadro' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <button className="flex h-7 items-center gap-1.5 rounded-md border border-border/60 bg-secondary/50 px-2.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                <Filter size={11} /> Filtro
              </button>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex h-7 items-center gap-1.5 rounded-md border border-border/60 bg-secondary/50 px-2.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
              >
                <Plus size={11} /> Tarefa
              </button>
            </div>
          }
        />

        {/* Project header strip */}
        {project && (
          <div className="flex items-center gap-3 border-b border-border bg-card/50 px-5 py-2.5">
            <div className="h-2 w-2 rounded-full" style={{ background: project.color }} />
            <span className="text-xs font-medium text-foreground">{project.name}</span>
            <span className="text-xs text-muted-foreground">—</span>
            <span className="text-xs text-muted-foreground">{tasks.length} tarefas</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="h-1 w-24 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${tasks.length ? Math.round(tasks.filter(t => t.status === 'Done').length / tasks.length * 100) : 0}%`,
                    background: project.color,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {tasks.length ? Math.round(tasks.filter(t => t.status === 'Done').length / tasks.length * 100) : 0}%
              </span>
            </div>
          </div>
        )}

        {/* Board */}
        <div className="flex-1 overflow-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex h-full gap-3 p-5">
              {KANBAN_COLUMNS.map((status) => {
                const col = columns.find((c) => c.id === status)
                return (
                  <KanbanColumn
                    key={status}
                    status={status}
                    tasks={col?.tasks ?? []}
                    color={col?.color ?? '#666'}
                    onAddTask={() => setCreateModalOpen(true)}
                    onTaskClick={(taskId) => openTaskModal(taskId)}
                    onDeleteTask={deleteTask}
                  />
                )
              })}
            </div>

            <DragOverlay>
              {activeTask && (
                <div className="rotate-2 scale-105 opacity-90 shadow-2xl">
                  <TaskCard task={activeTask as any} isDragging />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Task detail modal */}
      <TaskModal
        taskId={activeTaskId}
        open={taskModalOpen}
        onClose={closeTaskModal}
        onUpdate={update}
        onDelete={deleteTask}
      />

      {/* Create task modal */}
      <CreateTaskModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={create}
        projectId={projectId}
      />
    </AppShell>
  )
}

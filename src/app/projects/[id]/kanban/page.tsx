'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, closestCorners,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { Plus, Filter, Lock } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { KanbanColumn } from '@/features/tasks/components/KanbanColumn'
import { TaskCard } from '@/features/tasks/components/TaskCard'
import { TaskModal } from '@/features/tasks/components/TaskModal'
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { useProjectsStore } from '@/stores/projects.store'
import { useUIStore } from '@/stores/ui.store'
import { usePermissions } from '@/hooks/usePermissions'
import { KANBAN_COLUMNS, ROUTES } from '@/constants'
import { toast } from 'sonner'
import type { Task, TaskStatus } from '@/types'

export default function KanbanPage() {
  const params = useParams()
  const projectId = params.id as string

  const { tasks, columns, create, update, delete: deleteTask, move } = useTasks(projectId)
  const { projects } = useProjectsStore()
  const { taskModalOpen, activeTaskId, openTaskModal, closeTaskModal } = useUIStore()
  const {
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canMoveTask,
  } = usePermissions(projectId)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const project = projects.find((p) => p.id === projectId)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }, [tasks])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    if (!canMoveTask) {
      toast.error('Sem permissão para mover tarefas.')
      return
    }

    const taskId = active.id as string
    const overId = over.id as string

    if ((KANBAN_COLUMNS as readonly string[]).includes(overId)) {
      const newStatus = overId as TaskStatus
      const task = tasks.find((t) => t.id === taskId)
      if (task && task.status !== newStatus) {
        await move(taskId, newStatus, tasks.filter((t) => t.status === newStatus).length)
      }
      return
    }

    const overTask = tasks.find((t) => t.id === overId)
    const task = tasks.find((t) => t.id === taskId)
    if (!overTask || !task || task.status === overTask.status) return
    await move(taskId, overTask.status, overTask.order)
  }, [tasks, move, canMoveTask])

  // Guarded handlers — permission checked, then delegates to hook
  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    if (!canDeleteTask(task)) {
      toast.error('Sem permissão', {
        description: 'Só pode eliminar tarefas que criou ou lhe foram atribuídas.',
      })
      return
    }
    await deleteTask(taskId)
  }

  const handleUpdateTask = async (
    taskId: string,
    input: Parameters<typeof update>[1],
  ) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    if (!canEditTask(task)) {
      toast.error('Sem permissão', {
        description: 'Só pode editar tarefas que criou ou lhe foram atribuídas.',
      })
      return
    }
    await update(taskId, input)
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          title={project?.name ?? 'Kanban'}
          breadcrumbs={[
            { label: 'Projetos', href: ROUTES.projects },
            { label: project?.name ?? '…' },
            { label: 'Board' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <button className="flex h-7 items-center gap-1.5 rounded-md border border-border/60 bg-secondary/50 px-2.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                <Filter size={11} /> Filtrar
              </button>

              {canCreateTask ? (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-all"
                >
                  <Plus size={11} /> Nova tarefa
                </button>
              ) : (
                <div
                  title="Apenas membros do projeto podem criar tarefas"
                  className="flex h-7 items-center gap-1.5 rounded-md border border-border/40 bg-secondary/30 px-2.5 text-xs text-muted-foreground/50 cursor-not-allowed select-none"
                >
                  <Lock size={11} /> Nova tarefa
                </div>
              )}
            </div>
          }
        />

        {/* Project */}
        {project && (
          <div className="flex items-center gap-3 border-b border-border bg-card/50 px-5 py-2.5">
            <div className="h-2 w-2 rounded-full" style={{ background: project.color }} />
            <span className="text-xs font-medium text-foreground">{project.name}</span>
            <span className="text-xs text-muted-foreground">—</span>
            <span className="text-xs text-muted-foreground">
              {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <div className="h-1 w-24 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${tasks.length
                      ? Math.round(tasks.filter((t) => t.status === 'Done').length / tasks.length * 100)
                      : 0}%`,
                    background: project.color,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {tasks.length
                  ? Math.round(tasks.filter((t) => t.status === 'Done').length / tasks.length * 100)
                  : 0}%
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
                    onAddTask={canCreateTask ? () => setCreateModalOpen(true) : undefined}
                    onTaskClick={(id) => openTaskModal(id)}
                    onDeleteTask={handleDeleteTask}
                    canDeleteTask={canDeleteTask}
                  />
                )
              })}
            </div>

            <DragOverlay>
              {activeTask && (
                <div className="rotate-2 scale-105 opacity-90 shadow-2xl">
                  <TaskCard task={activeTask} isDragging />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <TaskModal
        taskId={activeTaskId}
        open={taskModalOpen}
        onClose={closeTaskModal}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        canEdit={canEditTask}
        canDelete={canDeleteTask}
      />

      {canCreateTask && (
        <CreateTaskModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreate={create}
          projectId={projectId}
        />
      )}
    </AppShell>
  )
}

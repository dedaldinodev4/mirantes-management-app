import { useAuthStore } from '@/stores/auth.store'
import { useProjectsStore } from '@/stores/projects.store'
import type { Task } from '@/types'

/**
 * Regras de negócio de permissões:
 *
 * OWNER do projeto:
 *   ✅ Criar projeto
 *   ✅ Editar projeto (nome, cor, descrição, datas)
 *   ✅ Eliminar projeto
 *   ✅ Adicionar / remover membros
 *   ✅ Criar tarefas
 *   ✅ Editar qualquer tarefa
 *   ✅ Eliminar qualquer tarefa
 *   ✅ Mover tarefas no kanban
 *
 * MEMBER do projeto:
 *   ❌ Editar projeto
 *   ❌ Eliminar projeto
 *   ❌ Gerir membros
 *   ✅ Criar tarefas
 *   ✅ Editar as suas próprias tarefas (reporter ou assignee)
 *   ✅ Eliminar as suas próprias tarefas
 *   ✅ Mover qualquer tarefa no kanban (colaboração)
 */

export function usePermissions(projectId?: string) {
  const { sessionUser } = useAuthStore()
  const { projects } = useProjectsStore()

  const userId = sessionUser?.id ?? null
  const project = projectId ? projects.find((p) => p.id === projectId) : null

  //* ── Project-level role *//
  const isOwner = !!project && project.ownerId === userId
  const isMember = !!project && !!userId && project.memberIds.includes(userId)
  const isAuthenticated = !!userId

  //* ── Project permissions *//
  const canCreateProject = isAuthenticated
  const canEditProject   = isOwner
  const canDeleteProject = isOwner
  const canManageMembers = isOwner

  //* ── Task permissions *//
  const canCreateTask = isMember || isOwner

 
  const canEditTask = (task: Pick<Task, 'reporterId' | 'assigneeId'>): boolean => {
    if (!userId) return false
    if (isOwner) return true
    if (!isMember) return false
    return task.reporterId === userId || task.assigneeId === userId
  }

  
  const canDeleteTask = (task: Pick<Task, 'reporterId' | 'assigneeId'>): boolean => {
    if (!userId) return false
    if (isOwner) return true
    if (!isMember) return false
    return task.reporterId === userId || task.assigneeId === userId
  }

 
  const canMoveTask = isMember || isOwner

  return {
    userId,
    isOwner,
    isMember,
    isAuthenticated,
    canCreateProject,
    canEditProject,
    canDeleteProject,
    canManageMembers,
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canMoveTask,
  }
}

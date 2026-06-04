'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useProjectsStore } from '@/stores/projects.store'
import {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
} from '@/services/supabase/tasks'
import type { CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/types'

export function useTasks(projectId: string) {
  const { sessionUser } = useAuthStore()
  const {
    tasks,
    setTasks,
    columns,
    moveTaskLocally,
    addTask,
    updateTask: storeUpdate,
    removeTask,
  } = useProjectsStore()

  const projectTasks = tasks.filter((t) => t.projectId === projectId)
  const loadingRef = useRef(false)

  const load = useCallback(async () => {
    if (!projectId || loadingRef.current) return
    loadingRef.current = true
    try {
      const data = await getProjectTasks(projectId)
      const others = tasks.filter((t) => t.projectId !== projectId)
      setTasks([...others, ...data])
    } catch (err: any) {
      toast.error('Falha ao carregar tarefas', { description: err?.message })
    } finally {
      loadingRef.current = false
    }
  }, [projectId])

  
  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (input: CreateTaskInput) => {
    if (!sessionUser) return
    try {
      const task = await createTask(input, sessionUser.id)
      const others = tasks.filter((t) => t.projectId !== projectId)
      const current = tasks.filter((t) => t.projectId === projectId)
      setTasks([...others, ...current, task])
      toast.success('Tarefa criada!', { description: input.title })
      return task.id
    } catch (err: any) {
      toast.error('Falha ao criar tarefa', { description: err?.message })
    }
  }

  const handleUpdate = async (taskId: string, input: Partial<UpdateTaskInput>) => {
    storeUpdate(taskId, input as any)
    try {
      await updateTask(taskId, input)
    } catch (err: any) {
      toast.error('Falha ao atualizar tarefa', { description: err?.message })
      await load() // rollback
    }
  }

  const handleDelete = async (taskId: string) => {
    removeTask(taskId)
    try {
      await deleteTask(taskId)
      toast.success('Tarefa apagada')
    } catch (err: any) {
      toast.error('Falha ao apagar tarefa', { description: err?.message })
      await load() // rollback
    }
  }

  const handleMove = async (taskId: string, newStatus: TaskStatus, newOrder: number) => {
    moveTaskLocally(taskId, newStatus, newOrder)
    try {
      await moveTask(taskId, newStatus, newOrder)
    } catch (err: any) {
      toast.error('Falha ao mover tarefa', { description: err?.message })
      await load()
    }
  }

  return {
    tasks: projectTasks,
    columns,
    create: handleCreate,
    update: handleUpdate,
    delete: handleDelete,
    move: handleMove,
    refetch: load,
  }
}

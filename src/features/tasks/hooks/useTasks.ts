'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useProjectsStore } from '@/stores/projects.store'
import {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
} from '@/services/firebase/tasks'
import type { CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/types'

export function useTasks(projectId: string) {
  const { firebaseUser } = useAuthStore()
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

  const load = useCallback(async () => {
    if (!projectId) return
    try {
      const data = await getProjectTasks(projectId)
      const otherTasks = tasks.filter((t) => t.projectId !== projectId)
      setTasks([...otherTasks, ...data])
    } catch (err: any) {
      toast.error('Failed to load tasks', { description: err?.message })
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  const handleCreate = async (input: CreateTaskInput) => {
    if (!firebaseUser) return
    try {
      const id = await createTask(input, firebaseUser.uid)
      toast.success('Tarefa criada!', { description: input.title })
      // Reload to get real Firestore data with timestamps
      await load()
      return id
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

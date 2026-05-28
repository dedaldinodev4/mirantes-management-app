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
  reorderTasks,
} from '@/services/firebase/tasks'
import type { CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/types'

export function useTasks(projectId: string) {
  const { firebaseUser } = useAuthStore()
  const { tasks, setTasks, columns, moveTaskLocally, addTask, updateTask: storeUpdate, removeTask } =
    useProjectsStore()

  const projectTasks = tasks.filter((t) => t.projectId === projectId)

  const load = useCallback(async () => {
    if (!projectId) return
    try {
      const data = await getProjectTasks(projectId)
      // merge with existing tasks from other projects
      const otherTasks = tasks.filter((t) => t.projectId !== projectId)
      setTasks([...otherTasks, ...data])
    } catch {
      toast.error('Failed to load tasks')
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  const handleCreate = async (input: CreateTaskInput) => {
    if (!firebaseUser) return
    try {
      const id = await createTask(input, firebaseUser.uid)
      toast.success('Task created', { description: input.title })
      await load()
      return id
    } catch {
      toast.error('Failed to create task')
    }
  }

  const handleUpdate = async (taskId: string, input: Partial<UpdateTaskInput>) => {
    try {
      storeUpdate(taskId, input as any)
      await updateTask(taskId, input)
    } catch {
      toast.error('Failed to update task')
      await load()
    }
  }

  const handleDelete = async (taskId: string) => {
    try {
      removeTask(taskId)
      await deleteTask(taskId)
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
      await load()
    }
  }

  const handleMove = async (taskId: string, newStatus: TaskStatus, newOrder: number) => {
    try {
      moveTaskLocally(taskId, newStatus, newOrder)
      await moveTask(taskId, newStatus, newOrder)
    } catch {
      toast.error('Failed to move task')
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

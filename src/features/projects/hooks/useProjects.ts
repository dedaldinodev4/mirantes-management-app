'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useProjectsStore } from '@/stores/projects.store'
import {
  getUserProjects,
  createProject,
  updateProject,
  deleteProject,
} from '@/services/firebase/projects'
import type { CreateProjectInput, UpdateProjectInput } from '@/types'

export function useProjects() {
  const { firebaseUser } = useAuthStore()
  const { projects, setProjects, loading, setLoading } = useProjectsStore()

  const load = useCallback(async () => {
    if (!firebaseUser) return
    try {
      setLoading(true)
      const data = await getUserProjects(firebaseUser.uid)
      setProjects(data)
    } catch {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [firebaseUser])

  useEffect(() => { load() }, [load])

  const handleCreate = async (input: CreateProjectInput) => {
    if (!firebaseUser) return
    const id = await createProject(input, firebaseUser.uid)
    toast.success('Project created!', { description: input.name })
    await load()
    return id
  }

  const handleUpdate = async (projectId: string, input: Partial<UpdateProjectInput>) => {
    await updateProject(projectId, input)
    toast.success('Project updated')
    await load()
  }

  const handleDelete = async (projectId: string) => {
    if (!firebaseUser) return
    await deleteProject(projectId, firebaseUser.uid)
    toast.success('Project deleted')
    await load()
  }

  return { projects, loading, create: handleCreate, update: handleUpdate, delete: handleDelete, refetch: load }
}

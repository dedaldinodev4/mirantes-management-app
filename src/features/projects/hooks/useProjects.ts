'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useProjectsStore } from '@/stores/projects.store'
import {
  getUserProjects,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} from '@/services/supabase/projects'
import { findUserByEmail } from '@/services/supabase/auth'
import type { CreateProjectInput, UpdateProjectInput } from '@/types'

export function useProjects() {
  const { sessionUser } = useAuthStore()
  const { projects, setProjects, removeProject, loading, setLoading } = useProjectsStore()
  const loadingRef = useRef(false)

  const load = useCallback(async () => {
    if (!sessionUser || loadingRef.current) return
    loadingRef.current = true
    try {
      setLoading(true)
      const data = await getUserProjects(sessionUser?.id)
      setProjects(data)
    } catch (err: any) {
      toast.error('Falha ao carregar projetos', { description: err?.message })
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [sessionUser?.id])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (input: CreateProjectInput) => {
    if (!sessionUser) return
    try {
      const id = await createProject(input,sessionUser.id)
      toast.success('Projeto criado!', { description: input.name })
      await load()
      return id
    } catch (err: any) {
      toast.error('Falha ao criar projeto', { description: err?.message })
    }
  }

  const handleUpdate = async (projectId: string, input: Partial<UpdateProjectInput>) => {
    try {
      await updateProject(projectId, input)
      toast.success('Projeto atualizado')
      await load()
    } catch (err: any) {
      toast.error('Falha ao atualizar projeto', { description: err?.message })
    }
  }

  const handleDelete = async (projectId: string) => {
    removeProject(projectId) // optimistic
    try {
      await deleteProject(projectId)
      toast.success('Projeto apagado')
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao apagar o projeto')
      // Rollback by reloading
      await load()
    }
  }

  
  const handleAddMember = async (projectId: string, email: string): Promise<boolean> => {
    try {
      const user = await findUserByEmail(email)
      if (!user) {
        toast.error('Usuário não encontrado', { description: `Conta não encontrada ${email}` })
        return false
      }
      const project = projects.find((p) => p.id === projectId)
      if (project?.memberIds.includes(user.uid as string)) {
        toast.warning('Membro existente', { description: `${email} já é membro do projeto` })
        return false
      }
      await addProjectMember(projectId, user.uid as string)
      toast.success('Membro adicionado!!', { description: (user as any).displayName ?? email })
      await load()
      return true
    } catch (err: any) {
      toast.error('Falha ao adicionar o membro', { description: err?.message })
      return false
    }
  }

  
  const handleRemoveMember = async (projectId: string, userId: string): Promise<void> => {
    if (!sessionUser) return
    try {
      await removeProjectMember(projectId, userId, sessionUser.id)
      toast.success('Membro removido')
      await load()
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao remover membro')
    }
  }

  return {
    projects,
    loading,
    create: handleCreate,
    update: handleUpdate,
    delete: handleDelete,
    addMember: handleAddMember,
    removeMember: handleRemoveMember,
    refetch: load,
  }
}

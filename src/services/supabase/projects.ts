import { supabase } from './client'
import type { TablesInsert, TablesUpdate } from './database.types'
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/types'

//* ── Map DB row → app Project *//
function rowToProject(row: {
  id: string
  name: string
  description: string
  color: string
  cover_url: string | null
  owner_id: string
  member_ids: string[]
  due_date: string | null
  archived: boolean
  created_at: string
  updated_at: string
}): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    color: row.color as Project['color'],
    coverURL: row.cover_url ?? null,
    ownerId: row.owner_id,
    memberIds: row.member_ids ?? [],
    dueDate: row.due_date ?? null,
    archived: row.archived ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}


//* ── Get user projects *//
export async function getUserProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .contains('member_ids', [userId])
    .eq('archived', false)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToProject)
}

//* ── Get single project *//
export async function getProject(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  if (error || !data) return null
  return rowToProject(data)
}

//* ── Create project *//
export async function createProject(
  input: CreateProjectInput,
  ownerId: string,
): Promise<string> {
  const payload: TablesInsert<'projects'> = {
    name: input.name,
    description: input.description ?? '',
    color: input.color,
    owner_id: ownerId,
    member_ids: [ownerId, ...(input.memberIds ?? [])],
    due_date: input.dueDate ?? null,
  }
  const { data, error } = await supabase
    .from('projects')
    .insert(payload)
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data!.id
}

//* ── Update project *//
export async function updateProject(
  projectId: string,
  input: Partial<UpdateProjectInput>,
): Promise<void> {
  const updates: TablesUpdate<'projects'> = {}
  if (input.name !== undefined)        updates.name = input.name
  if (input.description !== undefined) updates.description = input.description
  if (input.color !== undefined)       updates.color = input.color
  if (input.dueDate !== undefined)     updates.due_date = input.dueDate ?? null

  const { error } = await supabase.from('projects').update(updates).eq('id', projectId)
  if (error) throw new Error(error.message)
}

//* ── Delete project (RLS enforces owner only) *//
export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
  if (error) throw new Error(error.message)
}

//* ── Add member *//
export async function addProjectMember(projectId: string, userId: string): Promise<void> {
  const { data, error: fetchErr } = await supabase
    .from('projects')
    .select('member_ids')
    .eq('id', projectId)
    .single()
  if (fetchErr || !data) throw new Error(fetchErr?.message ?? 'Projeto não encontrado')

  const current: string[] = data.member_ids ?? []
  if (current.includes(userId)) return

  const updates: TablesUpdate<'projects'> = { member_ids: [...current, userId] }
  const { error } = await supabase.from('projects').update(updates).eq('id', projectId)
  if (error) throw new Error(error.message)
}

//* ── Remove member *//
export async function removeProjectMember(
  projectId: string,
  userId: string,
  requesterId: string,
): Promise<void> {
  const { data, error: fetchErr } = await supabase
    .from('projects')
    .select('owner_id, member_ids')
    .eq('id', projectId)
    .single()
  if (fetchErr || !data) throw new Error('Projeto não encontrado')
  if (data.owner_id !== requesterId)
    throw new Error('Apenas o dono do projeto pode remover membros')

  const updates: TablesUpdate<'projects'> = {
    member_ids: (data.member_ids as string[]).filter((id) => id !== userId),
  }
  const { error } = await supabase.from('projects').update(updates).eq('id', projectId)
  if (error) throw new Error(error.message)
}

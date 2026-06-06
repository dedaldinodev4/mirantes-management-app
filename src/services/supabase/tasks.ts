import { supabase } from './client'
import type {
  Task, CreateTaskInput,
  UpdateTaskInput, TaskStatus, TaskFilters
} from '@/types'
import type { TablesInsert, TablesUpdate } from './database.types'
import { isOverdue } from '@/utils'

//* ── Map DB row → app Task *//
function rowToTask(row: {
  id: string
  project_id: string
  title: string
  description: string
  status: string
  priority: string
  label: string
  assignee_id: string | null
  reporter_id: string
  due_date: string | null
  completed_at: string | null
  order: number
  attachments: unknown
  created_at: string
  updated_at: string
}): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description ?? '',
    status: row.status as TaskStatus,
    priority: row.priority as Task['priority'],
    label: row.label ?? '',
    assigneeId: row.assignee_id ?? null,
    reporterId: row.reporter_id,
    dueDate: row.due_date ?? null,
    completedAt: row.completed_at ?? null,
    order: row.order ?? Date.now(),
    attachments: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

//* ── Get project tasks *//
export async function getProjectTasks(
  projectId: string,
  filters?: TaskFilters,
): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('order', { ascending: true })
  if (error) throw new Error(error.message)

  let tasks = (data ?? []).map(rowToTask)

  // Client-side filters
  if (filters?.status?.length)
    tasks = tasks.filter((t) => filters.status!.includes(t.status))
  if (filters?.priority?.length)
    tasks = tasks.filter((t) => filters.priority!.includes(t.priority))
  if (filters?.assigneeId?.length)
    tasks = tasks.filter((t) => t.assigneeId && filters.assigneeId!.includes(t.assigneeId))
  if (filters?.search) {
    const q = filters.search.toLowerCase()
    tasks = tasks.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    )
  }
  if (filters?.overdue) tasks = tasks.filter((t) => isOverdue(t.dueDate))

  return tasks
}

//* ── Create task *//
export async function createTask(
  input: CreateTaskInput,
  reporterId: string,
): Promise<Task> {
  const payload: TablesInsert<'tasks'> = {
    project_id: input.projectId,
    title: input.title,
    description: input.description ?? '',
    status: input.status,
    priority: input.priority,
    label: input.label ?? '',
    assignee_id: input.assigneeId ?? null,
    reporter_id: reporterId,
    due_date: input.dueDate ?? null,
    order: Date.now(),
  }
  const { data, error } = await supabase.from('tasks').insert(payload).select().single()
  if (error) throw new Error(error.message)
  return rowToTask(data!)
}

//* ── Update task *//
export async function updateTask(
  taskId: string,
  input: Partial<UpdateTaskInput>,
): Promise<void> {
  const updates: TablesUpdate<'tasks'> = {}
  if (input.title !== undefined)       updates.title = input.title
  if (input.description !== undefined) updates.description = input.description
  if (input.status !== undefined) {
    updates.status = input.status
    if (input.status === 'Done') updates.completed_at = new Date().toISOString()
  }
  if (input.priority !== undefined)   updates.priority = input.priority
  if (input.label !== undefined)      updates.label = input.label
  if (input.assigneeId !== undefined) updates.assignee_id = input.assigneeId ?? null
  if (input.dueDate !== undefined)    updates.due_date = input.dueDate ?? null

  const { error } = await supabase.from('tasks').update(updates).eq('id', taskId)
  if (error) throw new Error(error.message)
}

//* ── Move task (kanban) *//
export async function moveTask(
  taskId: string,
  newStatus: TaskStatus,
  newOrder: number,
): Promise<void> {
  const updates: TablesUpdate<'tasks'> = { status: newStatus, order: newOrder }
  if (newStatus === 'Done') updates.completed_at = new Date().toISOString()

  const { error } = await supabase.from('tasks').update(updates).eq('id', taskId)
  if (error) throw new Error(error.message)
}

//* ── Delete task *//
export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw new Error(error.message)
}

//* ── Delete all tasks of a project (cascade is handled by Supabase FK) *//
export async function deleteProjectTasks(projectId: string): Promise<void> {
  const { error } = await supabase.from('tasks')
    .delete()
    .eq('project_id', projectId)

  if (error) throw new Error(error.message)
}

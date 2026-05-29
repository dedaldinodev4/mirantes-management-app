import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore'
import { db } from './config'
import { COLLECTIONS } from '@/constants'
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskFilters } from '@/types'
import { isOverdue } from '@/utils'

//* Create Task *//
export async function createTask(
  input: CreateTaskInput,
  reporterId: string,
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.tasks), {
    title: input.title,
    description: input.description ?? '',
    projectId: input.projectId,
    status: input.status,
    priority: input.priority,
    label: input.label ?? '',
    assigneeId: input.assigneeId ?? null,
    reporterId,
    dueDate: input.dueDate ? Timestamp.fromDate(new Date(input.dueDate)) : null,
    completedAt: null,
    // timestamp-based order: always appends to end, no extra read needed
    order: Date.now(),
    attachments: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

//* Get Project Tasks *//
export async function getProjectTasks(
  projectId: string,
  filters?: TaskFilters,
): Promise<Task[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.tasks),
      where('projectId', '==', projectId),
    ),
  )
  let tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task)
  tasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  if (filters) {
    if (filters.status?.length)
      tasks = tasks.filter((t) => filters.status!.includes(t.status))
    if (filters.priority?.length)
      tasks = tasks.filter((t) => filters.priority!.includes(t.priority))
    if (filters.assigneeId?.length)
      tasks = tasks.filter((t) => t.assigneeId && filters.assigneeId!.includes(t.assigneeId))
    if (filters.search) {
      const q = filters.search.toLowerCase()
      tasks = tasks.filter(
        (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      )
    }
    if (filters.overdue) tasks = tasks.filter((t) => isOverdue(t.dueDate))
  }

  return tasks
}

//* Update Task *//
export async function updateTask(
  taskId: string,
  input: Partial<UpdateTaskInput>,
): Promise<void> {
  const updates: Record<string, unknown> = { ...input, updatedAt: serverTimestamp() }
  if (input.status === 'Done') updates.completedAt = serverTimestamp()
  await updateDoc(doc(db, COLLECTIONS.tasks, taskId), updates)
}

//* Move Task (Kanban drag & drop)  *//
export async function moveTask(
  taskId: string,
  newStatus: TaskStatus,
  newOrder: number,
): Promise<void> {
  const updates: Record<string, unknown> = {
    status: newStatus,
    order: newOrder,
    updatedAt: serverTimestamp(),
  }
  if (newStatus === 'Done') updates.completedAt = serverTimestamp()
  await updateDoc(doc(db, COLLECTIONS.tasks, taskId), updates)
}

//* Batch Reorder ─*//
export async function reorderTasks(
  updates: Array<{ id: string; order: number; status: TaskStatus }>,
): Promise<void> {
  const batch = writeBatch(db)
  for (const { id, order, status } of updates) {
    batch.update(doc(db, COLLECTIONS.tasks, id), {
      order,
      status,
      updatedAt: serverTimestamp(),
    })
  }
  await batch.commit()
}

//* Delete Task *//
export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.tasks, taskId))
}

//* Delete All Tasks of a Project (for cascade delete) *//
export async function deleteProjectTasks(projectId: string): Promise<void> {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.tasks), where('projectId', '==', projectId)),
  )
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

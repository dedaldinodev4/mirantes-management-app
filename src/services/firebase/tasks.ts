import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  Timestamp,
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
  // Get max order in column
  const existingQ = query(
    collection(db, COLLECTIONS.tasks),
    where('projectId', '==', input.projectId),
    where('status', '==', input.status),
    orderBy('order', 'desc'),
  )
  const snap = await getDocs(existingQ)
  const maxOrder = snap.docs.length > 0 ? (snap.docs[0].data().order ?? 0) + 1 : 0

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
    order: maxOrder,
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
  let q = query(
    collection(db, COLLECTIONS.tasks),
    where('projectId', '==', projectId),
    orderBy('order', 'asc'),
  )

  const snap = await getDocs(q)
  let tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task)

  // Client-side filtering
  if (filters) {
    if (filters.status?.length) {
      tasks = tasks.filter((t) => filters.status!.includes(t.status))
    }
    if (filters.priority?.length) {
      tasks = tasks.filter((t) => filters.priority!.includes(t.priority))
    }
    if (filters.assigneeId?.length) {
      tasks = tasks.filter(
        (t) => t.assigneeId && filters.assigneeId!.includes(t.assigneeId),
      )
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      )
    }
    if (filters.overdue) {
      tasks = tasks.filter((t) => isOverdue(t.dueDate))
    }
  }

  return tasks
}

//* Update Task *//
export async function updateTask(
  taskId: string,
  input: Partial<UpdateTaskInput>,
): Promise<void> {
  const updates: Record<string, unknown> = {
    ...input,
    updatedAt: serverTimestamp(),
  }

  // Set completedAt when moving to Done
  if (input.status === 'Done') {
    updates.completedAt = serverTimestamp()
  }

  // Prevent reverting Done without confirmation (handled at UI layer)
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

  if (newStatus === 'Done') {
    updates.completedAt = serverTimestamp()
  }

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

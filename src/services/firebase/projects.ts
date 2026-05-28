import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from './config'
import { COLLECTIONS } from '@/constants'
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/types'

//* Create Project *// 
export async function createProject(
  input: CreateProjectInput,
  ownerId: string,
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.projects), {
    name: input.name,
    description: input.description ?? '',
    color: input.color,
    coverURL: null,
    ownerId,
    memberIds: [ownerId, ...(input.memberIds ?? [])],
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return ref.id
}

//* Get User Projects *//
export async function getUserProjects(userId: string): Promise<Project[]> {
  const q = query(
    collection(db, COLLECTIONS.projects),
    where('memberIds', 'array-contains', userId),
    where('archived', '==', false),
    orderBy('createdAt', 'desc'),
  )

  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project)
}

//* Get Project *//
export async function getProject(projectId: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.projects, projectId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Project
}

//* Update Project *//
export async function updateProject(
  projectId: string,
  input: Partial<UpdateProjectInput>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.projects, projectId), {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

//* Delete Project (owner only) *//
export async function deleteProject(
  projectId: string,
  requesterId: string,
): Promise<void> {
  const project = await getProject(projectId)
  if (!project) throw new Error('Project not found')
  if (project.ownerId !== requesterId) {
    throw new Error('Only the project owner can delete it')
  }
  await deleteDoc(doc(db, COLLECTIONS.projects, projectId))
}

//* Add Member in Project *//
export async function addProjectMember(
  projectId: string,
  userId: string,
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.projects, projectId), {
    memberIds: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  })
}

//* Remove Member *//
export async function removeProjectMember(
  projectId: string,
  userId: string,
  requesterId: string,
): Promise<void> {
  const project = await getProject(projectId)
  if (!project) throw new Error('Project not found')
  if (project.ownerId !== requesterId) {
    throw new Error('Only the project owner can remove members')
  }
  await updateDoc(doc(db, COLLECTIONS.projects, projectId), {
    memberIds: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  })
}

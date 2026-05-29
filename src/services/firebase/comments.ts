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
  Timestamp,
} from 'firebase/firestore'
import { db } from './config'
import { COLLECTIONS } from '@/constants'
import type { Comment, CreateCommentInput } from '@/types'

export async function createComment(
  input: CreateCommentInput,
  authorId: string,
): Promise<string> {
  const now = Timestamp.now()
  const ref = await addDoc(collection(db, COLLECTIONS.comments), {
    taskId: input.taskId,
    projectId: input.projectId,
    authorId,
    content: input.content.trim(),
    edited: false,
    createdAt: now,
    updatedAt: now,
  })
  // Return immediately with local data — no extra getDoc needed
  return {
    id: ref.id,
    taskId: input.taskId,
    projectId: input.projectId,
    authorId,
    content: input.content.trim(),
    edited: false,
    createdAt: now,
    updatedAt: now,
  } as Comment
}

export async function getTaskComments(taskId: string): Promise<Comment[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.comments), where('taskId', '==', taskId)),
  )
  const comments = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment)
  return comments.sort((a, b) => {
    const ta = (a.createdAt as any)?.toMillis?.() ?? 0
    const tb = (b.createdAt as any)?.toMillis?.() ?? 0
    return ta - tb
  })
}

export async function updateComment(
  commentId: string,
  content: string,
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.comments, commentId), {
    content: content.trim(),
    edited: true,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteComment(commentId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.comments, commentId))
}


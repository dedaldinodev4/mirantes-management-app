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
} from 'firebase/firestore'
import { db } from './config'
import { COLLECTIONS } from '@/constants'
import type { Comment, CreateCommentInput } from '@/types'

export async function createComment(
  input: CreateCommentInput,
  authorId: string,
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.comments), {
    taskId: input.taskId,
    projectId: input.projectId,
    authorId,
    content: input.content,
    edited: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getTaskComments(taskId: string): Promise<Comment[]> {
  const q = query(
    collection(db, COLLECTIONS.comments),
    where('taskId', '==', taskId),
  )
  const snap = await getDocs(q)
  const comments = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment)
  // Sort client-side by createdAt ascending
  return comments.sort((a, b) => {
    const ta = (a.createdAt as any)?.toMillis?.() ?? 0
    const tb = (b.createdAt as any)?.toMillis?.() ?? 0
    return ta - tb
  })
}

export async function updateComment(
  commentId: string,
  content: string,
  authorId: string,
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


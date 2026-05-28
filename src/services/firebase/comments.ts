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
    orderBy('createdAt', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment)
}

export async function updateComment(
  commentId: string,
  content: string,
  authorId: string,
): Promise<void> {
  const comment = await getDocs(
    query(collection(db, COLLECTIONS.comments), where('__name__', '==', commentId)),
  )
  const data = comment.docs[0]?.data()
  if (data?.authorId !== authorId) {
    throw new Error('You can only edit your own comments')
  }
  await updateDoc(doc(db, COLLECTIONS.comments, commentId), {
    content,
    edited: true,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteComment(
  commentId: string,
  authorId: string,
): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.comments, commentId))
}

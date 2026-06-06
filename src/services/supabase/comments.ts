import { supabase } from './client'
import type { Comment, CreateCommentInput } from '@/types'
import type { TablesInsert, TablesUpdate } from './database.types'


//* ── Map DB row → Comment *//
function rowToComment(row: {
  id: string
  task_id: string
  project_id: string
  author_id: string
  content: string
  edited: boolean
  created_at: string
  updated_at: string
}): Comment {
  return {
    id: row.id,
    taskId: row.task_id,
    projectId: row.project_id,
    authorId: row.author_id,
    content: row.content,
    edited: row.edited ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}


//* ── Create — returns immediately with inserted row *//
export async function createComment(
  input: CreateCommentInput,
  authorId: string,
): Promise<Comment> {
  const payload: TablesInsert<'comments'> = {
    task_id: input.taskId,
    project_id: input.projectId,
    author_id: authorId,
    content: input.content.trim(),
  }
  const { data, error } = await supabase.from('comments').insert(payload).select().single()
  if (error) throw new Error(error.message)
  return rowToComment(data!)
}

//* ── Get task comments *//
export async function getTaskComments(taskId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToComment)
}

//* ── Update comment *//
export async function updateComment(commentId: string, content: string): Promise<void> {
  const updates: TablesUpdate<'comments'> = { content: content.trim(), edited: true }
  const { error } = await supabase.from('comments').update(updates).eq('id', commentId)
  if (error) throw new Error(error.message)
}

//* ── Delete comment *//
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) throw new Error(error.message)
}

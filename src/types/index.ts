import { Timestamp } from 'firebase/firestore'

// ── User ──────────────────────────────────────────────────────────────────────
export interface User {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ── Project ───────────────────────────────────────────────────────────────────
export type ProjectColor =
  | '#6366f1'
  | '#22c55e'
  | '#f59e0b'
  | '#ef4444'
  | '#3b82f6'
  | '#a855f7'
  | '#ec4899'
  | '#14b8a6'

export interface Project {
  id: string
  name: string
  description: string
  color: ProjectColor
  coverURL: string | null
  ownerId: string
  memberIds: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
  dueDate: Timestamp | null
  archived: boolean
}

export interface ProjectWithMeta extends Project {
  taskCount: number
  completedCount: number
  progress: number
  members: User[]
  owner: User
}

// ── Task ──────────────────────────────────────────────────────────────────────
export type TaskStatus = 'Backlog' | 'Todo' | 'In Progress' | 'Review' | 'Done'

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  label: string
  assigneeId: string | null
  reporterId: string
  dueDate: Timestamp | null
  completedAt: Timestamp | null
  order: number
  attachments: Attachment[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface TaskWithMeta extends Task {
  assignee: User | null
  reporter: User
  commentCount: number
  isOverdue: boolean
}

// ── Comment ───────────────────────────────────────────────────────────────────
export interface Comment {
  id: string
  taskId: string
  projectId: string
  authorId: string
  content: string
  createdAt: Timestamp
  updatedAt: Timestamp
  edited: boolean
}

export interface TaskComment extends Comment {}

export interface CommentWithAuthor extends Comment {
  author: User
}

// ── Notification ──────────────────────────────────────────────────────────────
export type NotificationType =
  | 'task_assigned'
  | 'task_overdue'
  | 'comment_added'
  | 'project_invite'
  | 'task_completed'
  | 'task_status_changed'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  taskId: string | null
  projectId: string | null
  actorId: string | null
  createdAt: Timestamp
}

// ── Attachment ────────────────────────────────────────────────────────────────
export interface Attachment {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploadedAt: Timestamp
  uploadedBy: string
}

// ── Activity ──────────────────────────────────────────────────────────────────
export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'assigned'
  | 'commented'
  | 'completed'
  | 'moved'

export interface Activity {
  id: string
  projectId: string
  taskId: string | null
  actorId: string
  action: ActivityAction
  meta: Record<string, string>
  createdAt: Timestamp
}

// ── Kanban ────────────────────────────────────────────────────────────────────
export interface KanbanColumn {
  id: TaskStatus
  title: TaskStatus
  tasks: TaskWithMeta[]
  color: string
}

// ── Forms ─────────────────────────────────────────────────────────────────────
export interface CreateTaskInput {
  title: string
  description?: string
  projectId: string
  status: TaskStatus
  priority: TaskPriority
  label?: string
  assigneeId?: string
  dueDate?: string
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string
}

export interface CreateProjectInput {
  name: string
  description?: string
  color: ProjectColor
  memberIds?: string[]
  dueDate?: string
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string
}

export interface CreateCommentInput {
  taskId: string
  projectId: string
  content: string
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  displayName: string
  email: string
  password: string
  confirmPassword: string
}

// ── API Responses ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  hasMore: boolean
  cursor: string | null
}

// ── Filters ───────────────────────────────────────────────────────────────────
export interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assigneeId?: string[]
  label?: string[]
  search?: string
  overdue?: boolean
}

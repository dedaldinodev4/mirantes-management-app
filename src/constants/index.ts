import type { TaskStatus, TaskPriority, ProjectColor } from '@/types'

// ── Kanban Columns ────────────────────────────────────────────────────────────
export const KANBAN_COLUMNS: TaskStatus[] = [
  'Backlog',
  'Todo',
  'In Progress',
  'Review',
  'Done',
]

export const COLUMN_COLORS: Record<TaskStatus, string> = {
  Backlog: '#71717a',
  Todo: '#3b82f6',
  'In Progress': '#f59e0b',
  Review: '#a855f7',
  Done: '#22c55e',
}

export const COLUMN_BG: Record<TaskStatus, string> = {
  Backlog: 'bg-zinc-500/10 text-zinc-400',
  Todo: 'bg-blue-500/10 text-blue-400',
  'In Progress': 'bg-amber-500/10 text-amber-400',
  Review: 'bg-purple-500/10 text-purple-400',
  Done: 'bg-emerald-500/10 text-emerald-400',
}

// ── Priority ──────────────────────────────────────────────────────────────────
export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bg: string; icon: string }
> = {
  urgent: {
    label: 'Urgent',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    icon: '🔴',
  },
  high: {
    label: 'High',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    icon: '🟠',
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    icon: '🔵',
  },
  low: {
    label: 'Low',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    icon: '🟢',
  },
}

// ── Project Colors ────────────────────────────────────────────────────────────
export const PROJECT_COLORS: ProjectColor[] = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
]

// ── Labels ────────────────────────────────────────────────────────────────────
export const TASK_LABELS = [
  'Frontend',
  'Backend',
  'Design',
  'Mobile',
  'UX',
  'Docs',
  'Security',
  'DevOps',
  'Testing',
  'Bug',
  'Feature',
  'Improvement',
]

export const LABEL_COLORS: Record<string, { bg: string; text: string }> = {
  Frontend: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  Backend: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  Design: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  Mobile: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  UX: { bg: 'bg-pink-500/15', text: 'text-pink-400' },
  Docs: { bg: 'bg-teal-500/15', text: 'text-teal-400' },
  Security: { bg: 'bg-red-500/15', text: 'text-red-400' },
  DevOps: { bg: 'bg-orange-500/15', text: 'text-orange-400' },
  Testing: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  Bug: { bg: 'bg-red-500/15', text: 'text-red-400' },
  Feature: { bg: 'bg-indigo-500/15', text: 'text-indigo-400' },
  Improvement: { bg: 'bg-violet-500/15', text: 'text-violet-400' },
}

// ── Routes ────────────────────────────────────────────────────────────────────
export const ROUTES = {
  home: '/',
  login: '/auth/login',
  register: '/auth/register',
  dashboard: '/dashboard',
  projects: '/projects',
  newProject: '/projects/new',
  project: (id: string) => `/projects/${id}`,
  kanban: (id: string) => `/projects/${id}/kanban`,
  settings: '/settings',
  profile: '/profile',
} as const

// ── Firebase Collections ──────────────────────────────────────────────────────
export const COLLECTIONS = {
  users: 'users',
  projects: 'projects',
  tasks: 'tasks',
  comments: 'comments',
  notifications: 'notifications',
  activities: 'activities',
} as const

// ── Pagination ────────────────────────────────────────────────────────────────
export const PAGE_SIZE = 20

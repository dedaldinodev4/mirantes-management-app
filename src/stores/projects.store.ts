import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Project, Task, KanbanColumn, TaskFilters } from '@/types'
import { KANBAN_COLUMNS, COLUMN_COLORS } from '@/constants'

interface ProjectsState {
  projects: Project[]
  currentProject: Project | null
  tasks: Task[]
  columns: KanbanColumn[]
  filters: TaskFilters
  loading: boolean
  error: string | null

  setProjects: (projects: Project[]) => void
  removeProject: (projectId: string) => void          // ← new: optimistic delete
  setCurrentProject: (project: Project | null) => void
  setTasks: (tasks: Task[]) => void
  buildColumns: () => void
  moveTaskLocally: (taskId: string, newStatus: string, newOrder: number) => void
  setFilters: (filters: Partial<TaskFilters>) => void
  clearFilters: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  removeTask: (taskId: string) => void
}

export const useProjectsStore = create<ProjectsState>()(
  devtools(
    (set, get) => ({
      projects: [],
      currentProject: null,
      tasks: [],
      columns: [],
      filters: {},
      loading: false,
      error: null,

      setProjects: (projects) => set({ projects }),

      // Optimistic delete: remove project + its tasks from store immediately
      removeProject: (projectId) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          tasks: state.tasks.filter((t) => t.projectId !== projectId),
        }))
        get().buildColumns()
      },

      setCurrentProject: (project) => set({ currentProject: project }),

      setTasks: (tasks) => {
        set({ tasks })
        get().buildColumns()
      },

      buildColumns: () => {
        const { tasks, filters } = get()
        let filtered = [...tasks]

        if (filters.search) {
          const q = filters.search.toLowerCase()
          filtered = filtered.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.description.toLowerCase().includes(q),
          )
        }
        if (filters.status?.length) {
          filtered = filtered.filter((t) => filters.status!.includes(t.status))
        }
        if (filters.priority?.length) {
          filtered = filtered.filter((t) => filters.priority!.includes(t.priority))
        }
        if (filters.assigneeId?.length) {
          filtered = filtered.filter(
            (t) => t.assigneeId && filters.assigneeId!.includes(t.assigneeId),
          )
        }

        const columns: KanbanColumn[] = KANBAN_COLUMNS.map((status) => ({
          id: status,
          title: status,
          tasks: filtered
            .filter((t) => t.status === status)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) as any,
          color: COLUMN_COLORS[status],
        }))

        set({ columns })
      },

      moveTaskLocally: (taskId, newStatus, newOrder) => {
        const tasks = get().tasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus as any, order: newOrder } : t,
        )
        set({ tasks })
        get().buildColumns()
      },

      setFilters: (filters) => {
        set((state) => ({ filters: { ...state.filters, ...filters } }))
        get().buildColumns()
      },

      clearFilters: () => {
        set({ filters: {} })
        get().buildColumns()
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      addTask: (task) => {
        set((state) => ({ tasks: [...state.tasks, task] }))
        get().buildColumns()
      },

      updateTask: (taskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t,
          ),
        }))
        get().buildColumns()
      },

      removeTask: (taskId) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }))
        get().buildColumns()
      },
    }),
    { name: 'projects-store' },
  ),
)

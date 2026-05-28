import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectsStore } from '@/stores/projects.store'
import { useUIStore } from '@/stores/ui.store'
import type { Task } from '@/types'
import { Timestamp } from 'firebase/firestore'

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  projectId: 'proj-1',
  title: 'Test task',
  description: '',
  status: 'Todo',
  priority: 'medium',
  label: 'Frontend',
  assigneeId: null,
  reporterId: 'user-1',
  dueDate: null,
  completedAt: null,
  order: 0,
  attachments: [],
  createdAt: {} as Timestamp,
  updatedAt: {} as Timestamp,
  ...overrides,
})

describe('useProjectsStore', () => {
  beforeEach(() => {
    useProjectsStore.setState({
      projects: [],
      tasks: [],
      columns: [],
      filters: {},
      currentProject: null,
      loading: false,
      error: null,
    })
  })

  it('adds a task', () => {
    const task = makeTask()
    useProjectsStore.getState().addTask(task)
    expect(useProjectsStore.getState().tasks).toHaveLength(1)
  })

  it('removes a task', () => {
    const task = makeTask()
    useProjectsStore.getState().addTask(task)
    useProjectsStore.getState().removeTask('task-1')
    expect(useProjectsStore.getState().tasks).toHaveLength(0)
  })

  it('updates a task', () => {
    const task = makeTask()
    useProjectsStore.getState().addTask(task)
    useProjectsStore.getState().updateTask('task-1', { title: 'Updated' })
    expect(useProjectsStore.getState().tasks[0].title).toBe('Updated')
  })

  it('moves a task locally', () => {
    const task = makeTask()
    useProjectsStore.getState().addTask(task)
    useProjectsStore.getState().moveTaskLocally('task-1', 'Done', 0)
    expect(useProjectsStore.getState().tasks[0].status).toBe('Done')
  })

  it('builds columns from tasks', () => {
    useProjectsStore.getState().addTask(makeTask({ id: '1', status: 'Todo' }))
    useProjectsStore.getState().addTask(makeTask({ id: '2', status: 'Done' }))
    useProjectsStore.getState().addTask(makeTask({ id: '3', status: 'In Progress' }))
    const cols = useProjectsStore.getState().columns
    expect(cols.find((c) => c.id === 'Todo')?.tasks).toHaveLength(1)
    expect(cols.find((c) => c.id === 'Done')?.tasks).toHaveLength(1)
  })

  it('applies search filter', () => {
    useProjectsStore.getState().addTask(makeTask({ id: '1', title: 'Fix login bug' }))
    useProjectsStore.getState().addTask(makeTask({ id: '2', title: 'Design system update' }))
    useProjectsStore.getState().setFilters({ search: 'login' })
    const cols = useProjectsStore.getState().columns
    const todoCol = cols.find((c) => c.id === 'Todo')
    expect(todoCol?.tasks).toHaveLength(1)
    expect(todoCol?.tasks[0].title).toBe('Fix login bug')
  })
})

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      taskModalOpen: false,
      activeTaskId: null,
    })
  })

  it('toggles sidebar', () => {
    useUIStore.getState().toggleSidebar()
    expect(useUIStore.getState().sidebarCollapsed).toBe(true)
    useUIStore.getState().toggleSidebar()
    expect(useUIStore.getState().sidebarCollapsed).toBe(false)
  })

  it('opens command palette', () => {
    useUIStore.getState().openCommandPalette()
    expect(useUIStore.getState().commandPaletteOpen).toBe(true)
  })

  it('opens task modal with taskId', () => {
    useUIStore.getState().openTaskModal('task-42')
    expect(useUIStore.getState().taskModalOpen).toBe(true)
    expect(useUIStore.getState().activeTaskId).toBe('task-42')
  })

  it('closes task modal', () => {
    useUIStore.getState().openTaskModal('task-42')
    useUIStore.getState().closeTaskModal()
    expect(useUIStore.getState().taskModalOpen).toBe(false)
    expect(useUIStore.getState().activeTaskId).toBeNull()
  })
})

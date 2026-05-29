'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useProjectsStore } from '@/stores/projects.store'
import { getUserProjects } from '@/services/firebase/projects'
import { getProjectTasks } from '@/services/firebase/tasks'
import type { User } from '@/types'
import { toast } from 'sonner'

interface ActivityItem {
  icon: string
  text: string
  time: string
}

const MOCK_ACTIVITIES: ActivityItem[] = [
  { icon: '✅', text: '<strong>Alex Kim</strong> completed <strong>Storybook setup</strong>', time: '2 min ' },
  { icon: '💬', text: '<strong>Sam Rivera</strong> commented on <strong>API schema</strong>', time: '18 min ago' },
  { icon: '🚀', text: '<strong>Morgan Lee</strong> moved task to <strong>Review</strong>', time: '1h ago' },
  { icon: '⚠️', text: '<strong>Navigation redesign</strong> is overdue', time: '3h ago' },
  { icon: '➕', text: '<strong>Jordan Davis</strong> created a new task', time: '5h ago' },
]

export function useDashboard() {
  const { firebaseUser } = useAuthStore()
  const { projects, tasks, setProjects, setTasks } = useProjectsStore()
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser) return

    const load = async () => {
      try {
        setLoading(true)
        const userProjects = await getUserProjects(firebaseUser.uid)
        setProjects(userProjects)

        const allTasks = await Promise.all(
          userProjects.map((p) => getProjectTasks(p.id))
        )
        setTasks(allTasks.flat())
      } catch (err) {
        toast.error('Dashboard carregou com erro: ')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [firebaseUser])

  return {
    projects,
    tasks,
    activities: MOCK_ACTIVITIES,
    members,
    loading,
  }
}

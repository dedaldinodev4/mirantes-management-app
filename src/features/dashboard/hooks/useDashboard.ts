'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useProjectsStore } from '@/stores/projects.store'
import { getUserProjects } from '@/services/supabase/projects'
import { getProjectTasks } from '@/services/supabase/tasks'
import type { User } from '@/types'

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
  const { sessionUser } = useAuthStore()
  const { projects, tasks, setProjects, setTasks } = useProjectsStore()
  const [members] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!sessionUser || loadedRef.current) return
    loadedRef.current = true

    const load = async () => {
      try {
        setLoading(true)
        const userProjects = await getUserProjects(sessionUser.id)
        setProjects(userProjects)

        if (userProjects.length > 0) {
          const allTasks = await Promise.all(
            userProjects.map((p) => getProjectTasks(p.id)),
          )
          setTasks(allTasks.flat())
        }
      } catch (err) {
        console.error('Dashboard erro ao carregar:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [sessionUser?.id])

  return { projects, tasks, activities: MOCK_ACTIVITIES, members, loading }
}

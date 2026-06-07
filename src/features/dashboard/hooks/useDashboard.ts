'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useProjectsStore } from '@/stores/projects.store'
import { useNotificationsStore } from '@/stores/notifications.store'
import { getUserProjects } from '@/services/supabase/projects'
import { getProjectTasks } from '@/services/supabase/tasks'
import { isOverdue, formatRelative } from '@/utils'

export interface ActivityItem {
  id: string
  icon: string
  text: string
  time: string
  type: 'completed' | 'overdue' | 'review' | 'created' | 'notification'
}

export function useDashboard() {
  const { sessionUser, profile } = useAuthStore()
  const { projects, tasks, setProjects, setTasks } = useProjectsStore()
  const { notifications, loading: notifsLoading } = useNotificationsStore()
  const loadedRef = useRef(false)
  const loadingRef = useRef(true)

  useEffect(() => {
    if (!sessionUser || loadedRef.current) return
    loadedRef.current = true

    const load = async () => {
      try {
        loadingRef.current = true
        const userProjects = await getUserProjects(sessionUser.id)
        setProjects(userProjects)

        if (userProjects.length > 0) {
          const allTasks = await Promise.all(
            userProjects.map((p) => getProjectTasks(p.id)),
          )
          setTasks(allTasks.flat())
        }
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        loadingRef.current = false
      }
    }

    load()
  }, [sessionUser?.id])

  //* ── Build activity feed from real data *//
  const activities = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = []

    //* Tasks completed recently
    const recentDone = [...tasks]
      .filter((t) => t.status === 'Done' && t.completedAt)
      .sort((a, b) =>
        new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime(),
      )
      .slice(0, 3)

    recentDone.forEach((task) => {
      const project = projects.find((p) => p.id === task.projectId)
      const isOwn = task.reporterId === sessionUser?.id || task.assigneeId === sessionUser?.id
      items.push({
        id: `done-${task.id}`,
        icon: '✅',
        text: isOwn
          ? `Concluiu <strong>${task.title}</strong>${project ? ` em ${project.name}` : ''}`
          : `<strong>${task.title}</strong> foi concluída${project ? ` em ${project.name}` : ''}`,
        time: formatRelative(task.completedAt),
        type: 'completed',
      })
    })

    //* Overdue tasks assigned to user
    const overdue = tasks
      .filter((t) =>
        t.status !== 'Done' &&
        isOverdue(t.dueDate) &&
        (t.assigneeId === sessionUser?.id || t.reporterId === sessionUser?.id),
      )
      .slice(0, 2)

    overdue.forEach((task) => {
      const project = projects.find((p) => p.id === task.projectId)
      items.push({
        id: `overdue-${task.id}`,
        icon: '⚠️',
        text: `<strong>${task.title}</strong> está em atraso${project ? ` — ${project.name}` : ''}`,
        time: formatRelative(task.dueDate),
        type: 'overdue',
      })
    })

    //* Tasks in Review 
    const inReview = tasks
      .filter((t) => t.status === 'Review')
      .slice(0, 2)

    inReview.forEach((task) => {
      const project = projects.find((p) => p.id === task.projectId)
      items.push({
        id: `review-${task.id}`,
        icon: '🔍',
        text: `<strong>${task.title}</strong> está em revisão${project ? ` em ${project.name}` : ''}`,
        time: formatRelative(task.updatedAt),
        type: 'review',
      })
    })

    //* Recent notifications (comments, assignments)
    const recentNotifs = notifications
      .filter((n) => n.type === 'comment_added' || n.type === 'task_assigned')
      .slice(0, 2)

    recentNotifs.forEach((n) => {
      items.push({
        id: `notif-${n.id}`,
        icon: n.type === 'comment_added' ? '💬' : '👤',
        text: n.body,
        time: formatRelative(n.createdAt),
        type: 'notification',
      })
    })

    //* Recently created tasks (if nothing else)
    if (items.length < 3) {
      const recentCreated = [...tasks]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .filter((t) => t.reporterId === sessionUser?.id)
        .slice(0, 3 - items.length)

      recentCreated.forEach((task) => {
        const project = projects.find((p) => p.id === task.projectId)
        items.push({
          id: `created-${task.id}`,
          icon: '➕',
          text: `Criou <strong>${task.title}</strong>${project ? ` em ${project.name}` : ''}`,
          time: formatRelative(task.createdAt),
          type: 'created',
        })
      })
    }

    //* Sort all by most recent first (approximate — uses string comparison)
    return items.slice(0, 8)
  }, [tasks, projects, notifications, sessionUser?.id])

  const loading = loadingRef.current && tasks.length === 0 && projects.length === 0

  return { projects, tasks, activities, loading }
}

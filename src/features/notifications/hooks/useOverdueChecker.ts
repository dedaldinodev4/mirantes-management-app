'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useProjectsStore } from '@/stores/projects.store'
import { createNotification } from '@/services/supabase/notifications'
import { isOverdue } from '@/utils'

//* Checks for overdue tasks once per session and creates notifications *//
export function useOverdueChecker() {
  const { sessionUser } = useAuthStore()
  const { tasks } = useProjectsStore()
  const checkedRef = useRef(false)

  useEffect(() => {
    if (!sessionUser || checkedRef.current || !tasks.length) return
    checkedRef.current = true

    const overdueTasks = tasks.filter(
      (t) =>
        t.assigneeId === sessionUser.id &&
        t.status !== 'Done' &&
        isOverdue(t.dueDate),
    )

    overdueTasks.forEach((task) => {
      createNotification({
        userId: sessionUser.id,
        type: 'task_overdue',
        title: 'Tarefa em atraso',
        body: `"${task.title}" ultrapassou o prazo`,
        read: false,
        taskId: task.id,
        projectId: task.projectId,
        actorId: null,
      }).catch(() => {})
    })
  }, [sessionUser?.id, tasks.length])
}

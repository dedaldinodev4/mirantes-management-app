import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(5000).optional(),
  projectId: z.string().min(1, 'Project is required'),
  status: z.enum(['Backlog', 'Todo', 'In Progress', 'Review', 'Done']),
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  label: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
})

export type TaskFormData = z.infer<typeof taskSchema>

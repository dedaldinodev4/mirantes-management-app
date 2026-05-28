import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name is too long'),
  description: z.string().max(300, 'Description is too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),
  dueDate: z.string().optional(),
})

export type ProjectFormData = z.infer<typeof projectSchema>

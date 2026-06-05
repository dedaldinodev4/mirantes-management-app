import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string()
    .min(2, 'O nome deve ter pelo menos 2 caracteres')
    .max(60, 'Nome demasiado longo'),
  description: z.string().max(300, 'Descrição demasiado longa').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  dueDate: z.string().optional(),
})

export type ProjectFormData = z.infer<typeof projectSchema>

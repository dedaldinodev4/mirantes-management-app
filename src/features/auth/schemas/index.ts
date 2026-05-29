import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Entra com endereço de email válido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatório')
    .min(6, 'Precisa ter pelo menos 6 caracteres'),
})

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Nome muito curto')
      .max(50, 'Nome muito longo')
      .regex(/^[a-zA-Z\s]+$/, 'Nome pode conter apenas letras e espaços'),
    email: z
      .string()
      .min(1, 'Email é obrigatório')
      .email('Entra com endereço de email válido'),
    password: z
      .string()
      .min(8, 'Precisa ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'A senha deve conter pelo menos um número'),
    confirmPassword: z.string().min(1, 'Por favor, confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conicidem',
    path: ['confirmPassword'],
  })


export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
})


export const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Enter a valid email'),
})

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatório'),
    newPassword: z
      .string()
      .min(8, 'Precisa ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'A senha deve conter pelo menos um número'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Senhas não conicidem',
    path: ['confirmPassword'],
  })

  export type LoginFormData = z.infer<typeof loginSchema>
  export type RegisterFormData = z.infer<typeof registerSchema>
  export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
  export type ProfileForm = z.infer<typeof profileSchema>
  export type PasswordForm = z.infer<typeof passwordSchema>

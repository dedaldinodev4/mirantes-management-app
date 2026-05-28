'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, CheckCircle2, Circle } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { registerSchema, type RegisterFormData } from '@/features/auth/schemas'
import { ROUTES } from '@/constants'
import { cn } from '@/utils'

const passwordRules = [
  { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Precisa de uma maiúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Precisa de um número', test: (p: string) => /[0-9]/.test(p) },
]

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser } = useAuth()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const password = watch('password', '')
  const onSubmit = async (data: RegisterFormData) => {
    await registerUser(data).catch(() => {})
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="w-full max-w-sm"
    >
      <div className="rounded-2xl border border-border/60 bg-card/80 px-8 py-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Criar conta
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
          Começar a gerenciar projetos gratuitamente
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Nome
            </label>
            <input
              {...register('displayName')}
              type="text"
              placeholder="Carlos Viera"
              autoComplete="name"
              className={cn(
                'w-full rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all outline-none',
                'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                errors.displayName ? 'border-destructive/60' : 'border-border/60',
              )}
            />
            {errors.displayName && (
              <p className="mt-1 text-xs text-destructive">{errors.displayName.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="seu@exemplo.com"
              autoComplete="email"
              className={cn(
                'w-full rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all outline-none',
                'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                errors.email ? 'border-destructive/60' : 'border-border/60',
              )}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Senha
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                className={cn(
                  'w-full rounded-lg border bg-secondary/50 px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all outline-none',
                  'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                  errors.password ? 'border-destructive/60' : 'border-border/60',
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {/* Password strength indicator */}
            {password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 space-y-1"
              >
                {passwordRules.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-1.5">
                    {rule.test(password) ? (
                      <CheckCircle2 size={11} className="text-emerald-500" />
                    ) : (
                      <Circle size={11} className="text-muted-foreground/40" />
                    )}
                    <span
                      className={cn(
                        'text-xs transition-colors',
                        rule.test(password) ? 'text-emerald-500' : 'text-muted-foreground/60',
                      )}
                    >
                      {rule.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Confirmar Senha
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className={cn(
                'w-full rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all outline-none',
                'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                errors.confirmPassword ? 'border-destructive/60' : 'border-border/60',
              )}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            Criar conta
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link
          href={ROUTES.login}
          className="font-medium text-foreground hover:text-primary transition-colors"
        >
          Entrar
        </Link>
      </p>
    </motion.div>
  )
}

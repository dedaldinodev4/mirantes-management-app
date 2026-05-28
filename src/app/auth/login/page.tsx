'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { loginSchema, type LoginFormData } from '@/features/auth/schemas'
import { ROUTES } from '@/constants'
import { cn } from '@/utils'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, signInWithGoogle, loading } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    await login(data).catch(() => {})
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
          Bem-vindo de volta
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
          Entre na sua conta para continuar
          </p>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={() => signInWithGoogle().catch(() => {})}
          className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-secondary hover:border-border/80 active:scale-[0.99]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
            <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"/>
            <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/>
            <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
          </svg>
          Usar conta Google
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-xs text-muted-foreground">ou</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="seu@email.com"
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
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Palavra-passe
              </label>
              <Link
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Esqueceu a palavra-passe?
              </Link>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
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
                aria-label={showPassword ? 'Não mostra senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            Entrar
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Você não tem uma conta?{' '}
        <Link
          href={ROUTES.register}
          className="font-medium text-foreground hover:text-primary transition-colors"
        >
          Criar agora
        </Link>
      </p>
    </motion.div>
  )
}

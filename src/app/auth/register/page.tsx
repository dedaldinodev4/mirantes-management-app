'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, Loader2, CheckCircle2, Circle,
  Mail, RefreshCw, AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { registerSchema, type RegisterFormData } from '@/features/auth/schemas'
import { ROUTES } from '@/constants'
import { cn } from '@/utils'

const passwordRules = [
  { label: 'Pelo menos 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Pelo menos uma letra maiúscula',  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Pelo menos um número',            test: (p: string) => /[0-9]/.test(p) },
]

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [resending, setResending] = useState(false)
  const { register: registerUser, resendConfirmation } = useAuth()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const password = watch('password', '')

  const onSubmit = async (data: RegisterFormData) => {
    // handleRegister never throws — always returns a result
    const result = await registerUser(data)
    if (result?.needsConfirmation) {
      setPendingEmail(data.email)
      setRateLimited(result.rateLimited ?? false)
    }
    // If needsConfirmation=false, router.push already happened inside useAuth
  }

  const handleResend = async () => {
    if (!pendingEmail || resending) return
    setResending(true)
    await resendConfirmation(pendingEmail)
    setResending(false)
  }

  // ── Confirmation pending (or rate-limited) 
  if (pendingEmail) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-2xl border border-border/60 bg-card/80 px-8 py-8 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex justify-center">
            <div className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full',
              rateLimited ? 'bg-amber-500/10' : 'bg-primary/10',
            )}>
              {rateLimited
                ? <AlertTriangle size={26} className="text-amber-400" />
                : <Mail size={26} className="text-primary" />}
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">
              {rateLimited ? 'Conta criada!' : 'Verifique seu email'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {rateLimited
                ? 'Mas o e-mail de confirmação não pôde ser enviado neste momento.'
                : `Enviamos um link de confirmação para`}
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground break-all">{pendingEmail}</p>
          </div>

          {rateLimited ? (
            <>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-left">
                <p className="text-xs font-medium text-amber-400 mb-1.5">
                Limite adicional de taxa de e-mails (2 e-mails/hora)
                </p>
                <p className="text-[11px] text-amber-400/80 leading-relaxed">
                Sua conta existe. Para fazer login sem confirmar:
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-3 text-left">
                <p className="text-[11px] font-medium text-foreground mb-2">
                Desativar confirmação por e-mail:
                </p>
                <ol className="text-[11px] text-muted-foreground space-y-1 leading-relaxed list-none">
                  <li>1. Abrir o <strong className="text-foreground">Painel de Suporte</strong></li>
                  <li>2. Vá para <strong className="text-foreground">Authentication → Providers</strong></li>
                  <li>3. Clique <strong className="text-foreground">Email</strong></li>
                  <li>4. Desative <strong className="text-foreground">"Confirmar e-mail"</strong> e Salve</li>
                </ol>
              </div>

              <Link
                href={ROUTES.login}
                className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Ir par Login
              </Link>

              <button
                onClick={handleResend}
                disabled={resending}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all disabled:opacity-60"
              >
                {resending
                  ? <><Loader2 size={12} className="animate-spin" />Enviando…</>
                  : <><RefreshCw size={12} />Tente reenviar o e-mail de qualquer forma</>}
              </button>
            </>
          ) : (
            <>
              <p className="text-center text-xs text-muted-foreground leading-relaxed">
              Clique no link para ativar sua conta. Verifique seu spam se você não o vê.
              </p>

              <button
                onClick={handleResend}
                disabled={resending}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-all disabled:opacity-60"
              >
                {resending
                  ? <><Loader2 size={14} className="animate-spin" />Enviando…</>
                  : <><RefreshCw size={14} />Reenviar o e-mail de confirmação</>}
              </button>

              <div className="rounded-lg border border-border bg-secondary/20 p-3 text-left">
                <p className="text-[11px] font-medium text-muted-foreground mb-1">
                💡 Ignore isso no desenvolvimento
                </p>
                <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                Painel de suporte → <strong>Autenticação → Provedores → Email</strong> → desativar <strong>"Confirmação por email"</strong>
                </p>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Já confirmou?{' '}
                <Link href={ROUTES.login} className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Entrar
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    )
  }

  // ── Registration form 
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="w-full max-w-sm"
    >
      <div className="rounded-2xl border border-border/60 bg-card/80 px-8 py-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Criar sua conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Começar a gerenciar projetos gratuitamente</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nome</label>
            <input
              {...register('displayName')}
              type="text" placeholder="Jonas Daniel" autoComplete="name" disabled={isSubmitting}
              className={cn(
                'w-full rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all outline-none disabled:opacity-60',
                'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                errors.displayName ? 'border-destructive/60' : 'border-border/60',
              )}
            />
            {errors.displayName && <p className="mt-1 text-xs text-destructive">{errors.displayName.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
            <input
              {...register('email')}
              type="email" placeholder="seu@email.com" autoComplete="email" disabled={isSubmitting}
              className={cn(
                'w-full rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all outline-none disabled:opacity-60',
                'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                errors.email ? 'border-destructive/60' : 'border-border/60',
              )}
            />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Senha</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••" autoComplete="new-password" disabled={isSubmitting}
                className={cn(
                  'w-full rounded-lg border bg-secondary/50 px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all outline-none disabled:opacity-60',
                  'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                  errors.password ? 'border-destructive/60' : 'border-border/60',
                )}
              />
              <button
                type="button" onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <AnimatePresence>
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-1 overflow-hidden"
                >
                  {passwordRules.map((rule) => (
                    <div key={rule.label} className="flex items-center gap-1.5">
                      {rule.test(password)
                        ? <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                        : <Circle size={11} className="text-muted-foreground/40 flex-shrink-0" />}
                      <span className={cn('text-xs transition-colors', rule.test(password) ? 'text-emerald-500' : 'text-muted-foreground/60')}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {/* Confirm password */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Confirmar Senha</label>
            <input
              {...register('confirmPassword')}
              type="password" placeholder="••••••••" autoComplete="new-password" disabled={isSubmitting}
              className={cn(
                'w-full rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all outline-none disabled:opacity-60',
                'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                errors.confirmPassword ? 'border-destructive/60' : 'border-border/60',
              )}
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit" disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? <><Loader2 size={14} className="animate-spin" />Criando conta…</>
              : 'Criar conta'}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link href={ROUTES.login} className="font-medium text-foreground hover:text-primary transition-colors">
          Entrar
        </Link>
      </p>
    </motion.div>
  )
}

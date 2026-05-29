'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Loader2, Sun, Moon, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useTheme } from 'next-themes'

import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Avatar } from '@/components/shared/Avatar'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { profileSchema, ProfileForm } from '@/features/auth/schemas'
import { passwordSchema, PasswordForm } from '@/features/auth/schemas'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/utils'
import { NOTIF_PREFS } from '@/constants'


const TABS = [
  { id: 'profile', label: 'Perfil' },
  { id: 'appearance', label: 'Aparência' },
  { id: 'notifications', label: 'Notificações' },
  { id: 'security', label: 'Segurança' }
] as const
type Tab = (typeof TABS)[number]


export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>({
    id: 'profile', label: 'Perfil'
  })
  const { profile } = useAuthStore()
  const { updateProfile, changePassword } = useAuth()
  const { theme, setTheme } = useTheme()
  const [notifPrefs, setNotifPrefs] = useState({ assigned: true, overdue: true, comment: true, project: false })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)

  //* Profile Form *//
  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors, isSubmitting: profileSaving },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: profile?.displayName ?? '', email: profile?.email ?? '' },
  })

  const onProfileSubmit = async (data: ProfileForm) => {
    await updateProfile(data)
  }

  //* Password Form *//
  const {
    register: regPwd,
    handleSubmit: handlePwd,
    reset: resetPwd,
    watch: watchPwd,
    formState: { errors: pwdErrors, isSubmitting: pwdSaving },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  const newPwd = watchPwd('newPassword', '')

  const pwdRules = [
    { label: 'Pelo menos 8 caracteres', ok: newPwd.length >= 8 },
    { label: 'Pelo menos uma letra maiúscula', ok: /[A-Z]/.test(newPwd) },
    { label: 'Pelo menos um número', ok: /[0-9]/.test(newPwd) },
  ]

  const onPasswordSubmit = async (data: PasswordForm) => {
    await changePassword(data.currentPassword, data.newPassword)
    resetPwd()
    setPasswordChanged(true)
    setTimeout(() => setPasswordChanged(false), 4000)
  }


  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title="Settings" breadcrumbs={[{ label: 'Configurações' }]} />
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-5 text-base font-semibold text-foreground">Configurações</h1>

            {/* Tabs */}
            <div className="mb-6 flex border-b border-border overflow-x-auto no-scrollbar">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-shrink-0 px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px',
                    activeTab === tab
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <motion.div key={activeTab.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {activeTab.id === 'profile' && (
                <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-5">
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h2 className="mb-4 text-sm font-medium text-foreground">Informações do Usuário</h2>
                    <div className="flex items-center gap-4 mb-5">
                      {profile && <Avatar name={profile.displayName} photoURL={profile.photoURL} size="lg" />}
                      <div>
                        <p className="text-sm font-medium text-foreground">{profile?.displayName}</p>
                        <p className="text-xs text-muted-foreground">{profile?.email}</p>
                        <button className="mt-1.5 text-xs text-primary hover:text-primary/80 transition-colors">Alterar Avatar</button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nome</label>
                        <input
                          {...regProfile('displayName')}
                          disabled={profileSaving}
                          className={cn(
                            'w-full rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-all disabled:opacity-60',
                            'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                            profileErrors.displayName ? 'border-destructive/60' : 'border-border/60',
                          )}
                        />
                        {profileErrors.displayName && (
                          <p className="mt-1 text-xs text-destructive">{profileErrors.displayName.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
                        <input
                          {...regProfile('email')}
                          type="email"
                          disabled={profileSaving}
                          className={cn(
                            'w-full rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-all disabled:opacity-60',
                            'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                            profileErrors.email ? 'border-destructive/60' : 'border-border/60',
                          )}
                        />
                        {profileErrors.email && (
                          <p className="mt-1 text-xs text-destructive">{profileErrors.email.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        disabled={profileSaving}
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all"
                      >
                        {profileSaving ? (
                          <><Loader2 size={13} className="animate-spin" /> Salvando…</>
                        ) : (
                          'Salvar'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {activeTab.id === 'appearance' && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="mb-4 text-sm font-medium text-foreground">Aparência</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {(['dark', 'light'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          'flex flex-col items-center gap-3 rounded-xl border p-4 transition-all',
                          theme === t ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80',
                        )}
                      >
                        {t === 'dark' ? <Moon size={20} className="text-muted-foreground" /> : <Sun size={20} className="text-muted-foreground" />}
                        <span className="text-sm font-medium capitalize text-foreground">
                          tema {t === 'dark' ? 'escuro' : 'claro'}
                        </span>
                        {theme === t && <span className="text-[10px] text-primary font-medium">Activo</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab.id === 'notifications' && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-1">
                  <h2 className="mb-1 text-sm font-medium text-foreground">Preferências de notificações</h2>
                  <p className="mb-4 text-xs text-muted-foreground">Escolha sobre o que você deseja ser notificado.</p>
                  {NOTIF_PREFS.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifPrefs((p) => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                        role="switch"
                        aria-checked={notifPrefs[item.key as keyof typeof notifPrefs]}
                        className={cn(
                          'relative h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200',
                          notifPrefs[item.key as keyof typeof notifPrefs] ? 'bg-primary' : 'bg-secondary border border-border',
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                            notifPrefs[item.key as keyof typeof notifPrefs] ? 'translate-x-4' : 'translate-x-0.5',
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab.id === 'security' && (
                <form onSubmit={handlePwd(onPasswordSubmit)} className="space-y-5">
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h2 className="mb-1 text-sm font-medium text-foreground">Alterar Senha</h2>
                    <p className="mb-4 text-xs text-muted-foreground">
                      Você será solicitado a autenticar novamente antes que a alteração entre em vigor.
                    </p>

                    {passwordChanged && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
                        <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                        <p className="text-xs text-emerald-500 font-medium">Senha alterada com sucesso</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Current password */}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Senha Atual</label>
                        <div className="relative">
                          <input
                            {...regPwd('currentPassword')}
                            type={showCurrent ? 'text' : 'password'}
                            placeholder="••••••••"
                            disabled={pwdSaving}
                            className={cn(
                              'w-full rounded-lg border bg-secondary/50 px-3 py-2 pr-10 text-sm text-foreground outline-none transition-all disabled:opacity-60',
                              'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                              pwdErrors.currentPassword ? 'border-destructive/60' : 'border-border/60',
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrent((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showCurrent ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                        {pwdErrors.currentPassword && (
                          <p className="mt-1 text-xs text-destructive">{pwdErrors.currentPassword.message}</p>
                        )}
                      </div>

                      {/* New password */}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nova Senha</label>
                        <div className="relative">
                          <input
                            {...regPwd('newPassword')}
                            type={showNew ? 'text' : 'password'}
                            placeholder="••••••••"
                            disabled={pwdSaving}
                            className={cn(
                              'w-full rounded-lg border bg-secondary/50 px-3 py-2 pr-10 text-sm text-foreground outline-none transition-all disabled:opacity-60',
                              'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                              pwdErrors.newPassword ? 'border-destructive/60' : 'border-border/60',
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNew((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                        {newPwd && (
                          <div className="mt-2 space-y-1">
                            {pwdRules.map((r) => (
                              <div key={r.label} className="flex items-center gap-1.5">
                                <CheckCircle2 size={11} className={cn(r.ok ? 'text-emerald-500' : 'text-muted-foreground/30')} />
                                <span className={cn('text-xs', r.ok ? 'text-emerald-500' : 'text-muted-foreground/60')}>{r.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {pwdErrors.newPassword && (
                          <p className="mt-1 text-xs text-destructive">{pwdErrors.newPassword.message}</p>
                        )}
                      </div>

                      {/* Confirm */}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Confirm new password</label>
                        <input
                          {...regPwd('confirmPassword')}
                          type="password"
                          placeholder="••••••••"
                          disabled={pwdSaving}
                          className={cn(
                            'w-full rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-all disabled:opacity-60',
                            'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                            pwdErrors.confirmPassword ? 'border-destructive/60' : 'border-border/60',
                          )}
                        />
                        {pwdErrors.confirmPassword && (
                          <p className="mt-1 text-xs text-destructive">{pwdErrors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="submit"
                        disabled={pwdSaving}
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                      >
                        {pwdSaving ? (
                          <><Loader2 size={13} className="animate-spin" /> Alterando…</>
                        ) : (
                          'Alterar Senha'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

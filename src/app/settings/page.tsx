'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Loader2, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Avatar } from '@/components/shared/Avatar'

import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/utils'

const TABS = [
  { id: 'profile', label: 'Perfil' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'notifications', label: 'Notificações' },
  { id: 'security', label: 'Segurança' }
] as const
type Tab = (typeof TABS)[number]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>({
    id: 'profile', label: 'Perfil'
  })
  const { profile } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    toast.success('Configurações salvas!')
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title="Settings" breadcrumbs={[{ label: 'Configurações' }]} />
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-5 text-base font-semibold text-foreground">Configurações</h1>

            {/* Tabs */}
            <div className="mb-6 flex gap-0 border-b border-border">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px',
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
                <div className="space-y-5">
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h2 className="mb-4 text-sm font-medium text-foreground">Informações do Usuário</h2>
                    <div className="flex items-center gap-4 mb-5">
                      {profile && <Avatar name={profile.displayName} photoURL={profile.photoURL} size="lg" />}
                      <div>
                        <p className="text-sm font-medium text-foreground">{profile?.displayName}</p>
                        <p className="text-xs text-muted-foreground">{profile?.email}</p>
                        <button className="mt-1.5 text-xs text-primary hover:text-primary/80 transition-colors">Change avatar</button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nome</label>
                        <input
                          defaultValue={profile?.displayName}
                          className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
                        <input
                          defaultValue={profile?.email}
                          type="email"
                          disabled
                          className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all"
                      >
                        {saving && <Loader2 size={13} className="animate-spin" />}
                        Salvar
                      </button>
                    </div>
                  </div>
                </div>
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
                          tema {t === 'dark'? 'escuro': 'claro'}
                          </span>
                        {theme === t && <span className="text-[10px] text-primary font-medium">Activo</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab.id === 'notifications' && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <h2 className="text-sm font-medium text-foreground">Notificações</h2>
                  {[
                    { label: 'Tarefa atribuída a mim', desc: 'Quando uma tarefa é atribuída a você' },
                    { label: 'Tarefa atrasada', desc: 'Quando uma tarefa ultrapassa sua data de vencimento' },
                    { label: 'Novo comentário', desc: 'Quando alguém comentar sobre sua tarefa' },
                    { label: 'Projeto atualiza', desc: 'Quando um projeto é atualizado' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <button
                        className="relative h-5 w-9 rounded-full bg-primary transition-all"
                        role="switch"
                      >
                        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform translate-x-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab.id === 'security' && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <h2 className="text-sm font-medium text-foreground">Segurança</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Senha atual</label>
                      <input type="password" placeholder="••••••••" className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary/60" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nova Senha</label>
                      <input type="password" placeholder="••••••••" className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary/60" />
                    </div>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
                    >
                      Atualizar senha
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

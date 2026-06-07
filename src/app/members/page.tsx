'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Crown, Shield, User, Folder, CheckCircle2, Clock } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Avatar } from '@/components/shared/Avatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAuthStore } from '@/stores/auth.store'
import { useProjectsStore } from '@/stores/projects.store'
import { getUserProfiles } from '@/services/supabase/auth'
import { cn, formatDate, calcProgress } from '@/utils'
import type { User as AppUser } from '@/types'

interface MemberWithStats extends AppUser {
  role: 'owner' | 'member'
  projectCount: number
  taskCount: number
  completedCount: number
  isOnline: boolean
}

const ROLE_CONFIG = {
  owner: { label: 'Administrador', icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  member: { label: 'Membro', icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10' },
}

export default function MembersPage() {
  const { sessionUser, profile } = useAuthStore()
  const { projects, tasks } = useProjectsStore()
  const [members, setMembers] = useState<MemberWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MemberWithStats | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!sessionUser) return
      try {
        setLoading(true)
        const allUids = [...new Set(projects.flatMap((p) => p.memberIds))]
        if (!allUids.length) { setMembers([]); return }
        const profiles = await getUserProfiles(allUids)
        const withStats: MemberWithStats[] = profiles.map((p) => ({
          ...p,
          role: projects.some((proj) => proj.ownerId === p.uid) ? 'owner' : 'member',
          projectCount: projects.filter((proj) => proj.memberIds.includes(p.uid)).length,
          taskCount: tasks.filter((t) => t.assigneeId === p.uid).length,
          completedCount: tasks.filter((t) => t.assigneeId === p.uid && t.status === 'Done').length,
          isOnline: p.uid === sessionUser.id,
        }))
        setMembers(withStats)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionUser?.id, projects.length])

  const filtered = members.filter(
    (m) =>
      m.displayName.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  )

  const getIcon = (role: 'owner' | 'member') => {
    const Icon = ROLE_CONFIG[role].icon
    return <Icon size ={11} /> 
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          title="Membros"
          breadcrumbs={[{ label: 'Membros' }]}
          actions={
            <span className="flex h-7 items-center rounded-md border border-border/60 bg-secondary/50 px-2.5 text-xs text-muted-foreground">
              {members.length} membro{members.length !== 1 ? 's' : ''}
            </span>
          }
        />

        <div className="flex flex-1 overflow-hidden">
          {/* List */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Search */}
            <div className="border-b border-border bg-card/50 px-5 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/50 px-3 py-2">
                <Search size={13} className="text-muted-foreground flex-shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar membros…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-0 divide-y divide-border">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-4 animate-pulse">
                      <div className="h-9 w-9 rounded-full bg-secondary" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-32 rounded bg-secondary" />
                        <div className="h-2.5 w-48 rounded bg-secondary" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={<Users size={20} />}
                    title={search ? 'Sem menbros encontrados' : 'Sem menbros ainda'}
                    description={search ? `Nenhum membro corresponde "${search}"` : 'Adicione membros aos seus projetos para vê-los aqui.'}
                  />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filtered.map((member, i) => {
                    const roleConfig = ROLE_CONFIG[member.role]
                    const Icon = ROLE_CONFIG[member.role].icon
                    const isActive = selected?.uid === member.uid

                    return (
                      <motion.button
                        key={member.uid}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => setSelected(isActive ? null : member)}
                        className={cn(
                          'flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors',
                          isActive ? 'bg-primary/5' : 'hover:bg-secondary/40',
                        )}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar name={member.displayName} photoURL={member.photoURL} size="md" />
                          {member.isOnline && (
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">
                              {member.displayName}
                            </span>
                            {member.uid === sessionUser?.id && (
                              <span className="text-[10px] text-muted-foreground">(você)</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>

                        <div className="flex-shrink-0 flex items-center gap-2">
                          <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', roleConfig.bg, roleConfig.color)}>
                            <roleConfig.icon size={10} />
                            {roleConfig.label}
                          </span>
                          {member.isOnline && (
                            <span className="hidden sm:block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="hidden md:flex w-72 flex-shrink-0 flex-col border-l border-border bg-card overflow-y-auto"
            >
              {/* Header */}
              <div className="flex flex-col items-center gap-3 border-b border-border p-6 text-center">
                <div className="relative">
                  <Avatar name={selected.displayName} photoURL={selected.photoURL} size="lg" />
                  {selected.isOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{selected.displayName}</h3>
                  <p className="text-xs text-muted-foreground">{selected.email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn('flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium', ROLE_CONFIG[selected.role].bg, ROLE_CONFIG[selected.role].color)}>
                    {getIcon(selected.role)}
                    {ROLE_CONFIG[selected.role].label}
                  </span>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium', selected.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-secondary text-muted-foreground')}>
                    {selected.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                {[
                  { label: 'Projetos', value: selected.projectCount, icon: Folder },
                  { label: 'Tarefas', value: selected.taskCount, icon: Clock },
                  { label: 'Completos', value: selected.completedCount, icon: CheckCircle2 },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-1 py-4">
                    <s.icon size={13} className="text-muted-foreground" />
                    <span className="text-lg font-semibold text-foreground">{s.value}</span>
                    <span className="text-[10px] text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div className="p-4">
                <h4 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">Projetos</h4>
                {projects
                  .filter((p) => p.memberIds.includes(selected.uid))
                  .map((p) => {
                    const ptasks = tasks.filter((t) => t.projectId === p.id)
                    const done = ptasks.filter((t) => t.status === 'Done').length
                    const pct = calcProgress(ptasks.length, done)
                    return (
                      <div key={p.id} className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-secondary/40 transition-colors">
                        <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: p.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                          <div className="mt-1 h-1 w-full rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{pct}%</span>
                      </div>
                    )
                  })}
                {projects.filter((p) => p.memberIds.includes(selected.uid)).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Não enviou projeto</p>
                )}
              </div>

              {/* Member since */}
              {selected.createdAt && (
                <div className="mt-auto border-t border-border p-4">
                  <p className="text-[11px] text-muted-foreground">
                    Membro desde <span className="font-medium text-foreground">{formatDate(selected.createdAt)}</span>
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

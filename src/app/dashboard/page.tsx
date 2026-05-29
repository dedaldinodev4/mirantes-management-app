'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Folder, CheckCircle2, Clock, AlertCircle, TrendingUp,
  Plus, ArrowRight, Activity,
} from 'lucide-react'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { Avatar, AvatarGroup } from '@/components/shared/Avatar'
import { Skeleton, DashboardSkeleton } from '@/components/shared/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDashboard } from '@/features/dashboard/hooks/useDashboard'
import { ROUTES, COLUMN_COLORS } from '@/constants'
import { cn, formatRelative, calcProgress, isOverdue, toDate } from '@/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  }),
}

export default function DashboardPage() {
  const { projects, tasks, activities, members, loading } = useDashboard()

  const totalProjects = projects.length
  const doneTasks = tasks.filter((t) => t.status === 'Done').length
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length
  const overdueTasks = tasks.filter((t) => isOverdue(t.dueDate)).length

  const metrics = [
    {
      label: 'Projetos',
      value: totalProjects,
      icon: Folder,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      accent: '#6366f1',
      delta: '+1 este mês',
      deltaUp: true,
    },
    {
      label: 'Completo',
      value: doneTasks,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      accent: '#22c55e',
      delta: '+3 esta semana',
      deltaUp: true,
    },
    {
      label: 'Em Progresso',
      value: inProgressTasks,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      accent: '#f59e0b',
      delta: 'entre projetos',
      deltaUp: null,
    },
    {
      label: 'Em atraso',
      value: overdueTasks,
      icon: AlertCircle,
      color: overdueTasks > 0 ? 'text-red-400' : 'text-muted-foreground',
      bg: overdueTasks > 0 ? 'bg-red-500/10' : 'bg-secondary',
      accent: overdueTasks > 0 ? '#ef4444' : '#666',
      delta: overdueTasks > 0 ? 'Precisa de atenção' : 'Todos no caminho certo',
      deltaUp: overdueTasks > 0 ? false : null,
    },
  ]

  if (loading) return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar title="Dashboard" breadcrumbs={[{ label: 'Dashboard' }]} />
      <div className="flex-1 overflow-auto p-6">
        <DashboardSkeleton />
      </div>
    </div>
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar
        title="Dashboard"
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <Link
            href={ROUTES.newProject}
            className="flex h-7 items-center gap-1.5 rounded-md border border-border/60 bg-secondary/50 px-2.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <Plus size={11} />
            Novo projeto
          </Link>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* ── Metrics ── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              custom={i}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="relative rounded-xl border border-border bg-card p-4 overflow-hidden hover:border-border/80 transition-colors"
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: metric.accent }}
              />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
                  {metric.label}
                </span>
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', metric.bg)}>
                  <metric.icon size={14} className={metric.color} />
                </div>
              </div>
              <div className={cn('text-2xl font-semibold tracking-tight', metric.color === 'text-red-400' && overdueTasks > 0 ? 'text-red-400' : 'text-foreground')}>
                {metric.value}
              </div>
              <div className={cn('mt-1.5 text-[11px]',
                metric.deltaUp === true ? 'text-emerald-500' :
                metric.deltaUp === false ? 'text-red-400' :
                'text-muted-foreground'
              )}>
                {metric.deltaUp === true && '↑ '}
                {metric.deltaUp === false && '↓ '}
                {metric.delta}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Two column ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* Projects */}
          <motion.div custom={4} initial="hidden" animate="show" variants={fadeUp}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">Projetos Recentes</h2>
              <Link
                href={ROUTES.projects}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Ver todos <ArrowRight size={11} />
              </Link>
            </div>

            {projects.length === 0 ? (
              <EmptyState
                icon={<Folder size={20} />}
                title="No projects yet"
                description="Create your first project to start organizing tasks."
                action={
                  <Link
                    href={ROUTES.newProject}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-all"
                  >
                    <Plus size={12} /> Create project
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 4).map((project) => {
                  const ptasks = tasks.filter((t) => t.projectId === project.id)
                  const done = ptasks.filter((t) => t.status === 'Done').length
                  const pct = calcProgress(ptasks.length, done)

                  return (
                    <Link
                      key={project.id}
                      href={ROUTES.kanban(project.id)}
                      className="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 hover:border-border/80 hover:bg-card/80 transition-all"
                    >
                      <div
                        className="h-9 w-9 flex-shrink-0 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: project.color }}
                      >
                        {project.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-foreground truncate">
                            {project.name}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: project.color }}
                          />
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <ArrowRight
                          size={14}
                          className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors"
                        />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Activity */}
          <motion.div custom={5} initial="hidden" animate="show" variants={fadeUp}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">Atividades Recentes</h2>
              <Activity size={13} className="text-muted-foreground" />
            </div>

            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {activities.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Sem atividades recentes
                </div>
              ) : (
                activities.slice(0, 6).map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-sm">
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs text-muted-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: activity.text }}
                      />
                      <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Team */}
            {members.length > 0 && (
              <>
                <div className="mb-3 mt-5 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-foreground">Membros</h2>
                </div>
                <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
                  {members.map((member) => (
                    <div key={member.uid} className="flex items-center gap-3 px-4 py-2.5">
                      <Avatar name={member.displayName} photoURL={member.photoURL} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {member.displayName}
                        </p>
                      </div>
                      <div className="flex h-4 items-center gap-1 rounded-full bg-emerald-500/10 px-2 text-[10px] font-medium text-emerald-500">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Online
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

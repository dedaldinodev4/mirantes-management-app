'use client'

import { motion } from 'framer-motion'
import {
  Folder, CheckCircle2, Clock, AlertCircle,
  Plus, ArrowRight, Activity,
} from 'lucide-react'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { DashboardSkeleton } from '@/components/shared/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDashboard } from '@/features/dashboard/hooks/useDashboard'
import { ROUTES } from '@/constants'
import { cn, calcProgress, formatDate, isOverdue } from '@/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  }),
}

const ACTIVITY_COLORS = {
  completed:    'bg-emerald-500/10',
  overdue:      'bg-red-500/10',
  review:       'bg-amber-500/10',
  created:      'bg-indigo-500/10',
  notification: 'bg-blue-500/10',
}

export default function DashboardPage() {
  const { projects, tasks, activities, loading } = useDashboard()

  const totalProjects   = projects.length
  const doneTasks       = tasks.filter((t) => t.status === 'Done').length
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length
  const overdueTasks    = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'Done').length

  const metrics = [
    {
      label: 'Projetos',
      value: totalProjects,
      icon: Folder,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      accent: '#6366f1',
      delta: 'total activos',
      deltaUp: null as boolean | null,
    },
    {
      label: 'Concluídas',
      value: doneTasks,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      accent: '#22c55e',
      delta: 'tarefas concluídas',
      deltaUp: null,
    },
    {
      label: 'Em progresso',
      value: inProgressTasks,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      accent: '#f59e0b',
      delta: 'em todos os projetos',
      deltaUp: null,
    },
    {
      label: 'Em atraso',
      value: overdueTasks,
      icon: AlertCircle,
      color: overdueTasks > 0 ? 'text-red-400' : 'text-muted-foreground',
      bg: overdueTasks > 0 ? 'bg-red-500/10' : 'bg-secondary',
      accent: overdueTasks > 0 ? '#ef4444' : '#666',
      delta: overdueTasks > 0 ? 'Requer atenção' : 'Tudo em dia',
      deltaUp: overdueTasks > 0 ? false : null,
    },
  ]

  if (loading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title="Dashboard" breadcrumbs={[{ label: 'Dashboard' }]} />
        <div className="flex-1 overflow-auto p-6">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

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
            <Plus size={11} /> Novo projeto
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
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: metric.accent }} />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
                  {metric.label}
                </span>
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', metric.bg)}>
                  <metric.icon size={14} className={metric.color} />
                </div>
              </div>
              <div className={cn(
                'text-2xl font-semibold tracking-tight',
                overdueTasks > 0 && metric.label === 'Em atraso' ? 'text-red-400' : 'text-foreground',
              )}>
                {metric.value}
              </div>
              <div className={cn(
                'mt-1.5 text-[11px]',
                metric.deltaUp === false ? 'text-red-400' : 'text-muted-foreground',
              )}>
                {metric.delta}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Two columns ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* Recents projects */}
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
                title="Ainda sem projetos"
                description="Crie o seu primeiro projeto para começar."
                action={
                  <Link
                    href={ROUTES.newProject}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-all"
                  >
                    <Plus size={12} /> Criar projeto
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => {
                  const ptasks = tasks.filter((t) => t.projectId === project.id)
                  const done   = ptasks.filter((t) => t.status === 'Done').length
                  const pct    = calcProgress(ptasks.length, done)
                  const hasOverdue = ptasks.some((t) => isOverdue(t.dueDate) && t.status !== 'Done')

                  return (
                    <Link
                      key={project.id}
                      href={ROUTES.kanban(project.id) as any}
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
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-foreground truncate">
                              {project.name}
                            </span>
                            {hasOverdue && (
                              <span className="flex-shrink-0 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-medium text-red-400">
                                Atraso
                              </span>
                            )}
                          </div>
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
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground">
                            {ptasks.length} tarefa{ptasks.length !== 1 ? 's' : ''} · {done} concluída{done !== 1 ? 's' : ''}
                          </span>
                          {project.dueDate && (
                            <span className="text-[10px] text-muted-foreground">
                              Prazo: {formatDate(project.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors flex-shrink-0"
                      />
                    </Link>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Recents activities */}
          <motion.div custom={5} initial="hidden" animate="show" variants={fadeUp}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">Atividade Recente</h2>
              <Activity size={13} className="text-muted-foreground" />
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <Activity size={20} className="text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Sem atividade recente.<br />Crie tarefas para ver o progresso aqui.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activities.map((activity, i) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-3 px-4 py-3"
                    >
                      <div className={cn(
                        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-sm',
                        ACTIVITY_COLORS[activity.type],
                      )}>
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
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Due tasks */}
            {overdueTasks > 0 && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-red-400">
                    {overdueTasks} tarefa{overdueTasks !== 1 ? 's' : ''} em atraso
                  </span>
                </div>
                <div className="space-y-1">
                  {tasks
                    .filter((t) => isOverdue(t.dueDate) && t.status !== 'Done')
                    .slice(0, 3)
                    .map((task) => {
                      const project = projects.find((p) => p.id === task.projectId)
                      return (
                        <Link
                          key={task.id}
                          href={project ? ROUTES.kanban(project.id) as any : ROUTES.projects}
                          className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-red-500/10 transition-colors"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                          <span className="text-[11px] text-red-400/80 truncate">{task.title}</span>
                          {project && (
                            <span className="text-[10px] text-red-400/50 flex-shrink-0 ml-auto">
                              {project.name}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Folder, Trash2, ArrowRight } from 'lucide-react'

import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { EmptyState } from '@/components/shared/EmptyState'
import { ProjectCardSkeleton } from '@/components/shared/Skeleton'
import { useProjects } from '@/features/projects/hooks/useProjects'

import { useProjectsStore } from '@/stores/projects.store'
import { ROUTES } from '@/constants'
import { calcProgress, formatDate } from '@/utils'

export default function ProjectsPage() {
  const { projects, loading, delete: deleteProject } = useProjects()
  const { tasks } = useProjectsStore()

  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          title="Projects"
          breadcrumbs={[{ label: 'Projetos' }]}
          actions={
            <Link
              href={ROUTES.newProject}
              className="flex h-7 items-center gap-1.5 rounded-md border border-border/60 bg-secondary/50 px-2.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <Plus size={11} /> Novo projeto
            </Link>
          }
        />

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h1 className="text-base font-semibold text-foreground">Todos Projetos</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {projects.length} projeto{projects.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => <ProjectCardSkeleton key={i} />)}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              icon={<Folder size={22} />}
              title="No projects yet"
              description="Create your first project to start tracking tasks and collaborating with your team."
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project, i) => {
                const ptasks = tasks.filter((t) => t.projectId === project.id)
                const done = ptasks.filter((t) => t.status === 'Done').length
                const pct = calcProgress(ptasks.length, done)

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-border/80 transition-all hover:-translate-y-0.5"
                  >
                    {/* Color strip */}
                    <div className="h-[3px] w-full" style={{ background: project.color }} />

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                            style={{ background: project.color }}
                          >
                            {project.name[0]}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-foreground line-clamp-1">
                              {project.name}
                            </h3>
                            {project.dueDate && (
                              <p className="text-[10px] text-muted-foreground">
                                Datas {formatDate(project.dueDate)}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            if (confirm('Delete this project?')) deleteProject(project.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <p className="mb-4 text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[32px]">
                        {project.description || 'No description'}
                      </p>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Progresso</span>
                          <span className="text-[10px] font-medium text-foreground">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: project.color }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          {ptasks.length} tarefas · {done} completas
                        </span>
                        <Link
                          href={ROUTES.kanban(project.id)}
                          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          Abrir quadro <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              {/* New project card */}
              <Link
                href={ROUTES.newProject}
                className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-transparent hover:border-border/80 hover:bg-secondary/30 transition-all group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-border group-hover:border-primary/40 group-hover:bg-primary/5 transition-all mb-2">
                  <Plus size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Novo projeto
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

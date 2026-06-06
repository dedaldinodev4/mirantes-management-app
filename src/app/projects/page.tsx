'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Folder, Trash2, ArrowRight, Users, Loader2, Pencil } from 'lucide-react'

import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { EmptyState } from '@/components/shared/EmptyState'
import { ProjectCardSkeleton } from '@/components/shared/Skeleton'
import { useProjects } from '@/features/projects/hooks/useProjects'

import { useProjectsStore } from '@/stores/projects.store'
import { ROUTES } from '@/constants'
import { calcProgress, formatDate } from '@/utils'
import { toast } from 'sonner'
import { useState } from 'react'
import { AddMemberModal } from '@/features/projects/components/AddMemberModal'
import type { Project } from '@/types'
import type { ProjectFormData } from '@/features/projects/schemas'
import { EditProjectModal } from '@/features/projects/components/EditProjectModal'
import { useAuthStore } from '@/stores/auth.store'
import { usePermissions } from '@/hooks/usePermissions'

export default function ProjectsPage() {
  const {
    projects, loading, delete: deleteProject,
    update: updateProject } = useProjects()
  const { tasks } = useProjectsStore()
  const { sessionUser } = useAuthStore()
  const { canCreateProject } = usePermissions()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [memberModalProject, setMemberModalProject] = useState<Project | null>(null)
  const [editModalProject, setEditModalProject] = useState<Project | null>(null)

  const handleDelete = async (project: Project) => {
    toast.warning(
      `Eliminar "${project.name}"?`,
      {
        description: 'Todas as tarefas também serão eliminadas.',
        action: {
          label: 'Confirmar',
          onClick: async () => {
            try {
              setDeletingId(project.id)
              await deleteProject(project.id)

            } finally {
              setDeletingId(null)
            }
          },
        },
        duration: 5000,
        position: 'top-center'
      }
    )
  }

  const handleSaveEdit = async (projectId: string, data: Partial<ProjectFormData>) => {
    await updateProject(projectId, {
      name: data.name,
      description: data.description,
      color: data.color as Project['color'],
      dueDate: data.dueDate || undefined,
    })
  }


  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          title="Projetos"
          breadcrumbs={[{ label: 'Projetos' }]}
          actions={
            canCreateProject ? (
              <Link
                href={ROUTES.newProject}
                className="flex h-7 items-center gap-1.5 rounded-md border border-border/60 bg-secondary/50 px-2.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
              >
                <Plus size={11} /> Novo projeto
              </Link>
            ) : undefined
          }
        />

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h1 className="text-base font-semibold text-foreground">Todos os Projetos</h1>
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
              title="Ainda sem projetos"
              description="Crie o seu primeiro projeto para começar a gerir tarefas e colaborar com a sua equipa."
              action={
                canCreateProject ? (
                  <Link
                    href={ROUTES.newProject}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-all"
                  >
                    <Plus size={12} /> Criar projeto
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project, i) => {
                const ptasks = tasks.filter((t) => t.projectId === project.id)
                const done = ptasks.filter((t) => t.status === 'Done').length
                const pct = calcProgress(ptasks.length, done)
                const isDeleting = deletingId === project.id

                // Per-project permissions
                const isOwner = project.ownerId === sessionUser?.id

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: isDeleting ? 0.4 : 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-border/80 transition-all hover:-translate-y-0.5"
                  >
                    <div className="h-[3px] w-full" style={{ background: project.color }} />

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                            style={{ background: project.color }}
                          >
                            {project.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-medium text-foreground line-clamp-1">
                                {project.name}
                              </h3>
                              {/* Role badge */}
                              {isOwner ? (
                                <span className="flex-shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-400">
                                  Owner
                                </span>
                              ) : (
                                <span className="flex-shrink-0 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-medium text-blue-400">
                                  Membro
                                </span>
                              )}
                            </div>
                            {project.dueDate && (
                              <p className="text-[10px] text-muted-foreground">
                                Prazo: {formatDate(project.dueDate)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {isOwner && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                            <button
                              onClick={(e) => { e.preventDefault(); setEditModalProject(project) }}
                              title="Editar projeto"
                              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={(e) => { e.preventDefault(); setMemberModalProject(project) }}
                              title="Gerir membros"
                              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                            >
                              <Users size={12} />
                            </button>
                            <button
                              onClick={(e) => { e.preventDefault(); handleDelete(project) }}
                              disabled={isDeleting}
                              title="Eliminar projeto"
                              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all disabled:opacity-60"
                            >
                              {isDeleting
                                ? <Loader2 size={11} className="animate-spin" />
                                : <Trash2 size={12} />}
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="mb-4 text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[32px]">
                        {project.description || 'Sem descrição'}
                      </p>

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
                          {ptasks.length} tarefas · {done} concluídas · {project.memberIds.length} membro{project.memberIds.length !== 1 ? 's' : ''}
                        </span>
                        <Link
                          href={ROUTES.kanban(project.id) as any}
                          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          Abrir <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              {/* Card novo projeto — só para utilizadores autenticados */}
              {canCreateProject && (
                <Link
                  href={ROUTES.newProject}
                  className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-transparent hover:border-border/80 hover:bg-secondary/30 transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-border group-hover:border-primary/40 group-hover:bg-primary/5 transition-all mb-2">
                    <Plus size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Novo Projeto
                  </span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {memberModalProject && (
        <AddMemberModal
          open={!!memberModalProject}
          onClose={() => setMemberModalProject(null)}
          project={memberModalProject}
          onMembersChanged={() => { }}
        />
      )}

      <EditProjectModal
        open={!!editModalProject}
        onClose={() => setEditModalProject(null)}
        onSave={handleSaveEdit}
        project={editModalProject}
      />
    </AppShell>
  )
}

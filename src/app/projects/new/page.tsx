'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { projectSchema, type ProjectFormData } from '@/features/projects/schemas'
import { PROJECT_COLORS, ROUTES } from '@/constants'
import { cn, todayDate } from '@/utils'

export default function NewProjectPage() {
  const router = useRouter()
  const { create } = useProjects()

  const { 
    register, 
    handleSubmit,
    watch, 
    setValue, formState: { errors, isSubmitting } } =
    useForm<ProjectFormData>({
      resolver: zodResolver(projectSchema),
      defaultValues: { color: PROJECT_COLORS[0] },
    })

  const selectedColor = watch('color')

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const id = await create({ ...data, color: data.color as any })
      if (id) router.push(`/projects/${id}/kanban`)
    } catch {
      // error already toasted inside create()
    }
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          title="New Project"
          breadcrumbs={[
            { label: 'Projetos', href: ROUTES.projects },
            { label: 'Novo' },
          ]}
        />
        <div className="flex-1 overflow-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-lg"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-1 text-base font-semibold text-foreground">Novo Projeto</h2>
              <p className="mb-6 text-xs text-muted-foreground">
              Configurar um novo espaço de trabalho para sua equipe.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Nome *
                  </label>
                  <input
                    {...register('name')}
                    placeholder="Nome do projeto"
                    disabled={isSubmitting}
                    className={cn(
                      'w-full rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all',
                      'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
                      errors.name ? 'border-destructive/60' : 'border-border/60',
                    )}
                  />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Descrição
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    placeholder="Descreva este projecto"
                    disabled={isSubmitting}
                    className="w-full resize-none rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Cor
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setValue('color', color)}
                        className={cn(
                          'h-7 w-7 rounded-full transition-all',
                          selectedColor === color
                            ? 'ring-2 ring-offset-2 ring-offset-card scale-110'
                            : 'hover:scale-105',
                        )}
                        style={{
                          backgroundColor: color,
                          ...(selectedColor === color ? { ringColor: color } : {}),
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Prazo (opcional)
                  </label>
                  <input
                    {...register('dueDate')}
                    type="date"
                    disabled={isSubmitting}
                    min={todayDate()}
                    className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Link
                    href={ROUTES.projects}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                  >
                    <ArrowLeft size={13} /> Cancelar
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Criando…
                      </>
                    ) : (
                      'Criar projeto'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </AppShell>
  )
}

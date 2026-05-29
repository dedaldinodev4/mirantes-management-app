'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Search, Loader2, UserPlus, Trash2, Crown } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { useAuthStore } from '@/stores/auth.store'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { getUserProfiles } from '@/services/firebase/auth'
import type { Project } from '@/types'
import { toast } from 'sonner'

interface AddMemberModalProps {
  open: boolean
  onClose: () => void
  project: Project
}

export function AddMemberModal({ open, onClose, project }: AddMemberModalProps) {
  const { firebaseUser } = useAuthStore()
  const { addMember, removeMember } = useProjects()
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [loadedMembers, setLoadedMembers] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const isOwner = project.ownerId === firebaseUser?.uid

  // Load member profiles on open
  const loadMembers = async () => {
    if (loadedMembers) return
    try {
      const profiles = await getUserProfiles(project.memberIds)
      setMembers(profiles)
      setLoadedMembers(true)
    } catch {
      setMembers([])
    }
  }

  if (open && !loadedMembers) loadMembers()

  const handleAdd = async () => {
    if (!email.trim()) return
    setAdding(true)
    try {
      await addMember(project.id, email.trim())
      setEmail('')
      // Reload members list
      setLoadedMembers(false)
      setTimeout(() => loadMembers(), 500)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (userId: string) => {
    
    toast.warning(
      'Deseja remover este membro?',
      {
        description: 'Esta ação não pode ser revertida.',
        action: {
          label: 'Confirmar',
          onClick: async () => {
            setRemovingId(userId)
            try {
              await removeMember(project.id, userId)
              setMembers((prev) => prev.filter((m) => m.uid !== userId))
            } finally {
              setRemovingId(null)
            }
          },
        },
        duration: 5000,
        position: 'top-center'
      }
    )
    
  }

  // Close on Escape
  if (typeof window !== 'undefined') {
    window.onkeydown = (e) => { if (e.key === 'Escape' && open) onClose() }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-auto w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Gerir membros</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">{project.name}</p>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Add by email */}
                {isOwner && (
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">
                      Adicionar membro pelo Email
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
                          placeholder="seu@exemplo.com"
                          disabled={adding}
                          className="w-full rounded-lg border border-border/60 bg-secondary/50 pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                        />
                      </div>
                      <button
                        onClick={handleAdd}
                        disabled={adding || !email.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {adding ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                        {adding ? 'Adicionando…' : 'Adiconar'}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[10px] text-muted-foreground/60">
                    O usuário já deve ter uma conta na plataforma.
                    </p>
                  </div>
                )}

                {/* Members list */}
                <div>
                  <h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                    Membros ({project.memberIds.length})
                  </h3>

                  {!loadedMembers ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                      <Loader2 size={12} className="animate-spin" /> Carregando…
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {members.map((member) => {
                        const isProjectOwner = member.uid === project.ownerId
                        const isCurrentUser = member.uid === firebaseUser?.uid
                        const removing = removingId === member.uid

                        return (
                          <div
                            key={member.uid}
                            className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/40 transition-colors"
                          >
                            <Avatar name={member.displayName} photoURL={member.photoURL} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {member.displayName}
                                  {isCurrentUser && <span className="text-muted-foreground font-normal"> (você)</span>}
                                </p>
                                {isProjectOwner && (
                                  <Crown size={10} className="text-amber-400 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                            </div>

                            {isOwner && !isProjectOwner && !isCurrentUser && (
                              <button
                                onClick={() => handleRemove(member.uid)}
                                disabled={removing}
                                className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-all disabled:opacity-60"
                              >
                                {removing
                                  ? <Loader2 size={11} className="animate-spin" />
                                  : <Trash2 size={11} />}
                              </button>
                            )}

                            {isProjectOwner && (
                              <span className="flex-shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                                Owner
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border px-5 py-3 flex justify-end">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                >
                  Concluir
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

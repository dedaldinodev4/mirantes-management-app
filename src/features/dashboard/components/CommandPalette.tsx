'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, LayoutDashboard, Folder, KanbanSquare, Plus,
  Settings, User, ArrowRight, Clock,
} from 'lucide-react'
import { useUIStore } from '@/stores/ui.store'
import { useProjectsStore } from '@/stores/projects.store'
import { ROUTES } from '@/constants'
import { cn, truncate } from '@/utils'

interface CommandItem {
  id: string
  icon: React.ReactNode
  label: string
  sub?: string
  action: () => void
  section: string
}

export function CommandPalette() {
  const router = useRouter()
  const { commandPaletteOpen, closeCommandPalette, openTaskModal } = useUIStore()
  const { projects, tasks } = useProjectsStore()
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Build items
  const staticItems: CommandItem[] = [
    {
      id: 'dashboard',
      icon: <LayoutDashboard size={14} />,
      label: 'Go to Dashboard',
      sub: 'Navigation',
      action: () => { router.push(ROUTES.dashboard); closeCommandPalette() },
      section: 'Navigation',
    },
    {
      id: 'projects',
      icon: <Folder size={14} />,
      label: 'View all Projects',
      sub: 'Navigation',
      action: () => { router.push(ROUTES.projects); closeCommandPalette() },
      section: 'Navigation',
    },
    {
      id: 'new-task',
      icon: <Plus size={14} />,
      label: 'Create new Task',
      sub: 'Action',
      action: () => { openTaskModal(); closeCommandPalette() },
      section: 'Actions',
    },
    {
      id: 'new-project',
      icon: <Folder size={14} />,
      label: 'Create new Project',
      sub: 'Action',
      action: () => { router.push(ROUTES.newProject); closeCommandPalette() },
      section: 'Actions',
    },
    {
      id: 'settings',
      icon: <Settings size={14} />,
      label: 'Settings',
      action: () => { router.push(ROUTES.settings); closeCommandPalette() },
      section: 'Navigation',
    },
    {
      id: 'profile',
      icon: <User size={14} />,
      label: 'Profile',
      action: () => { router.push(ROUTES.profile); closeCommandPalette() },
      section: 'Navigation',
    },
  ]

  const projectItems: CommandItem[] = projects.map((p) => ({
    id: `project-${p.id}`,
    icon: <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: p.color }} />,
    label: p.name,
    sub: 'Project',
    action: () => { router.push(ROUTES.kanban(p.id)); closeCommandPalette() },
    section: 'Projects',
  }))

  const allItems = [...staticItems, ...projectItems]

  const filtered = query
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.sub?.toLowerCase().includes(query.toLowerCase()),
      )
    : allItems

  const taskResults = query
    ? tasks
        .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 4)
    : []

  // Group by section
  const sections: Record<string, CommandItem[]> = {}
  for (const item of filtered) {
    if (!sections[item.section]) sections[item.section] = []
    sections[item.section].push(item)
  }

  const allFiltered = [...filtered, ...taskResults.map((t) => ({
    id: `task-${t.id}`,
    icon: <Clock size={14} />,
    label: t.title,
    sub: `Task · ${t.status}`,
    action: () => { openTaskModal(t.id); closeCommandPalette() },
    section: 'Tasks',
  }))]

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx((i) => Math.min(i + 1, allFiltered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        allFiltered[selectedIdx]?.action()
      }
    },
    [allFiltered, selectedIdx],
  )

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandPaletteOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        commandPaletteOpen ? closeCommandPalette() : useUIStore.getState().openCommandPalette()
      }
      if (e.key === 'Escape') closeCommandPalette()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [commandPaletteOpen, closeCommandPalette])

  let flatIdx = 0

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            onClick={closeCommandPalette}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-[20vh] z-50 w-[560px] max-w-[94vw] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          >
            {/* Input */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
              <Search size={16} className="text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0) }}
                onKeyDown={handleKeyDown}
                placeholder="Search tasks, projects, actions…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[380px] overflow-y-auto p-2">
              {allFiltered.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;
                </div>
              ) : (
                Object.entries(sections).map(([section, items]) => (
                  <div key={section} className="mb-1">
                    <div className="px-2 py-1 text-[10px] font-medium tracking-widest uppercase text-muted-foreground/60">
                      {section}
                    </div>
                    {items.map((item) => {
                      const idx = flatIdx++
                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIdx(idx)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                            selectedIdx === idx
                              ? 'bg-primary/10 text-foreground'
                              : 'text-foreground hover:bg-secondary',
                          )}
                        >
                          <span className="text-muted-foreground">{item.icon}</span>
                          <span className="flex-1 text-sm">{truncate(item.label, 50)}</span>
                          {item.sub && (
                            <span className="text-[11px] text-muted-foreground">{item.sub}</span>
                          )}
                          <ArrowRight size={12} className="text-muted-foreground/40" />
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> select</span>
              <span><kbd className="font-mono">esc</kbd> close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

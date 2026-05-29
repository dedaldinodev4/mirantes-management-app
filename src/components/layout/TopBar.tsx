'use client'

import { Search, Plus } from 'lucide-react'
import { useUIStore } from '@/stores/ui.store'
import { cn } from '@/utils'

interface TopBarProps {
  title: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  actions?: React.ReactNode
  className?: string
}

export function TopBar({ title, breadcrumbs, actions, className }: TopBarProps) {
  const { openCommandPalette, openTaskModal } = useUIStore()

  return (
    <header
      className={cn(
        'flex h-[50px] flex-shrink-0 items-center gap-3 border-b border-border bg-card/80 px-5 backdrop-blur-sm',
        className,
      )}
    >
      {/* Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        {breadcrumbs?.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            <span
              className={cn(
                i === breadcrumbs.length - 1
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground transition-colors cursor-pointer',
              )}
            >
              {crumb.label}
            </span>
          </span>
        ))}
        {!breadcrumbs && (
          <span className="font-medium text-foreground">{title}</span>
        )}
      </div>

      <div className="flex-1" />

      {/* Actions */}
      {actions}

      {/* Search trigger */}
      <button
        onClick={openCommandPalette}
        className="flex h-7 items-center gap-2 rounded-md border border-border/60 bg-secondary/50 px-2.5 text-xs text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground transition-all"
      >
        <Search size={11} />
        <span className="hidden sm:inline">Buscar…</span>
        <kbd className="hidden rounded border border-border bg-secondary px-1 text-[10px] font-mono sm:inline">
          ⌘K
        </kbd>
      </button>

      {/* New task quick action */}
      <button
        onClick={() => openTaskModal()}
        className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-all"
      >
        <Plus size={12} />
        <span>Nova Tarefa</span>
      </button>
    </header>
  )
}

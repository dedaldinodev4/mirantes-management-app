'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Folder, KanbanSquare, Bell, Users, Settings,
  ChevronLeft, ChevronRight, Plus, Search, Moon, Sun, LogOut,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUIStore } from '@/stores/ui.store'
import { useProjectsStore } from '@/stores/projects.store'
import { ROUTES } from '@/constants'
import { cn, getInitials } from '@/utils'
import { CommandPalette } from '@/features/dashboard/components/CommandPalette'

const NAV_ITEMS = [
  { href: ROUTES.dashboard, icon: LayoutDashboard, label: 'Dashboard' },
  { href: ROUTES.projects, icon: Folder, label: 'Projetos' },
  { href: '/notifications', icon: Bell, label: 'Notificações', badge: 3 },
  { href: '/members', icon: Users, label: 'Membros' },
  { href: ROUTES.settings, icon: Settings, label: 'Configurações' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { profile, signOut } = useAuth()
  const { sidebarCollapsed, toggleSidebar, openCommandPalette } = useUIStore()
  const { projects } = useProjectsStore()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 56 : 220 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex h-full flex-shrink-0 flex-col border-r border-border bg-card overflow-hidden"
      >
        {/* Header */}
        <div className="flex h-[50px] items-center justify-between px-3 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
            <div className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
              <span className="text-[11px] font-bold text-white">F</span>
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-[13px] font-semibold tracking-tight text-foreground whitespace-nowrap overflow-hidden"
                >
                  Flow
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="flex h-5 w-5 items-center justify-center rounded border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <ChevronLeft size={11} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">
          {/* Search */}
          <button
            onClick={openCommandPalette}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all mb-2',
            )}
          >
            <Search size={14} className="flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="flex-1 text-left whitespace-nowrap overflow-hidden">
                Buscar...
              </span>
            )}
            {!sidebarCollapsed && (
              <span className="rounded border border-border bg-secondary px-1 text-[10px] font-mono">⌘K</span>
            )}
          </button>

          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-all relative',
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <item.icon size={15} className="flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="flex-1 whitespace-nowrap overflow-hidden">{item.label}</span>
                )}
                {!sidebarCollapsed && item.badge && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Projects section */}
          {!sidebarCollapsed && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-1.5 px-2">
                <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground/70">
                  Projetos
                </span>
                <Link
                  href={ROUTES.newProject}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus size={12} />
                </Link>
              </div>
              {projects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  href={ROUTES.kanban(project.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-all',
                    pathname.includes(project.id) && 'text-foreground bg-secondary',
                  )}
                >
                  <div
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate">{project.name}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-2 space-y-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            {theme === 'dark' ? <Sun size={14} className="flex-shrink-0" /> : <Moon size={14} className="flex-shrink-0" />}
            {!sidebarCollapsed && <span>Tema {theme === 'dark' ? 'claro' : 'escuro'}</span>}
          </button>

          <button
            onClick={signOut}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[12px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut size={14} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Sair</span>}
          </button>

          {/* User */}
          <Link
            href={ROUTES.profile}
            className="flex items-center gap-2 rounded-md p-1.5 hover:bg-secondary transition-all"
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-semibold text-white">
              {profile ? getInitials(profile.displayName) : '?'}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-[11px] font-medium text-foreground">
                  {profile?.displayName ?? 'User'}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {profile?.email ?? ''}
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Collapsed toggle */}
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="absolute bottom-24 -right-3 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-md text-muted-foreground hover:text-foreground transition-all z-10"
          >
            <ChevronRight size={11} />
          </button>
        )}
      </motion.aside>

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>

      {/* ── Command Palette ── */}
      <CommandPalette />
    </div>
  )
}

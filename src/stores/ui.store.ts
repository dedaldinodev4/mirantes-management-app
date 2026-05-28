import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UIState {
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  taskModalOpen: boolean
  activeTaskId: string | null

  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  openCommandPalette: () => void
  closeCommandPalette: () => void
  openTaskModal: (taskId?: string) => void
  closeTaskModal: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        sidebarCollapsed: false,
        commandPaletteOpen: false,
        taskModalOpen: false,
        activeTaskId: null,

        toggleSidebar: () =>
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

        openCommandPalette: () => set({ commandPaletteOpen: true }),
        closeCommandPalette: () => set({ commandPaletteOpen: false }),

        openTaskModal: (taskId) =>
          set({ taskModalOpen: true, activeTaskId: taskId ?? null }),

        closeTaskModal: () =>
          set({ taskModalOpen: false, activeTaskId: null }),
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
      },
    ),
    { name: 'ui-store' },
  ),
)

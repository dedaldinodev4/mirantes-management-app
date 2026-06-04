import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { User } from '@/types'


export interface SessionUser {
  id: string
  email: string
}

interface AuthState {
  sessionUser: SessionUser | null
  profile: User | null
  loading: boolean
  initialized: boolean

  setSessionUser: (user: SessionUser | null) => void
  setProfile: (profile: User | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      sessionUser: null,
      profile: null,
      loading: true,
      initialized: false,

      setSessionUser: (user) => set({ sessionUser: user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      setInitialized: (initialized) => set({ initialized }),
      reset: () =>
        set({ sessionUser: null, profile: null, loading: false, initialized: true }),
    }),
    { name: 'auth-store' },
  ),
)

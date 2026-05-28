import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User as FirebaseUser } from 'firebase/auth'
import type { User } from '@/types'

interface AuthState {
  firebaseUser: FirebaseUser | null
  profile: User | null
  loading: boolean
  initialized: boolean

  setFirebaseUser: (user: FirebaseUser | null) => void
  setProfile: (profile: User | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      firebaseUser: null,
      profile: null,
      loading: true,
      initialized: false,

      setFirebaseUser: (user) => set({ firebaseUser: user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      setInitialized: (initialized) => set({ initialized }),
      reset: () =>
        set({
          firebaseUser: null,
          profile: null,
          loading: false,
          initialized: true,
        }),
    }),
    { name: 'auth-store' },
  ),
)

'use client'

import { useEffect } from 'react'
import { supabase } from '@/services/supabase/client'
import { getUserProfile, upsertProfile } from '@/services/supabase/auth'
import { useAuthStore } from '@/stores/auth.store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSessionUser, setProfile, setLoading, setInitialized } = useAuthStore()

  useEffect(() => {
    let mounted = true

    async function handleUser(user: { id: string; email: string; user_metadata?: any } | null) {
      if (!mounted) return

      if (!user) {
        setSessionUser(null)
        setProfile(null)
        setLoading(false)
        setInitialized(true)
        return
      }

      setSessionUser({ id: user.id, email: user.email ?? '' })

      // Try to load profile — if it doesn't exist yet (trigger hasn't fired),
      // create it from auth metadata
      let profile = await getUserProfile(user.id).catch(() => null)

      if (!profile) {
        // Profile not in DB yet — upsert it now
        const displayName =
          user.user_metadata?.display_name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'User'
        await upsertProfile(user.id, user.email ?? '', displayName)
        profile = await getUserProfile(user.id).catch(() => null)
      }

      if (mounted) {
        setProfile(profile)
        setLoading(false)
        setInitialized(true)
      }
    }

    // 1. Restore existing session synchronously from localStorage (no network call)
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null
      handleUser(
        user
          ? { id: user.id, email: user.email ?? '', user_metadata: user.user_metadata }
          : null,
      )
    })

    // 2. Listen for all future auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      handleUser(
        user
          ? { id: user.id, email: user.email ?? '', user_metadata: user.user_metadata }
          : null,
      )
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return <>{children}</>
}

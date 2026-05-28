'use client'

import { useEffect } from 'react'
import { onAuthChange, getUserProfile } from '@/services/firebase/auth'
import { useAuthStore } from '@/stores/auth.store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setFirebaseUser, setProfile, setLoading, setInitialized } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user)

      if (user) {
        const profile = await getUserProfile(user.uid)
        setProfile(profile)
      } else {
        setProfile(null)
      }

      setLoading(false)
      setInitialized(true)
    })

    return unsubscribe
  }, [setFirebaseUser, setProfile, setLoading, setInitialized])

  return <>{children}</>
}

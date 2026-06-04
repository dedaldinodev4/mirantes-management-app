'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/constants'

const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/auth/callback', '/auth/reset']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { initialized, sessionUser, loading } = useAuthStore()

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))

  useEffect(() => {
    if (!initialized) return
    if (!sessionUser && !isPublic) router.replace(ROUTES.login)
    else if (sessionUser && isPublic) router.replace(ROUTES.dashboard)
  }, [initialized, sessionUser, isPublic, router])

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
            <span className="text-base font-bold text-white">F</span>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!sessionUser && !isPublic) return null
  if (sessionUser && isPublic) return null

  return <>{children}</>
}

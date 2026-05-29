'use client'

import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/features/auth/components/AuthProvider'
import { AuthGuard } from '@/components/shared/AuthGuard'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <AuthProvider>
        <AuthGuard>
          {children}
        </AuthGuard>
      </AuthProvider>
    </ThemeProvider>
  )
}

import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Providers } from '@/providers'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Flow App',
    template: '%s · Flow',
  },
  description:
    'Modern project management platform. Kanban boards, task tracking, team collaboration.',
  keywords: ['project management', 'kanban', 'tasks', 'collaboration', 'productivity'],
  authors: [{ name: 'Flow Team' }],
  openGraph: {
    title: 'Flow — Project Management',
    description: 'Modern project management platform for teams.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              classNames: {
                toast:
                  'bg-card border border-border text-foreground shadow-xl rounded-xl font-sans text-sm',
                success: 'border-emerald-500/30',
                error: 'border-red-500/30',
                warning: 'border-amber-500/30',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}

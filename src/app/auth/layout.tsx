import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Auth',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Background gradient mesh */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      >
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 h-[400px] w-[400px] rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-purple-600/10 blur-[80px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
        aria-hidden
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg">
            <span className="text-sm font-bold text-white">F</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Flow
          </span>
        </div>

        {children}

        <p className="mt-8 text-center text-xs text-muted-foreground">
        Ao continuar, você concorda com o nosso{' '}
          <a href="#" className="underline underline-offset-2 hover:text-foreground">
            Termos
          </a>{' '}
          e{' '}
          <a href="#" className="underline underline-offset-2 hover:text-foreground">
            Política de Privacidade
          </a>
          .
        </p>
      </div>
    </div>
  )
}

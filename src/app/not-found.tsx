'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Home } from 'lucide-react'
import { ROUTES } from '@/constants'

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background overflow-hidden px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex flex-col items-center text-center"
      >
        {/* 404 number */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 select-none"
        >
          <span className="bg-gradient-to-b from-foreground/80 to-foreground/20 bg-clip-text text-[120px] font-bold leading-none tracking-tighter text-transparent sm:text-[160px]">
            404
          </span>
        </motion.div>

        {/* Logo */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg">
            <span className="text-xs font-bold text-white">F</span>
          </div>
          <span className="text-sm font-semibold text-foreground">Flow</span>
        </div>

        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
          Página não encontarada
        </h1>
        <p className="mb-8 max-w-sm text-sm text-muted-foreground leading-relaxed">
        A página que você está procurando não existe ou foi movida para outra URL.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <ArrowLeft size={14} />
            Voltar
          </button>
          <Link
            href={ROUTES.dashboard}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Home size={14} />
            Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  format,
  formatDistanceToNow,
  isPast,
  isToday,
  isTomorrow,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

import type { ErrorKind, ISODate } from '@/types'


//* ── Tailwind class merger *//
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

//* ── Date utilities *//
export function toDate(value: ISODate | string | null | undefined): Date | null {
  if (!value) return null
  try { return parseISO(value) } catch { return null }
}

export function formatDate(value: ISODate | string | null | undefined, pattern = 'MMM d, yyyy'): string {
  const d = toDate(value)
  if (!d) return '—'
  return format(d, pattern,{
    locale: ptBR,
  })
}

export function formatRelative(value: ISODate | string | null | undefined): string {
  const d = toDate(value)
  if (!d) return '—'
  return formatDistanceToNow(d, 
    { addSuffix: true, 
      locale: ptBR,
    })
}

export function isOverdue(value: ISODate | string | null | undefined): boolean {
  const d = toDate(value)
  if (!d) return false
  return isPast(d) && !isToday(d)
}

export function getDueDateLabel(value: ISODate | string | null | undefined): { label: string; urgent: boolean } {
  const d = toDate(value)
  if (!d) return { label: '—', urgent: false }
  if (isToday(d)) return { label: 'Hoje', urgent: true }
  if (isTomorrow(d)) return { label: 'Amanhã', urgent: false }
  if (isPast(d)) return { label: formatDate(value, 'MMM d'), urgent: true }
  return { label: formatDate(value, 'MMM d'), urgent: false }
}

export function todayDate (): string {
  return new Date().toISOString().split('T')[0];
}


//* ── String utilities *//
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

//* ── Number utilities *//
export function calcProgress(total: number, completed: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

//* ── Color utilities *//
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function getContrastColor(hex: string): 'white' | 'black' {
  const rgb = hexToRgb(hex)
  if (!rgb) return 'white'
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? 'black' : 'white'
}

//* ── Array utilities *//
export function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = [...list]
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (acc, item) => {
      const group = String(item[key])
      if (!acc[group]) acc[group] = []
      acc[group].push(item)
      return acc
    },
    {} as Record<string, T[]>,
  )
}

//* ── Classify every possible Supabase error *//
export function classifyError(err: any): { kind: ErrorKind; message: string } {
  const raw = (err?.message ?? err?.error_description ?? err?.msg ?? '').toLowerCase()
  const code = (err?.code ?? err?.error ?? '').toLowerCase()
  const status = err?.status ?? err?.statusCode ?? 0

  if (raw.includes('email not confirmed') || raw.includes('email_not_confirmed'))
    return { kind: 'EMAIL_NOT_CONFIRMED', message: '' }

  if (
    raw.includes('for security purposes') || raw.includes('rate limit') ||
    raw.includes('too many requests') || raw.includes('over_email_send_rate_limit') ||
    raw.includes('email rate limit') || raw.includes('request this after') ||
    raw.includes('wait') || code === 'over_email_send_rate_limit' ||
    code === 'too_many_requests' || status === 429
  ) return { kind: 'EMAIL_RATE_LIMIT', message: '' }

  if (raw === 'email_already_exists' || raw.includes('already exists') ||
    raw.includes('already registered') || raw.includes('user already'))
    return { kind: 'EMAIL_ALREADY_EXISTS', message: 'Já existe uma conta com este email.' }

  if (raw.includes('invalid login') || raw.includes('invalid credentials') || raw.includes('wrong password'))
    return { kind: 'INVALID_CREDENTIALS', message: 'Email ou palavra-passe incorretos.' }

  if (raw.includes('password should be') || raw.includes('password must be'))
    return { kind: 'WEAK_PASSWORD', message: 'A palavra-passe deve ter pelo menos 6 caracteres.' }

  if (raw.includes('fetch') || raw.includes('network') || raw.includes('failed to fetch'))
    return { kind: 'NETWORK', message: 'Erro de rede. Verifique a sua ligação e tente novamente.' }

  return { kind: 'GENERIC', message: err?.message || 'Algo correu mal. Por favor tente novamente.' }
}


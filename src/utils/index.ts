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
import { Timestamp } from 'firebase/firestore'
import { FIREBASE_ERRORS } from '@/constants'

// ── Tailwind class merger ─────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Date utilities ────────────────────────────────────────────────────────────
export function toDate(value: Timestamp | string | Date | null): Date | null {
  if (!value) return null
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return parseISO(value)
}

export function formatDate(
  value: Timestamp | string | Date | null,
  pattern = 'MMM d, yyyy',
): string {
  const date = toDate(value)
  if (!date) return '—'
  return format(date, pattern)
}

export function formatRelative(value: Timestamp | string | Date | null): string {
  const date = toDate(value)
  if (!date) return '—'
  return formatDistanceToNow(date, { addSuffix: true })
}

export function isOverdue(dueDate: Timestamp | string | Date | null): boolean {
  const date = toDate(dueDate)
  if (!date) return false
  return isPast(date) && !isToday(date)
}

export function getDueDateLabel(
  value: Timestamp | string | Date | null,
): { label: string; urgent: boolean } {
  const date = toDate(value)
  if (!date) return { label: '—', urgent: false }

  if (isToday(date)) return { label: 'Today', urgent: true }
  if (isTomorrow(date)) return { label: 'Tomorrow', urgent: false }
  if (isPast(date)) return { label: formatDate(value, 'MMM d'), urgent: true }
  return { label: formatDate(value, 'MMM d'), urgent: false }
}

// ── String utilities ──────────────────────────────────────────────────────────
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

// ── Number utilities ──────────────────────────────────────────────────────────
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

// ── Color utilities ───────────────────────────────────────────────────────────
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

// ── Array utilities ───────────────────────────────────────────────────────────
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

export function getFirebaseError(err: any): string {
  return FIREBASE_ERRORS[err?.code] ?? err?.message ?? 'Something went wrong. Please try again.'
}

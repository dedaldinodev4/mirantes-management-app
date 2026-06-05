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
import type { ISODate } from '@/types'


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
  return format(d, pattern)
}

export function formatRelative(value: ISODate | string | null | undefined): string {
  const d = toDate(value)
  if (!d) return '—'
  return formatDistanceToNow(d, { addSuffix: true })
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


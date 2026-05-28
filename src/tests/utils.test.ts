import { describe, it, expect } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import {
  cn,
  getInitials,
  truncate,
  calcProgress,
  formatBytes,
  reorder,
  groupBy,
  isOverdue,
} from '@/utils'

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
  it('handles conditional classes', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c')
  })
  it('deduplicates tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

describe('getInitials()', () => {
  it('returns two-letter initials', () => {
    expect(getInitials('Jordan Davis')).toBe('JD')
  })
  it('handles single name', () => {
    expect(getInitials('Jordan')).toBe('J')
  })
  it('uppercases result', () => {
    expect(getInitials('alex kim')).toBe('AK')
  })
})

describe('truncate()', () => {
  it('truncates long strings', () => {
    expect(truncate('Hello World', 5)).toBe('Hello…')
  })
  it('does not truncate short strings', () => {
    expect(truncate('Hi', 10)).toBe('Hi')
  })
})

describe('calcProgress()', () => {
  it('returns 0 for empty total', () => {
    expect(calcProgress(0, 0)).toBe(0)
  })
  it('returns correct percentage', () => {
    expect(calcProgress(10, 5)).toBe(50)
  })
  it('returns 100 when all done', () => {
    expect(calcProgress(4, 4)).toBe(100)
  })
})

describe('formatBytes()', () => {
  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1024 * 1024)).toBe('1 MB')
  })
})

describe('reorder()', () => {
  it('reorders array elements', () => {
    expect(reorder([1, 2, 3], 0, 2)).toEqual([2, 3, 1])
  })
  it('does not mutate original', () => {
    const arr = [1, 2, 3]
    reorder(arr, 0, 1)
    expect(arr).toEqual([1, 2, 3])
  })
})

describe('groupBy()', () => {
  it('groups objects by key', () => {
    const items = [
      { status: 'Todo', title: 'A' },
      { status: 'Done', title: 'B' },
      { status: 'Todo', title: 'C' },
    ]
    const result = groupBy(items, 'status')
    expect(result['Todo']).toHaveLength(2)
    expect(result['Done']).toHaveLength(1)
  })
})

describe('isOverdue()', () => {
  it('returns false for null', () => {
    expect(isOverdue(null)).toBe(false)
  })
  it('returns true for past date', () => {
    expect(isOverdue('2020-01-01')).toBe(true)
  })
  it('returns false for future date', () => {
    expect(isOverdue('2099-01-01')).toBe(false)
  })
})

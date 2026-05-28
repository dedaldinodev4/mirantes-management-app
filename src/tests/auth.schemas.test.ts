import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '@/features/auth/schemas'

describe('loginSchema', () => {
  it('validates valid input', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: 'password123' })
    expect(result.success).toBe(true)
  })
  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'password123' })
    expect(result.success).toBe(false)
  })
  it('rejects short password', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '123' })
    expect(result.success).toBe(false)
  })
  it('rejects empty fields', () => {
    const result = loginSchema.safeParse({ email: '', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  const valid = {
    displayName: 'Jordan Davis',
    email: 'jordan@test.com',
    password: 'Password1',
    confirmPassword: 'Password1',
  }

  it('validates valid input', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })
  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'Different1' })
    expect(result.success).toBe(false)
    const errors = result.error?.flatten().fieldErrors
    expect(errors?.confirmPassword).toBeDefined()
  })
  it('rejects password without uppercase', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'nouppercase1', confirmPassword: 'nouppercase1' })
    expect(result.success).toBe(false)
  })
  it('rejects password without number', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'NoNumbers', confirmPassword: 'NoNumbers' })
    expect(result.success).toBe(false)
  })
  it('rejects short name', () => {
    const result = registerSchema.safeParse({ ...valid, displayName: 'J' })
    expect(result.success).toBe(false)
  })
})

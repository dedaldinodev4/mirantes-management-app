import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase
vi.mock('@/services/firebase/config', () => ({
  auth: {},
  db: {},
  storage: {},
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ id: 'test-project-id' }),
  usePathname: () => '/dashboard',
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}))

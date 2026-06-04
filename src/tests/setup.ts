import '@testing-library/jest-dom'
import { vi } from 'vitest'


vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ id: 'test-project-id' }),
  usePathname: () => '/dashboard',
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}))

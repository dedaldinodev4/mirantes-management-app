import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { Avatar, AvatarGroup } from '@/components/shared/Avatar'

describe('PriorityBadge', () => {
  it('renders priority label', () => {
    render(<PriorityBadge priority="urgent" />)
    expect(screen.getByText('Urgent')).toBeInTheDocument()
  })

  it('renders without label when showLabel=false', () => {
    render(<PriorityBadge priority="high" showLabel={false} />)
    expect(screen.queryByText('High')).not.toBeInTheDocument()
  })

  it('applies correct classes for each priority', () => {
    const { rerender, container } = render(<PriorityBadge priority="urgent" />)
    expect(container.firstChild).toHaveClass('bg-red-500/10')

    rerender(<PriorityBadge priority="low" />)
    expect(container.firstChild).toHaveClass('bg-emerald-500/10')
  })
})

describe('Avatar', () => {
  it('renders initials', () => {
    render(<Avatar name="Jordan Davis" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders image when photoURL given', () => {
    render(<Avatar name="Alex Kim" photoURL="https://example.com/photo.jpg" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
    expect(img).toHaveAttribute('alt', 'Alex Kim')
  })

  it('has accessible title', () => {
    const { container } = render(<Avatar name="Morgan Lee" />)
    expect(container.firstChild).toHaveAttribute('title', 'Morgan Lee')
  })
})

describe('AvatarGroup', () => {
  const users = [
    { name: 'Jordan Davis' },
    { name: 'Alex Kim' },
    { name: 'Sam Rivera' },
    { name: 'Morgan Lee' },
  ]

  it('shows up to max avatars', () => {
    render(<AvatarGroup users={users} max={2} />)
    expect(screen.getByText('JD')).toBeInTheDocument()
    expect(screen.getByText('AK')).toBeInTheDocument()
  })

  it('shows overflow count', () => {
    render(<AvatarGroup users={users} max={2} />)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('shows no overflow when all fit', () => {
    render(<AvatarGroup users={users.slice(0, 2)} max={3} />)
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument()
  })
})

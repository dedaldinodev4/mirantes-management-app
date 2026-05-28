import { cn, getInitials } from '@/utils'

interface AvatarProps {
  name: string
  photoURL?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

const SIZE_CLASSES = {
  xs: 'h-5 w-5 text-[8px]',
  sm: 'h-6 w-6 text-[9px]',
  md: 'h-8 w-8 text-[11px]',
  lg: 'h-10 w-10 text-[13px]',
}

const AVATAR_COLORS = [
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-blue-500 to-cyan-600',
  'from-purple-500 to-fuchsia-600',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function Avatar({ name, photoURL, size = 'md', color, className }: AvatarProps) {
  const gradient = color ? '' : getAvatarColor(name)

  return (
    <div
      className={cn(
        'flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white',
        SIZE_CLASSES[size],
        color ? '' : `bg-gradient-to-br ${gradient}`,
        className,
      )}
      style={color ? { backgroundColor: color } : undefined}
      title={name}
    >
      {photoURL ? (
        <img src={photoURL} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}

interface AvatarGroupProps {
  users: Array<{ name: string; photoURL?: string | null }>
  max?: number
  size?: AvatarProps['size']
}

export function AvatarGroup({ users, max = 3, size = 'xs' }: AvatarGroupProps) {
  const visible = users.slice(0, max)
  const rest = users.length - max

  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <div
          key={i}
          className="ring-2 ring-card"
          style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: visible.length - i }}
        >
          <Avatar name={user.name} photoURL={user.photoURL} size={size} />
        </div>
      ))}
      {rest > 0 && (
        <div
          className={cn(
            'flex flex-shrink-0 items-center justify-center rounded-full bg-secondary text-[8px] font-semibold text-muted-foreground ring-2 ring-card',
            size === 'xs' ? 'h-5 w-5' : 'h-6 w-6',
          )}
          style={{ marginLeft: '-6px' }}
        >
          +{rest}
        </div>
      )}
    </div>
  )
}

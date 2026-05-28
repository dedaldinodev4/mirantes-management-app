import { cn } from '@/utils'
import { PRIORITY_CONFIG } from '@/constants'
import type { TaskPriority } from '@/types'

interface PriorityBadgeProps {
  priority: TaskPriority
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function PriorityBadge({
  priority,
  showLabel = true,
  size = 'sm',
  className,
}: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium',
        config.bg,
        config.color,
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        className,
      )}
    >
      <span className="text-[8px] leading-none">{config.icon}</span>
      {showLabel && config.label}
    </span>
  )
}

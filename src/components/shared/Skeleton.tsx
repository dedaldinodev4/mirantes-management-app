import { cn } from '@/utils'

interface SkeletonProps {
  className?: string
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

export function Skeleton({ className, rounded = 'md' }: SkeletonProps) {
  const roundedClass = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded]

  return (
    <div
      className={cn(
        'skeleton',
        roundedClass,
        className,
      )}
    />
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20 ml-auto" rounded="full" />
      </div>
    </div>
  )
}

export function KanbanColumnSkeleton() {
  return (
    <div className="min-w-[240px] w-[240px] space-y-2">
      <div className="flex items-center gap-2 pb-3">
        <Skeleton className="h-2.5 w-2.5" rounded="full" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-6 ml-2" />
      </div>
      {[1, 2, 3].map((i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-8" rounded="full" />
      </div>
      <Skeleton className="h-1.5" rounded="full" />
      <div className="flex items-center gap-2">
        <div className="flex gap-[-4px]">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-5 w-5 -ml-1 first:ml-0" rounded="full" />
          ))}
        </div>
        <Skeleton className="h-3 w-24 ml-auto" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-7 w-7" rounded="lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-2.5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

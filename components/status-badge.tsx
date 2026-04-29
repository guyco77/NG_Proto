import { cn } from '@/lib/utils'
import { getStatusColor } from '@/lib/mock-data'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClasses = getStatusColor(status)
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        colorClasses,
        className
      )}
    >
      {label}
    </span>
  )
}

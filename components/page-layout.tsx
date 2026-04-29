'use client'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

interface PageContentProps {
  children: React.ReactNode
  className?: string
}

export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cn('p-6 lg:p-8 space-y-8', className)}>
      {children}
    </div>
  )
}

interface StaggeredSectionProps {
  children: React.ReactNode
  index?: number
  className?: string
}

export function StaggeredSection({ children, index = 0, className }: StaggeredSectionProps) {
  const staggerClass = index <= 4 ? `stagger-${index}` : ''
  
  return (
    <div 
      className={cn('animate-in fade-in slide-in-from-bottom-2', staggerClass, className)}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  )
}

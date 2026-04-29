import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ElementType
  iconColor?: string
}

export function StatsCard({ title, value, change, changeLabel, icon: Icon, iconColor = 'text-primary' }: StatsCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
            {change !== undefined && (
              <div className="mt-2 flex items-center gap-1 text-sm">
                {isPositive && <TrendingUp className="h-4 w-4 text-success" />}
                {isNegative && <TrendingDown className="h-4 w-4 text-destructive" />}
                <span className={cn(isPositive && 'text-success', isNegative && 'text-destructive')}>
                  {isPositive ? '+' : ''}{change}%
                </span>
                {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
              </div>
            )}
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10', iconColor)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

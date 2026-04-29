'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DashboardRefreshProps {
  onRefresh?: () => void | Promise<void>
  className?: string
}

export function DashboardRefresh({ onRefresh, className }: DashboardRefreshProps) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDebounced, setIsDebounced] = useState(false)
  const [formattedTime, setFormattedTime] = useState<string>('')

  // Format time on client side only to avoid hydration mismatch
  useEffect(() => {
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    }
    setFormattedTime(formatTime(lastUpdated))
  }, [lastUpdated])

  const handleRefresh = useCallback(async () => {
    if (isDebounced || isRefreshing) return

    setIsRefreshing(true)
    setIsDebounced(true)

    // Minimum animation duration of 500ms
    const minAnimationTime = new Promise(resolve => setTimeout(resolve, 500))

    try {
      // Run refresh callback if provided
      if (onRefresh) {
        await Promise.all([onRefresh(), minAnimationTime])
      } else {
        await minAnimationTime
      }
    } finally {
      setIsRefreshing(false)
      setLastUpdated(new Date())

      // Debounce for 2 seconds after refresh completes
      setTimeout(() => {
        setIsDebounced(false)
      }, 2000)
    }
  }, [isDebounced, isRefreshing, onRefresh])

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs text-muted-foreground">
        Last updated: {formattedTime || '--:--:--'}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleRefresh}
        disabled={isDebounced || isRefreshing}
        title="Refresh dashboard"
      >
        <RefreshCw
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isRefreshing && 'animate-spin'
          )}
        />
      </Button>
    </div>
  )
}

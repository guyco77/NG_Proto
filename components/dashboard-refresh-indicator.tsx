'use client'

import { RefreshCw, WifiOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface DashboardRefreshIndicatorProps {
  lastUpdated: string
  isRefreshing: boolean
  isOffline: boolean
  hasError: boolean
  onRefresh: () => void
}

export function DashboardRefreshIndicator({
  lastUpdated,
  isRefreshing,
  isOffline,
  hasError,
  onRefresh,
}: DashboardRefreshIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {isOffline && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-[#f59e0b]">
                <WifiOff className="h-4 w-4" />
                <span>Offline</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{"We'll retry when you're back online."}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {hasError && !isOffline && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onRefresh}
                className="flex items-center gap-1 text-destructive hover:underline"
              >
                <AlertCircle className="h-4 w-4" />
                <span>{"Couldn't load data. Tap to retry."}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to retry loading data</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {!isOffline && !hasError && (
        <>
          <span>Last updated: {lastUpdated}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn(
                    'h-4 w-4',
                    isRefreshing && 'animate-spin'
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh dashboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
    </div>
  )
}

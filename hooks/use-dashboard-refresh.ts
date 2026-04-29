'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const REFRESH_INTERVAL = 10 * 60 * 1000 // 10 minutes
const DEBOUNCE_DELAY = 2000 // 2 seconds

interface UseDashboardRefreshOptions {
  onRefresh: () => Promise<void> | void
  enabled?: boolean
}

interface UseDashboardRefreshReturn {
  lastUpdated: Date
  isRefreshing: boolean
  isOffline: boolean
  hasError: boolean
  manualRefresh: () => void
  formattedLastUpdated: string
}

export function useDashboardRefresh({
  onRefresh,
  enabled = true,
}: UseDashboardRefreshOptions): UseDashboardRefreshReturn {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastManualRefreshRef = useRef<number>(0)

  // Format last updated time (HH:MM:SS)
  const formattedLastUpdated = lastUpdated.toLocaleTimeString('en-IL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jerusalem',
  })

  const doRefresh = useCallback(async () => {
    if (!enabled || isOffline) return

    setIsRefreshing(true)
    setHasError(false)

    try {
      await onRefresh()
      setLastUpdated(new Date())
    } catch {
      setHasError(true)
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh, enabled, isOffline])

  // Manual refresh with debounce
  const manualRefresh = useCallback(() => {
    const now = Date.now()
    if (now - lastManualRefreshRef.current < DEBOUNCE_DELAY) {
      return
    }
    lastManualRefreshRef.current = now
    
    // Reset timer on manual refresh
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    doRefresh()
    
    // Restart timer
    if (enabled && isVisible) {
      timerRef.current = setInterval(doRefresh, REFRESH_INTERVAL)
    }
  }, [doRefresh, enabled, isVisible])

  // Handle visibility change (pause on inactive tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible'
      setIsVisible(visible)
      
      if (visible) {
        // Resume refresh on focus
        doRefresh()
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
        timerRef.current = setInterval(doRefresh, REFRESH_INTERVAL)
      } else {
        // Pause on inactive
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [doRefresh])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      doRefresh()
    }
    
    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Check initial status
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [doRefresh])

  // Setup auto-refresh interval
  useEffect(() => {
    if (!enabled || !isVisible) return

    // Initial fetch
    doRefresh()

    // Setup interval
    timerRef.current = setInterval(doRefresh, REFRESH_INTERVAL)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [enabled, isVisible, doRefresh])

  return {
    lastUpdated,
    isRefreshing,
    isOffline,
    hasError,
    manualRefresh,
    formattedLastUpdated,
  }
}

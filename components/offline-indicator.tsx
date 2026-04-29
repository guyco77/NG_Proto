'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      // Keep showing for a moment to indicate reconnection
      setTimeout(() => setShowIndicator(false), 2000)
    }
    
    const handleOffline = () => {
      setIsOffline(true)
      setShowIndicator(true)
    }

    // Check initial state
    if (!navigator.onLine) {
      setIsOffline(true)
      setShowIndicator(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showIndicator) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all duration-300',
        isOffline
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-emerald-500 text-white'
      )}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4" />
          You&apos;re offline
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          Back online
        </>
      )}
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Check,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Flag,
  Mail,
  Handshake,
  MessageSquare,
  FileText,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  AlertCircle,
  DollarSign,
  CreditCard,
  Package,
  UserPlus,
  KeyRound,
  Shield,
  Settings,
  AlertOctagon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { mockNotifications, NOTIFICATION_TYPE_CONFIG } from '@/lib/mock-data'
import type { Notification, NotificationType } from '@/lib/types'

// Icon mapping
const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Flag,
  Mail,
  Handshake,
  MessageSquare,
  FileText,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  AlertCircle,
  DollarSign,
  CreditCard,
  Package,
  UserPlus,
  KeyRound,
  Shield,
  Settings,
  AlertOctagon,
}

function getNotificationIcon(type: NotificationType) {
  const config = NOTIFICATION_TYPE_CONFIG[type]
  if (!config) return { Icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-100' }
  const Icon = iconComponents[config.icon] || Bell
  return { Icon, color: config.color, bgColor: config.bgColor }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isToday(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

interface NotificationBellProps {
  userId?: string
}

export function NotificationBell({ userId = '2' }: NotificationBellProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(
    mockNotifications.filter(n => n.userId === userId)
  )

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications])
  const displayCount = unreadCount > 99 ? '99+' : unreadCount

  // Group notifications by Today / Earlier
  const { todayNotifications, earlierNotifications } = useMemo(() => {
    const today: Notification[] = []
    const earlier: Notification[] = []
    
    // Sort by createdAt descending and take last 20
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 20)
    
    sorted.forEach(n => {
      if (isToday(n.createdAt)) {
        today.push(n)
      } else {
        earlier.push(n)
      }
    })
    
    return { todayNotifications: today, earlierNotifications: earlier }
  }, [notifications])

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    setOpen(false)
    if (notification.entityUrl) {
      router.push(notification.entityUrl)
    }
  }

  const renderNotification = (notification: Notification) => {
    const { Icon, color, bgColor } = getNotificationIcon(notification.type)
    
    return (
      <button
        key={notification.id}
        onClick={() => handleNotificationClick(notification)}
        className={cn(
          'flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50',
          !notification.isRead && 'bg-primary/5'
        )}
      >
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', bgColor)}>
          <Icon className={cn('h-4 w-4', color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('text-sm font-medium', !notification.isRead && 'text-foreground')}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
          </div>
          {notification.preview && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {notification.preview}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {displayCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto gap-1 px-2 py-1 text-xs"
            >
              <Check className="h-3 w-3" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">You&apos;re all caught up! &#10024;</p>
            </div>
          ) : (
            <div className="p-2">
              {todayNotifications.length > 0 && (
                <>
                  <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Today
                  </p>
                  {todayNotifications.map(renderNotification)}
                </>
              )}
              {earlierNotifications.length > 0 && (
                <>
                  <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Earlier
                  </p>
                  {earlierNotifications.map(renderNotification)}
                </>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-2">
          <Link href="/notifications" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-center text-sm">
              View All
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}

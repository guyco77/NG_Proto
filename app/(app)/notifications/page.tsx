'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
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
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { mockNotifications, NOTIFICATION_TYPE_CONFIG } from '@/lib/mock-data'
import type { Notification, NotificationType, NotificationCategory } from '@/lib/types'

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

const ITEMS_PER_PAGE = 20

export default function NotificationsPage() {
  // Mock current user ID
  const currentUserId = '2'
  
  const [notifications, setNotifications] = useState<Notification[]>(
    mockNotifications.filter(n => n.userId === currentUserId)
  )
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [page, setPage] = useState(1)

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications])

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let result = [...notifications]
    
    if (categoryFilter !== 'all') {
      result = result.filter(n => n.category === categoryFilter)
    }
    
    if (readFilter === 'unread') {
      result = result.filter(n => !n.isRead)
    } else if (readFilter === 'read') {
      result = result.filter(n => n.isRead)
    }
    
    // Sort by createdAt descending
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return result
  }, [notifications, categoryFilter, readFilter])

  // Paginate
  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE)
  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  // Group by Today / Earlier
  const { todayNotifications, earlierNotifications } = useMemo(() => {
    const today: Notification[] = []
    const earlier: Notification[] = []
    
    paginatedNotifications.forEach(n => {
      if (isToday(n.createdAt)) {
        today.push(n)
      } else {
        earlier.push(n)
      }
    })
    
    return { todayNotifications: today, earlierNotifications: earlier }
  }, [paginatedNotifications])

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const renderNotification = (notification: Notification) => {
    const { Icon, color, bgColor } = getNotificationIcon(notification.type)
    
    return (
      <Card
        key={notification.id}
        className={cn(
          'transition-colors',
          !notification.isRead && 'border-primary/30 bg-primary/5'
        )}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                bgColor
              )}
            >
              <Icon className={cn('h-5 w-5', color)} />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground">{notification.title}</h4>
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  {notification.preview && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.preview}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatRelativeTime(notification.createdAt)}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {notification.entityUrl && (
                  <Link href={notification.entityUrl}>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </Link>
                )}
                {!notification.isRead && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markAsRead(notification.id)}
                    className="gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark as read
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead} className="gap-1.5">
            <Check className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="mx-auto max-w-3xl">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filters:</span>
          </div>
          
          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value as NotificationCategory | 'all')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="tasks">Tasks</SelectItem>
              <SelectItem value="projects">Projects</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="account">Account</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={readFilter}
            onValueChange={(value) => {
              setReadFilter(value as 'all' | 'unread' | 'read')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>

          <span className="ml-auto text-sm text-muted-foreground">
            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {paginatedNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex h-64 flex-col items-center justify-center">
                <Bell className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  {categoryFilter !== 'all' || readFilter !== 'all'
                    ? 'No notifications match your filters'
                    : "You're all caught up!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {todayNotifications.length > 0 && (
                <>
                  <p className="px-1 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Today
                  </p>
                  {todayNotifications.map(renderNotification)}
                </>
              )}
              {earlierNotifications.length > 0 && (
                <>
                  <p className="px-1 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Earlier
                  </p>
                  {earlierNotifications.map(renderNotification)}
                </>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

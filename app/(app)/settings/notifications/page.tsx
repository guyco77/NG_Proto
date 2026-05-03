'use client'

import { useState, useMemo } from 'react'
import { Bell, Mail, Lock, Check, Shield, Settings, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../../layout'
import type { UserRole } from '@/lib/types'

/**
 * Update-001 & Update-002: Per-role notification preferences
 * 
 * Each user sees only the notification types relevant to their role.
 * Always-on notifications cannot be disabled.
 * 
 * Role model:
 * - Performers (receive task assignments): Vendor, Client Task Owner, Client Reviewer
 * - Overseers (orchestrate Shows, monitor progress): Admin, PM, Client Admin
 * - Read-only / financial (no task involvement): Finance, IT, Client Viewer
 */

// Client sub-roles (stored separately from main UserRole)
type ClientSubRole = 'client_admin' | 'task_owner' | 'reviewer' | 'viewer'

interface NotificationRow {
  id: string
  category: string
  label: string
  description?: string
  isAlwaysOn: boolean
  inApp: boolean
  email: boolean
}

// Category labels
const categoryLabels: Record<string, string> = {
  account: 'Account & Security',
  shows_ng: 'Show Lifecycle — NG-owned Shows',
  shows_client: 'Show Lifecycle — Client-owned Shows',
  vendor_tasks: 'Vendor Task Progress',
  client_tasks: 'Client Task Events',
  tasks: 'Tasks',
  quotes: 'Quotes',
  billing: 'Billing',
  system: 'System',
}

// Universal notifications (all roles)
const UNIVERSAL_NOTIFICATIONS: NotificationRow[] = [
  { id: 'account_invite', category: 'account', label: 'Account invite', isAlwaysOn: true, inApp: true, email: true },
  { id: 'password_reset', category: 'account', label: 'Password reset', isAlwaysOn: true, inApp: true, email: true },
  { id: 'role_changed', category: 'account', label: 'Role changed', isAlwaysOn: true, inApp: true, email: true },
  { id: 'account_deactivated', category: 'account', label: 'Account deactivated', isAlwaysOn: true, inApp: true, email: true },
]

/**
 * Role-specific notification definitions
 * Update-002: Complete matrix per PRD specification
 */
const ROLE_NOTIFICATIONS: Record<UserRole | ClientSubRole, NotificationRow[]> = {
  // =============== ADMIN ===============
  admin: [
    // Show lifecycle — NG-owned Shows
    { id: 'show_created_ng', category: 'shows_ng', label: 'New Show created (by me or PM)', isAlwaysOn: false, inApp: true, email: true },
    { id: 'show_in_progress_ng', category: 'shows_ng', label: 'Show moved to In Progress', isAlwaysOn: false, inApp: true, email: true },
    { id: 'tasks_added_ng', category: 'shows_ng', label: 'New tasks added mid-Show by Admin/PM', description: 'No re-pricing — internal scope change', isAlwaysOn: false, inApp: true, email: true },
    { id: 'show_delivered_ng', category: 'shows_ng', label: 'Show delivered (all tasks complete)', isAlwaysOn: true, inApp: true, email: true },
    // Show lifecycle — Client-owned Shows
    { id: 'client_show_created', category: 'shows_client', label: 'New Client-owned Show created (billing-bound)', isAlwaysOn: false, inApp: true, email: true },
    { id: 'repricing_requested', category: 'shows_client', label: 'Re-pricing requested by Client Admin', isAlwaysOn: true, inApp: true, email: true },
    { id: 'repricing_confirmed', category: 'shows_client', label: 'Re-pricing confirmed by Client Admin', isAlwaysOn: false, inApp: true, email: true },
    { id: 'repricing_rejected', category: 'shows_client', label: 'Re-pricing rejected / cancelled by Client Admin', isAlwaysOn: false, inApp: true, email: true },
    { id: 'client_show_delivered', category: 'shows_client', label: 'Client-owned Show delivered', isAlwaysOn: false, inApp: true, email: true },
    // Vendor task progress
    { id: 'vendor_accepted', category: 'vendor_tasks', label: 'Vendor accepted offer / self-assigned a task', isAlwaysOn: false, inApp: true, email: true },
    { id: 'vendor_started', category: 'vendor_tasks', label: 'Vendor started task (status → In Progress)', isAlwaysOn: false, inApp: true, email: true },
    { id: 'vendor_submitted', category: 'vendor_tasks', label: 'Vendor submitted task (status → Submitted)', isAlwaysOn: false, inApp: true, email: true },
    { id: 'vendor_blocker', category: 'vendor_tasks', label: 'Vendor flagged blocker', isAlwaysOn: true, inApp: true, email: true },
    { id: 'task_overdue_digest', category: 'vendor_tasks', label: 'Task overdue (daily digest, >24h)', isAlwaysOn: false, inApp: true, email: true },
    { id: 'task_complete', category: 'vendor_tasks', label: 'Task complete (status → Complete)', isAlwaysOn: false, inApp: true, email: true },
    { id: 'task_rework', category: 'vendor_tasks', label: 'Task sent back for rework (Submitted → In Progress)', isAlwaysOn: false, inApp: true, email: true },
    // Client-side task events
    { id: 'client_task_submitted', category: 'client_tasks', label: 'Client team member submitted a client task', isAlwaysOn: false, inApp: true, email: true },
    { id: 'client_review_approved', category: 'client_tasks', label: 'Client Review approved (task → Complete)', isAlwaysOn: false, inApp: true, email: true },
    { id: 'client_review_rejected', category: 'client_tasks', label: 'Client Review rejected / rework requested by client', isAlwaysOn: false, inApp: true, email: true },
    // Quotes
    { id: 'quote_sent', category: 'quotes', label: 'Quote sent to client (audit)', isAlwaysOn: false, inApp: true, email: true },
    { id: 'quote_approved', category: 'quotes', label: 'Quote approved by client', isAlwaysOn: false, inApp: true, email: true },
    { id: 'quote_rejected', category: 'quotes', label: 'Quote rejected / changes requested by client', isAlwaysOn: false, inApp: true, email: true },
    // Billing
    { id: 'invoice_sent', category: 'billing', label: 'Invoice sent to client', isAlwaysOn: false, inApp: true, email: true },
    { id: 'invoice_paid', category: 'billing', label: 'Invoice paid', isAlwaysOn: false, inApp: true, email: true },
    { id: 'invoice_overdue', category: 'billing', label: 'Invoice overdue (weekly digest, >30d)', isAlwaysOn: true, inApp: true, email: true },
    { id: 'vendor_payment_processed', category: 'billing', label: 'Vendor payment processed', isAlwaysOn: false, inApp: true, email: true },
    // System
    { id: 'editor_failure', category: 'system', label: 'Editor integration failure', isAlwaysOn: true, inApp: true, email: true },
    { id: 'services_catalog_updated', category: 'system', label: 'Services catalog updated', isAlwaysOn: false, inApp: true, email: true },
  ],

  // =============== PM ===============
  pm: [
    // Show lifecycle — NG-owned Shows (where I am assigned PM)
    { id: 'show_assigned_pm', category: 'shows_ng', label: 'New NG-owned Show assigned to me as PM', isAlwaysOn: true, inApp: true, email: true },
    { id: 'show_in_progress', category: 'shows_ng', label: 'Show moved to In Progress', isAlwaysOn: false, inApp: true, email: true },
    { id: 'tasks_added', category: 'shows_ng', label: 'New tasks added mid-Show by Admin/PM', description: 'No re-pricing — internal scope change', isAlwaysOn: false, inApp: true, email: true },
    { id: 'show_delivered', category: 'shows_ng', label: 'Show delivered (all tasks complete)', isAlwaysOn: false, inApp: true, email: true },
    // Vendor task progress (own Shows)
    { id: 'vendor_accepted', category: 'vendor_tasks', label: 'Vendor accepted offer / self-assigned a task', isAlwaysOn: false, inApp: true, email: true },
    { id: 'vendor_started', category: 'vendor_tasks', label: 'Vendor started task (status → In Progress)', isAlwaysOn: false, inApp: true, email: true },
    { id: 'vendor_submitted', category: 'vendor_tasks', label: 'Vendor submitted task (status → Submitted)', isAlwaysOn: false, inApp: true, email: true },
    { id: 'vendor_blocker', category: 'vendor_tasks', label: 'Vendor flagged blocker', isAlwaysOn: true, inApp: true, email: true },
    { id: 'task_overdue_digest', category: 'vendor_tasks', label: 'Task overdue (daily digest)', isAlwaysOn: false, inApp: true, email: true },
    { id: 'task_complete', category: 'vendor_tasks', label: 'Task complete (status → Complete)', isAlwaysOn: false, inApp: true, email: true },
    { id: 'task_rework', category: 'vendor_tasks', label: 'Task sent back for rework', isAlwaysOn: false, inApp: true, email: true },
    // Client-side task events (own Shows)
    { id: 'client_task_submitted', category: 'client_tasks', label: 'Client team member submitted a client task', isAlwaysOn: false, inApp: true, email: true },
    { id: 'client_review_approved', category: 'client_tasks', label: 'Client Review approved', isAlwaysOn: false, inApp: true, email: true },
    { id: 'client_review_rejected', category: 'client_tasks', label: 'Client Review rejected / rework requested by client', isAlwaysOn: true, inApp: true, email: true },
    // Quotes (own Shows)
    { id: 'quote_approved', category: 'quotes', label: 'Quote approved by client', isAlwaysOn: false, inApp: true, email: true },
    { id: 'quote_rejected', category: 'quotes', label: 'Quote rejected / changes requested by client', isAlwaysOn: true, inApp: true, email: true },
    // System
    { id: 'editor_failure', category: 'system', label: 'Editor integration failure', isAlwaysOn: true, inApp: true, email: true },
    { id: 'services_catalog_updated', category: 'system', label: 'Services catalog updated', isAlwaysOn: false, inApp: true, email: true },
  ],

  // =============== FINANCE ===============
  finance: [
    // Shows
    { id: 'show_delivered', category: 'shows_ng', label: 'Show delivered (revenue trigger)', isAlwaysOn: false, inApp: true, email: true },
    // Billing
    { id: 'invoice_sent', category: 'billing', label: 'Invoice sent to client', isAlwaysOn: false, inApp: true, email: true },
    { id: 'invoice_paid', category: 'billing', label: 'Invoice paid', isAlwaysOn: false, inApp: true, email: true },
    { id: 'invoice_overdue', category: 'billing', label: 'Invoice overdue (weekly digest, >30d)', isAlwaysOn: true, inApp: true, email: true },
    { id: 'vendor_payment_due', category: 'billing', label: 'Vendor payment due', isAlwaysOn: false, inApp: true, email: true },
    { id: 'vendor_payment_processed', category: 'billing', label: 'Vendor payment processed', isAlwaysOn: false, inApp: true, email: true },
  ],

  // =============== IT ===============
  it: [
    // System
    { id: 'editor_failure', category: 'system', label: 'Editor integration failure', isAlwaysOn: true, inApp: true, email: true },
    { id: 'services_catalog_updated', category: 'system', label: 'Services catalog updated', isAlwaysOn: false, inApp: true, email: true },
    { id: 'system_alert', category: 'system', label: 'System alert (auth failures, integration outages)', isAlwaysOn: true, inApp: true, email: true },
  ],

  // =============== VENDOR ===============
  // Update-001: All vendor work notifications are always-on
  vendor: [
    { id: 'task_assigned', category: 'tasks', label: 'Task assigned', isAlwaysOn: true, inApp: true, email: true },
    { id: 'task_rework', category: 'tasks', label: 'Rework requested (Submitted → In Progress)', isAlwaysOn: true, inApp: true, email: true },
    { id: 'task_offer', category: 'tasks', label: 'New task offer (Open for Offers)', isAlwaysOn: true, inApp: true, email: true },
    { id: 'offer_confirmation', category: 'tasks', label: 'Vendor self-assigned offer confirmation', isAlwaysOn: true, inApp: true, email: true },
    { id: 'payment_processed', category: 'billing', label: 'Payment processed (own pay)', isAlwaysOn: true, inApp: true, email: true },
  ],

  // =============== CLIENT (generic - not used directly, see sub-roles below) ===============
  client: [],

  // =============== CLIENT ADMIN ===============
  client_admin: [
    // Tasks — Client-owned Shows only
    { id: 'team_task_submitted', category: 'tasks', label: 'Team member submitted a task on our Show', isAlwaysOn: false, inApp: true, email: true },
    { id: 'team_task_overdue', category: 'tasks', label: 'Team member\'s task overdue', isAlwaysOn: false, inApp: true, email: true },
    // Show lifecycle — Client-owned Shows (Shows I created)
    { id: 'my_show_created', category: 'shows_client', label: 'New Show created (own action confirmation)', isAlwaysOn: false, inApp: true, email: true },
    { id: 'show_in_progress', category: 'shows_client', label: 'Show in progress milestone', isAlwaysOn: false, inApp: true, email: true },
    { id: 'show_delivered', category: 'shows_client', label: 'Show delivered', isAlwaysOn: true, inApp: true, email: true },
    // Re-pricing — Client-owned Shows only
    { id: 'repricing_required', category: 'shows_client', label: 'Re-pricing required: confirm new price before service is added', isAlwaysOn: true, inApp: true, email: true },
    { id: 'repricing_confirmed', category: 'shows_client', label: 'Re-pricing confirmed (own action confirmation)', isAlwaysOn: false, inApp: true, email: true },
    // Show lifecycle — NG-owned Shows (where I am client recipient)
    { id: 'ng_show_in_progress', category: 'shows_ng', label: 'Show in progress milestone', isAlwaysOn: false, inApp: true, email: true },
    { id: 'ng_show_delivered', category: 'shows_ng', label: 'Show delivered', isAlwaysOn: true, inApp: true, email: true },
    // Quotes
    { id: 'quote_received', category: 'quotes', label: 'Quote received from NG Broadcast', isAlwaysOn: true, inApp: true, email: true },
    { id: 'quote_approval_confirmation', category: 'quotes', label: 'Quote approval confirmation (own action)', isAlwaysOn: false, inApp: true, email: true },
    { id: 'quote_rejection_confirmation', category: 'quotes', label: 'Quote rejection confirmation (own action)', isAlwaysOn: false, inApp: true, email: true },
    // Billing
    { id: 'invoice_received', category: 'billing', label: 'Invoice received from NG Broadcast', isAlwaysOn: true, inApp: true, email: true },
    { id: 'invoice_payment_confirmation', category: 'billing', label: 'Invoice payment confirmation', isAlwaysOn: false, inApp: true, email: true },
    { id: 'invoice_overdue_reminder', category: 'billing', label: 'Invoice overdue reminder', isAlwaysOn: true, inApp: true, email: true },
  ],

  // =============== CLIENT TASK OWNER ===============
  task_owner: [
    { id: 'task_assigned', category: 'tasks', label: 'Task assigned to me', isAlwaysOn: true, inApp: true, email: true },
    { id: 'task_rework', category: 'tasks', label: 'Rework requested on my task', isAlwaysOn: true, inApp: true, email: true },
    { id: 'task_overdue', category: 'tasks', label: 'My task overdue', isAlwaysOn: false, inApp: true, email: true },
  ],

  // =============== CLIENT REVIEWER ===============
  reviewer: [
    { id: 'review_assigned', category: 'tasks', label: 'Task assigned for my review', isAlwaysOn: true, inApp: true, email: true },
    { id: 'review_rework', category: 'tasks', label: 'Rework requested on my review', isAlwaysOn: true, inApp: true, email: true },
    { id: 'review_overdue', category: 'tasks', label: 'My review task overdue', isAlwaysOn: false, inApp: true, email: true },
  ],

  // =============== CLIENT VIEWER ===============
  // Only universal account/security notifications
  viewer: [],
}

// Category order for display
const CATEGORY_ORDER = [
  'account',
  'shows_ng',
  'shows_client',
  'vendor_tasks',
  'client_tasks',
  'tasks',
  'quotes',
  'billing',
  'system',
]

export default function NotificationPreferencesPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  const isAdmin = currentRole === 'admin'
  
  // For demo, simulate client sub-role (would come from user context in real app)
  const [clientSubRole] = useState<ClientSubRole>('client_admin')
  
  // Determine effective role for notifications
  const effectiveRole = currentRole === 'client' ? clientSubRole : currentRole
  
  // Get role-specific notifications
  const roleNotifications = useMemo(() => {
    const roleSpecific = ROLE_NOTIFICATIONS[effectiveRole] || []
    return [...UNIVERSAL_NOTIFICATIONS, ...roleSpecific]
  }, [effectiveRole])
  
  // State for preferences
  const [preferences, setPreferences] = useState<Record<string, { inApp: boolean; email: boolean }>>(
    () => {
      const initial: Record<string, { inApp: boolean; email: boolean }> = {}
      roleNotifications.forEach(n => {
        initial[n.id] = { inApp: n.inApp, email: n.email }
      })
      return initial
    }
  )
  
  const [systemDefaults, setSystemDefaults] = useState<Record<string, { inApp: boolean; email: boolean }>>(
    () => {
      const initial: Record<string, { inApp: boolean; email: boolean }> = {}
      roleNotifications.forEach(n => {
        initial[n.id] = { inApp: n.inApp, email: n.email }
      })
      return initial
    }
  )
  
  const [recentlySaved, setRecentlySaved] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'personal' | 'system'>('personal')

  // Group by category in order
  const groupedPreferences = useMemo(() => {
    const grouped: Record<string, NotificationRow[]> = {}
    CATEGORY_ORDER.forEach(cat => {
      const prefs = roleNotifications.filter(p => p.category === cat)
      if (prefs.length > 0) {
        grouped[cat] = prefs
      }
    })
    return grouped
  }, [roleNotifications])

  const handleToggle = async (notifId: string, channel: 'inApp' | 'email', value: boolean) => {
    const notif = roleNotifications.find(n => n.id === notifId)
    if (!notif || notif.isAlwaysOn) return

    setPreferences(prev => ({
      ...prev,
      [notifId]: { ...prev[notifId], [channel]: value }
    }))

    setRecentlySaved(notifId)
    await new Promise(resolve => setTimeout(resolve, 300))
    setTimeout(() => setRecentlySaved(null), 1500)
  }

  const handleResetToDefaults = () => {
    const reset: Record<string, { inApp: boolean; email: boolean }> = {}
    roleNotifications.forEach(n => {
      reset[n.id] = { inApp: true, email: true }
    })
    setPreferences(reset)
    toast({
      title: 'Preferences reset',
      description: 'Notification preferences have been reset to defaults.',
    })
  }

  const handleToggleSystemDefault = async (notifId: string, channel: 'inApp' | 'email', value: boolean) => {
    const notif = roleNotifications.find(n => n.id === notifId)
    if (!notif || notif.isAlwaysOn) return

    setSystemDefaults(prev => ({
      ...prev,
      [notifId]: { ...prev[notifId], [channel]: value }
    }))

    setRecentlySaved(notifId)
    await new Promise(resolve => setTimeout(resolve, 300))
    setTimeout(() => setRecentlySaved(null), 1500)
  }

  const handleResetSystemDefaults = () => {
    const reset: Record<string, { inApp: boolean; email: boolean }> = {}
    roleNotifications.forEach(n => {
      reset[n.id] = { inApp: true, email: true }
    })
    setSystemDefaults(reset)
    toast({
      title: 'System defaults reset',
      description: 'System-wide notification defaults have been reset.',
    })
  }

  // Render notification row
  const renderNotificationRow = (
    notif: NotificationRow,
    prefs: { inApp: boolean; email: boolean },
    onToggle: (id: string, channel: 'inApp' | 'email', value: boolean) => void,
    showSaved: boolean
  ) => (
    <TableRow key={notif.id}>
      <TableCell>
        <div className="flex items-center gap-2">
          <div>
            <p className="font-medium text-sm">{notif.label}</p>
            {notif.description && (
              <p className="text-xs text-muted-foreground">{notif.description}</p>
            )}
          </div>
          {notif.isAlwaysOn && (
            <Tooltip>
              <TooltipTrigger>
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Critical notification - always enabled</p>
              </TooltipContent>
            </Tooltip>
          )}
          {showSaved && (
            <span className="flex items-center gap-1 text-xs text-green-600 animate-in fade-in">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        {notif.isAlwaysOn ? (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Always on
          </Badge>
        ) : (
          <Switch
            checked={prefs.inApp}
            onCheckedChange={(checked) => onToggle(notif.id, 'inApp', checked)}
          />
        )}
      </TableCell>
      <TableCell className="text-center">
        {notif.isAlwaysOn ? (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Always on
          </Badge>
        ) : (
          <Switch
            checked={prefs.email}
            onCheckedChange={(checked) => onToggle(notif.id, 'email', checked)}
          />
        )}
      </TableCell>
    </TableRow>
  )

  // Render category card
  const renderCategoryCard = (
    category: string,
    notifications: NotificationRow[],
    prefsMap: Record<string, { inApp: boolean; email: boolean }>,
    onToggle: (id: string, channel: 'inApp' | 'email', value: boolean) => void,
    isSystemDefaults = false
  ) => (
    <Card key={`${isSystemDefaults ? 'system-' : ''}${category}`}>
      <CardHeader className="pb-0">
        <CardTitle className="text-base">{categoryLabels[category]}</CardTitle>
        {isSystemDefaults && (
          <CardDescription>Default settings for new users</CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-4 py-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Notification</TableHead>
              <TableHead className="text-center w-[25%]">
                <div className="flex items-center justify-center gap-1">
                  <Bell className="h-4 w-4" />
                  In-app
                </div>
              </TableHead>
              <TableHead className="text-center w-[25%]">
                <div className="flex items-center justify-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((notif) => 
              renderNotificationRow(
                notif,
                prefsMap[notif.id] || { inApp: true, email: true },
                onToggle,
                recentlySaved === notif.id
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  // Role display name
  const roleDisplayName = useMemo(() => {
    const names: Record<string, string> = {
      admin: 'Administrator',
      pm: 'Project Manager',
      finance: 'Finance',
      it: 'IT',
      vendor: 'Vendor',
      client: 'Client',
      client_admin: 'Client Admin',
      task_owner: 'Client Task Owner',
      reviewer: 'Client Reviewer',
      viewer: 'Client Viewer',
    }
    return names[effectiveRole] || effectiveRole
  }, [effectiveRole])

  return (
    <TooltipProvider>
      <div className="p-6 max-w-4xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Notification Preferences</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure how you receive notifications. Changes are saved automatically.
          </p>
        </div>

        {/* Role Info Badge */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Viewing preferences for: {roleDisplayName}</p>
                <p className="text-muted-foreground">
                  You only see notification types relevant to your role.
                  {currentRole === 'vendor' && (
                    <span className="block mt-1 text-amber-600">
                      All work-critical notifications are always enabled for vendors.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin: Show tabs for personal vs system-wide defaults */}
        {isAdmin ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'personal' | 'system')} className="space-y-6">
            <TabsList>
              <TabsTrigger value="personal" className="gap-1.5">
                <Bell className="h-4 w-4" />
                My Preferences
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-1.5">
                <Settings className="h-4 w-4" />
                System Defaults
              </TabsTrigger>
            </TabsList>

            {/* Personal Preferences Tab */}
            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Channel Options</p>
                      <p className="text-muted-foreground">
                        <strong>In-app:</strong> Notifications appear in the Notification Center.
                        <br />
                        <strong>Email:</strong> Notifications are sent to your registered email address.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {Object.entries(groupedPreferences).map(([category, notifs]) =>
                renderCategoryCard(category, notifs, preferences, handleToggle)
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={handleResetToDefaults}>
                  Reset to Defaults
                </Button>
              </div>
            </TabsContent>

            {/* System-Wide Defaults Tab (Admin Only) */}
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">System-Wide Notification Defaults</p>
                      <p className="text-muted-foreground">
                        Configure the default notification settings for all new users.
                        Existing users can override these in their personal preferences.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {Object.entries(groupedPreferences).map(([category, notifs]) =>
                renderCategoryCard(category, notifs, systemDefaults, handleToggleSystemDefault, true)
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={handleResetSystemDefaults}>
                  Reset System Defaults
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // Non-admin view: Personal preferences only
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Channel Options</p>
                    <p className="text-muted-foreground">
                      <strong>In-app:</strong> Notifications appear in the Notification Center.
                      <br />
                      <strong>Email:</strong> Notifications are sent to your registered email address.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {Object.entries(groupedPreferences).map(([category, notifs]) =>
              renderCategoryCard(category, notifs, preferences, handleToggle)
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleResetToDefaults}>
                Reset to Defaults
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

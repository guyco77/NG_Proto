'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Power,
  Loader2,
  XCircle,
  Settings2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { mockUsers } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { DashboardRefresh } from '@/components/dashboard-refresh'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

/**
 * Update-002: Integration type with all required fields
 */
interface Integration {
  id: string
  name: string
  description: string
  status: 'connected' | 'disconnected' | 'error'
  lastSyncTime: string | null
  lastSyncResult: 'success' | 'failed' | null
  lastSyncError?: string
  connectedBy: string
  connectedOn: string
  canManualSync: boolean
  settingsPath?: string
}

/**
 * Update-002: Mock data for all connected integrations
 */
const mockIntegrations: Integration[] = [
  {
    id: 'editor',
    name: 'Editor',
    description: 'Video editing platform integration',
    status: 'connected',
    lastSyncTime: '2 min ago',
    lastSyncResult: 'success',
    connectedBy: 'Tom Tech',
    connectedOn: '2025-01-15',
    canManualSync: true,
    settingsPath: '/settings/editor-integration',
  },
  {
    id: 'icount',
    name: 'iCount',
    description: 'Billing and invoicing system',
    status: 'connected',
    lastSyncTime: '15 min ago',
    lastSyncResult: 'success',
    connectedBy: 'Sarah Admin',
    connectedOn: '2024-11-20',
    canManualSync: true,
    settingsPath: '/settings/billing',
  },
  {
    id: 'meckano',
    name: 'Meckano',
    description: 'Vendor hours and payments sync',
    status: 'connected',
    lastSyncTime: '1 hour ago',
    lastSyncResult: 'success',
    connectedBy: 'Sarah Admin',
    connectedOn: '2024-11-20',
    canManualSync: true,
    settingsPath: '/settings/billing',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Email notifications delivery',
    status: 'connected',
    lastSyncTime: '5 min ago',
    lastSyncResult: 'success',
    connectedBy: 'Tom Tech',
    connectedOn: '2024-10-05',
    canManualSync: false,
    settingsPath: '/settings/email-templates',
  },
  {
    id: 'supabase',
    name: 'Supabase Auth',
    description: 'Authentication and user management',
    status: 'connected',
    lastSyncTime: null, // Always-on service
    lastSyncResult: null,
    connectedBy: 'System',
    connectedOn: '2024-09-01',
    canManualSync: false,
  },
  {
    id: 'storage',
    name: 'Cloud Storage',
    description: 'File and asset storage',
    status: 'error',
    lastSyncTime: '3 hours ago',
    lastSyncResult: 'failed',
    lastSyncError: 'Authentication token expired',
    connectedBy: 'Tom Tech',
    connectedOn: '2024-12-01',
    canManualSync: true,
  },
]

export function ITDashboard() {
  const { toast } = useToast()
  const [includeInactive, setIncludeInactive] = useState(false)
  
  // Update-002: Integration management state
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [disconnectDialog, setDisconnectDialog] = useState<{ open: boolean; integration: Integration | null }>({
    open: false,
    integration: null,
  })

  // Calculate users by role
  const allUsers = mockUsers
  const usersByRole = {
    admin: allUsers.filter((u) => u.role === 'admin').length,
    pm: allUsers.filter((u) => u.role === 'pm').length,
    client: allUsers.filter((u) => u.role === 'client').length,
    vendor: allUsers.filter((u) => u.role === 'vendor').length,
    finance: allUsers.filter((u) => u.role === 'finance').length,
    it: allUsers.filter((u) => u.role === 'it').length,
  }

  // With inactive users toggle
  const displayedUsersByRole = includeInactive
    ? {
        admin: usersByRole.admin + 1,
        pm: usersByRole.pm,
        client: usersByRole.client + 1,
        vendor: usersByRole.vendor + 1,
        finance: usersByRole.finance,
        it: usersByRole.it,
      }
    : usersByRole

  const maxRoleCount = Math.max(...Object.values(displayedUsersByRole))

  // Mock active sessions
  const activeSessions = 24

  // Recent audit events
  const auditEvents = [
    { id: 'ae1', actor: 'Sarah Admin', action: 'user_role_changed', target: 'Mike Manager → PM', timestamp: '10 min ago' },
    { id: 'ae2', actor: 'System', action: 'show_created', target: 'Netflix Q2 Localization', timestamp: '1h ago' },
    { id: 'ae3', actor: 'Tom Tech', action: 'quote_sent', target: 'Q-2024-043', timestamp: '2h ago' },
    { id: 'ae4', actor: 'Finance', action: 'vendor_payable_approved', target: 'Maria Garcia - $450', timestamp: '3h ago' },
    { id: 'ae5', actor: 'System', action: 'invoice_paid', target: 'INV-2024-091', timestamp: '5h ago' },
    { id: 'ae6', actor: 'Noa PM', action: 'task_assigned', target: 'Carlos R. - Translation PT', timestamp: '6h ago' },
    { id: 'ae7', actor: 'Carlos R.', action: 'task_completed', target: 'HBO Max - Subtitling', timestamp: '8h ago' },
    { id: 'ae8', actor: 'Sarah Admin', action: 'show_status_changed', target: 'Training Vol. 2 → Complete', timestamp: '1d ago' },
    { id: 'ae9', actor: 'Client', action: 'quote_approved', target: 'Q-2024-040', timestamp: '1d ago' },
    { id: 'ae10', actor: 'Finance', action: 'vendor_payable_paid', target: 'John D. - $380', timestamp: '2d ago' },
  ]

  const roleColors: Record<string, string> = {
    admin: 'bg-[#ef4444]',
    pm: 'bg-[#f59e0b]',
    client: 'bg-[#3b82f6]',
    vendor: 'bg-[#10b981]',
    finance: 'bg-[#8b5cf6]',
    it: 'bg-[#6366f1]',
  }
  
  // Update-002: Handle manual sync
  const handleManualSync = async (integrationId: string) => {
    setSyncingId(integrationId)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const success = Math.random() > 0.2 // 80% success rate for demo
    
    setIntegrations(prev => prev.map(integration => {
      if (integration.id === integrationId) {
        return {
          ...integration,
          lastSyncTime: 'Just now',
          lastSyncResult: success ? 'success' : 'failed',
          lastSyncError: success ? undefined : 'Connection timeout',
          status: success ? 'connected' : 'error',
        }
      }
      return integration
    }))
    
    toast({
      title: success ? 'Sync completed' : 'Sync failed',
      description: success 
        ? `${integrations.find(i => i.id === integrationId)?.name} synced successfully.`
        : 'Please check the integration settings.',
      variant: success ? 'default' : 'destructive',
    })
    
    setSyncingId(null)
  }
  
  // Update-002: Handle reconnect
  const handleReconnect = async (integrationId: string) => {
    setSyncingId(integrationId)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIntegrations(prev => prev.map(integration => {
      if (integration.id === integrationId) {
        return {
          ...integration,
          status: 'connected',
          lastSyncTime: 'Just now',
          lastSyncResult: 'success',
          lastSyncError: undefined,
        }
      }
      return integration
    }))
    
    toast({
      title: 'Integration reconnected',
      description: `${integrations.find(i => i.id === integrationId)?.name} is now connected.`,
    })
    
    setSyncingId(null)
  }
  
  // Update-002: Handle disconnect
  const handleDisconnect = async () => {
    if (!disconnectDialog.integration) return
    
    const integrationId = disconnectDialog.integration.id
    
    setIntegrations(prev => prev.map(integration => {
      if (integration.id === integrationId) {
        return {
          ...integration,
          status: 'disconnected',
          lastSyncTime: null,
          lastSyncResult: null,
        }
      }
      return integration
    }))
    
    toast({
      title: 'Integration disconnected',
      description: `${disconnectDialog.integration.name} has been disconnected.`,
    })
    
    setDisconnectDialog({ open: false, integration: null })
  }
  
  // Update-002: Count integrations by status
  const connectedCount = integrations.filter(i => i.status === 'connected').length
  const errorCount = integrations.filter(i => i.status === 'error').length

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">System health view</p>
        </div>
        <DashboardRefresh />
      </div>

      {/* Users by Role & Active Sessions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Users by Role */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Users by Role</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-inactive"
                checked={includeInactive}
                onCheckedChange={(checked) => setIncludeInactive(checked === true)}
              />
              <label
                htmlFor="include-inactive"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Include inactive users
              </label>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="space-y-4">
              {Object.entries(displayedUsersByRole).map(([role, count]) => (
                <div key={role} className="flex items-center gap-4">
                  <span className="w-16 text-sm font-medium capitalize">{role}</span>
                  <div className="flex-1 h-8 bg-muted rounded overflow-hidden">
                    <div
                      className={cn('h-full transition-all', roleColors[role])}
                      style={{ width: `${(count / maxRoleCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm font-semibold text-right">{count}</span>
                </div>
              ))}
            </div>
            <Link href="/users">
              <Button variant="outline" className="w-full mt-4 gap-2">
                Manage Users
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <div>
          <Link href="/users">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Activity className="h-4 w-4" />
                  Active Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <p className="text-4xl font-bold text-foreground">{activeSessions}</p>
                <p className="text-sm text-muted-foreground mt-1">Click to view session list</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
      
      {/* Update-002: All Connected Integrations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Connected Integrations
            </CardTitle>
            <CardDescription className="mt-1">
              {connectedCount} connected{errorCount > 0 && `, ${errorCount} with errors`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2">
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className={cn(
                  'flex items-center gap-4 rounded-lg border p-4',
                  integration.status === 'connected' && 'border-border',
                  integration.status === 'error' && 'border-destructive/30 bg-destructive/5',
                  integration.status === 'disconnected' && 'border-muted bg-muted/30'
                )}
              >
                {/* Status Icon */}
                <div className="shrink-0">
                  {integration.status === 'connected' && (
                    <CheckCircle2 className="h-6 w-6 text-[#10b981]" />
                  )}
                  {integration.status === 'error' && (
                    <XCircle className="h-6 w-6 text-destructive" />
                  )}
                  {integration.status === 'disconnected' && (
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                
                {/* Integration Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{integration.name}</span>
                    <Badge
                      variant={
                        integration.status === 'connected' ? 'default' :
                        integration.status === 'error' ? 'destructive' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {integration.status === 'connected' && 'Connected'}
                      {integration.status === 'error' && 'Error'}
                      {integration.status === 'disconnected' && 'Disconnected'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{integration.description}</p>
                  
                  {/* Sync Info */}
                  {integration.lastSyncTime && (
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last sync: {integration.lastSyncTime}
                      </span>
                      {integration.lastSyncResult && (
                        <span className={cn(
                          'flex items-center gap-1',
                          integration.lastSyncResult === 'success' ? 'text-[#10b981]' : 'text-destructive'
                        )}>
                          {integration.lastSyncResult === 'success' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {integration.lastSyncResult === 'success' ? 'Success' : 'Failed'}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Error Message */}
                  {integration.lastSyncError && (
                    <p className="text-xs text-destructive mt-1">{integration.lastSyncError}</p>
                  )}
                  
                  {/* Connected By/On */}
                  <p className="text-xs text-muted-foreground mt-1">
                    Connected by {integration.connectedBy} on {integration.connectedOn}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {integration.status === 'error' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReconnect(integration.id)}
                      disabled={syncingId === integration.id}
                    >
                      {syncingId === integration.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span className="ml-1">Reconnect</span>
                    </Button>
                  )}
                  
                  {integration.canManualSync && integration.status === 'connected' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleManualSync(integration.id)}
                      disabled={syncingId === integration.id}
                    >
                      {syncingId === integration.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span className="ml-1 sr-only">Sync</span>
                    </Button>
                  )}
                  
                  {integration.settingsPath && (
                    <Link href={integration.settingsPath}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                        <span className="ml-1 sr-only">Settings</span>
                      </Button>
                    </Link>
                  )}
                  
                  {integration.status !== 'disconnected' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDisconnectDialog({ open: true, integration })}
                    >
                      <Power className="h-4 w-4" />
                      <span className="ml-1 sr-only">Disconnect</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Audit Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Recent Audit Events</CardTitle>
          <Link href="/users?tab=audit">
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2">
          <div className="space-y-2">
            {auditEvents.slice(0, 10).map((event) => (
              <Link key={event.id} href="/users?tab=audit">
                <div className="flex items-center gap-4 rounded-lg border border-border p-3 hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{event.actor}</span>
                      <span className="text-sm text-muted-foreground">
                        {event.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{event.target}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{event.timestamp}</span>
                </div>
              </Link>
            ))}
          </div>
          {auditEvents.length > 10 && (
            <Button variant="ghost" size="sm" className="w-full mt-3 gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
      
      {/* Update-002: Disconnect Confirmation Dialog */}
      <AlertDialog open={disconnectDialog.open} onOpenChange={(open) => setDisconnectDialog({ open, integration: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {disconnectDialog.integration?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect the {disconnectDialog.integration?.name} integration. 
              You can reconnect it later from the settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

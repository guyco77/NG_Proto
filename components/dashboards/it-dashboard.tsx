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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { mockUsers } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { DashboardRefresh } from '@/components/dashboard-refresh'

export function ITDashboard() {
  const [includeInactive, setIncludeInactive] = useState(false)

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
  const inactiveUsers = 3 // Mock
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

  const totalDisplayedUsers = Object.values(displayedUsersByRole).reduce((a, b) => a + b, 0)
  const maxRoleCount = Math.max(...Object.values(displayedUsersByRole))

  // Mock active sessions
  const activeSessions = 24

  // Editor integration status
  const editorStatus = {
    connected: true,
    lastSync: '2 min ago',
    lastSuccessfulSync: '2 min ago',
  }

  // Recent audit events
  const auditEvents = [
    { id: 'ae1', actor: 'Sarah Admin', action: 'user_role_changed', target: 'Mike Manager → PM', timestamp: '10 min ago' },
    { id: 'ae2', actor: 'System', action: 'project_created', target: 'Netflix Q2 Localization', timestamp: '1h ago' },
    { id: 'ae3', actor: 'Tom Tech', action: 'quote_sent', target: 'Q-2024-043', timestamp: '2h ago' },
    { id: 'ae4', actor: 'Finance', action: 'vendor_payable_approved', target: 'Maria Garcia - $450', timestamp: '3h ago' },
    { id: 'ae5', actor: 'System', action: 'invoice_paid', target: 'INV-2024-091', timestamp: '5h ago' },
    { id: 'ae6', actor: 'Noa PM', action: 'task_assigned', target: 'Carlos R. - Translation PT', timestamp: '6h ago' },
    { id: 'ae7', actor: 'Carlos R.', action: 'task_completed', target: 'HBO Max - Subtitling', timestamp: '8h ago' },
    { id: 'ae8', actor: 'Sarah Admin', action: 'project_status_changed', target: 'Training Vol. 2 → Complete', timestamp: '1d ago' },
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

      

      {/* Users by Role & Editor Status */}
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

        {/* Sidebar - Active Sessions & Editor Status */}
        <div className="space-y-6">
          {/* Active Sessions */}
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

          {/* Editor Integration Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Editor Integration</CardTitle>
            </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className={cn(
              'flex items-center gap-3 rounded-lg border p-4',
              editorStatus.connected
                ? 'border-[#10b981]/30 bg-[#10b981]/5'
                : 'border-destructive/30 bg-destructive/5'
            )}>
              {editorStatus.connected ? (
                <CheckCircle2 className="h-8 w-8 text-[#10b981]" />
              ) : (
                <AlertCircle className="h-8 w-8 text-destructive" />
              )}
              <div>
                <p className={cn(
                  'font-semibold',
                  editorStatus.connected ? 'text-[#10b981]' : 'text-destructive'
                )}>
                  {editorStatus.connected ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Last sync: {editorStatus.lastSync}
                </p>
              </div>
            </div>
            {!editorStatus.connected && (
              <Link href="/settings/editor-integration">
                <Button variant="outline" className="w-full mt-3 gap-2">
                  Check Settings
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Managed jointly by IT and Editor developer
            </p>
          </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  )
}

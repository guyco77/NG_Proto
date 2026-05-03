'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  AlertTriangle,
  ArrowRight,
  MoreHorizontal,
  Plus,
  Bell,
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  User,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/status-badge'
import {
  mockProjects,
  mockTasks,
  formatCurrency,
  formatDate,
} from '@/lib/mock-data'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DashboardRefresh } from '@/components/dashboard-refresh'

// Mock data for billing flags
const billingFlags = [
  { id: 'bf1', type: 'unpaid', label: 'Unpaid invoice >30 days', client: 'Acme Corp', amount: 15000, days: 45, link: '/finance?tab=invoices&filter=overdue' },
  { id: 'bf2', type: 'expiring', label: 'Quote expiring', project: 'Netflix Q1', expiresIn: 7, link: '/quotes?filter=expiring' },
  { id: 'bf3', type: 'vendor', label: 'Pending vendor payment', vendor: 'Maria Garcia', amount: 2500, link: '/finance?tab=payables' },
]

// Mock activity feed - only workspace events, no auth events
const activityFeed = [
  { id: 'a1', type: 'show_created', actor: 'Noa PM', target: 'Breaking News Coverage', time: '10 min ago' },
  { id: 'a2', type: 'task_completed', actor: 'Carlos R.', target: 'Translation (PT)', time: '1h ago' },
  { id: 'a3', type: 'quote_sent', actor: 'System', target: 'Q-2024-042', time: '2h ago' },
  { id: 'a4', type: 'invoice_paid', actor: 'Acme Corp', target: 'INV-2024-089', time: '3h ago' },
  { id: 'a5', type: 'vendor_payable_approved', actor: 'Finance', target: 'Maria Garcia', time: '5h ago' },
  { id: 'a6', type: 'task_assigned', actor: 'Noa PM', target: 'Subtitling ES', time: '6h ago' },
  { id: 'a7', type: 'quote_approved', actor: 'Netflix Inc.', target: 'Q-2024-041', time: '8h ago' },
  { id: 'a8', type: 'show_status_changed', actor: 'System', target: 'HBO Max Documentary', time: '12h ago' },
  { id: 'a9', type: 'user_role_changed', actor: 'Admin', target: 'Lisa Translator', time: '1d ago' },
  { id: 'a10', type: 'invoice_sent', actor: 'Finance', target: 'INV-2024-092', time: '1d ago' },
]

// Mock system alerts
const systemAlerts = [
  { id: 's1', level: 'warning', message: 'Editor sync delayed by 5 min', time: '15 min ago', link: '/settings?tab=integrations' },
  { id: 's2', level: 'info', message: 'Email rate limit reached (95%)', time: '1h ago', link: '/settings?tab=notifications' },
]

// Mock new notes
const newNotes = [
  { id: 'n1', from: 'Client', projectId: 'p1', project: 'Netflix Q1', message: 'Need urgent update on delivery', time: '1h ago' },
  { id: 'n2', from: 'Vendor', projectId: 'p3', project: 'HBO Max', message: 'File format question', time: '3h ago' },
  { id: 'n3', from: 'Finance', projectId: 'p2', project: 'Disney+', message: 'Budget approval needed', time: '5h ago' },
]

// Pagination constants per Cross-Cutting rules
const ITEMS_PER_PAGE = 10

export function AdminDashboard() {
  const [projectPage, setProjectPage] = useState(0)
  const [overdueTaskPage, setOverdueTaskPage] = useState(0)
  const [activityPage, setActivityPage] = useState(0)
  
  const activeProjects = mockProjects.filter((p) => p.status === 'in_progress')
  const overdueTasks = mockTasks.filter((t) => {
    const dueDate = new Date(t.dueDate)
    return t.status !== 'completed' && dueDate < new Date()
  })
  
  // Paginated data
  const paginatedProjects = activeProjects.slice(projectPage * ITEMS_PER_PAGE, (projectPage + 1) * ITEMS_PER_PAGE)
  const paginatedOverdueTasks = overdueTasks.slice(overdueTaskPage * ITEMS_PER_PAGE, (overdueTaskPage + 1) * ITEMS_PER_PAGE)
  const paginatedActivity = activityFeed.slice(activityPage * ITEMS_PER_PAGE, (activityPage + 1) * ITEMS_PER_PAGE)

  // Get task counts for a project
  const getTaskSummary = (projectId: string) => {
    const projectTasks = mockTasks.filter(t => t.projectId === projectId)
    const completedTasks = projectTasks.filter(t => t.status === 'completed')
    return { completed: completedTasks.length, total: projectTasks.length }
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header with CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Full operations overview</p>
        </div>
        <div className="flex items-center gap-3">
          <DashboardRefresh />
          <Link href="/projects/new" prefetch={true}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Show
            </Button>
          </Link>
        </div>
      </div>



      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Projects */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              Active Shows
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {activeProjects.length}
              </span>
            </CardTitle>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="flex flex-col gap-4">
              {paginatedProjects.map((project) => {
                const taskSummary = getTaskSummary(project.id)
                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="flex items-center gap-4 rounded-lg border border-border p-4 hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">{project.name}</h4>
                            <p className="text-sm text-muted-foreground">{project.client}</p>
                          </div>
                          <StatusBadge status={project.status} />
                        </div>
                        
                        {/* PM, Deadline, Progress Row */}
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{project.pm || 'Noa'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{formatDate(project.deadline)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">{project.progress}%</span>
                          </div>
                        </div>
                        
                        {/* Task Summary Row */}
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Progress value={project.progress} className="h-2" />
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {taskSummary.completed}/{taskSummary.total} tasks
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.id}`}>Edit Show</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/tasks?project=${project.id}`}>View Tasks</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Link>
                )
              })}
              {activeProjects.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">No active projects yet.</p>
              )}
            </div>
            
            {/* Pagination */}
            {activeProjects.length > ITEMS_PER_PAGE && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Showing {projectPage * ITEMS_PER_PAGE + 1}-{Math.min((projectPage + 1) * ITEMS_PER_PAGE, activeProjects.length)} of {activeProjects.length}
                </span>
                <div className="flex gap-2">
                  {projectPage > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setProjectPage(p => p - 1)}>
                      Previous
                    </Button>
                  )}
                  {(projectPage + 1) * ITEMS_PER_PAGE < activeProjects.length && (
                    <Button variant="outline" size="sm" onClick={() => setProjectPage(p => p + 1)}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Overdue Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Overdue Tasks
              </CardTitle>
              <Link href="/tasks?filter=overdue">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="flex flex-col gap-3">
                {paginatedOverdueTasks.slice(0, 5).map((task) => {
                  const dueDate = new Date(task.dueDate)
                  const daysOverdue = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3 hover:border-destructive/50 transition-colors cursor-pointer">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{task.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.projectName} {task.assignedVendor && `· ${task.assignedVendor}`}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-destructive">{daysOverdue}d overdue</span>
                      </div>
                    </Link>
                  )
                })}
                {overdueTasks.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No overdue tasks — everything&apos;s on track
                  </p>
                )}
              </div>
              {overdueTasks.length > 5 && (
                <div className="mt-3 flex justify-end">
                  <Link href="/tasks?filter=overdue">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Flags */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <DollarSign className="h-4 w-4 text-[#f59e0b]" />
                Billing Flags
              </CardTitle>
              <Link href="/billing">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="flex flex-col gap-3">
                {billingFlags.map((flag) => (
                  <Link key={flag.id} href={flag.link}>
                    <div className="flex items-center justify-between rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-3 hover:border-[#f59e0b]/50 transition-colors cursor-pointer">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{flag.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {flag.client || flag.project || flag.vendor}
                        </p>
                      </div>
                      {flag.amount && (
                        <span className="text-sm font-semibold">{formatCurrency(flag.amount)}</span>
                      )}
                      {flag.expiresIn && (
                        <span className="text-xs font-medium text-[#f59e0b]">{flag.expiresIn}d left</span>
                      )}
                    </div>
                  </Link>
                ))}
                {billingFlags.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No billing flags right now.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Notes, System Alerts, Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* New Notes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Bell className="h-4 w-4" />
              New Notes
              {newNotes.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {newNotes.length}
                </span>
              )}
            </CardTitle>
            <Link href="/projects?tab=notes">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="flex flex-col gap-3">
              {newNotes.map((note) => (
                <Link key={note.id} href={`/projects/${note.projectId}?tab=notes`}>
                  <div className="rounded-lg border border-border p-3 hover:border-primary/30 hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{note.project}</p>
                      <span className="text-xs text-muted-foreground">{note.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{note.from}:</span> {note.message}
                    </p>
                  </div>
                </Link>
              ))}
              {newNotes.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No unread notes.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <AlertCircle className="h-4 w-4" />
              System Alerts
            </CardTitle>
            <Link href="/monitoring">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="flex flex-col gap-3">
              {systemAlerts.map((alert) => (
                <Link key={alert.id} href={alert.link}>
                  <div className={`flex items-start gap-3 rounded-lg border p-3 hover:border-primary/50 transition-colors cursor-pointer ${
                    alert.level === 'error'
                      ? 'border-destructive/30 bg-destructive/5'
                      : alert.level === 'warning'
                      ? 'border-[#f59e0b]/30 bg-[#f59e0b]/5'
                      : 'border-border'
                  }`}>
                    <AlertCircle className={`h-4 w-4 mt-0.5 ${
                      alert.level === 'error' ? 'text-destructive' : alert.level === 'warning' ? 'text-[#f59e0b]' : 'text-muted-foreground'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                    </div>
                  </div>
                </Link>
              ))}
              {systemAlerts.length === 0 && (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                  <p className="text-sm text-muted-foreground">All systems running smoothly.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Global Activity Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="h-4 w-4" />
              Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="flex flex-col gap-3">
              {paginatedActivity.slice(0, 6).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 text-sm">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted shrink-0">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">
                      <span className="font-medium">{activity.actor}</span>
                      <span className="text-muted-foreground"> {activity.type.replace(/_/g, ' ')} </span>
                      <span className="font-medium">{activity.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            {activityFeed.length > 6 && (
              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" className="gap-1">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              This Month
            </Button>
            <Button variant="ghost" size="sm">
              This Quarter
            </Button>
            <Button variant="ghost" size="sm">
              This Year
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2">
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
            <div className="text-center">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">Revenue chart will be displayed here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

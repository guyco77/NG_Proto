'use client'

import { Activity, AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useRole } from '../layout'

const slaMetrics = [
  { label: 'Overall SLA Compliance', value: 94, target: 95, trend: 'up' },
  { label: 'On-Time Delivery', value: 92, target: 90, trend: 'up' },
  { label: 'Quality Score', value: 97, target: 95, trend: 'up' },
  { label: 'Client Response Time', value: 88, target: 90, trend: 'down' },
]

const activeAlerts = [
  {
    type: 'warning',
    title: 'SLA at Risk',
    description: 'Breaking News Coverage - Timing task approaching deadline',
    time: '15 min ago',
  },
  {
    type: 'info',
    title: 'Resource Bottleneck',
    description: '3 unassigned jobs pending vendor assignment',
    time: '1 hour ago',
  },
  {
    type: 'success',
    title: 'Milestone Reached',
    description: 'Training Series Vol. 2 completed translation phase',
    time: '2 hours ago',
  },
]

const projectHealth = [
  { name: 'Product Launch Campaign', health: 65, status: 'on_track', tasks: 12, completed: 8 },
  { name: 'Breaking News Coverage', health: 30, status: 'at_risk', tasks: 8, completed: 2 },
  { name: 'Training Series Vol. 2', health: 90, status: 'on_track', tasks: 10, completed: 9 },
]

export default function MonitoringPage() {
  const { currentRole } = useRole()
  const canAccess = currentRole === 'admin' || currentRole === 'it'

  if (!canAccess) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 p-6">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground">You don&apos;t have permission to view this page.</p>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Monitoring</h1>
        <p className="text-sm text-muted-foreground mt-1">Track SLAs, project health, and system alerts</p>
      </div>

      {/* SLA Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        {slaMetrics.map((metric, index) => (
          <Card key={index} className="border border-border">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-[#10b981]" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-[#f43f5e]" />
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-foreground">{metric.value}%</span>
                <span className="text-sm text-muted-foreground">/ {metric.target}% target</span>
              </div>
              <Progress
                value={metric.value}
                className={cn(
                  'mt-3 h-1.5',
                  metric.value >= metric.target ? '[&>div]:bg-[#10b981]' : '[&>div]:bg-[#f59e0b]'
                )}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Alerts */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeAlerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3 rounded-lg border border-border p-3">
                {alert.type === 'warning' && (
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-[#f59e0b]" />
                )}
                {alert.type === 'info' && <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />}
                {alert.type === 'success' && (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#10b981]" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{alert.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Project Health Overview */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-base">Project Health Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectHealth.map((project, index) => (
              <div key={index} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">{project.name}</h4>
                  <span
                    className={cn(
                      'flex items-center gap-1 text-sm font-medium',
                      project.status === 'on_track' ? 'text-[#10b981]' : 'text-[#f43f5e]'
                    )}
                  >
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        project.status === 'on_track' ? 'bg-[#10b981]' : 'bg-[#f43f5e]'
                      )}
                    />
                    {project.health}%
                  </span>
                </div>
                <Progress
                  value={project.health}
                  className={cn(
                    'mt-2 h-1.5',
                    project.status === 'on_track' ? '[&>div]:bg-[#10b981]' : '[&>div]:bg-[#f43f5e]'
                  )}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {project.completed}/{project.tasks} tasks completed
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

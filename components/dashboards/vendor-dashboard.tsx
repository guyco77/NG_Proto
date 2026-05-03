'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ListTodo,
  DollarSign,
  Clock,
  CheckCircle2,
  ArrowRight,
  Play,
  FileCheck,
  Inbox,
  Calendar,
  AlertTriangle,
  Sparkles,
  Mic,
  Languages,
  FileText,
  CalendarDays,
} from 'lucide-react'
import { OpenInEditorButton } from '@/components/open-in-editor-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/stats-card'
import { StatusBadge } from '@/components/status-badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  mockTasks,
  mockVendorPayables,
  formatCurrency,
  formatDate,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { DashboardRefresh } from '@/components/dashboard-refresh'

// UPDATE-004: Period filter options
const PERIOD_OPTIONS = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last year' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom' },
]

// Task type icon configuration
const taskTypeIcons: Record<string, React.ElementType> = {
  'Translation': Languages,
  'Transcription': Mic,
  'Review': CheckCircle2,
  'Subtitling': FileText,
}

// Newly accepted assignment from task offer
interface NewlyAcceptedAssignment {
  id: string
  name: string
  projectName: string
  taskType: string
  languagePair: string
  dueDate: string
  acceptedAt: Date
}

export function VendorDashboard() {
  const [acceptedOffers, setAcceptedOffers] = useState<string[]>([])
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [animatingOutId, setAnimatingOutId] = useState<string | null>(null)
  const [newlyAcceptedAssignments, setNewlyAcceptedAssignments] = useState<NewlyAcceptedAssignment[]>([])
  const { toast } = useToast()
  
  // UPDATE-004: Period filter state
  const [periodFilter, setPeriodFilter] = useState('30')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)

  const handleAcceptOffer = async (offer: typeof taskOffers[0]) => {
    setAcceptingId(offer.id)
    
    // Start exit animation
    setTimeout(() => {
      setAnimatingOutId(offer.id)
    }, 200)
    
    // After animation, update state
    setTimeout(() => {
      setAcceptedOffers(prev => [...prev, offer.id])
      
      // Add to newly accepted assignments at top
      const newAssignment: NewlyAcceptedAssignment = {
        id: `new-${offer.id}`,
        name: `${offer.type} — ${offer.languagePair}`,
        projectName: offer.project,
        taskType: offer.type,
        languagePair: offer.languagePair,
        dueDate: offer.deadline,
        acceptedAt: new Date(),
      }
      setNewlyAcceptedAssignments(prev => [newAssignment, ...prev])
      
      setAcceptingId(null)
      setAnimatingOutId(null)
      
      toast({
        title: 'Task Accepted',
        description: `You have been assigned to ${offer.project}`,
      })
    }, 500) // Match animation duration
  }

  // Filter tasks for this vendor
  const myTasks = mockTasks.filter((t) => t.vendorId === 'v1' || t.vendorId === 'v2')
  const myPayments = mockVendorPayables.filter((p) => p.vendorId === 'v1' || p.vendorId === 'v2')

  const inProgressTasks = myTasks.filter((t) => t.status === 'in_progress')
  const pendingTasks = myTasks.filter((t) => t.status === 'pending')
  const completedTasks = myTasks.filter((t) => t.status === 'completed')
  const openAssignments = myTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')

  // Calculate tasks due this week (rolling 7 days)
  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const dueThisWeek = openAssignments.filter((t) => {
    const dueDate = new Date(t.dueDate)
    return dueDate <= weekFromNow
  })

  // Calculate completion stats (this month)
  const thisMonth = now.getMonth()
  const completedThisMonth = completedTasks.filter((t) => {
    const dueDate = new Date(t.dueDate)
    return dueDate.getMonth() === thisMonth
  }).length

  // Additional realistic assignments for display
  const additionalAssignments = [
    { 
      id: 'extra1', 
      name: 'Episode 12 — The Final Chapter', 
      projectName: 'Dark Matter S2', 
      service: 'Translation',
      sourceLanguage: 'EN',
      targetLanguage: 'ES',
      dueDate: '2026-05-01',
      status: 'in_progress' as const,
    },
    { 
      id: 'extra2', 
      name: 'Episode 5 — New Horizons', 
      projectName: 'Space Explorers', 
      service: 'Review',
      sourceLanguage: 'EN',
      targetLanguage: 'FR',
      dueDate: '2026-05-03',
      status: 'in_progress' as const,
    },
    { 
      id: 'extra3', 
      name: 'Trailer — Summer Campaign', 
      projectName: 'Brand Launch 2026', 
      service: 'Transcription',
      sourceLanguage: 'EN',
      targetLanguage: null,
      dueDate: '2026-04-30',
      status: 'pending' as const,
    },
  ]

  // Combine with existing open assignments
  const allOpenAssignments = [...openAssignments, ...additionalAssignments]

  // Task offers matching vendor's skills
  const taskOffers = [
    { id: 'to1', type: 'Subtitling', languagePair: 'EN → ES', project: 'Netflix Q1 Localization', deadline: '2026-05-05', price: 450 },
    { id: 'to2', type: 'Translation', languagePair: 'EN → PT', project: 'HBO Max Documentary', deadline: '2026-05-08', price: 380 },
    { id: 'to3', type: 'Transcription', languagePair: 'ES', project: 'Product Launch Campaign', deadline: '2026-05-02', price: 220 },
  ]

  // Filter out accepted offers
  const visibleOffers = taskOffers.filter(o => !acceptedOffers.includes(o.id))

  // Get urgency class for due dates
  const getUrgencyClass = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr)
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue < 0) return 'text-[#991b1b] bg-[#fef2f2] border-[#991b1b]/30' // Overdue - darker red
    if (daysUntilDue <= 1) return 'text-[#dc2626] bg-[#fef2f2] border-[#dc2626]/30' // Today/tomorrow - red
    if (daysUntilDue <= 3) return 'text-[#f59e0b] bg-[#fffbeb] border-[#f59e0b]/30' // Mid-window - yellow
    return 'text-muted-foreground bg-muted border-border' // Normal
  }

  const getDaysLabel = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr)
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)}d overdue`
    if (daysUntilDue === 0) return 'Due today'
    if (daysUntilDue === 1) return 'Due tomorrow'
    return `${daysUntilDue}d left`
  }

return (
<div className="p-6 lg:p-8 space-y-8">
  {/* Header */}
  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-1">Your tasks and earnings</p>
    </div>
    <div className="flex items-center gap-3 mt-4 sm:mt-0">
      {/* UPDATE-004: Period filter */}
      <Popover open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
        <Select 
          value={periodFilter} 
          onValueChange={(value) => {
            if (value === 'custom') {
              setShowCustomDatePicker(true)
            } else {
              setPeriodFilter(value)
            }
          }}
        >
          <SelectTrigger className="w-[160px]">
            <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={() => {
                setPeriodFilter('custom')
                setShowCustomDatePicker(false)
              }}
              disabled={!customStartDate || !customEndDate}
            >
              Apply Range
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <DashboardRefresh />
    </div>
  </div>

  {/* Stats */}
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* UPDATE-004: Clickable card linking to Task Offers page */}
        <Link href="/task-offers">
          <StatsCard
            title="Task Offers"
            value={visibleOffers.length}
            icon={Inbox}
            iconColor="text-primary"
          />
        </Link>
        {/* UPDATE-004: Clickable card linking to My Tasks */}
        <Link href="/tasks">
          <StatsCard
            title="Open Tasks"
            value={allOpenAssignments.length + newlyAcceptedAssignments.length}
            icon={Clock}
          />
        </Link>
        <StatsCard
          title="Due This Week"
          value={dueThisWeek.length}
          icon={Calendar}
          iconColor={dueThisWeek.length > 0 ? 'text-[#f59e0b]' : undefined}
        />
        <StatsCard
          title="Completed This Month"
          value={completedThisMonth}
          icon={CheckCircle2}
          iconColor="text-[#10b981]"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* UPDATE-004: Renamed from Open Assignments to Open Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Open Tasks</CardTitle>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="space-y-4">
              {/* Newly Accepted Assignments - Just assigned, not started */}
              {newlyAcceptedAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4 animate-in slide-in-from-top-2 fade-in duration-300"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-xs font-medium text-primary">
                          {assignment.taskType.charAt(0)}
                        </span>
                        <h4 className="font-medium text-foreground">{assignment.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{assignment.projectName}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      <Sparkles className="h-3 w-3" />
                      New
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                        {(() => {
                          const IconComponent = taskTypeIcons[assignment.taskType] || FileText
                          return <IconComponent className="h-3.5 w-3.5" />
                        })()}
                        {assignment.taskType}
                      </span>
                      <span>{assignment.languagePair}</span>
                      <span>Due: {formatDate(assignment.dueDate)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Just assigned</span>
                  </div>
                </div>
              ))}
              
              {/* UPDATE-004: Existing Open Tasks - now clickable to open task detail */}
              {allOpenAssignments.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => window.location.href = `/tasks/${task.id}`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs">
                          {task.service?.charAt(0) || 'T'}
                        </span>
                        <h4 className="font-medium text-foreground">{task.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{task.projectName}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                        {(() => {
                          const taskType = task.service || 'Translation'
                          const IconComponent = taskTypeIcons[taskType] || FileText
                          return <IconComponent className="h-3.5 w-3.5" />
                        })()}
                        {task.service || 'Translation'}
                      </span>
                      {task.sourceLanguage && task.targetLanguage && (
                        <span>{task.sourceLanguage} → {task.targetLanguage}</span>
                      )}
                      <span>Due: {formatDate(task.dueDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* EDIT-001: Open in Editor button */}
                      <OpenInEditorButton
                        taskId={task.id}
                        projectId={task.projectId}
                        taskName={task.name}
                        sourceLanguage={task.sourceLanguage}
                        targetLanguage={task.targetLanguage}
                        serviceType={task.service || 'Translation'}
                        vendorId={task.vendorId}
                        taskStatus={task.status as 'assigned' | 'in_progress'}
                        isAssignedVendor={true}
                        canView={false}
                        variant="sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {/* UPDATE-004: Updated empty state microcopy */}
              {allOpenAssignments.length === 0 && newlyAcceptedAssignments.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  No open tasks right now. Enjoy the break!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Offers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Inbox className="h-4 w-4 text-primary" />
                Task Offers
                {visibleOffers.length > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    {visibleOffers.length}
                  </span>
                )}
              </CardTitle>
              <Link href="/task-offers">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="space-y-3">
                {visibleOffers.slice(0, 3).map((offer) => (
                  <div
                    key={offer.id}
                    className={cn(
                      'rounded-lg border border-primary/30 bg-primary/5 p-3 transition-all duration-300',
                      animatingOutId === offer.id && 'opacity-0 scale-95 -translate-x-2'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-xs font-medium">
                        {offer.type.charAt(0)}
                      </span>
                      <span className="text-sm font-medium">{offer.languagePair}</span>
                    </div>
                    <p className="text-sm text-foreground">{offer.project}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Due: {formatDate(offer.deadline)}
                      </span>
                      <span className="font-semibold text-sm">{formatCurrency(offer.price)}</span>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full mt-3"
                      disabled={acceptingId === offer.id}
                      onClick={() => handleAcceptOffer(offer)}
                    >
                      {acceptingId === offer.id ? 'Accepting...' : 'Accept'}
                    </Button>
                  </div>
                ))}
                {visibleOffers.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No open offers for your skills right now.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Due This Week */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Calendar className="h-4 w-4 text-[#f59e0b]" />
                Due This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="space-y-3">
                {dueThisWeek.slice(0, 4).map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className={cn(
                      'flex items-center justify-between rounded-lg border p-3 transition-colors cursor-pointer',
                      getUrgencyClass(task.dueDate)
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-current/10 text-xs font-medium">
                          {task.service?.charAt(0) || 'T'}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{task.name}</p>
                          <p className="text-xs opacity-70">{task.projectName}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium whitespace-nowrap">
                        {getDaysLabel(task.dueDate)}
                      </span>
                    </div>
                  </Link>
                ))}
                {dueThisWeek.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Nothing due this week.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Completion Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Completion Stats</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-foreground">{completedThisMonth}</p>
                <p className="text-sm text-muted-foreground mt-1">tasks delivered this month</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

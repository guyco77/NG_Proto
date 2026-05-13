'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Clock,
  Layers,
  CheckCircle2,
  MoreHorizontal,
  Filter,
  LayoutGrid,
  List,
  TrendingUp,
  Search,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { AssignVendorDialog } from '@/components/assign-vendor-dialog'
import { useToast } from '@/hooks/use-toast'
import { mockVendors } from '@/lib/mock-data'
import { DashboardRefresh } from '@/components/dashboard-refresh'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Newly assigned show awaiting vendor start
interface NewlyAssignedShow {
  id: string
  name: string
  client: string
  taskType: string
  language: string
  vendorId: string
  vendorName: string
  assignedAt: Date
  dueDate: string
}

const unassignedJobs = [
  { id: 'uj1', projectId: 'p1', project: 'Product Launch Campaign', client: 'Acme Corp', task: 'Transcription', sourceLang: 'EN', targetLang: 'ES', due: 'Tomorrow' },
  { id: 'uj2', projectId: 'p1', project: 'Product Launch Campaign', client: 'Acme Corp', task: 'Transcription', sourceLang: 'EN', targetLang: 'ES', due: 'Today' },
  { id: 'uj3', projectId: 'p1', project: 'Product Launch Campaign', client: 'Acme Corp', task: 'Transcription', sourceLang: 'EN', targetLang: 'ES', due: '2026-02-10' },
  { id: 'uj4', projectId: 'p2', project: 'Breaking News Coverage', client: 'Global News Ltd', task: 'Timing', sourceLang: 'EN', targetLang: 'ES', due: '2026-02-08' },
  { id: 'uj5', projectId: 'p2', project: 'Breaking News Coverage', client: 'Global News Ltd', task: 'Translation', sourceLang: 'EN', targetLang: 'ES', due: 'Overdue' },
]

const pendingQuotes = [
  { id: 'q1', projectName: 'Product Launch Campaign', status: 'unsent', amount: 12500, expiresAt: '2026-02-20' },
  { id: 'q2', projectName: 'Training Series Vol. 3', status: 'pending_approval', amount: 8200, expiresAt: '2026-02-15' },
]

const newNotes = [
  { id: 'n1', projectId: 'p2', project: 'Breaking News Coverage', from: 'Client', message: 'Please prioritize Arabic track', time: '2h ago' },
  { id: 'n2', projectId: 'p1', project: 'Product Launch', from: 'Vendor', message: 'File format issue on ES-03', time: '4h ago' },
]

interface PipelineStep {
  name: string
  assignee?: { initials: string; name: string }
  status: 'completed' | 'in_progress' | 'pending' | 'at_risk'
}

interface ActiveShow {
  id: string
  name: string
  status: 'In Progress' | 'In Review' | 'At Risk'
  client: string
  due: string
  languages: string[]
  health: { label: string; percentage: number; status: 'on_track' | 'at_risk' }
  pipeline: PipelineStep[]
}

const activeShows: ActiveShow[] = [
  {
    id: 'p1',
    name: 'Product Launch Campaign',
    status: 'In Progress',
    client: 'Acme Corp',
    due: '2026-02-15',
    languages: ['ES', 'FR', 'DE'],
    health: { label: 'On track', percentage: 65, status: 'on_track' },
    pipeline: [
      { name: 'Start', status: 'completed' },
      { name: 'Transcription', assignee: { initials: 'MG', name: 'Maria Garcia' }, status: 'completed' },
      { name: 'Translating', assignee: { initials: 'JM', name: 'Jose Martinez' }, status: 'in_progress' },
      { name: 'Review', status: 'pending' },
    ],
  },
  {
    id: 'p2',
    name: 'Breaking News Coverage',
    status: 'At Risk',
    client: 'Global News',
    due: '2026-02-08',
    languages: ['AR', 'JA'],
    health: { label: 'At risk', percentage: 25, status: 'at_risk' },
    pipeline: [
      { name: 'Start', status: 'completed' },
      { name: 'Transcription', assignee: { initials: 'AH', name: 'Ahmed Hassan' }, status: 'completed' },
      { name: 'Timing Delay', status: 'at_risk' },
      { name: 'Review', status: 'pending' },
    ],
  },
  {
    id: 'p3',
    name: 'Training Series Vol. 2',
    status: 'In Review',
    client: 'EduTech Inc',
    due: '2026-02-10',
    languages: ['PT'],
    health: { label: 'On track', percentage: 90, status: 'on_track' },
    pipeline: [
      { name: 'Start', status: 'completed' },
      { name: 'Transcription', assignee: { initials: 'AI', name: 'Ana Ibanez' }, status: 'completed' },
      { name: 'Translation', assignee: { initials: 'CR', name: 'Carlos Ruiz' }, status: 'completed' },
      { name: 'QC', assignee: { initials: 'CR', name: 'Carlos Ruiz' }, status: 'completed' },
      { name: 'Client Review', status: 'in_progress' },
    ],
  },
]

// Completed today items
const completedToday = [
  { id: 'ct1', name: 'Training Series Vol. 2', task: 'Translation', lang: 'PT', vendor: 'Carlos R.', time: '14:32', slaMet: true },
  { id: 'ct2', name: 'Product Launch', task: 'Transcription', lang: 'ES', vendor: 'Maria Garcia', time: '09:15', slaMet: true },
]

interface AssignTask {
  id: string
  projectId: string
  project: string
  client: string
  taskType: string
  language: string
  dueDate: string
}

// Helper to format due date with colors
function formatDueDate(due: string) {
  if (due === 'Today') {
    return <span className="text-red-500 font-medium">Today</span>
  }
  if (due === 'Tomorrow') {
    return <span className="text-amber-500 font-medium">Tomorrow</span>
  }
  if (due === 'Overdue') {
    return (
      <span className="text-red-500 font-medium flex items-center gap-1">
        <AlertTriangle className="h-3.5 w-3.5" />
        Overdue
      </span>
    )
  }
  // Format date as "Feb 10, 2026"
  const date = new Date(due)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Compact Pipeline visualization component
function CompactPipeline({ pipeline, health }: { pipeline: PipelineStep[], health: { percentage: number; status: 'on_track' | 'at_risk' } }) {
  const currentStep = pipeline.find(s => s.status === 'in_progress' || s.status === 'at_risk')
  const lastStep = pipeline[pipeline.length - 1]
  
  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      {/* Progress dots with initials */}
      <div className="flex items-center flex-1">
        {pipeline.map((step, idx) => (
          <div key={idx} className="flex items-center flex-1">
            <div className="relative group">
              {step.status === 'completed' ? (
                step.assignee ? (
                  <Avatar className="h-5 w-5 border border-foreground">
                    <AvatarFallback className="text-[7px] bg-foreground text-background font-medium">
                      {step.assignee.initials}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-5 w-5 rounded-full bg-foreground flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-background" />
                  </div>
                )
              ) : step.status === 'in_progress' ? (
                step.assignee ? (
                  <Avatar className="h-5 w-5 border-2 border-primary ring-2 ring-primary/20">
                    <AvatarFallback className="text-[7px] bg-white text-foreground font-medium">
                      {step.assignee.initials}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-primary bg-white ring-2 ring-primary/20" />
                )
              ) : step.status === 'at_risk' ? (
                <div className="h-5 w-5 rounded-full border-2 border-red-500 bg-red-50 ring-2 ring-red-200" />
              ) : (
                <div className="h-5 w-5 rounded-full border border-muted-foreground/30 bg-white" />
              )}
              {/* Tooltip */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {step.name}{step.assignee ? ` - ${step.assignee.name}` : ''}
              </div>
            </div>
            {idx < pipeline.length - 1 && (
              <div className={cn(
                'h-[2px] flex-1 mx-0.5',
                step.status === 'completed' ? 'bg-foreground' : 
                step.status === 'at_risk' ? 'bg-red-300' : 'bg-muted'
              )} />
            )}
          </div>
        ))}
      </div>
      {/* Current step label and percentage */}
      <div className="flex items-center gap-1.5 min-w-[80px] justify-end">
        <span className={cn(
          "text-[10px]",
          health.status === 'at_risk' ? "text-red-500 font-medium" : "text-muted-foreground"
        )}>
          {currentStep?.name || lastStep.name}
        </span>
        <span className={cn(
          "text-[10px] font-semibold tabular-nums",
          health.status === 'on_track' ? "text-emerald-600" : "text-red-500"
        )}>
          {health.percentage}%
        </span>
      </div>
    </div>
  )
}

export function PMDashboard({ userName = 'Noa' }: { userName?: string }) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<AssignTask | null>(null)
  const [assignedJobIds, setAssignedJobIds] = useState<string[]>([])
  const [newlyAssignedShows, setNewlyAssignedShows] = useState<NewlyAssignedShow[]>([])
  const [animatingOutId, setAnimatingOutId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  const { toast } = useToast()

  const handleAssignClick = (job: typeof unassignedJobs[0]) => {
    setSelectedTask({
      id: job.id,
      projectId: job.projectId,
      project: job.project,
      client: job.client,
      taskType: job.task,
      language: `${job.sourceLang} → ${job.targetLang}`,
      dueDate: job.due,
    })
    setAssignDialogOpen(true)
  }

  const handleAssignVendor = (vendorId: string) => {
    if (selectedTask) {
      const vendor = mockVendors.find(v => v.id === vendorId)
      
      setAnimatingOutId(selectedTask.id)
      
      setTimeout(() => {
        setAssignedJobIds(prev => [...prev, selectedTask.id])
        
        const newShow: NewlyAssignedShow = {
          id: `new-${selectedTask.id}`,
          name: selectedTask.project,
          client: selectedTask.client,
          taskType: selectedTask.taskType,
          language: selectedTask.language,
          vendorId: vendorId,
          vendorName: vendor?.name || 'Unknown Vendor',
          assignedAt: new Date(),
          dueDate: selectedTask.dueDate,
        }
        setNewlyAssignedShows(prev => [newShow, ...prev])
        setAnimatingOutId(null)
        
        toast({
          title: 'Vendor Assigned',
          description: `${vendor?.name || 'Vendor'} assigned to ${selectedTask.taskType}. Awaiting start.`,
        })
      }, 300)
    }
  }

  const visibleUnassignedJobs = unassignedJobs.filter(
    job => !assignedJobIds.includes(job.id)
  )

  const stats = {
    activeShows: 3,
    activeShowsTrend: 1,
    unassignedJobs: visibleUnassignedJobs.length,
    unassignedJobsTrend: 2,
    atRisk: 1,
    atRiskTrend: 0,
    completedToday: 2,
    completedTodayTrend: 2,
  }

  return (
    <div className="min-h-screen bg-[#e8e8e8]">
      {/* Curved white content area */}
      <div className="bg-white rounded-tl-[3rem] min-h-screen ml-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Show Monitoring</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track show health, SLAs, and vendor assignments.</p>
            </div>
            <div className="flex items-center gap-3">
              <DashboardRefresh />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search shows..." 
                  className="pl-9 w-[200px] h-9 bg-muted/30 border-0"
                />
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <Card className="mb-6 border border-border">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Shows</span>
                    <Layers className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tabular-nums">{stats.activeShows}</span>
                    {stats.activeShowsTrend !== 0 && (
                      <span className="text-xs font-medium text-emerald-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-0.5" />+{stats.activeShowsTrend}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Unassigned Jobs</span>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tabular-nums">{stats.unassignedJobs}</span>
                    {stats.unassignedJobsTrend !== 0 && (
                      <span className="text-xs font-medium text-red-500 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-0.5" />+{stats.unassignedJobsTrend}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">At-Risk</span>
                    <Clock className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tabular-nums">{stats.atRisk}</span>
                    <span className="text-xs text-muted-foreground">– {stats.atRiskTrend}</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Completed Today</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tabular-nums">{stats.completedToday}</span>
                    {stats.completedTodayTrend !== 0 && (
                      <span className="text-xs font-medium text-emerald-600">+{stats.completedTodayTrend}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Required */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="text-base font-semibold text-foreground">Action Required</h2>
              {visibleUnassignedJobs.length > 0 && (
                <span className="rounded-full bg-red-100 text-red-600 px-2 py-0.5 text-xs font-medium">
                  {visibleUnassignedJobs.length} pending assignments
                </span>
              )}
            </div>
            <Card className="border border-border overflow-hidden">
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Show</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Task</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Language</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Due Date</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibleUnassignedJobs.map((job) => (
                      <tr 
                        key={job.id}
                        className={cn(
                          'transition-all duration-300 hover:bg-muted/20',
                          animatingOutId === job.id && 'opacity-0 -translate-x-4'
                        )}
                      >
                        <td className="px-4 py-2.5">
                          <Link href={`/projects/${job.projectId}`} className="text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors">
                            {job.project}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">{job.task}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-muted rounded">{job.sourceLang}</span>
                            <span className="text-muted-foreground text-xs">→</span>
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-muted rounded">{job.targetLang}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-sm">{formatDueDate(job.due)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <Button 
                            size="sm" 
                            className="h-7 px-3 text-xs bg-foreground text-background hover:bg-foreground/90"
                            onClick={() => handleAssignClick(job)}
                          >
                            Assign
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Active Shows - COMPACT CARD/ROW FORMAT */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">Active Shows</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                  <Filter className="h-3 w-3" />
                  Filters
                </Button>
                <div className="flex border border-border rounded-md">
                  <Button 
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-7 w-7 p-0 rounded-r-none"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-7 w-7 p-0 rounded-l-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Newly Assigned Shows */}
            {newlyAssignedShows.map((show) => (
              <Link key={show.id} href={`/projects/${show.id.replace('new-uj', 'p')}`} className="block mb-2">
                <Card className="border border-amber-200 bg-amber-50/30 hover:border-amber-300 transition-all animate-in slide-in-from-top-2 fade-in">
                  <CardContent className="py-2 px-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700">Awaiting Start</span>
                        <span className="font-medium text-sm">{show.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{show.vendorName} assigned to {show.taskType}</span>
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            
            {/* Shows Cards - ULTRA COMPACT */}
            <div className={cn(
              "grid gap-2",
              viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
            )}>
              {activeShows.map((show) => (
                <Card key={show.id} className="border border-border hover:border-primary/30 hover:shadow-sm transition-all">
                  <CardContent className="p-3">
                    {/* Row 1: Status badge, name, menu */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          'px-1.5 py-0.5 text-[10px] font-medium rounded shrink-0',
                          show.status === 'In Review' ? 'bg-emerald-100 text-emerald-700' :
                          show.status === 'At Risk' ? 'bg-red-100 text-red-600' :
                          'bg-muted text-foreground'
                        )}>
                          {show.status}
                        </span>
                        <Link href={`/projects/${show.id}`} className="truncate">
                          <span className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                            {show.name}
                          </span>
                        </Link>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${show.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit Show</DropdownMenuItem>
                          <DropdownMenuItem>Assign Vendor</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Row 2: Client, Due, Langs - single line */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{show.client}</span>
                      <span className={cn(show.health.status === 'at_risk' && "text-red-500 font-medium")}>
                        {new Date(show.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="font-medium">{show.languages.join(', ')}</span>
                    </div>
                    
                    {/* Row 3: Workflow Progress - compact inline */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span className="uppercase tracking-wide">Workflow Progress</span>
                      <span className={cn(
                        "font-semibold",
                        show.health.status === 'on_track' ? "text-emerald-600" : "text-red-500"
                      )}>
                        {show.health.percentage}%
                      </span>
                    </div>
                    <CompactPipeline pipeline={show.pipeline} health={show.health} />
                  </CardContent>
                </Card>
              ))}
            </div>

            {activeShows.length === 0 && (
              <Card className="border border-dashed">
                <CardContent className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">No active shows yet.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Completed Today */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h2 className="text-base font-semibold text-foreground">Completed Today</h2>
              </div>
              <Link href="/projects?status=completed">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs h-7">
                  View History
                </Button>
              </Link>
            </div>
            <Card className="border border-border">
              <CardContent className="p-0 divide-y divide-border">
                {completedToday.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-0.5 h-5 bg-emerald-500 rounded-full" />
                      <div>
                        <p className="text-sm font-medium">{item.name} – {item.task} ({item.lang})</p>
                        <p className="text-[10px] text-muted-foreground">Vendor: {item.vendor} · Completed at {item.time}</p>
                      </div>
                    </div>
                    {item.slaMet && (
                      <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-emerald-100 text-emerald-700">SLA Met</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Pending Quotes & New Notes */}
          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="border border-border">
              <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
                <CardTitle className="text-sm font-semibold">Pending Quotes</CardTitle>
                <Link href="/quotes">
                  <Button variant="ghost" size="sm" className="gap-1 text-primary text-xs h-6">
                    View All <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex flex-col gap-2">
                  {pendingQuotes.map((quote) => (
                    <Link key={quote.id} href={`/quotes/${quote.id}`}>
                      <div className="flex items-center justify-between rounded-lg border border-border p-2 hover:border-primary/50 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{quote.projectName}</p>
                            {quote.status === 'unsent' && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">Unsent</span>
                            )}
                            {quote.status === 'pending_approval' && (
                              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">Pending</span>
                            )}
                          </div>
                          <p className="text-[9px] text-muted-foreground">Expires: {quote.expiresAt}</p>
                        </div>
                        <p className="font-semibold text-sm">₪{quote.amount.toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Bell className="h-3.5 w-3.5" />
                  New Notes
                </CardTitle>
                <Link href="/projects?tab=notes">
                  <Button variant="ghost" size="sm" className="gap-1 text-primary text-xs h-6">
                    View All <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex flex-col gap-2">
                  {newNotes.map((note) => (
                    <Link key={note.id} href={`/projects/${note.projectId}?tab=notes`}>
                      <div className="rounded-lg border border-border p-2 hover:border-primary/30 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-medium">{note.project}</p>
                          <span className="text-[9px] text-muted-foreground">{note.time}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                          <span className="font-medium text-foreground">{note.from}:</span> {note.message}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AssignVendorDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        task={selectedTask}
        onAssign={handleAssignVendor}
      />
    </div>
  )
}

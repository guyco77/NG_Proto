'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  UserPlus,
  Plus,
  FileText,
  Bell,
  Clock,
  User,
  Layers,
  CheckCircle2,
  MoreHorizontal,
  Filter,
  LayoutGrid,
  List,
  TrendingUp,
  TrendingDown,
  FolderOpen,
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
import { Checkbox } from '@/components/ui/checkbox'

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
  assignee?: { initials: string; color: string }
  status: 'completed' | 'in_progress' | 'pending' | 'at_risk'
  count?: number
}

interface ActiveShow {
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
    name: 'Product Launch Campaign',
    status: 'In Progress',
    client: 'Acme Corp',
    due: '2026-02-15',
    languages: ['ES', 'FR', 'DE'],
    health: { label: 'On track', percentage: 65, status: 'on_track' },
    pipeline: [
      { name: 'Start', status: 'completed' },
      { name: 'Transcription', assignee: { initials: 'MG', color: 'bg-foreground' }, status: 'completed' },
      { name: 'Translating', assignee: { initials: 'JM', color: 'bg-foreground' }, status: 'in_progress' },
      { name: 'Review', status: 'pending' },
    ],
  },
  {
    name: 'Breaking News Coverage',
    status: 'At Risk',
    client: 'Global News',
    due: '2026-02-08',
    languages: ['AR', 'JA'],
    health: { label: 'At risk', percentage: 25, status: 'at_risk' },
    pipeline: [
      { name: 'Start', status: 'completed' },
      { name: 'Transcription', assignee: { initials: 'AH', color: 'bg-foreground' }, status: 'completed' },
      { name: 'Timing Delay', status: 'at_risk' },
      { name: 'Review', status: 'pending' },
    ],
  },
  {
    name: 'Training Series Vol. 2',
    status: 'In Review',
    client: 'EduTech Inc',
    due: '2026-02-10',
    languages: ['PT'],
    health: { label: 'On track', percentage: 90, status: 'on_track' },
    pipeline: [
      { name: 'Start', status: 'completed' },
      { name: 'Transcription', assignee: { initials: 'AI', color: 'bg-foreground' }, status: 'completed' },
      { name: 'Translation', assignee: { initials: 'CR', color: 'bg-foreground' }, status: 'completed' },
      { name: 'QC', assignee: { initials: 'CR', color: 'bg-foreground' }, status: 'completed' },
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
      
      // Start exit animation
      setAnimatingOutId(selectedTask.id)
      
      // After animation, update state
      setTimeout(() => {
        // Remove from unassigned list
        setAssignedJobIds(prev => [...prev, selectedTask.id])
        
        // Add to newly assigned projects at top
        const newProject: NewlyAssignedShow = {
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
        setNewlyAssignedShows(prev => [newProject, ...prev])
        setAnimatingOutId(null)
        
        toast({
          title: 'Vendor Assigned',
          description: `${vendor?.name || 'Vendor'} assigned to ${selectedTask.taskType}. Awaiting start.`,
        })
      }, 300)
    }
  }

  // Filter out already assigned jobs
  const visibleUnassignedJobs = unassignedJobs.filter(
    job => !assignedJobIds.includes(job.id)
  )

  // KPI stats
  const stats = {
    activeProjects: 3,
    activeProjectsTrend: 1,
    unassignedJobs: visibleUnassignedJobs.length,
    unassignedJobsTrend: 2,
    atRisk: 1,
    atRiskTrend: 0,
    completedToday: 2,
    completedTodayTrend: 2,
  }

  return (
    <div className="min-h-full bg-[#f5f5f5]">
      {/* Main curved content area */}
      <div className="bg-white rounded-tl-[2rem] min-h-full p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Project Monitoring</h1>
            <p className="text-sm text-muted-foreground mt-1">Track project health, SLAs, and vendor assignments.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search projects..." 
                className="pl-9 w-[200px] h-9 bg-white border-border"
              />
            </div>
            <DashboardRefresh />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border border-border bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Projects</span>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold">{stats.activeProjects}</span>
                {stats.activeProjectsTrend !== 0 && (
                  <span className={cn(
                    "text-xs font-medium flex items-center",
                    stats.activeProjectsTrend > 0 ? "text-emerald-600" : "text-red-500"
                  )}>
                    {stats.activeProjectsTrend > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                    {stats.activeProjectsTrend > 0 ? '+' : ''}{stats.activeProjectsTrend}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Unassigned Jobs</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold">{stats.unassignedJobs}</span>
                {stats.unassignedJobsTrend !== 0 && (
                  <span className="text-xs font-medium flex items-center text-red-500">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    +{stats.unassignedJobsTrend}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">At-Risk</span>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold">{stats.atRisk}</span>
                <span className="text-xs text-muted-foreground">– {stats.atRiskTrend}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Completed Today</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold">{stats.completedToday}</span>
                {stats.completedTodayTrend !== 0 && (
                  <span className="text-xs font-medium flex items-center text-emerald-600">
                    +{stats.completedTodayTrend}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Required - Pending Assignments Table */}
        <div className="mb-8">
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
                    <th className="w-10 px-4 py-3">
                      <Checkbox />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Task
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Language
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                      Actions
                    </th>
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
                      <td className="w-10 px-4 py-3">
                        <Checkbox />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/projects/${job.projectId}`} className="text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors">
                          {job.project}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{job.task}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-muted rounded">{job.sourceLang}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-muted rounded">{job.targetLang}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDueDate(job.due)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          size="sm" 
                          className="h-8 bg-foreground text-background hover:bg-foreground/90"
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

        {/* Active Projects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Active Projects</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Filters
              </Button>
              <div className="flex border border-border rounded-md">
                <Button 
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-r-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-l-none"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Newly Assigned Shows - Awaiting Vendor Start */}
          {newlyAssignedShows.map((project) => (
            <Link key={project.id} href={`/projects/${project.id.replace('new-uj', 'p')}`} className="block mb-4">
              <Card className="border border-amber-200 bg-amber-50/30 hover:border-amber-300 transition-all duration-300 animate-in slide-in-from-top-2 fade-in">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-700">
                        Awaiting Start
                      </span>
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{project.vendorName} assigned to {project.taskType}</span>
                      <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          
          {/* Active Projects Cards - Condensed Grid */}
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {activeShows.map((project, index) => (
              <Link key={index} href={`/projects/p${index + 1}`}>
                <Card className="border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer h-full">
                  <CardContent className="p-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 text-xs font-medium rounded mb-1.5',
                            project.status === 'In Review'
                              ? 'bg-emerald-100 text-emerald-700'
                              : project.status === 'At Risk'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-muted text-foreground'
                          )}
                        >
                          {project.status}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground">{project.name}</h3>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>

                    {/* Info rows */}
                    <div className="space-y-1.5 text-xs mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Client</span>
                        <span className="font-medium text-right">{project.client}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Due Date</span>
                        <span className={cn(
                          "font-medium",
                          project.health.status === 'at_risk' && "text-red-500"
                        )}>
                          {new Date(project.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Langs</span>
                        <span className="font-medium">{project.languages.join(', ')}</span>
                      </div>
                    </div>

                    {/* Workflow Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Workflow Progress</span>
                        <span className={cn(
                          "text-xs font-medium",
                          project.health.status === 'on_track' ? "text-emerald-600" : "text-red-500"
                        )}>
                          {project.health.percentage}%
                        </span>
                      </div>
                      
                      {/* Pipeline visualization */}
                      <div className="flex items-center gap-1">
                        {project.pipeline.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-center flex-1">
                            {/* Step dot/circle */}
                            <div className="flex flex-col items-center">
                              {step.status === 'completed' ? (
                                <div className="h-4 w-4 rounded-full bg-foreground flex items-center justify-center">
                                  <CheckCircle2 className="h-3 w-3 text-background" />
                                </div>
                              ) : step.status === 'in_progress' ? (
                                <div className="h-4 w-4 rounded-full border-2 border-foreground bg-white" />
                              ) : step.status === 'at_risk' ? (
                                <div className="h-4 w-4 rounded-full border-2 border-red-500 bg-red-50" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 bg-white" />
                              )}
                            </div>
                            {/* Connecting line */}
                            {stepIndex < project.pipeline.length - 1 && (
                              <div
                                className={cn(
                                  'h-0.5 flex-1 mx-0.5',
                                  step.status === 'completed' ? 'bg-foreground' : 'bg-muted'
                                )}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Labels */}
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">Start</span>
                        <span className={cn(
                          "text-[10px]",
                          project.pipeline.some(s => s.status === 'at_risk') ? "text-red-500 font-medium" : "text-muted-foreground"
                        )}>
                          {project.pipeline.find(s => s.status === 'at_risk')?.name || 
                           project.pipeline.find(s => s.status === 'in_progress')?.name || 
                           project.pipeline[project.pipeline.length - 1].name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Review</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {activeShows.length === 0 && (
            <Card className="border border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No active projects yet.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Completed Today */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <h2 className="text-base font-semibold text-foreground">Completed Today</h2>
            </div>
            <Link href="/projects?status=completed">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                View History
              </Button>
            </Link>
          </div>
          <Card className="border border-border">
            <CardContent className="p-0 divide-y divide-border">
              {completedToday.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-emerald-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium">{item.name} – {item.task} ({item.lang})</p>
                      <p className="text-xs text-muted-foreground">Vendor: {item.vendor} · Completed at {item.time}</p>
                    </div>
                  </div>
                  {item.slaMet && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-100 text-emerald-700">
                      SLA Met
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Pending Quotes & New Notes - Side by side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Quotes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Pending Quotes</CardTitle>
              <Link href="/quotes">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex flex-col gap-3">
                {pendingQuotes.map((quote) => (
                  <Link key={quote.id} href={`/quotes/${quote.id}`}>
                    <div className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary/50 transition-colors cursor-pointer">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{quote.projectName}</p>
                          {quote.status === 'unsent' && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                              Unsent
                            </span>
                          )}
                          {quote.status === 'pending_approval' && (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Expires: {quote.expiresAt}</p>
                      </div>
                      <p className="font-semibold">₪{quote.amount.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
                {pendingQuotes.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">No pending quotes.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* New Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Bell className="h-4 w-4" />
                New Notes
              </CardTitle>
              <Link href="/projects?tab=notes">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-2">
              <div className="flex flex-col gap-3">
                {newNotes.map((note) => (
                  <Link key={note.id} href={`/projects/${note.projectId}?tab=notes`}>
                    <div className="rounded-lg border border-border p-3 hover:border-primary/30 hover:bg-muted/30 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{note.project}</p>
                        <span className="text-xs text-muted-foreground">{note.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
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
        </div>
      </div>

      {/* Assign Vendor Dialog */}
      <AssignVendorDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        task={selectedTask}
        onAssign={handleAssignVendor}
      />
    </div>
  )
}

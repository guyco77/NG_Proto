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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { AssignVendorDialog } from '@/components/assign-vendor-dialog'
import { useToast } from '@/hooks/use-toast'
import { mockVendors } from '@/lib/mock-data'
import { DashboardRefresh } from '@/components/dashboard-refresh'

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
  { id: 'uj1', projectId: 'p1', project: 'Product Launch Campaign', client: 'Acme Corp', task: 'Transcription', language: 'Spanish', due: '2026-02-10' },
  { id: 'uj2', projectId: 'p2', project: 'Breaking News Coverage', client: 'Global News Ltd', task: 'Timing', language: 'Arabic', due: '2026-02-08' },
  { id: 'uj3', projectId: 'p2', project: 'Breaking News Coverage', client: 'Global News Ltd', task: 'Translation', language: 'Japanese', due: '2026-02-08' },
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
  status: 'IN PROGRESS' | 'IN REVIEW'
  client: string
  due: string
  languages: string[]
  health: { label: string; percentage: number; status: 'on_track' | 'at_risk' }
  pipeline: PipelineStep[]
}

const activeShows: ActiveShow[] = [
  {
    name: 'Product Launch Campaign',
    status: 'IN PROGRESS',
    client: 'Acme Corp',
    due: '2026-02-15',
    languages: ['ES', 'FR', 'DE'],
    health: { label: 'On track', percentage: 65, status: 'on_track' },
    pipeline: [
      { name: 'Transcription', assignee: { initials: 'MG', color: 'bg-[#18181b]' }, status: 'completed' },
      { name: 'Timing', assignee: { initials: 'MG', color: 'bg-[#18181b]' }, status: 'completed' },
      { name: 'Translation', assignee: { initials: 'JM', color: 'bg-[#18181b]' }, status: 'in_progress' },
      { name: 'QA', status: 'pending', count: 4 },
      { name: 'Review', status: 'pending', count: 5 },
    ],
  },
  {
    name: 'Breaking News Coverage',
    status: 'IN PROGRESS',
    client: 'Global News Ltd',
    due: '2026-02-08',
    languages: ['AR', 'JA'],
    health: { label: 'At risk', percentage: 30, status: 'at_risk' },
    pipeline: [
      { name: 'Transcription', assignee: { initials: 'AH', color: 'bg-[#18181b]' }, status: 'completed' },
      { name: 'Timing', assignee: { initials: 'AH', color: 'bg-[#f43f5e]' }, status: 'at_risk' },
      { name: 'Translation', status: 'pending', count: 4 },
      { name: 'QA', status: 'pending', count: 4 },
      { name: 'Review', status: 'pending', count: 5 },
    ],
  },
  {
    name: 'Training Series Vol. 2',
    status: 'IN REVIEW',
    client: 'EduTech Inc',
    due: '2026-02-10',
    languages: ['PT'],
    health: { label: 'On track', percentage: 90, status: 'on_track' },
    pipeline: [
      { name: 'Transcription', assignee: { initials: 'AI', color: 'bg-[#18181b]' }, status: 'completed' },
      { name: 'Timing', assignee: { initials: 'AI', color: 'bg-[#18181b]' }, status: 'completed' },
      { name: 'Translation', assignee: { initials: 'CR', color: 'bg-[#18181b]' }, status: 'completed' },
      { name: 'CR', assignee: { initials: 'CR', color: 'bg-[#18181b]' }, status: 'completed' },
      { name: 'Review', status: 'in_progress', count: 5 },
    ],
  },
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

export function PMDashboard({ userName = 'Noa' }: { userName?: string }) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<AssignTask | null>(null)
  const [assignedJobIds, setAssignedJobIds] = useState<string[]>([])
  const [newlyAssignedShows, setNewlyAssignedShows] = useState<NewlyAssignedShow[]>([])
  const [animatingOutId, setAnimatingOutId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleAssignClick = (job: typeof unassignedJobs[0]) => {
    setSelectedTask({
      id: job.id,
      projectId: job.projectId,
      project: job.project,
      client: job.client,
      taskType: job.task,
      language: job.language,
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
        const newProject: NewlyAssignedProject = {
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
        setNewlyAssignedProjects(prev => [newProject, ...prev])
        setAnimatingOutId(null)
        
        toast({
          title: 'Vendor Assigned',
          description: `${vendor?.name || 'Vendor'} assigned to ${selectedTask.taskType} (${selectedTask.language}). Awaiting start.`,
        })
      }, 300) // Match animation duration
    }
  }

  // Filter out already assigned jobs
  const visibleUnassignedJobs = unassignedJobs.filter(
    job => !assignedJobIds.includes(job.id)
  )

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header with CTAs */}
<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
  <div>
<h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
  <p className="text-sm text-muted-foreground mt-1">Track project health, SLAs, and vendor assignments.</p>
  </div>
  <div className="flex items-center gap-3">
  <DashboardRefresh />
  <Link href="/projects/new" prefetch={true}>
  <Button className="gap-2">
  <Plus className="h-4 w-4" />
  New Show
  </Button>
          </Link>
          <Link href="/quotes/new" prefetch={true}>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              New Quote
            </Button>
          </Link>
        </div>
      </div>



      {/* Unassigned Jobs */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Pending Vendor Assignments</h2>
          {visibleUnassignedJobs.length > 0 && (
            <span className="rounded-full bg-[#f43f5e] px-2 py-0.5 text-xs font-medium text-white">
              {visibleUnassignedJobs.length} pending
            </span>
          )}
        </div>
        <Card className="border border-border">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Language
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Due
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleUnassignedJobs.map((job) => (
                  <tr 
                    key={job.id}
                    className={cn(
                      'transition-all duration-300',
                      animatingOutId === job.id && 'opacity-0 -translate-x-4'
                    )}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      <Link href={`/projects/${job.projectId}`} className="hover:text-primary hover:underline transition-colors">
                        {job.project}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{job.task}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{job.language}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{job.due}</td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        size="sm" 
                        className="h-7 gap-1.5 bg-[#18181b] text-white hover:bg-[#18181b]/90"
                        onClick={() => handleAssignClick(job)}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Assign Vendor
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Pending Quotes & New Notes */}
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
                          <span className="rounded bg-[#fef3c7] px-1.5 py-0.5 text-xs font-medium text-[#92400e]">
                            Unsent
                          </span>
                        )}
                        {quote.status === 'pending_approval' && (
                          <span className="rounded bg-[#dbeafe] px-1.5 py-0.5 text-xs font-medium text-[#1e40af]">
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
          <CardContent className="px-6 pb-6 pt-2">
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

      {/* Active Shows */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-foreground">Active Shows</h2>
        <div className="flex flex-col gap-5">
          {/* Newly Assigned Shows - Awaiting Vendor Start */}
          {newlyAssignedShows.map((project) => (
            <Link key={project.id} href={`/projects/${project.id.replace('new-uj', 'p')}`}>
              <Card className="border border-amber-200 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20 hover:border-amber-300 transition-all duration-300 animate-in slide-in-from-top-2 fade-in cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-foreground">{project.name}</h3>
                        <span className="rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                          Awaiting Start
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Client: {project.client} · Due {project.dueDate} · {project.language}
                      </p>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{project.vendorName}</span>
                          <span className="text-muted-foreground">assigned to {project.taskType}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Pending</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Assigned just now
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          
          {/* Existing Active Projects */}
          {activeShows.map((project, index) => (
            <Link key={index} href={`/projects/p${index + 1}`}>
              <Card className="border border-border hover:border-primary/30 hover:bg-muted/20 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">{project.name}</h3>
                        <span
                          className={cn(
                            'rounded px-2 py-0.5 text-xs font-medium',
                            project.status === 'IN REVIEW'
                              ? 'bg-[#d1fae5] text-[#047857]'
                              : 'bg-secondary text-foreground'
                          )}
                        >
                          {project.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Client: {project.client} · Due {project.due} · {project.languages.join(', ')}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-1 text-sm font-medium',
                        project.health.status === 'on_track' ? 'text-[#10b981]' : 'text-[#f43f5e]'
                      )}
                    >
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          project.health.status === 'on_track' ? 'bg-[#10b981]' : 'bg-[#f43f5e]'
                        )}
                      />
                      {project.health.label} ({project.health.percentage}%)
                    </div>
                  </div>

                  {/* Pipeline */}
                  <div className="flex items-start">
                    {project.pipeline.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex flex-1 items-center">
                        {/* Step column with avatar and label */}
                        <div className="flex flex-col items-center">
                          {step.assignee ? (
                            <Avatar className="h-8 w-8 shrink-0 border-2 border-white">
                              <AvatarFallback className={cn('text-xs font-medium text-white', step.assignee.color)}>
                                {step.assignee.initials}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-border bg-secondary text-xs font-medium text-muted-foreground">
                              {step.count}
                            </div>
                          )}
                          <span
                            className={cn(
                              'mt-2 text-xs whitespace-nowrap',
                              step.status === 'at_risk'
                                ? 'font-medium text-destructive'
                                : step.status === 'completed' || step.status === 'in_progress'
                                  ? 'text-foreground'
                                  : 'text-muted-foreground'
                            )}
                          >
                            {step.name}
                          </span>
                        </div>
                        {/* Connecting line */}
                        {stepIndex < project.pipeline.length - 1 && (
                          <div
                            className={cn(
                              'h-0.5 flex-1 -translate-y-3',
                              step.status === 'completed' ? 'bg-foreground' : 'bg-border'
                            )}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {activeShows.length === 0 && (
            <Card className="border border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No active projects yet.</p>
              </CardContent>
            </Card>
          )}
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

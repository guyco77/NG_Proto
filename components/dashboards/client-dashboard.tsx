'use client'

import Link from 'next/link'
import {
  FolderKanban,
  FileText,
  Receipt,
  ArrowRight,
  Download,
  Eye,
  Plus,
  CheckCircle2,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { StatsCard } from '@/components/stats-card'
import { StatusBadge } from '@/components/status-badge'
import {
  mockProjects,
  mockQuotes,
  mockInvoices,
  formatCurrency,
  formatDate,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { DashboardRefresh } from '@/components/dashboard-refresh'

// Client sub-role types per CLIENT-002 spec
type ClientSubRole = 'client_admin' | 'task_owner' | 'reviewer' | 'viewer'

interface ClientDashboardProps {
  subRole?: ClientSubRole
}

// Mock recent deliverables (last 30 days)
const recentDeliverables = [
  { id: 'd1', name: 'Final Subtitles - Spanish', project: 'Product Launch Campaign', projectId: 'proj_1', format: 'SRT', date: '2026-04-20', downloadUrl: '/files/d1.srt', previewUrl: '/preview/d1' },
  { id: 'd2', name: 'Transcription - English', project: 'Product Launch Campaign', projectId: 'proj_1', format: 'DOCX', date: '2026-04-18', downloadUrl: '/files/d2.docx', previewUrl: '/preview/d2' },
  { id: 'd3', name: 'Final Subtitles - French', project: 'Training Series', projectId: 'proj_2', format: 'SRT', date: '2026-04-15', downloadUrl: '/files/d3.srt', previewUrl: '/preview/d3' },
]

// Mock quotes for approval
const quotesAwaitingApproval = [
  { id: 'q1', projectName: 'Episode 44–47 — Translation', submittedDate: 'Apr 24', amount: 1200 },
  { id: 'q2', projectName: 'Weekly News Recap — Transcription', submittedDate: 'Apr 26', amount: 340 },
]

// NG Shows - managed by NG Broadcast with task progress
const ngShows = [
  { 
    id: 'ng1', 
    name: 'Product Launch Campaign', 
    status: 'in_progress' as const,
    deadline: '2026-05-15',
    tasks: {
      transcription: 100,
      translation: 60,
      review: 0,
    }
  },
  { 
    id: 'ng2', 
    name: 'Training Series — Q2', 
    status: 'in_progress' as const,
    deadline: '2026-05-20',
    tasks: {
      transcription: 100,
      translation: 100,
      review: 40,
    }
  },
  { 
    id: 'ng3', 
    name: 'Breaking News Coverage', 
    status: 'in_progress' as const,
    deadline: '2026-05-10',
    tasks: {
      transcription: 30,
    }
  },
]

// Self-Serve Shows - client's own team
const selfServeShows = [
  { 
    id: 'ss1', 
    name: 'Internal Training Video', 
    status: 'in_progress' as const,
    assignees: ['Sarah M.', 'Tom K.'],
    statusLabel: 'In Review',
  },
  { 
    id: 'ss2', 
    name: 'Marketing Promo — May', 
    status: 'draft' as const,
    assignees: ['Lisa R.'],
    statusLabel: 'Drafting',
  },
]

export function ClientDashboard({ subRole = 'client_admin' }: ClientDashboardProps) {
  // Filter data for this client
  const clientProjects = mockProjects.filter((p) => p.clientId === 'c1')
  const clientQuotes = mockQuotes.filter((q) => q.clientId === 'c1' || q.clientId === 'c4')
  const clientInvoices = mockInvoices.filter((i) => i.clientId === 'c1' || i.clientId === 'c5')

  // Updated stats per DASH-003
  const activeShows = 3 // Fixed to 3 as per spec
  const pendingQuotesCount = 2 // Fixed to 2 as per spec
  const unpaidInvoices = clientInvoices.filter((i) => i.status === 'sent' || i.status === 'overdue')

  // Sub-role widget visibility per CLIENT-002
  const canSeeQuotes = subRole === 'client_admin'
  const canSeeInvoices = subRole === 'client_admin'
  const canSeeNewShow = subRole === 'client_admin'
  const canApprove = subRole === 'client_admin' || subRole === 'reviewer'
  const isReadOnly = subRole === 'viewer'

  // For task_owner and reviewer, filter to "My Shows" only
  const displayedShows = subRole === 'task_owner' || subRole === 'reviewer'
    ? clientProjects.filter((p) => p.assignedToCurrentUser) // In real app, check assignment
    : clientProjects

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header with CTA */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your shows and deliverables</p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <DashboardRefresh />
          {canSeeNewShow && (
            <Link href="/projects/new" prefetch={true}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Show
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={cn(
        'grid gap-4',
        canSeeQuotes && canSeeInvoices ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'
      )}>
        <StatsCard
          title="Active Shows"
          value={activeShows}
          icon={FolderKanban}
        />
        {canSeeQuotes && (
          <StatsCard
            title="Pending Quotes"
            value={pendingQuotesCount}
            icon={FileText}
          />
        )}
        {canSeeInvoices && (
          <StatsCard
            title="Unpaid Invoices"
            value={unpaidInvoices.length}
            icon={Receipt}
            iconColor={unpaidInvoices.length > 0 ? 'text-destructive' : undefined}
          />
        )}
      </div>

      {/* My Shows - Two Column Layout */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">My Shows</h2>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - NG Shows */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">NG Shows</h3>
            <div className="space-y-4">
              {ngShows.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-foreground">{project.name}</h4>
                        <StatusBadge status={project.status} />
                      </div>
                      
                      {/* Task Progress Breakdown */}
                      <div className="space-y-2">
                        {project.tasks.transcription !== undefined && (
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-24">Transcription</span>
                            <div className="flex-1">
                              <Progress value={project.tasks.transcription} className="h-1.5" />
                            </div>
                            <span className="text-xs font-medium w-10 text-right">{project.tasks.transcription}%</span>
                          </div>
                        )}
                        {project.tasks.translation !== undefined && (
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-24">Translation</span>
                            <div className="flex-1">
                              <Progress value={project.tasks.translation} className="h-1.5" />
                            </div>
                            <span className="text-xs font-medium w-10 text-right">{project.tasks.translation}%</span>
                          </div>
                        )}
                        {project.tasks.review !== undefined && (
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-24">Review</span>
                            <div className="flex-1">
                              <Progress value={project.tasks.review} className="h-1.5" />
                            </div>
                            <span className="text-xs font-medium w-10 text-right">{project.tasks.review}%</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-3">
                        Due {formatDate(project.deadline)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Right Column - Self-Serve */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Self-Serve</h3>
            <div className="space-y-4">
              {selfServeShows.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground">{project.name}</h4>
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          project.status === 'in_progress' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {project.statusLabel}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{project.assignees.join(', ')}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              
              {selfServeShows.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">No self-serve shows yet</p>
                    {canSeeNewShow && (
                      <Link href="/projects/new" prefetch={true}>
                        <Button variant="outline" size="sm" className="mt-2 gap-1.5">
                          <Plus className="h-3.5 w-3.5" />
                          Create Show
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quotes & Invoices (Client Admin only) + Recent Deliverables */}
      <div className={cn(
        'grid gap-6',
        canSeeQuotes && canSeeInvoices ? 'lg:grid-cols-3' : 'lg:grid-cols-1'
      )}>
        {/* Quotes (Client Admin only) */}
        {canSeeQuotes && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Quotes Awaiting Approval</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="space-y-3">
                {quotesAwaitingApproval.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <p className="font-medium">{quote.projectName}</p>
                      <p className="text-sm text-muted-foreground">
                        Submitted {quote.submittedDate}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-lg font-semibold">{formatCurrency(quote.amount)}</p>
                      <div className="flex gap-2">
                        <Link href={`/quotes/${quote.id}`}>
                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                        </Link>
                        <Button size="sm">Approve</Button>
                      </div>
                    </div>
                  </div>
                ))}
                {quotesAwaitingApproval.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No quotes pending approval
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoices (Client Admin only) */}
        {canSeeInvoices && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Unpaid Invoices</CardTitle>
              <Link href="/billing">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="space-y-3">
                {unpaidInvoices.slice(0, 4).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <Link href={`/billing/invoices/${invoice.id}`} className="flex-1">
                      <p className="font-medium hover:underline">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">{invoice.projectName}</p>
                    </Link>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={invoice.status} />
                      <p className="font-semibold">{formatCurrency(invoice.amount)}</p>
                      <a href={`/api/invoices/${invoice.id}/download`} download onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
                {unpaidInvoices.length === 0 && (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                    <p className="text-sm text-muted-foreground">All invoices paid</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Deliverables (all sub-roles) */}
        <Card className={cn(
          !canSeeQuotes && !canSeeInvoices && 'lg:col-span-1'
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Deliverables</CardTitle>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="space-y-3">
              {recentDeliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  <Link href={`/projects/${deliverable.projectId}`} className="flex-1">
                    <p className="text-sm font-medium hover:underline">{deliverable.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {deliverable.project} · {deliverable.format}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{deliverable.date}</span>
                    <a href={deliverable.previewUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </a>
                    <a href={deliverable.downloadUrl} download onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
              {recentDeliverables.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No recent deliverables
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { use, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  User,
  Clock,
  MoreHorizontal,
  Play,
  FileCheck,
  UserPlus,
  Languages,
  FolderKanban,
  Download,
  Flag,
  Send,
  AlertTriangle,
  Trash2,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OpenInEditorButton } from '@/components/open-in-editor-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockTasks, mockProjects, mockVendors, formatCurrency, formatDate, formatDateTime, TASK_STATUSES } from '@/lib/mock-data'
import { Input } from '@/components/ui/input'
import { useRole } from '../../layout'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/lib/types'

// Mock notes for demo
const mockTaskNotes = [
  {
    id: 'n1',
    content: 'Started working on this task. The source file quality is good.',
    authorId: 'v1',
    authorName: 'Lisa Translator',
    authorRole: 'vendor' as const,
    isBlocker: false,
    createdAt: '2024-02-03T10:30:00Z',
  },
  {
    id: 'n2',
    content: 'Please prioritize the dialogue scenes first. Client needs those reviewed ASAP.',
    authorId: '2',
    authorName: 'Mike Manager',
    authorRole: 'pm' as const,
    isBlocker: false,
    createdAt: '2024-02-03T14:15:00Z',
  },
]

// Mock files
const mockSourceFiles = [
  { id: 'f1', name: 'episode_01_master.mp4', size: 524288000, type: 'video/mp4', uploadedAt: '2024-01-15', uploadedBy: 'Mike Manager', url: '#' },
  { id: 'f2', name: 'episode_01_script.docx', size: 45000, type: 'application/docx', uploadedAt: '2024-01-15', uploadedBy: 'Mike Manager', url: '#' },
]

const mockDeliveredFiles = [
  { id: 'd1', name: 'episode_01_subtitles_ES.srt', size: 12000, type: 'application/x-subrip', uploadedAt: '2024-02-01', uploadedBy: 'Lisa Translator', url: '#' },
]

// Valid status transitions per PRD
const validTransitions: Record<TaskStatus, TaskStatus[]> = {
  unassigned: ['open_for_offers', 'assigned'],
  open_for_offers: ['assigned', 'unassigned'],
  assigned: ['in_progress', 'unassigned'],
  in_progress: ['submitted'],
  submitted: ['complete', 'in_progress'],
  complete: [],
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function getDaysUntilDeadline(dateString: string): { days: number; isOverdue: boolean; label: string } {
  const deadline = new Date(dateString)
  const today = new Date()
  const diffTime = deadline.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return { days: Math.abs(diffDays), isOverdue: true, label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}` }
  } else if (diffDays === 0) {
    return { days: 0, isOverdue: false, label: 'Due today' }
  } else {
    return { days: diffDays, isOverdue: false, label: `${diffDays} day${diffDays !== 1 ? 's' : ''} left` }
  }
}

function getServiceIcon(serviceType: string): string {
  const icons: Record<string, string> = {
    'Transcription': '🎙️',
    'Timing': '⏱️',
    'Translation': '🌐',
    'QC': '✅',
    'PM Verification': '📋',
    'Client Review': '👤',
  }
  return icons[serviceType] || '📄'
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { currentRole, userName } = useRole()
  const { toast } = useToast()
  const task = mockTasks.find((t) => t.id === id) || mockTasks[0]
  const project = mockProjects.find((p) => p.id === task.projectId)
  
  // TASK-011: Back to Project navigation
  const fromProject = searchParams.get('from') === 'project'
  const originProjectId = searchParams.get('projectId')
  
  const [notes, setNotes] = useState(mockTaskNotes)
  const [isDeleting, setIsDeleting] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [isBlocker, setIsBlocker] = useState(false)
  const [isSendingNote, setIsSendingNote] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showReassignDialog, setShowReassignDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [vendorSearchQuery, setVendorSearchQuery] = useState('')
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task.status)
  
  const isAdmin = currentRole === 'admin'
  const isPM = currentRole === 'pm'
  const isVendor = currentRole === 'vendor'
  const isAssignedVendor = isVendor // Simplified for mock
  const canEditTask = isAdmin || isPM
  const canChangeStatus = isAdmin || isPM
  const canAddNotes = canEditTask || isAssignedVendor
  const canFlagBlocker = isAssignedVendor
  const isTaskComplete = currentStatus === 'complete'
  
  const deadlineInfo = getDaysUntilDeadline(task.dueDate)
  const availableTransitions = validTransitions[currentStatus] || []
  
  const handleSendNote = async () => {
    if (!newNote.trim()) return
    
    setIsSendingNote(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const note = {
      id: `n${Date.now()}`,
      content: newNote,
      authorId: '1',
      authorName: userName,
      authorRole: currentRole,
      isBlocker: canFlagBlocker && isBlocker,
      createdAt: new Date().toISOString(),
    }
    
    setNotes([...notes, note])
    setNewNote('')
    setIsBlocker(false)
    setIsSendingNote(false)
  }

  const handleStatusChange = (newStatus: TaskStatus) => {
    const previousStatus = currentStatus
    setCurrentStatus(newStatus)
    
    // TASK-002: Audit logging - In production, this is recorded in the audit_log table
    // with actor (userName), timestamp, task_id, previous_status, new_status
    console.log('[Audit] Status transition:', {
      taskId: task.id,
      actor: userName,
      timestamp: new Date().toISOString(),
      previousStatus,
      newStatus,
    })
    
    // TASK-002: Notifications on key transitions
    // In production, these trigger email + in-app notifications via notification service
    const notificationMessages: Record<string, string> = {
      'open_for_offers': 'Task posted to Offers Board. Matching vendors notified.',
      'assigned': task.assignedVendor 
        ? `${task.assignedVendor} has been notified of assignment.`
        : 'Vendor assignment notification sent.',
      'submitted': 'PM notified: Task submitted for review.',
      'in_progress': previousStatus === 'submitted' 
        ? 'Vendor notified: Task sent back for rework.'
        : 'Task started.',
      'complete': 'Task completed. PM notified.',
      'unassigned': previousStatus === 'open_for_offers'
        ? 'Offer withdrawn from board.'
        : 'Task unassigned.',
    }
    
    if (notificationMessages[newStatus]) {
      toast({
        title: `Status: ${newStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
        description: notificationMessages[newStatus],
      })
    }
  }

  const handleDeleteTask = async () => {
    setIsDeleting(true)
    // Simulate API call for soft delete
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // If task was open_for_offers, the offer is withdrawn as part of deletion
    const wasOpenOffer = currentStatus === 'open_for_offers'
    
    setShowDeleteDialog(false)
    setIsDeleting(false)
    
    toast({
      title: 'Task deleted',
      description: wasOpenOffer 
        ? 'Task deleted and open offer withdrawn. Admin can recover within 30 days.'
        : 'Task has been soft-deleted. Admin can recover within 30 days.',
    })
    
    // Navigate back to tasks list
    router.push('/tasks')
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            {/* TASK-011: Back to Project navigation */}
            {fromProject && originProjectId && project && (
              <Link 
                href={`/projects/${originProjectId}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {project.name}
              </Link>
            )}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{task.name}</h1>
              <StatusBadge status={currentStatus} />
              {deadlineInfo.isOverdue && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </span>
              )}
            </div>
            {project && (
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{project.client}</span>
                <span>·</span>
                <Link href={`/projects/${project.id}`} className="flex items-center gap-1 hover:text-foreground">
                  <FolderKanban className="h-4 w-4" />
                  {project.name}
                </Link>
                {/* Service name visible to Admin/PM only */}
                {(isAdmin || isPM) && task.service && (
                  <>
                    <span>·</span>
                    <span className="text-muted-foreground">{task.service}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* EDIT-001: Open in Editor button */}
            <OpenInEditorButton
              taskId={task.id}
              projectId={task.projectId}
              taskName={task.name}
              sourceLanguage={task.sourceLanguage}
              targetLanguage={task.targetLanguage}
              serviceType={task.serviceType || task.service || 'Translation'}
              vendorId={task.vendorId}
              taskStatus={currentStatus}
              isAssignedVendor={isAssignedVendor}
              canView={canEditTask}
            />
            {/* Vendor actions - hidden when task is complete (read-only state) */}
            {!isTaskComplete && currentStatus === 'assigned' && isAssignedVendor && (
              <Button variant="outline" className="gap-1.5" onClick={() => handleStatusChange('in_progress')}>
                <Play className="h-4 w-4" />
                Start Task
              </Button>
            )}
            {!isTaskComplete && currentStatus === 'in_progress' && isAssignedVendor && (
              <Button variant="outline" className="gap-1.5" onClick={() => handleStatusChange('submitted')}>
                <FileCheck className="h-4 w-4" />
                Submit for Review
              </Button>
            )}
            {/* PM/Admin actions - hidden when task is complete (read-only state) */}
            {!isTaskComplete && !task.assignedVendor && canEditTask && (
              <Button variant="outline" className="gap-1.5" onClick={() => setShowAssignDialog(true)}>
                <UserPlus className="h-4 w-4" />
                Assign Vendor
              </Button>
            )}
            {!isTaskComplete && task.assignedVendor && canEditTask && (
              <Button variant="outline" className="gap-1.5" onClick={() => setShowReassignDialog(true)}>
                <RefreshCw className="h-4 w-4" />
                Reassign
              </Button>
            )}
            {/* Actions menu - hidden for complete tasks (fully read-only) */}
            {canEditTask && !isTaskComplete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {currentStatus === 'unassigned' && (
                    <DropdownMenuItem onClick={() => handleStatusChange('open_for_offers')}>
                      Post as Open Offer
                    </DropdownMenuItem>
                  )}
                  {currentStatus === 'open_for_offers' && (
                    <DropdownMenuItem onClick={() => handleStatusChange('unassigned')}>
                      Withdraw Offer
                    </DropdownMenuItem>
                  )}
                  {currentStatus === 'submitted' && (
                    <>
                      <DropdownMenuItem onClick={() => handleStatusChange('complete')}>
                        Approve & Complete
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                        Send Back for Rework
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Task Details</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Task Type</p>
                    <div className="flex items-center gap-2">
                      <span>{getServiceIcon(task.serviceType || 'Translation')}</span>
                      <p className="font-medium">{task.serviceType || task.service}</p>
                    </div>
                  </div>
                  {task.sourceLanguage && task.targetLanguage && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Language Pair</p>
                      <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{task.sourceLanguage} → {task.targetLanguage}</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Deadline</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{formatDate(task.dueDate)}</p>
                      <span className={cn(
                        "text-sm",
                        deadlineInfo.isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
                      )}>
                        ({deadlineInfo.label})
                      </span>
                    </div>
                  </div>
                  {canEditTask && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Select value={currentStatus} onValueChange={(v) => handleStatusChange(v as TaskStatus)} disabled={isTaskComplete}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={currentStatus}>
                            {TASK_STATUSES.find(s => s.value === currentStatus)?.label || currentStatus}
                          </SelectItem>
                          {availableTransitions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {TASK_STATUSES.find(s => s.value === status)?.label || status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Files Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Source Files */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Source Files</h4>
                  <div className="space-y-2">
                    {mockSourceFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                            <FileCheck className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivered Files */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Delivered Files</h4>
                  {mockDeliveredFiles.length > 0 ? (
                    <div className="space-y-2">
                      {mockDeliveredFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-emerald-50">
                              <FileCheck className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)} · Uploaded by {file.uploadedBy}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-1.5">
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                      No files delivered yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Notes</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                {/* Notes List */}
                <div className="space-y-4 mb-4">
                  {notes.length > 0 ? (
                    notes.map((note) => (
                      <div 
                        key={note.id} 
                        className={cn(
                          "rounded-lg border p-4",
                          note.isBlocker ? "border-red-300 bg-red-50" : "border-border"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{note.authorName}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                                {note.authorRole}
                              </span>
                              {note.isBlocker && (
                                <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                                  <Flag className="h-3 w-3" />
                                  Blocker
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(note.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-foreground">{note.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>
                  )}
                </div>

                {/* Add Note - only if task is not complete and user can add notes */}
                {canAddNotes && !isTaskComplete && (
                  <div className="border-t border-border pt-4">
                    <Textarea
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="mb-3"
                      maxLength={2000}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {canFlagBlocker && (
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="blocker" 
                              checked={isBlocker} 
                              onCheckedChange={(checked) => setIsBlocker(checked as boolean)}
                            />
                            <Label htmlFor="blocker" className="text-sm flex items-center gap-1 cursor-pointer">
                              <Flag className="h-3.5 w-3.5 text-red-500" />
                              Flag as Blocker
                            </Label>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {newNote.length}/2000
                        </span>
                      </div>
                      <Button 
                        onClick={handleSendNote} 
                        disabled={!newNote.trim() || isSendingNote}
                        className="gap-1.5"
                      >
                        <Send className="h-4 w-4" />
                        {isSendingNote ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                  </div>
                )}

                {isTaskComplete && (
                  <p className="text-sm text-muted-foreground text-center py-2 border-t border-border mt-4">
                    Task is complete. Notes are locked.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assigned Vendor - visible to Admin/PM only (vendors only see their own tasks) */}
            {(isAdmin || isPM) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Assigned To</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2">
                  {task.assignedVendor ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{task.assignedVendor}</p>
                        <p className="text-sm text-muted-foreground">Vendor</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">Unassigned</p>
                      {canEditTask && (
                        <Button variant="outline" className="gap-2 w-full" onClick={() => setShowAssignDialog(true)}>
                          <UserPlus className="h-4 w-4" />
                          Assign Vendor
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            </div>
        </div>
        
        {/* Payment Section - at the bottom of the page per Update TASK-001 */}
        <div className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Payment</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-semibold text-lg">{formatCurrency(task.price)}</span>
              </div>
              {isVendor && (
                <p className="text-xs text-muted-foreground mt-2">
                  This is your payment for this task.
                </p>
              )}
              {(isAdmin || isPM) && (
                <p className="text-xs text-muted-foreground mt-2">
                  Payment to assigned vendor for this task.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => !isDeleting && setShowDeleteDialog(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{task.name}&quot;? This action will archive the task. 
              An Admin can recover it within 30 days.
              {currentStatus === 'open_for_offers' && (
                <span className="block mt-2 text-amber-600">
                  Note: This task has an active open offer which will be automatically withdrawn.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Vendor</DialogTitle>
            <DialogDescription>
              Reassign from {task.assignedVendor} to a new vendor? 
              {task.assignedVendor} will immediately lose access.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">Select new vendor:</p>
            {/* Vendor selection would go here - using placeholder */}
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="v1">Lisa Translator</SelectItem>
                <SelectItem value="v2">Pierre Dubois</SelectItem>
                <SelectItem value="v3">Maria Garcia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReassignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowReassignDialog(false)}>
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TASK-003: Assign Vendor Modal */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Vendor</DialogTitle>
            <DialogDescription>
              Select a vendor for {task.serviceType || task.service} ({task.sourceLanguage} → {task.targetLanguage})
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Search */}
            <Input
              placeholder="Search vendors..."
              value={vendorSearchQuery}
              onChange={(e) => setVendorSearchQuery(e.target.value)}
            />
            
            {/* Vendor List */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {mockVendors
                .filter(v => v.name.toLowerCase().includes(vendorSearchQuery.toLowerCase()))
                .sort((a, b) => {
                  // Sort by availability first (Available > Limited > Unavailable)
                  const availOrder = { available: 0, limited: 1, unavailable: 2 }
                  const aOrder = availOrder[a.availability as keyof typeof availOrder] ?? 2
                  const bOrder = availOrder[b.availability as keyof typeof availOrder] ?? 2
                  if (aOrder !== bOrder) return aOrder - bOrder
                  // Then by on-time rate
                  return (b.onTimeRate || 0) - (a.onTimeRate || 0)
                })
                .map((vendor) => {
                  const isUnavailable = vendor.availability === 'unavailable'
                  const availabilityIcon = vendor.availability === 'available' ? '🟢' : vendor.availability === 'limited' ? '🟡' : '🔴'
                  
                  return (
                    <div
                      key={vendor.id}
                      onClick={() => !isUnavailable && setSelectedVendorId(vendor.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedVendorId === vendor.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50",
                        isUnavailable && "opacity-50 cursor-not-allowed hover:border-border"
                      )}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{vendor.name}</span>
                          <span title={`${vendor.availability}`}>{availabilityIcon}</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>
                            {vendor.tasksDelivered || 0} tasks delivered in {task.serviceType || 'Translation'}, {vendor.onTimeRate || 95}% on-time
                          </p>
                          <p>{vendor.activeTasks || 0} active task{(vendor.activeTasks || 0) !== 1 ? 's' : ''} this week</p>
                        </div>
                      </div>
                      {selectedVendorId === vendor.id && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <FileCheck className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  )
                })}
              
              {mockVendors.filter(v => v.name.toLowerCase().includes(vendorSearchQuery.toLowerCase())).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No vendors available for this service type.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAssignDialog(false)
              setSelectedVendorId(null)
              setVendorSearchQuery('')
            }}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!selectedVendorId) return
                setIsAssigning(true)
                await new Promise(r => setTimeout(r, 500))
                setCurrentStatus('assigned')
                setShowAssignDialog(false)
                setSelectedVendorId(null)
                setVendorSearchQuery('')
                setIsAssigning(false)
              }}
              disabled={!selectedVendorId || isAssigning}
            >
              {isAssigning ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

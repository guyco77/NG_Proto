'use client'

import { use, useState, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Calendar,
  Building2,
  User,
  Clock,
  MoreHorizontal,
  Plus,
  FileText,
  Edit,
  Trash2,
  Upload,
  Download,
  Lock,
  Archive,
  CheckCircle2,
  RefreshCw,
  Mic,
  Globe,
  ClipboardCheck,
  Timer,
  Volume2,
  Captions,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { StatusBadge } from '@/components/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { mockProjects, mockTasks, mockQuotes, formatCurrency, formatDate, getPriorityColor, PROJECT_STATUSES } from '@/lib/mock-data'
import { useRole } from '@/app/(app)/layout'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { OpenInEditorButton } from '@/components/open-in-editor-button'

function getTaskIcon(service: string) {
  const serviceLower = service.toLowerCase()
  
  // Match based on keywords in the service name per PRD: 🎙 🌐 ✅ 📋
  if (serviceLower.includes('transcription')) {
    return <Mic className="h-4 w-4" />  // 🎙 Speech to text
  }
  if (serviceLower.includes('subtitl') || serviceLower.includes('caption')) {
    return <Captions className="h-4 w-4" />  // Subtitles/captions
  }
  if (serviceLower.includes('translation')) {
    return <Globe className="h-4 w-4" />  // 🌐 Language conversion
  }
  if (serviceLower.includes('dubbing') || serviceLower.includes('voice') || serviceLower.includes('audio')) {
    return <Volume2 className="h-4 w-4" />  // Voice/audio dubbing
  }
  if (serviceLower.includes('qc') || serviceLower.includes('qa') || serviceLower.includes('quality')) {
    return <CheckCircle2 className="h-4 w-4" />  // ✅ Quality check
  }
  if (serviceLower.includes('review') || serviceLower.includes('verification')) {
    return <ClipboardCheck className="h-4 w-4" />  // 📋 Review
  }
  if (serviceLower.includes('timing')) {
    return <Timer className="h-4 w-4" />  // Timing/sync
  }
  
  return <FileText className="h-4 w-4" />
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'overview'
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  const project = mockProjects.find((p) => p.id === id) || mockProjects[0]
  const projectTasks = mockTasks.filter((t) => t.projectId === project.id)
  const projectQuote = mockQuotes.find((q) => q.projectId === project.id)
  
  const [activeTab, setActiveTab] = useState(initialTab)
  const [newNote, setNewNote] = useState('')
  const [noteVisibility, setNoteVisibility] = useState<'internal' | 'client' | 'vendor' | 'billing'>('internal')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false)
  const [newTaskService, setNewTaskService] = useState('')
  const [newTaskLanguage, setNewTaskLanguage] = useState('')
  
  // File replacement refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [replacingFileId, setReplacingFileId] = useState<string | null>(null)
  const [replacingFileType, setReplacingFileType] = useState<'source' | 'reference' | null>(null)
  
  // File upload refs
  const sourceUploadRef = useRef<HTMLInputElement>(null)
  const referenceUploadRef = useRef<HTMLInputElement>(null)
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editedProject, setEditedProject] = useState({
    name: project.name,
    clientContact: project.clientContact || '',
    pm: project.pm,
    priority: project.priority,
    deadline: project.deadline,
    startDate: project.startDate,
    videoVolume: project.videoVolume || 45.5, // Mock video volume in minutes
  })
  
  const isAdmin = currentRole === 'admin'
  const isPM = currentRole === 'pm'
  const isFinance = currentRole === 'finance'
  const isClient = currentRole === 'client'
  const canEditStatus = isAdmin || isPM
  const canSeeBilling = isAdmin || isFinance
  const isQuoteLocked = project.status !== 'draft' && project.status !== 'quoted'
  
  // Determine which fields can be edited based on role and quote status
  const canEditField = (field: string) => {
    if (!canEditStatus) return false
    
    // Quote-locked fields: services, languages, videoVolume, priority, deadline, startDate, client
    const quoteLockableFields = ['priority', 'deadline', 'startDate', 'videoVolume', 'services', 'languages', 'client']
    
    if (isQuoteLocked && quoteLockableFields.includes(field)) {
      return false // Fields are locked after quote approval
    }
    
    // Admin can edit all fields before quote approval
    if (isAdmin) {
      // After approval, admin can only edit: name, clientContact, pm
      if (isQuoteLocked) {
        return ['name', 'clientContact', 'pm'].includes(field)
      }
      return true
    }
    
    // PM can edit all fields except client, clientContact, pm before approval
    if (isPM) {
      if (['client', 'clientContact', 'pm'].includes(field)) return false
      if (isQuoteLocked) {
        return field === 'name' // PM can only edit name after approval
      }
      return true
    }
    
    return false
  }
  
  // Mock files data
  const sourceFiles = [
    { id: 'f1', name: 'Episode_01_Master.mov', size: 2500000000, uploadedAt: '2024-01-15', isLocked: isQuoteLocked },
    { id: 'f2', name: 'Episode_01_Script.docx', size: 245000, uploadedAt: '2024-01-15', isLocked: isQuoteLocked },
  ]
  
  const referenceFiles = [
    { id: 'f3', name: 'Style_Guide.pdf', size: 1200000, uploadedAt: '2024-01-14', isLocked: false },
    { id: 'f4', name: 'Glossary.xlsx', size: 85000, uploadedAt: '2024-01-14', isLocked: false },
  ]
  
  const deliveredFiles = [
    { id: 'f5', name: 'Episode_01_ES_Sub.srt', size: 45000, uploadedAt: '2024-02-01', isLocked: false },
    { id: 'f6', name: 'Episode_01_FR_Sub.srt', size: 48000, uploadedAt: '2024-02-03', isLocked: false },
  ]
  
  // Mock notes data
  const notes = [
    { id: 'n1', content: 'Client approved the Spanish subtitles with minor corrections.', visibility: 'client' as const, authorName: 'Mike Manager', authorRole: 'pm' as const, createdAt: '2024-02-01T14:30:00Z' },
    { id: 'n2', content: 'Vendor rates confirmed for German dubbing.', visibility: 'internal' as const, authorName: 'Sarah Admin', authorRole: 'admin' as const, createdAt: '2024-01-28T10:15:00Z' },
    { id: 'n3', content: 'Invoice #INV-2024-003 issued.', visibility: 'billing' as const, authorName: 'David Finance', authorRole: 'finance' as const, createdAt: '2024-01-25T09:00:00Z' },
  ]

  const handleStatusChange = (newStatus: string) => {
    toast({
      title: 'Status Updated',
      description: `Project status changed to ${newStatus.replace('_', ' ')}`,
    })
  }

  const handleEditClick = () => {
    setIsEditing(true)
    // Reset edited values to current project values
    setEditedProject({
      name: project.name,
      clientContact: project.clientContact || '',
      pm: project.pm,
      priority: project.priority,
      deadline: project.deadline,
      startDate: project.startDate,
      videoVolume: project.videoVolume || 45.5,
    })
  }

  const handleSaveProject = () => {
    toast({
      title: 'Project Updated',
      description: 'Project details have been saved successfully.',
    })
    setIsEditing(false)
  }

const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset to original values
    setEditedProject({
      name: project.name,
      clientContact: project.clientContact || '',
      pm: project.pm,
      priority: project.priority,
      deadline: project.deadline,
      startDate: project.startDate,
      videoVolume: project.videoVolume || 45.5,
    })
  }

  const handleReplaceFile = (fileId: string, fileType: 'source' | 'reference') => {
    setReplacingFileId(fileId)
    setReplacingFileType(fileType)
    fileInputRef.current?.click()
  }

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && replacingFileId) {
      toast({
        title: 'File Replaced',
        description: `"${file.name}" has replaced the previous file.`,
      })
      // Reset state
      setReplacingFileId(null)
      setReplacingFileType(null)
      // Reset the input so the same file can be selected again
      event.target.value = ''
    }
  }

  const handleSourceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      toast({
        title: 'Source File Uploaded',
        description: `${files.length} file(s) uploaded successfully.`,
      })
      event.target.value = ''
    }
  }

  const handleReferenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      toast({
        title: 'Reference File Uploaded',
        description: `${files.length} file(s) uploaded successfully.`,
      })
      event.target.value = ''
    }
  }
  
  const handleCancelProject = () => {
    if (!cancelReason.trim()) return
    if (isClient) {
      // Client requesting cancellation - posts a note to PM
      toast({
        title: 'Cancellation Requested',
        description: 'Your cancellation request has been submitted. Our team will review it and contact you.',
      })
    } else {
      // Admin/PM actually cancelling
      toast({
        title: 'Project Cancelled',
        description: `Project has been cancelled. Reason: ${cancelReason}`,
      })
    }
    setShowCancelDialog(false)
    setCancelReason('')
  }

  const handleArchiveProject = () => {
    toast({
      title: 'Project Archived',
      description: `"${project.name}" has been moved to the archive.`,
    })
    setShowArchiveDialog(false)
  }

  const handleAddTask = () => {
    if (!newTaskService) return
    toast({
      title: 'Task Created',
      description: `New ${newTaskService} task has been added to the project.`,
    })
    setShowAddTaskDialog(false)
    setNewTaskService('')
    setNewTaskLanguage('')
  }
  
  // Archive is only available for Closed or Cancelled projects per PRD PROJ-009
  const canArchive = project.status === 'closed' || project.status === 'cancelled'
  
  // Cancel is available for any non-closed, non-cancelled project
  const canCancel = project.status !== 'closed' && project.status !== 'cancelled'

  const handleAddNote = () => {
    if (!newNote.trim()) return
    toast({
      title: 'Note Added',
      description: `Note added with ${noteVisibility} visibility`,
    })
    setNewNote('')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(1)} GB`
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`
    return `${(bytes / 1000).toFixed(1)} KB`
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              {isEditing && canEditField('name') ? (
                <Input
                  value={editedProject.name}
                  onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                  className="text-2xl font-semibold h-auto py-0 px-2 w-64"
                />
              ) : (
                <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
              )}
              <StatusBadge status={project.status} />
              {isEditing && canEditField('priority') ? (
                <Select
                  value={editedProject.priority}
                  onValueChange={(value) => setEditedProject({ ...editedProject, priority: value })}
                >
                  <SelectTrigger className={cn('w-24 h-7 text-xs', getPriorityColor(editedProject.priority))}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium flex items-center gap-1', getPriorityColor(project.priority))}>
                  {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                  {isEditing && !canEditField('priority') && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Lock className="h-3 w-3" />
                        </TooltipTrigger>
                        <TooltipContent>Locked — tied to the approved quote.</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              {/* Client name hidden from client view - implicit from logged-in user's company */}
              {!isClient && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {project.client}
                </span>
              )}
              {/* PM hidden from client view */}
              {!isClient && (
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {project.pm}
                </span>
              )}
              {project.startDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Started {formatDate(project.startDate)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Due {formatDate(project.deadline)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Status selector - Admin/PM only */}
            {canEditStatus && (
              <Select defaultValue={project.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {/* View Quote - hidden from clients (quote flow is separate) */}
            {projectQuote && !isClient && (
              <Link href={`/quotes/${projectQuote.id}`}>
                <Button variant="outline" className="gap-1.5">
                  <FileText className="h-4 w-4" />
                  View Quote
                </Button>
              </Link>
            )}
            {/* Create Quote - Admin/PM only */}
            {!projectQuote && canEditStatus && (
              <Link href={`/quotes/new?project=${project.id}`}>
                <Button variant="outline" className="gap-1.5">
                  <FileText className="h-4 w-4" />
                  Create Quote
                </Button>
              </Link>
            )}
            {/* Edit button - Admin/PM only, hidden from clients */}
            {canEditStatus && !isEditing && (
              <Button variant="outline" className="gap-1.5" onClick={handleEditClick}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            {isEditing && (
              <>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProject}>
                  Save Changes
                </Button>
              </>
            )}
            {/* Actions menu - different for clients vs admins */}
            {!isClient ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEditStatus && canArchive && (
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowArchiveDialog(true); }}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive Project
                    </DropdownMenuItem>
                  )}
                  {canEditStatus && canCancel && (
                    <DropdownMenuItem 
                      className="text-destructive"
                      onSelect={(e) => { e.preventDefault(); setShowCancelDialog(true); }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cancel Project
                    </DropdownMenuItem>
                  )}
                  {!canArchive && !canCancel && (
                    <DropdownMenuItem disabled>
                      No actions available
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Client view - only Request Cancellation available */
              canCancel && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onSelect={(e) => { e.preventDefault(); setShowCancelDialog(true); }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Request Cancellation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            {canSeeBilling && <TabsTrigger value="billing">Billing</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Project Details */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TooltipProvider>
                    {/* Client - hidden from client view (implicit from logged-in user) */}
                    {!isClient && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          Client
                          {!canEditField('client') && isEditing && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Lock className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {isQuoteLocked ? 'Locked — this field is tied to the approved quote.' : 'Admin only'}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </span>
                        <span className="text-sm font-medium">{project.client}</span>
                      </div>
                    )}
                    
                    {/* Client Contact - hidden from client view */}
                    {!isClient && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          Client Contact
                          {!canEditField('clientContact') && isEditing && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Lock className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>Admin only</TooltipContent>
                            </Tooltip>
                          )}
                        </span>
                        {isEditing && canEditField('clientContact') ? (
                          <Input
                            value={editedProject.clientContact}
                            onChange={(e) => setEditedProject({ ...editedProject, clientContact: e.target.value })}
                            className="w-40 h-7 text-sm"
                          />
                        ) : (
                          <span className="text-sm font-medium">{project.clientContact || '-'}</span>
                        )}
                      </div>
                    )}
                    
                    {/* Project Manager - hidden from client view */}
                    {!isClient && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          Project Manager
                          {!canEditField('pm') && isEditing && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Lock className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>Admin only</TooltipContent>
                            </Tooltip>
                          )}
                        </span>
                        {isEditing && canEditField('pm') ? (
                          <Select
                            value={editedProject.pm}
                            onValueChange={(value) => setEditedProject({ ...editedProject, pm: value })}
                          >
                            <SelectTrigger className="w-40 h-7 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mike Manager">Mike Manager</SelectItem>
                              <SelectItem value="Sarah Admin">Sarah Admin</SelectItem>
                              <SelectItem value="John PM">John PM</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm font-medium">{project.pm}</span>
                        )}
                      </div>
                    )}
                    
                    {/* Start Date */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        Start Date
                        {!canEditField('startDate') && isEditing && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>Locked — this field is tied to the approved quote.</TooltipContent>
                          </Tooltip>
                        )}
                      </span>
                      {isEditing && canEditField('startDate') ? (
                        <Input
                          type="date"
                          value={editedProject.startDate}
                          onChange={(e) => setEditedProject({ ...editedProject, startDate: e.target.value })}
                          className="w-40 h-7 text-sm"
                        />
                      ) : (
                        <span className="text-sm font-medium">{formatDate(project.startDate)}</span>
                      )}
                    </div>
                    
                    {/* Deadline */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        Deadline
                        {!canEditField('deadline') && isEditing && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>Locked — this field is tied to the approved quote.</TooltipContent>
                          </Tooltip>
                        )}
                      </span>
                      {isEditing && canEditField('deadline') ? (
                        <Input
                          type="date"
                          value={editedProject.deadline}
                          onChange={(e) => setEditedProject({ ...editedProject, deadline: e.target.value })}
                          className="w-40 h-7 text-sm"
                        />
                      ) : (
                        <span className="text-sm font-medium">{formatDate(project.deadline)}</span>
                      )}
                    </div>
                    
                    {/* Video Volume */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        Video Volume
                        {!canEditField('videoVolume') && isEditing && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>Locked — this field is tied to the approved quote.</TooltipContent>
                          </Tooltip>
                        )}
                      </span>
                      {isEditing && canEditField('videoVolume') ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.5"
                            value={editedProject.videoVolume}
                            onChange={(e) => setEditedProject({ ...editedProject, videoVolume: parseFloat(e.target.value) || 0 })}
                            className="w-20 h-7 text-sm"
                          />
                          <span className="text-sm text-muted-foreground">min</span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium">{editedProject.videoVolume} min</span>
                      )}
                    </div>
                  </TooltipProvider>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    Services & Languages
                    {isEditing && isQuoteLocked && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>Locked — tied to the approved quote.</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2">
                  <div className="space-y-2">
                    {/* Group languages by service name from catalog */}
                    {project.languages && project.languages.length > 0 ? (
                      // Show service name with its language pairs
                      Object.entries(
                        project.languages.reduce((acc, lang) => {
                          const serviceName = lang.service
                          if (!acc[serviceName]) acc[serviceName] = []
                          acc[serviceName].push(lang)
                          return acc
                        }, {} as Record<string, typeof project.languages>)
                      ).map(([serviceName, langs]) => (
                        <div key={serviceName} className="text-sm">
                          <span className="font-medium">{serviceName}</span>
                          <span className="text-muted-foreground"> — </span>
                          <span>
                            {langs.map((lang, i) => (
                              <span key={i}>
                                {lang.source} → {lang.target}
                                {i < langs.length - 1 && ', '}
                              </span>
                            ))}
                          </span>
                        </div>
                      ))
                    ) : (
                      // Fallback: show services without language pairs (e.g. Convert Files)
                      project.services.map((service) => (
                        <div key={service} className="text-sm font-medium">
                          {service}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Task Pipeline - moved from Tasks tab */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Task Pipeline</CardTitle>
                {canEditStatus && project.status !== 'draft' && project.status !== 'quoted' && (
                  <Button size="sm" className="gap-1.5" onClick={() => setShowAddTaskDialog(true)}>
                    <Plus className="h-4 w-4" />
                    Add Task
                  </Button>
                )}
                {(project.status === 'draft' || project.status === 'quoted') && canEditStatus && (
                  <Button size="sm" className="gap-1.5" disabled title="Approve quote to add tasks">
                    <Plus className="h-4 w-4" />
                    Add Task
                  </Button>
                )}
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                {projectTasks.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="flex items-center min-w-max pb-6">
                      {projectTasks.map((task, index) => (
                        <div key={task.id} className="flex items-center">
                          {/* Connector line before card (except first) */}
                          {index > 0 && (
                            <div className="w-8 h-0.5 bg-gray-300" />
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={`/tasks/${task.id}`}>
                                  <div className={cn(
                                    'relative flex flex-col items-center justify-center p-4 rounded-lg border-2 w-[120px] h-[120px] cursor-pointer transition-all hover:shadow-md',
                                    task.status === 'completed' ? 'border-emerald-500 bg-emerald-50' :
                                    task.status === 'in_progress' ? 'border-blue-500 bg-blue-50' :
                                    task.status === 'review' ? 'border-purple-500 bg-purple-50' :
                                    task.status === 'assigned' ? 'border-amber-500 bg-amber-50' :
                                    'border-gray-200 bg-gray-50'
                                  )}>
                                    {/* Type Icon */}
                                    <div className={cn(
                                      'flex h-8 w-8 items-center justify-center rounded-full text-sm',
                                      task.status === 'completed' ? 'bg-emerald-500 text-white' :
                                      task.status === 'in_progress' ? 'bg-blue-500 text-white' :
                                      task.status === 'review' ? 'bg-purple-500 text-white' :
                                      task.status === 'assigned' ? 'bg-amber-500 text-white' :
                                      'bg-gray-300 text-gray-600'
                                    )}>
                                      {getTaskIcon(task.service)}
                                    </div>
                                    {/* Service + Language */}
                                    <p className="text-xs font-medium text-center mt-2 line-clamp-1">{task.service}</p>
                                    <p className="text-[10px] text-muted-foreground text-center">
                                      {task.sourceLanguage && task.targetLanguage 
                                        ? `${task.sourceLanguage} → ${task.targetLanguage}` 
                                        : task.targetLanguage || task.sourceLanguage || ''}
                                    </p>
                                    {/* Assignee Badge - positioned at bottom with tooltip for full name */}
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            {task.assignedVendor ? (
                                              // Check if this is an NG vendor (vendorId starts with 'v') and we're in client view
                                              isClient && task.vendorId?.startsWith('v') ? (
                                                // NG vendor in client view - show "NG" badge
                                                <div 
                                                  className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground border-2 border-background leading-none cursor-default"
                                                  aria-label="Assigned"
                                                >
                                                  NG
                                                </div>
                                              ) : (
                                                // Client team member or admin view - show initials
                                                <div 
                                                  className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground border-2 border-background leading-none cursor-default"
                                                  aria-label={task.assignedVendor}
                                                  title={task.assignedVendor}
                                                >
                                                  {task.assignedVendor.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                              )
                                            ) : (
                                              <div 
                                                className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[9px] text-gray-500 border-2 border-background leading-none cursor-default"
                                                aria-label="Unassigned"
                                                title="Unassigned"
                                              >
                                                N/A
                                              </div>
                                            )}
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {task.assignedVendor 
                                              ? (isClient && task.vendorId?.startsWith('v') ? 'Assigned' : task.assignedVendor)
                                              : 'Unassigned'
                                            }
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </div>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">{task.name}</p>
                                <p className="text-xs text-muted-foreground">Due: {task.dueDate ? formatDate(task.dueDate) : 'Not set'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ))}
                      {canEditStatus && project.status !== 'draft' && project.status !== 'quoted' && (
                        <>
                          {/* Connector line to Add Task button */}
                          {projectTasks.length > 0 && (
                            <div className="w-8 h-0.5 bg-gray-300" />
                          )}
                          <button
                            onClick={() => setShowAddTaskDialog(true)}
                            className="flex h-[120px] w-[120px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                          >
                            <Plus className="h-6 w-6 text-muted-foreground" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border">
                    <div className="text-center">
                      <p className="text-muted-foreground">No tasks yet</p>
                      {canEditStatus && project.status !== 'draft' && project.status !== 'quoted' && (
                        <Button variant="outline" className="mt-2 gap-2" onClick={() => setShowAddTaskDialog(true)}>
                          <Plus className="h-4 w-4" />
                          Create First Task
                        </Button>
                      )}
                      {(project.status === 'draft' || project.status === 'quoted') && (
                        <p className="mt-2 text-xs text-muted-foreground">Approve quote to add tasks</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            {isQuoteLocked && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <Lock className="h-4 w-4" />
                <span>Source files are locked after quote approval. Only reference files can be updated.</span>
              </div>
            )}

            {/* Source Files - hidden from clients on NG-led projects per PRD */}
            {!isClient && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Source Files ({sourceFiles.length})</CardTitle>
                  {!isQuoteLocked && canEditStatus && (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => sourceUploadRef.current?.click()}>
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2">
                  <div className="space-y-2">
                    {sourceFiles.length > 0 ? sourceFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)} · Uploaded by {file.uploadedBy || 'Admin'} · {formatDate(file.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isQuoteLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download file</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {!isQuoteLocked && canEditStatus && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="ghost" onClick={() => handleReplaceFile(file.id, 'source')}>
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Replace file</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border">
                        <p className="text-sm text-muted-foreground">No source files uploaded</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reference Files - visible to clients for context */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Reference Files ({referenceFiles.length})</CardTitle>
                {/* Upload button hidden from clients on NG-led projects */}
                {!isQuoteLocked && canEditStatus && (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => referenceUploadRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                )}
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <div className="space-y-2">
                  {referenceFiles.length > 0 ? referenceFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {/* Hide uploader name from clients */}
                            {formatFileSize(file.size)} · {isClient ? 'Uploaded' : `Uploaded by ${file.uploadedBy || 'Admin'}`} · {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isClient && isQuoteLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download file</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {!isQuoteLocked && canEditStatus && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" onClick={() => handleReplaceFile(file.id, 'reference')}>
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Replace file</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border">
                      <p className="text-sm text-muted-foreground">No reference files uploaded</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivered Files */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delivered Files ({deliveredFiles.length})</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <div className="space-y-2">
                  {deliveredFiles.length > 0 ? deliveredFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {/* Hide vendor name from clients */}
                            {formatFileSize(file.size)} · {isClient ? 'Delivered' : `Delivered by ${file.uploadedBy || 'Vendor'}`} · {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download file</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )) : (
                    <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border">
                      <p className="text-sm text-muted-foreground">
                        {isClient 
                          ? 'Deliveries will appear here when tasks are completed.' 
                          : 'No delivered files yet'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              className="hidden"
              accept="*/*"
            />
            <input
              type="file"
              ref={sourceUploadRef}
              onChange={handleSourceUpload}
              className="hidden"
              accept="*/*"
              multiple
            />
            <input
              type="file"
              ref={referenceUploadRef}
              onChange={handleReferenceUpload}
              className="hidden"
              accept="*/*"
              multiple
            />
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-6">
            {/* Add Note */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isClient ? 'Add Comment' : 'Add Note'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={isClient ? 'Write a comment...' : 'Write a note...'}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  {/* Clients can only post Client Notes - no visibility selector needed */}
                  {!isClient ? (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="visibility" className="text-sm">Visibility:</Label>
                      <Select value={noteVisibility} onValueChange={(v: any) => setNoteVisibility(v)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">Internal</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                          {canSeeBilling && <SelectItem value="billing">Billing</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div /> /* Empty div to maintain flex spacing */
                  )}
                  <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                    {isClient ? 'Post Comment' : 'Add Note'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notes List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {isClient ? 'Comments' : 'Notes'} ({
                    isClient 
                      ? notes.filter(n => n.visibility === 'client').length 
                      : notes.length
                  })
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <div className="space-y-4">
                  {/* Filter notes for client view - only show Client Notes */}
                  {[...notes]
                    .filter(note => isClient ? note.visibility === 'client' : true)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((note) => {
                      // For client view: show "NG Team" for admin/pm/finance roles
                      const isNGStaff = ['admin', 'pm', 'finance'].includes(note.authorRole)
                      const displayName = isClient && isNGStaff ? 'NG Team' : note.authorName
                      const displayInitials = isClient && isNGStaff ? 'NG' : note.authorName.split(' ').map(n => n[0]).join('')
                      
                      return (
                        <div key={note.id} className="rounded-lg border border-border p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {displayInitials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{displayName}</span>
                              {/* Hide role badge for clients when viewing NG staff notes */}
                              {!(isClient && isNGStaff) && (
                                <span className={cn(
                                  'rounded-full px-2 py-0.5 text-xs font-medium',
                                  note.authorRole === 'admin' ? 'bg-red-100 text-red-700' :
                                  note.authorRole === 'pm' ? 'bg-blue-100 text-blue-700' :
                                  note.authorRole === 'finance' ? 'bg-amber-100 text-amber-700' :
                                  note.authorRole === 'vendor' ? 'bg-purple-100 text-purple-700' :
                                  note.authorRole === 'client' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                                )}>
                                  {note.authorRole === 'pm' ? 'PM' : note.authorRole.charAt(0).toUpperCase() + note.authorRole.slice(1)}
                                </span>
                              )}
                              {/* Hide visibility badge from clients */}
                              {!isClient && (
                                <span className={cn(
                                  'rounded-full px-2 py-0.5 text-xs',
                                  note.visibility === 'internal' ? 'bg-gray-100 text-gray-700' :
                                  note.visibility === 'client' ? 'bg-blue-100 text-blue-700' :
                                  note.visibility === 'vendor' ? 'bg-purple-100 text-purple-700' :
                                  'bg-amber-100 text-amber-700'
                                )}>
                                  {note.visibility.charAt(0).toUpperCase() + note.visibility.slice(1)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{note.content}</p>
                        </div>
                      )
                    })}
                  {(isClient ? notes.filter(n => n.visibility === 'client').length : notes.length) === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {isClient ? 'No comments yet' : 'No notes yet'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab (Admin/Finance only) */}
          {canSeeBilling && (
            <TabsContent value="billing" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="text-2xl font-semibold">{formatCurrency(project.budget, project.currency)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Spent</p>
                    <p className="text-2xl font-semibold">{formatCurrency(project.spent, project.currency)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-2xl font-semibold">{formatCurrency(project.budget - project.spent, project.currency)}</p>
                  </CardContent>
                </Card>
              </div>

              {projectQuote && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quote</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Quote #{projectQuote.id.toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDate(projectQuote.createdAt)} - Expires {formatDate(projectQuote.expiresAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={projectQuote.status} />
                        <p className="text-xl font-semibold">{formatCurrency(projectQuote.totalAmount, project.currency)}</p>
                        <Link href={`/quotes/${projectQuote.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Invoices</CardTitle>
                  <Link href={`/billing?project=${project.id}`}>
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2">
                  <p className="text-sm text-muted-foreground">No invoices yet for this project.</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Cancel Project Dialog - different behavior for clients vs admin/PM */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isClient ? 'Request Cancellation' : 'Cancel Project'}</DialogTitle>
            <DialogDescription>
              {isClient 
                ? 'Submit a cancellation request. Our team will review it and contact you.'
                : 'Are you sure you want to cancel this project? This action cannot be undone.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-reason">Reason for cancellation</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Enter the reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              {isClient ? 'Cancel' : 'Keep Project'}
            </Button>
            <Button 
              variant={isClient ? 'default' : 'destructive'} 
              onClick={handleCancelProject} 
              disabled={!cancelReason.trim()}
            >
              {isClient ? 'Submit Request' : 'Cancel Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Project Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive &quot;{project.name}&quot;? Archived projects can be restored later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleArchiveProject}>
              Archive Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog - Individual task types only, no Service-level addition */}
      <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>
              Select a task type to add to this project. Individual tasks only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-type">Task Type</Label>
              <Select value={newTaskService} onValueChange={setNewTaskService}>
                <SelectTrigger id="task-type">
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  {/* Individual task step types only - per PRD PROJ-004 */}
                  <SelectItem value="Transcription">Transcription</SelectItem>
                  <SelectItem value="Transcription AI">Transcription AI</SelectItem>
                  <SelectItem value="Timing">Timing</SelectItem>
                  <SelectItem value="Timing AI">Timing AI</SelectItem>
                  <SelectItem value="Translation">Translation</SelectItem>
                  <SelectItem value="Translation from Audio">Translation from Audio</SelectItem>
                  <SelectItem value="Upload TT">Upload TT</SelectItem>
                  <SelectItem value="Upload Text File">Upload Text File</SelectItem>
                  <SelectItem value="QC">QC</SelectItem>
                  <SelectItem value="PM Verification">PM Verification</SelectItem>
                  <SelectItem value="Proofread">Proofread</SelectItem>
                  <SelectItem value="Client Review">Client Review</SelectItem>
                  <SelectItem value="Upload Client Asset">Upload Client Asset</SelectItem>
                  <SelectItem value="Upload Rough Cut">Upload Rough Cut</SelectItem>
                  <SelectItem value="New Cut">New Cut</SelectItem>
                  <SelectItem value="Project Creation">Project Creation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Language pair selector - only for tasks that require it */}
            {['Translation', 'Translation from Audio', 'QC', 'Proofread', 'Transcription', 'Transcription AI', 'Timing', 'Timing AI'].includes(newTaskService) && (
              <div className="space-y-2">
                <Label>Language Pair</Label>
                <div className="flex items-center gap-2">
                  <Select value={newTaskLanguage.split('→')[0]?.trim() || ''} onValueChange={(src) => setNewTaskLanguage(`${src} → ${newTaskLanguage.split('→')[1]?.trim() || ''}`)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EN">EN</SelectItem>
                      <SelectItem value="ES">ES</SelectItem>
                      <SelectItem value="FR">FR</SelectItem>
                      <SelectItem value="DE">DE</SelectItem>
                      <SelectItem value="JA">JA</SelectItem>
                      <SelectItem value="KO">KO</SelectItem>
                      <SelectItem value="AR">AR</SelectItem>
                      <SelectItem value="HE">HE</SelectItem>
                      <SelectItem value="PT">PT</SelectItem>
                      <SelectItem value="ZH">ZH</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">→</span>
                  <Select value={newTaskLanguage.split('→')[1]?.trim() || ''} onValueChange={(tgt) => setNewTaskLanguage(`${newTaskLanguage.split('→')[0]?.trim() || ''} → ${tgt}`)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EN">EN</SelectItem>
                      <SelectItem value="ES">ES</SelectItem>
                      <SelectItem value="FR">FR</SelectItem>
                      <SelectItem value="DE">DE</SelectItem>
                      <SelectItem value="JA">JA</SelectItem>
                      <SelectItem value="KO">KO</SelectItem>
                      <SelectItem value="AR">AR</SelectItem>
                      <SelectItem value="HE">HE</SelectItem>
                      <SelectItem value="PT">PT</SelectItem>
                      <SelectItem value="ZH">ZH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTaskDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTask} disabled={!newTaskService}>
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

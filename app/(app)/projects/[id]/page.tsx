'use client'

import { use, useState, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
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
  Eye,
  Copy,
  Split,
  AlertTriangle,
  UserPlus,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { StatusBadge } from '@/components/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import { mockProjects, mockTasks, mockQuotes, formatCurrency, formatDate, getPriorityColor, PROJECT_STATUSES, SERVICES_LIST } from '@/lib/mock-data'
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
  const router = useRouter()
  // Check if this is a newly duplicated project - show Files tab if so
  const isDuplicated = searchParams.get('duplicated') === 'true'
  const initialTab = searchParams.get('tab') || (isDuplicated ? 'files' : 'overview')
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
  
  // PROJ-012: Duplicate Project dialog
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [duplicateName, setDuplicateName] = useState(`${project.name} (Copy)`)
  const [isDuplicating, setIsDuplicating] = useState(false)
  
  // PROJ-013: Split Project (Series → Episodes) dialog
  const [showSplitDialog, setShowSplitDialog] = useState(false)
  const [splitTotalEpisodes, setSplitTotalEpisodes] = useState<number | ''>('')
  const [splitPrefix, setSplitPrefix] = useState(project.name)
  const [isSplitting, setIsSplitting] = useState(false)
  const [splitProgress, setSplitProgress] = useState({ created: 0, total: 0 })
  const [splitError, setSplitError] = useState('')
  const [splitResult, setSplitResult] = useState<{
    show: boolean
    created: number
    failed: number
    failedEpisodes: number[]
  }>({ show: false, created: 0, failed: 0, failedEpisodes: [] })
  
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false)
  const [newTaskService, setNewTaskService] = useState('')
  const [newTaskLanguage, setNewTaskLanguage] = useState('')
  
  // TASK-004: Multi-select state for tasks
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false)
  const [bulkSelectedVendorId, setBulkSelectedVendorId] = useState<string | null>(null)
  const [bulkVendorSearchQuery, setBulkVendorSearchQuery] = useState('')
  const [isBulkAssigning, setIsBulkAssigning] = useState(false)
  const [localTaskUpdates, setLocalTaskUpdates] = useState<Record<string, { status?: string; assignedVendor?: string }>>({})
  
  // Apply local updates to project tasks
  const updatedProjectTasks = projectTasks.map(t => ({ ...t, ...localTaskUpdates[t.id] }))
  const selectedTasks = updatedProjectTasks.filter(t => selectedTaskIds.includes(t.id))
  const eligibleForAssign = selectedTasks.filter(t => t.status === 'unassigned')
  const ineligibleCount = selectedTasks.length - eligibleForAssign.length
  
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
  
  // Mock files data - Source is a SINGLE video file per project (per PROJ-006)
  const [sourceFile, setSourceFile] = useState<{ id: string; name: string; size: number; duration?: string; uploadedAt: string; uploadedBy?: string } | null>(
    { id: 'f1', name: 'Episode_01_Master.mov', size: 2500000000, duration: '45:32', uploadedAt: '2024-01-15', uploadedBy: 'Mike Manager' }
  )
  
  // State for source file delete confirmation
  const [showDeleteSourceDialog, setShowDeleteSourceDialog] = useState(false)
  const [isUploadingSource, setIsUploadingSource] = useState(false)
  
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
    const file = event.target.files?.[0]
    if (file) {
      // Only one source file allowed - set uploading state
      setIsUploadingSource(true)
      // Simulate upload delay
      setTimeout(() => {
        setSourceFile({
          id: `f-${Date.now()}`,
          name: file.name,
          size: file.size,
          duration: '45:32', // Would be detected from actual video
          uploadedAt: new Date().toISOString().split('T')[0],
          uploadedBy: 'Mike Manager', // Current user
        })
        setIsUploadingSource(false)
        toast({
          title: 'Source Video Uploaded',
          description: `"${file.name}" uploaded successfully. Billable volume detected.`,
        })
      }, 1500)
      event.target.value = ''
    }
  }

  const handleDeleteSourceFile = () => {
    const fileName = sourceFile?.name
    setSourceFile(null)
    setShowDeleteSourceDialog(false)
    toast({
      title: 'Source File Deleted',
      description: `"${fileName}" has been deleted. Upload a new source video to continue.`,
    })
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

  // PROJ-012: Duplicate Project handler
  const handleDuplicateProject = () => {
    if (!duplicateName.trim()) return
    
    setIsDuplicating(true)
    
    // Simulate API call
    setTimeout(() => {
      const newProjectId = `dup-${Date.now()}`
      
      setIsDuplicating(false)
      setShowDuplicateDialog(false)
      setDuplicateName(`${project.name} (Copy)`)
      
      toast({
        title: 'Project duplicated. Upload your source files to continue.',
        description: `"${duplicateName}" created in Draft status.`,
      })
      
// Redirect to new project detail with highlight flag
      router.push(`/projects/${newProjectId}?duplicated=true`)
    }, 1000)
  }

  // PROJ-013: Split Project helpers and handler
  const getEpisodeNames = (prefix: string, total: number) => {
    if (total < 2) return []
    const padLength = total > 99 ? 3 : 2
    const names: string[] = []
    for (let i = 2; i <= total; i++) {
      names.push(`${prefix} E${String(i).padStart(padLength, '0')}`)
    }
    return names
  }

  const handleSplitProject = (retryOnly = false, failedEpisodesToRetry: number[] = []) => {
    if (!splitTotalEpisodes || splitTotalEpisodes < 2 || !splitPrefix.trim()) return
    
    setIsSplitting(true)
    setSplitError('')
    setSplitResult({ show: false, created: 0, failed: 0, failedEpisodes: [] })
    
    const totalToCreate = retryOnly ? failedEpisodesToRetry.length : splitTotalEpisodes - 1
    setSplitProgress({ created: 0, total: totalToCreate })
    
    // Simulate creating episodes with progress (with ~5% random failure chance for demo)
    let created = 0
    let failed = 0
    const failedEpisodes: number[] = []
    let currentIndex = 0
    
    const createInterval = setInterval(() => {
      const episodeNumber = retryOnly ? failedEpisodesToRetry[currentIndex] : currentIndex + 2
      currentIndex++
      
      // Simulate ~5% failure rate for demo purposes (only if > 10 episodes)
      const simulateFailure = totalToCreate > 10 && Math.random() < 0.05
      
      if (simulateFailure) {
        failed++
        failedEpisodes.push(episodeNumber)
      } else {
        created++
      }
      
      setSplitProgress({ created: created + failed, total: totalToCreate })
      
      if (currentIndex >= totalToCreate) {
        clearInterval(createInterval)
        setIsSplitting(false)
        
        if (failed > 0) {
          // Partial failure - show results screen
          setSplitResult({ show: true, created, failed, failedEpisodes })
        } else {
          // Full success
          setShowSplitDialog(false)
          setSplitResult({ show: false, created: 0, failed: 0, failedEpisodes: [] })
          
          toast({
            title: `Series split into ${splitTotalEpisodes} episodes.`,
            description: 'Upload source files for each episode to continue.',
          })
          
          router.push('/projects')
        }
      }
    }, 150)
  }
  
  const handleRetryFailed = () => {
    handleSplitProject(true, splitResult.failedEpisodes)
  }
  
  // TASK-004: Toggle task selection
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }
  
  // TASK-004: Handle bulk vendor assignment
  const handleBulkAssignVendor = async () => {
    if (!bulkSelectedVendorId || eligibleForAssign.length === 0) return
    setIsBulkAssigning(true)
    await new Promise(r => setTimeout(r, 500))
    
    const vendor = mockVendors.find(v => v.id === bulkSelectedVendorId)
    const updates: Record<string, { status: string; assignedVendor?: string }> = {}
    eligibleForAssign.forEach(t => {
      updates[t.id] = { status: 'assigned', assignedVendor: vendor?.name }
    })
    setLocalTaskUpdates(prev => ({ ...prev, ...updates }))
    
    toast({
      title: `${vendor?.name} assigned to ${eligibleForAssign.length} tasks.`,
      description: 'Vendor has been notified via a single consolidated notification.',
    })
    
    setIsBulkAssigning(false)
    setShowBulkAssignDialog(false)
    setSelectedTaskIds([])
    setBulkSelectedVendorId(null)
    setBulkVendorSearchQuery('')
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
                  {/* PROJ-012: Duplicate Project - available on any status */}
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowDuplicateDialog(true); }}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate Project
                  </DropdownMenuItem>
                  {/* PROJ-013: Split Project - available on any status */}
                  <DropdownMenuItem onSelect={(e) => { 
                    e.preventDefault(); 
                    setSplitPrefix(project.name);
                    setSplitTotalEpisodes('');
                    setSplitError('');
                    setShowSplitDialog(true); 
                  }}>
                    <Split className="mr-2 h-4 w-4" />
                    Split Project
                  </DropdownMenuItem>
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
                <div className="flex items-center gap-2">
                  {/* TASK-004: Bulk action bar */}
                  {(isAdmin || isPM) && selectedTaskIds.length > 0 && (
                    <div className="flex items-center gap-2 mr-2">
                      <span className="text-xs text-muted-foreground">{selectedTaskIds.length} selected</span>
                      {selectedTaskIds.length <= 50 && eligibleForAssign.length > 0 && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowBulkAssignDialog(true)}>
                          <UserPlus className="h-3 w-3" />
                          Assign ({eligibleForAssign.length})
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedTaskIds([])}>
                        Clear
                      </Button>
                    </div>
                  )}
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
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                {updatedProjectTasks.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="flex items-center min-w-max pb-6">
                      {updatedProjectTasks.map((task, index) => (
                        <div key={task.id} className="flex items-center">
                          {/* Connector line before card (except first) */}
                          {index > 0 && (
                            <div className="w-8 h-0.5 bg-gray-300" />
                          )}
                          <div className="relative">
                            {/* TASK-004: Checkbox for multi-select (Admin/PM only) */}
                            {(isAdmin || isPM) && (
                              <div className="absolute -top-2 -left-2 z-10">
                                <Checkbox
                                  checked={selectedTaskIds.includes(task.id)}
                                  onCheckedChange={() => toggleTaskSelection(task.id)}
                                  className="h-4 w-4 bg-background border-2"
                                />
                              </div>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/tasks/${task.id}?from=project&projectId=${project.id}`}>
                                    <div className={cn(
                                      'relative flex flex-col items-center justify-center p-4 rounded-lg border-2 w-[120px] h-[120px] cursor-pointer transition-all hover:shadow-md',
                                      task.status === 'completed' ? 'border-emerald-500 bg-emerald-50' :
                                      task.status === 'in_progress' ? 'border-blue-500 bg-blue-50' :
                                      task.status === 'review' ? 'border-purple-500 bg-purple-50' :
                                      task.status === 'assigned' ? 'border-amber-500 bg-amber-50' :
                                      'border-gray-200 bg-gray-50',
                                      selectedTaskIds.includes(task.id) && 'ring-2 ring-primary ring-offset-2'
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
                {/* PROJ-012: Upload prompt for duplicated projects */}
                {isDuplicated && (
                  <div className="flex items-center gap-3 rounded-lg border-2 border-primary bg-primary/5 p-4">
                    <Upload className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-primary">Upload your source files to get started</p>
                      <p className="text-sm text-muted-foreground">This project was duplicated from an existing project. Upload a new source video to continue.</p>
                    </div>
                  </div>
                )}
                {isQuoteLocked && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <Lock className="h-4 w-4" />
                    <span>Source files are locked after quote approval. Only reference files can be updated.</span>
                  </div>
                )}

            {/* Source Video - ONE video per project (per PROJ-006) - hidden from clients on NG-led projects */}
            {!isClient && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Source Video</CardTitle>
                  {/* Upload button only shown when no source file exists and not locked */}
                  {!sourceFile && !isQuoteLocked && canEditStatus && !isUploadingSource && (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => sourceUploadRef.current?.click()}>
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2">
                  {/* Uploading state */}
                  {isUploadingSource && (
                    <div className="flex h-20 items-center justify-center rounded-lg border border-border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">Uploading source video...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Filled state - source file exists */}
                  {sourceFile && !isUploadingSource && (
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{sourceFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(sourceFile.size)}
                            {sourceFile.duration && ` · ${sourceFile.duration}`}
                            {sourceFile.uploadedBy && ` · Uploaded by ${sourceFile.uploadedBy}`}
                            {sourceFile.uploadedAt && ` · ${formatDate(sourceFile.uploadedAt)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Actions menu - Download and Delete (no Replace in v1 per PROJ-006) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            {!isQuoteLocked && canEditStatus && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={() => setShowDeleteSourceDialog(true)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                  
                  {/* Empty state - no source file, show upload zone */}
                  {!sourceFile && !isUploadingSource && (
                    <div 
                      className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-muted/30 transition-colors"
                      onClick={() => !isQuoteLocked && canEditStatus && sourceUploadRef.current?.click()}
                    >
                      <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">Upload your source video</p>
                      <p className="text-xs text-muted-foreground">One video file per project</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reference Files - NO LIMIT per PROJ-006, visible to clients for context */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Reference Files ({referenceFiles.length})</CardTitle>
                {/* Upload button ALWAYS visible (no limit on reference files) - per PROJ-006 */}
                {canEditStatus && (
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
                      <div className="flex items-center gap-1">
                        {/* Actions menu for each reference file - can delete individually */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            {canEditStatus && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={() => {
                                  toast({
                                    title: 'Reference File Deleted',
                                    description: `"${file.name}" has been deleted.`,
                                  })
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
              accept="video/*"
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

      {/* Delete Source File Confirmation Dialog - per PROJ-006 */}
      <Dialog open={showDeleteSourceDialog} onOpenChange={setShowDeleteSourceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Source Video</DialogTitle>
            <DialogDescription>
              Delete &quot;{sourceFile?.name}&quot;? You&apos;ll need to upload a new source file to continue working on this project.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteSourceDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSourceFile}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      
      {/* PROJ-012: Duplicate Project Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={(open) => { 
        setShowDuplicateDialog(open)
        if (!open) {
          setDuplicateName(`${project.name} (Copy)`)
          setIsDuplicating(false)
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Duplicate &quot;{project.name}&quot;?</DialogTitle>
            <DialogDescription>
              Create a new scene with the same settings. Source files are not duplicated — you&apos;ll upload a new video after creation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Update PROJ-001: "Project name" renamed to "Scene name" */}
            <div className="space-y-2">
              <Label htmlFor="duplicate-name" className="text-sm font-medium">
                New scene name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="duplicate-name"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="Enter scene name..."
                autoFocus
              />
              {!duplicateName.trim() && (
                <p className="text-xs text-destructive">Scene name is required.</p>
              )}
            </div>
            
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-medium">What will be copied:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{project.client}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getPriorityColor(project.priority))}>
                    {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-muted-foreground">PM</span>
                  <span className="font-medium">{project.pm}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Also copied: reference files, internal notes
              </p>
            </div>
            
            <p className="text-xs text-muted-foreground">
              <strong>Not copied:</strong> source files, vendor assignments, billable volume, quotes/billing, delivered files, deadlines, status history
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)} disabled={isDuplicating}>
              Cancel
            </Button>
            <Button onClick={handleDuplicateProject} disabled={!duplicateName.trim() || isDuplicating}>
              {isDuplicating ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Duplicating project...
                </>
              ) : (
                'Duplicate Project'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* PROJ-013: Split Project (Series → Episodes) Dialog */}
      <Dialog open={showSplitDialog} onOpenChange={(open) => { 
        setShowSplitDialog(open)
        if (!open) {
          setSplitTotalEpisodes('')
          setSplitPrefix(project.name)
          setSplitError('')
          setIsSplitting(false)
          setSplitProgress({ created: 0, total: 0 })
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Split &quot;{project.name}&quot; into a series?</DialogTitle>
            <DialogDescription>
              &quot;{project.name}&quot; will be treated as Episode 01. We&apos;ll create additional episode projects for the rest of the series — same client, services, vendors, and settings. You&apos;ll upload each episode&apos;s source video after the split.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Total Episodes Input */}
            <div className="space-y-2">
              <Label htmlFor="split-total" className="text-sm font-medium">
                Total episodes <span className="text-destructive">*</span>
              </Label>
              <Input
                id="split-total"
                type="number"
                min={2}
                max={200}
                value={splitTotalEpisodes}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10)
                  setSplitTotalEpisodes(val)
                  setSplitError('')
                }}
                placeholder="e.g., 20"
                disabled={isSplitting}
              />
              <p className="text-xs text-muted-foreground">
                Total number of episodes in the series, including this one.
              </p>
              {splitTotalEpisodes !== '' && splitTotalEpisodes < 2 && (
                <p className="text-xs text-destructive">Enter a total of 2 or more episodes.</p>
              )}
              {splitTotalEpisodes !== '' && splitTotalEpisodes > 200 && (
                <p className="text-xs text-destructive">Total episodes too high — maximum is 200. For larger series, contact support.</p>
              )}
              {splitTotalEpisodes !== '' && splitTotalEpisodes > 50 && splitTotalEpisodes <= 200 && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    You&apos;re about to create {splitTotalEpisodes - 1} new projects. This may take a moment to process and will appear at the top of your project list.
                  </p>
                </div>
              )}
            </div>
            
            {/* Episode Name Prefix */}
            <div className="space-y-2">
              <Label htmlFor="split-prefix" className="text-sm font-medium">
                Episode name prefix <span className="text-destructive">*</span>
              </Label>
              <Input
                id="split-prefix"
                value={splitPrefix}
                onChange={(e) => {
                  setSplitPrefix(e.target.value)
                  setSplitError('')
                }}
                placeholder="e.g., Tehran"
                disabled={isSplitting}
              />
              <p className="text-xs text-muted-foreground">
                New episodes will be named {splitPrefix || '{prefix}'} E02, {splitPrefix || '{prefix}'} E03, …
              </p>
              {splitPrefix === '' && (
                <p className="text-xs text-destructive">Episode name prefix is required.</p>
              )}
            </div>
            
            {/* Live Preview */}
            {splitTotalEpisodes !== '' && splitTotalEpisodes >= 2 && splitTotalEpisodes <= 200 && splitPrefix.trim() && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-medium">Preview</p>
                <p className="text-sm text-muted-foreground">
                  This will create <span className="font-medium text-foreground">{splitTotalEpisodes - 1}</span> new projects:{' '}
                  {(() => {
                    const names = getEpisodeNames(splitPrefix, splitTotalEpisodes)
                    if (names.length <= 5) {
                      return <span className="font-medium text-foreground">{names.join(', ')}</span>
                    }
                    return (
                      <span className="font-medium text-foreground">
                        {names.slice(0, 3).join(', ')}, …, {names[names.length - 1]}
                      </span>
                    )
                  })()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  The original project ({project.name}) remains as Episode 01 — it is not modified or renamed.
                </p>
              </div>
            )}
            
            {/* What will be copied summary */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-medium">What each episode will inherit:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{project.client}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getPriorityColor(project.priority))}>
                    {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-muted-foreground">PM</span>
                  <span className="font-medium">{project.pm}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Also copied: reference files, internal notes
              </p>
            </div>
            
            {/* Source files note */}
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Source files are not duplicated — you&apos;ll upload a video for each episode after the split.
            </p>
            
            {/* Error message */}
            {splitError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{splitError}</p>
              </div>
            )}
            
            {/* Progress indicator */}
            {isSplitting && splitProgress.total > 0 && !splitResult.show && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Creating episodes...</span>
                  <span className="text-muted-foreground">{splitProgress.created} of {splitProgress.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-150"
                    style={{ width: `${(splitProgress.created / splitProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Partial failure results screen */}
            {splitResult.show && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      {splitResult.created} of {splitResult.created + splitResult.failed} episodes created. {splitResult.failed} failed.
                    </p>
                    <p className="text-xs text-amber-800 mt-1">
                      Failed episodes: {splitResult.failedEpisodes.map(n => `E${String(n).padStart(splitTotalEpisodes && splitTotalEpisodes > 99 ? 3 : 2, '0')}`).join(', ')}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-amber-800">
                  Successfully created episodes have been saved. You can retry the failed ones or close this dialog and retry later.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {splitResult.show ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowSplitDialog(false)
                    setSplitResult({ show: false, created: 0, failed: 0, failedEpisodes: [] })
                    toast({
                      title: `${splitResult.created} episodes created.`,
                      description: `${splitResult.failed} failed. You can retry from the project list.`,
                    })
                    router.push('/projects')
                  }}
                >
                  Close
                </Button>
                <Button onClick={handleRetryFailed}>
                  Retry failed ({splitResult.failed})
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowSplitDialog(false)} disabled={isSplitting}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleSplitProject()}
                  disabled={
                    !splitPrefix.trim() || 
                    splitTotalEpisodes === '' || 
                    splitTotalEpisodes < 2 || 
                    splitTotalEpisodes > 200 || 
                    isSplitting
                  }
                >
                  {isSplitting ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating {splitProgress.total > 0 ? `${splitProgress.created} of ${splitProgress.total}` : '...'}
                    </>
                  ) : (
                    'Split Project'
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* TASK-004: Bulk Assign Vendor Dialog */}
      <Dialog open={showBulkAssignDialog} onOpenChange={(open) => {
        setShowBulkAssignDialog(open)
        if (!open) {
          setBulkSelectedVendorId(null)
          setBulkVendorSearchQuery('')
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Vendor</DialogTitle>
            <DialogDescription>
              Select a vendor for {eligibleForAssign.length} task{eligibleForAssign.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Ineligible tasks banner */}
            {ineligibleCount > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                {ineligibleCount} of {selectedTasks.length} selected tasks aren&apos;t Unassigned and will be skipped.
              </div>
            )}
            
            {/* No eligible tasks warning */}
            {eligibleForAssign.length === 0 && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                No Unassigned tasks in selection. Select at least one Unassigned task to assign.
              </div>
            )}
            
            {/* Search */}
            <Input
              placeholder="Search vendors..."
              value={bulkVendorSearchQuery}
              onChange={(e) => setBulkVendorSearchQuery(e.target.value)}
            />
            
            {/* Vendor List */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {mockVendors
                .filter(v => v.name.toLowerCase().includes(bulkVendorSearchQuery.toLowerCase()))
                .sort((a, b) => {
                  const availOrder = { available: 0, limited: 1, unavailable: 2 }
                  const aOrder = availOrder[a.availability as keyof typeof availOrder] ?? 2
                  const bOrder = availOrder[b.availability as keyof typeof availOrder] ?? 2
                  if (aOrder !== bOrder) return aOrder - bOrder
                  return (b.onTimeRate || 0) - (a.onTimeRate || 0)
                })
                .map((vendor) => {
                  const isUnavailable = vendor.availability === 'unavailable'
                  const availabilityIcon = vendor.availability === 'available' ? '🟢' : vendor.availability === 'limited' ? '🟡' : '🔴'
                  
                  return (
                    <div
                      key={vendor.id}
                      onClick={() => !isUnavailable && setBulkSelectedVendorId(vendor.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        bulkSelectedVendorId === vendor.id 
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
                        <div className="text-xs text-muted-foreground">
                          <p>{vendor.tasksDelivered || 0} tasks delivered, {vendor.onTimeRate || 95}% on-time</p>
                        </div>
                      </div>
                      {bulkSelectedVendorId === vendor.id && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBulkAssignDialog(false)
              setBulkSelectedVendorId(null)
              setBulkVendorSearchQuery('')
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAssignVendor}
              disabled={!bulkSelectedVendorId || isBulkAssigning || eligibleForAssign.length === 0}
            >
              {isBulkAssigning ? 'Assigning...' : `Assign to ${eligibleForAssign.length} Tasks`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

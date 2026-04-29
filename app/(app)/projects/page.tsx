'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  MoreHorizontal,
  X,
  ChevronDown,
  Archive,
  ArchiveRestore,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Split,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockUsers, formatDate, getPriorityColor, PROJECT_STATUSES, SERVICES_LIST } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../layout'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Client team members for Assignee filter (PROJ-005-Client)
const CLIENT_TEAM_MEMBERS = [
  { id: 'ct-1', name: 'Maya Cohen', initials: 'MC', role: 'task_owner' },
  { id: 'ct-2', name: 'Yossi Levy', initials: 'YL', role: 'reviewer' },
  { id: 'ct-3', name: 'Dana Roth', initials: 'DR', role: 'task_owner' },
]

// Services from the Services Catalog (SERV-001) - exact list per PRD
const CATALOG_SERVICES = [
  'Subtitles Transcription',
  'Subtitles Transcription AI',
  'Translation from Audio + Template',
  'Translation from Audio',
  'Translation from Audio + Template AI',
  'Translation from Template AI',
  'Text Translation',
  'Translation Pivot Language',
  'Proofread',
  'Extra QC',
  'Timing',
  'Client Corrections',
  'New Version (Re-conforming)',
  'Convert Files',
  'Other',
  'Raw Materials',
  'Translation On-Site',
]

// Task step types from PROJ-004 Add Task section - exact list per PRD
const TASK_STEP_TYPES = [
  'Transcription',
  'Transcription AI',
  'Timing',
  'Timing AI',
  'Translation',
  'Translation from Audio',
  'Upload TT',
  'Upload Text File',
  'QC',
  'PM Verification',
  'Proofread',
  'Client Review',
  'Upload Client Asset',
  'Upload Rough Cut',
  'New Cut',
  'Project Creation',
]

// PROJ-005-Client: Client-specific seed projects (single client view)
const clientSeedProjects = [
  {
    id: 'client-1',
    name: 'Spring Campaign Promo',
    client: 'My Company', // Implicit - not shown in client view
    clientId: 'c-mycompany',
    status: 'approved',
    services: ['Translation from Audio + Template'],
    pm: 'Sarah L.',
    pmId: '1',
    priority: 'medium',
    deadline: '2026-05-18',
    progress: 0,
    createdAt: '2026-04-29T10:00:00Z',
    isUnassigned: false,
    isClientCreated: true, // PROJ-010 project
    needsTeamAssignment: true, // Show "Assign your team" prompt
    assignees: [
      { id: 'ct-1', name: 'Maya Cohen', initials: 'MC', type: 'client' },
      { id: 'ct-2', name: 'Yossi Levy', initials: 'YL', type: 'client' },
    ],
  },
  {
    id: 'client-2',
    name: 'Investor Update Q1',
    client: 'My Company',
    clientId: 'c-mycompany',
    status: 'in_progress',
    services: ['Subtitles Transcription AI', 'Extra QC'],
    pm: 'David M.',
    pmId: '2',
    priority: 'high',
    deadline: '2026-05-05',
    progress: 35,
    createdAt: '2026-04-25T09:00:00Z',
    isUnassigned: false,
    isClientCreated: false, // NG-led project
    assignees: [
      { id: 'ng-1', name: 'NG', initials: 'NG', type: 'ng' },
    ],
  },
  {
    id: 'client-3',
    name: 'Internal Training Series',
    client: 'My Company',
    clientId: 'c-mycompany',
    status: 'in_progress',
    services: ['Translation from Template AI'],
    pm: 'Sarah L.',
    pmId: '1',
    priority: 'low',
    deadline: '2026-06-02',
    progress: 60,
    createdAt: '2026-04-20T14:00:00Z',
    isUnassigned: false,
    isClientCreated: true,
    assignees: [
      { id: 'ct-1', name: 'Maya Cohen', initials: 'MC', type: 'client' },
    ],
  },
  {
    id: 'client-4',
    name: 'Conference Highlights Reel',
    client: 'My Company',
    clientId: 'c-mycompany',
    status: 'in_review',
    services: ['Subtitles Transcription'],
    pm: 'David M.',
    pmId: '2',
    priority: 'urgent',
    deadline: '2026-04-30',
    progress: 85,
    createdAt: '2026-04-15T11:00:00Z',
    isUnassigned: false,
    isClientCreated: false,
    assignees: [
      { id: 'ng-1', name: 'NG', initials: 'NG', type: 'ng' },
    ],
  },
  {
    id: 'client-5',
    name: 'Brand Refresh Promo',
    client: 'My Company',
    clientId: 'c-mycompany',
    status: 'delivered',
    services: ['Translation from Audio'],
    pm: 'Sarah L.',
    pmId: '1',
    priority: 'medium',
    deadline: '2026-04-22',
    progress: 100,
    createdAt: '2026-04-10T08:00:00Z',
    isUnassigned: false,
    isClientCreated: false,
    assignees: [
      { id: 'ng-1', name: 'NG', initials: 'NG', type: 'ng' },
    ],
  },
  {
    id: 'client-6',
    name: 'Annual Report Voiceover',
    client: 'My Company',
    clientId: 'c-mycompany',
    status: 'invoiced',
    services: ['Text Translation'],
    pm: 'David M.',
    pmId: '2',
    priority: 'low',
    deadline: '2026-04-12',
    progress: 100,
    createdAt: '2026-04-01T10:00:00Z',
    isUnassigned: false,
    isClientCreated: false,
    assignees: [
      { id: 'ng-1', name: 'NG', initials: 'NG', type: 'ng' },
    ],
  },
  {
    id: 'client-7',
    name: 'Onboarding Module 1',
    client: 'My Company',
    clientId: 'c-mycompany',
    status: 'closed',
    services: ['Proofread'],
    pm: 'Sarah L.',
    pmId: '1',
    priority: 'low',
    deadline: '2026-03-28',
    progress: 100,
    createdAt: '2026-03-15T09:00:00Z',
    isUnassigned: false,
    isClientCreated: true,
    assignees: [
      { id: 'ct-2', name: 'Yossi Levy', initials: 'YL', type: 'client' },
    ],
  },
  {
    id: 'client-8',
    name: 'Cancelled Pilot',
    client: 'My Company',
    clientId: 'c-mycompany',
    status: 'cancelled',
    services: ['Translation from Audio'],
    pm: 'David M.',
    pmId: '2',
    priority: 'high',
    deadline: '2026-04-18',
    progress: 0,
    createdAt: '2026-03-10T16:00:00Z',
    isUnassigned: true,
    isClientCreated: false,
    assignees: [],
  },
]

// Seed data covering every status per PRD Update PROJ-005
const seedProjects = [
  {
    id: 'seed-1',
    name: 'Brand Refresh Transcription',
    client: 'Acme Corp',
    clientId: 'c-acme',
    status: 'draft',
    services: ['Subtitles Transcription AI'],
    pm: 'Sarah L.',
    pmId: '1',
    priority: 'medium',
    deadline: '2026-05-15',
    progress: 0,
    createdAt: '2026-04-29T10:00:00Z', // Newest - appears at top
    isUnassigned: true, // All tasks unassigned
  },
  {
    id: 'seed-2',
    name: 'Q2 Product Launch',
    client: 'NovaTech',
    clientId: 'c-novatech',
    status: 'quoted',
    services: ['Translation from Audio'],
    pm: 'David M.',
    pmId: '2',
    priority: 'high',
    deadline: '2026-05-20',
    progress: 0,
    createdAt: '2026-04-28T09:00:00Z',
    isUnassigned: false,
  },
  {
    id: 'seed-3',
    name: 'Annual Report Translation',
    client: 'GreenLeaf',
    clientId: 'c-greenleaf',
    status: 'approved',
    services: ['Text Translation'],
    pm: 'Sarah L.',
    pmId: '1',
    priority: 'low',
    deadline: '2026-06-01',
    progress: 0,
    createdAt: '2026-04-27T14:00:00Z',
    isUnassigned: true, // Vendors can be assigned
  },
  {
    id: 'seed-4',
    name: 'Training Videos Series',
    client: 'FinServ Group',
    clientId: 'c-finserv',
    status: 'in_progress',
    services: ['Translation from Audio + Template', 'Extra QC'],
    pm: 'David M.',
    pmId: '2',
    priority: 'urgent',
    deadline: '2026-04-30',
    progress: 45,
    createdAt: '2026-04-20T08:00:00Z',
    isUnassigned: false,
  },
  {
    id: 'seed-5',
    name: 'Safety Instructional',
    client: 'MedCare',
    clientId: 'c-medcare',
    status: 'in_review',
    services: ['Translation from Template AI'],
    pm: 'Sarah L.',
    pmId: '1',
    priority: 'high',
    deadline: '2026-05-05',
    progress: 90,
    createdAt: '2026-04-15T11:00:00Z',
    isUnassigned: false,
  },
  {
    id: 'seed-6',
    name: 'Corporate Comms Pack',
    client: 'RetailCo',
    clientId: 'c-retailco',
    status: 'delivered',
    services: ['Subtitles Transcription'],
    pm: 'David M.',
    pmId: '2',
    priority: 'medium',
    deadline: '2026-04-20',
    progress: 100,
    createdAt: '2026-04-10T09:00:00Z',
    isUnassigned: false,
  },
  {
    id: 'seed-7',
    name: 'E-Learning Module 3',
    client: 'EduFirst',
    clientId: 'c-edufirst',
    status: 'invoiced',
    services: ['Translation from Audio + Template AI', 'Extra QC'],
    pm: 'Sarah L.',
    pmId: '1',
    priority: 'low',
    deadline: '2026-04-10',
    progress: 100,
    createdAt: '2026-04-05T10:00:00Z',
    isUnassigned: false,
  },
  {
    id: 'seed-8',
    name: 'Legacy Archive Project',
    client: 'OldCo',
    clientId: 'c-oldco',
    status: 'closed',
    services: ['Proofread'],
    pm: 'David M.',
    pmId: '2',
    priority: 'low',
    deadline: '2026-03-31',
    progress: 100,
    createdAt: '2026-03-01T08:00:00Z',
    isUnassigned: false,
  },
  {
    id: 'seed-9',
    name: 'Cancelled Campaign',
    client: 'StartupX',
    clientId: 'c-startupx',
    status: 'cancelled',
    services: ['Translation from Audio'],
    pm: 'Sarah L.',
    pmId: '1',
    priority: 'high',
    deadline: '2026-04-25',
    progress: 35,
    createdAt: '2026-04-01T12:00:00Z',
    isUnassigned: false,
  },
]

const ITEMS_PER_PAGE = 25

type SortOption = 'date_created' | 'deadline' | 'priority' | 'client_name' | 'project_name'

// Statuses that can be cancelled
const CANCELLABLE_STATUSES = ['draft', 'quoted', 'approved', 'in_progress', 'in_review', 'delivered', 'invoiced']

export default function ProjectsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { currentRole } = useRole()
  
  // Role-based flags
  const isClient = currentRole === 'client_admin' || currentRole === 'task_owner' || currentRole === 'reviewer' || currentRole === 'viewer'
  const isClientAdmin = currentRole === 'client_admin'
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [serviceFilters, setServiceFilters] = useState<string[]>([])
  const [taskTypeFilters, setTaskTypeFilters] = useState<string[]>([])
  const [pmFilters, setPmFilters] = useState<string[]>([])
  const [assigneeFilters, setAssigneeFilters] = useState<string[]>([]) // PROJ-005-Client: Assignee filter for clients
  const [deadlineRange, setDeadlineRange] = useState<{ from: string; to: string }>({ from: '', to: '' })
  const [includeArchived, setIncludeArchived] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('date_created')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  
  // Archive dialog
  const [archiveDialog, setArchiveDialog] = useState<{ open: boolean; projectId: string; projectName: string; isArchived: boolean }>({
    open: false,
    projectId: '',
    projectName: '',
    isArchived: false,
  })
  
  // Cancel dialog
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; projectId: string; projectName: string }>({
    open: false,
    projectId: '',
    projectName: '',
  })
  const [cancelReason, setCancelReason] = useState('')
  const [clientNote, setClientNote] = useState('')
  
  // PROJ-012: Duplicate Project dialog
  const [duplicateDialog, setDuplicateDialog] = useState<{ 
    open: boolean
    projectId: string
    originalName: string
    client: string
    services: string[]
    priority: string
    pm: string
  }>({
    open: false,
    projectId: '',
    originalName: '',
    client: '',
    services: [],
    priority: '',
    pm: '',
  })
  const [duplicateName, setDuplicateName] = useState('')
  const [isDuplicating, setIsDuplicating] = useState(false)
  
  // PROJ-013: Split Project (Series → Episodes) dialog
  const [splitDialog, setSplitDialog] = useState<{
    open: boolean
    projectId: string
    projectName: string
    client: string
    services: string[]
    priority: string
    pm: string
  }>({
    open: false,
    projectId: '',
    projectName: '',
    client: '',
    services: [],
    priority: '',
    pm: '',
  })
  const [splitTotalEpisodes, setSplitTotalEpisodes] = useState<number | ''>('')
  const [splitPrefix, setSplitPrefix] = useState('')
  const [isSplitting, setIsSplitting] = useState(false)
  const [splitProgress, setSplitProgress] = useState({ created: 0, total: 0 })
  const [splitError, setSplitError] = useState('')
  // PROJ-013: Partial failure state
  const [splitResult, setSplitResult] = useState<{
    show: boolean
    created: number
    failed: number
    failedEpisodes: number[] // episode numbers that failed
  }>({ show: false, created: 0, failed: 0, failedEpisodes: [] })
  
  const pms = mockUsers.filter(u => u.role === 'admin' || u.role === 'pm')
  
  // Use seed projects - client sees client-specific projects, admin/PM sees all projects
  const projects = isClient ? clientSeedProjects : seedProjects
  
  // Filter projects
  const filteredProjects = useMemo(() => {
    let result = projects.filter((project: typeof seedProjects[0] | typeof clientSeedProjects[0]) => {
      // Search - PROJ-005-Client: clients search project name only, admin/PM searches name + client
      const matchesSearch = !searchQuery || 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (!isClient && project.client.toLowerCase().includes(searchQuery.toLowerCase()))
      
      // Status filter
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(project.status)
      
      // Service filter - match if project has any of the selected services
      const matchesService = serviceFilters.length === 0 || 
        project.services.some(s => serviceFilters.includes(s))
      
      // Task Type filter - for now, match based on service mapping (in real app, would check actual tasks)
      const matchesTaskType = taskTypeFilters.length === 0 // Simplified - would need task data
      
      // PM filter (admin/PM only)
      const matchesPM = isClient || pmFilters.length === 0 || pmFilters.includes(project.pmId)
      
      // Assignee filter (clients only) - PROJ-005-Client
      let matchesAssignee = true
      if (isClient && assigneeFilters.length > 0 && 'assignees' in project) {
        const projectAssignees = project.assignees || []
        matchesAssignee = assigneeFilters.some(filter => {
          if (filter === 'ng-assigned') {
            return projectAssignees.some(a => a.type === 'ng')
          }
          if (filter === 'unassigned') {
            return projectAssignees.length === 0 || project.isUnassigned
          }
          // Client team member filter
          return projectAssignees.some(a => a.id === filter)
        })
      }
      
      // Deadline range
      const matchesDeadline = (!deadlineRange.from || project.deadline >= deadlineRange.from) &&
        (!deadlineRange.to || project.deadline <= deadlineRange.to)
      
      // Archived
      const isArchivedProject = project.status === 'closed'
      const matchesArchived = includeArchived || !isArchivedProject
      
      return matchesSearch && matchesStatus && matchesService && matchesTaskType && matchesPM && matchesAssignee && matchesDeadline && matchesArchived
    })
    
    // Sort - default is date_created (newest first) per PRD
    result.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        case 'priority':
          const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'project_name':
          return a.name.localeCompare(b.name)
        case 'client_name':
          // PROJ-005-Client: clients don't have this sort option, but handle gracefully
          return isClient ? 0 : a.client.localeCompare(b.client)
        case 'date_created':
        default:
          // Newest first
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
    
    return result
  }, [searchQuery, statusFilters, serviceFilters, taskTypeFilters, pmFilters, assigneeFilters, deadlineRange, includeArchived, sortBy, projects, isClient])
  
  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE)
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )
  
  // Active filter count
  const activeFilterCount = statusFilters.length + serviceFilters.length + taskTypeFilters.length + 
    (isClient ? assigneeFilters.length : pmFilters.length) + 
    (deadlineRange.from ? 1 : 0) + (deadlineRange.to ? 1 : 0)
  
  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
    setCurrentPage(1)
  }
  
  const toggleServiceFilter = (service: string) => {
    setServiceFilters(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    )
    setCurrentPage(1)
  }
  
  const toggleTaskTypeFilter = (taskType: string) => {
    setTaskTypeFilters(prev => 
      prev.includes(taskType) ? prev.filter(t => t !== taskType) : [...prev, taskType]
    )
    setCurrentPage(1)
  }
  
  const togglePMFilter = (pmId: string) => {
    setPmFilters(prev => 
      prev.includes(pmId) ? prev.filter(p => p !== pmId) : [...prev, pmId]
    )
    setCurrentPage(1)
  }
  
  // PROJ-005-Client: Assignee filter toggle for clients
  const toggleAssigneeFilter = (assigneeId: string) => {
    setAssigneeFilters(prev => 
      prev.includes(assigneeId) ? prev.filter(a => a !== assigneeId) : [...prev, assigneeId]
    )
    setCurrentPage(1)
  }
  
  const clearAllFilters = () => {
    setStatusFilters([])
    setServiceFilters([])
    setTaskTypeFilters([])
    setPmFilters([])
    setAssigneeFilters([])
    setDeadlineRange({ from: '', to: '' })
    setSearchQuery('')
    setCurrentPage(1)
  }
  
  const handleArchive = () => {
    const action = archiveDialog.isArchived ? 'unarchived' : 'archived'
    toast({
      title: `Project ${action}`,
      description: `${archiveDialog.projectName} has been ${action}.`,
    })
    setArchiveDialog({ open: false, projectId: '', projectName: '', isArchived: false })
  }
  
  const handleCancelProject = () => {
    if (!cancelReason.trim()) return
    
    toast({
      title: 'Project cancelled',
      description: `${cancelDialog.projectName} has been cancelled.`,
    })
    
    // Reset state
    setCancelDialog({ open: false, projectId: '', projectName: '' })
    setCancelReason('')
    setClientNote('')
  }
  
  // PROJ-012: Duplicate Project
  const handleDuplicateProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return
    
    setDuplicateDialog({
      open: true,
      projectId: project.id,
      originalName: project.name,
      client: project.client,
      services: project.services,
      priority: project.priority,
      pm: project.pm,
    })
    setDuplicateName(`${project.name} (Copy)`)
  }
  
  const handleConfirmDuplicate = () => {
    if (!duplicateName.trim()) return
    
    setIsDuplicating(true)
    
    // Simulate API call
    setTimeout(() => {
      // In real app, POST to API to create duplicate project
      const newProjectId = `dup-${Date.now()}`
      
      setIsDuplicating(false)
      setDuplicateDialog({
        open: false,
        projectId: '',
        originalName: '',
        client: '',
        services: [],
        priority: '',
        pm: '',
      })
      setDuplicateName('')
      
      toast({
        title: 'Project duplicated. Upload your source files to continue.',
        description: `"${duplicateName}" created in Draft status.`,
      })
      
      // Redirect to new project detail with highlight flag
      router.push(`/projects/${newProjectId}?duplicated=true`)
    }, 1000)
  }
  
  // PROJ-013: Split Project (Series → Episodes)
  const handleSplitProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return
    
    setSplitDialog({
      open: true,
      projectId: project.id,
      projectName: project.name,
      client: project.client,
      services: project.services,
      priority: project.priority,
      pm: project.pm,
    })
    setSplitPrefix(project.name)
    setSplitTotalEpisodes('')
    setSplitError('')
    setSplitProgress({ created: 0, total: 0 })
  }
  
  // Generate episode names for preview
  const getEpisodeNames = (prefix: string, total: number) => {
    if (total < 2) return []
    const padLength = total > 99 ? 3 : 2
    const names: string[] = []
    for (let i = 2; i <= total; i++) {
      names.push(`${prefix} E${String(i).padStart(padLength, '0')}`)
    }
    return names
  }
  
  // Check for name conflicts
  const checkNameConflicts = (prefix: string, total: number) => {
    const episodeNames = getEpisodeNames(prefix, total)
    const existingNames = projects.map(p => p.name.toLowerCase())
    return episodeNames.filter(name => existingNames.includes(name.toLowerCase()))
  }
  
  const handleConfirmSplit = (retryOnly = false, failedEpisodesToRetry: number[] = []) => {
    if (!splitTotalEpisodes || splitTotalEpisodes < 2 || !splitPrefix.trim()) return
    
    // Skip conflict check on retry (already passed initially)
    if (!retryOnly) {
      const conflicts = checkNameConflicts(splitPrefix, splitTotalEpisodes)
      if (conflicts.length > 0) {
        setSplitError(`${conflicts.length} episode names already exist (e.g., ${conflicts[0]}). Choose a different prefix or delete the existing episodes first.`)
        return
      }
    }
    
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
      
      // Simulate ~5% failure rate for demo purposes (only if > 10 episodes to see the effect)
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
          setSplitResult({
            show: true,
            created,
            failed,
            failedEpisodes,
          })
        } else {
          // Full success
          setSplitDialog({
            open: false,
            projectId: '',
            projectName: '',
            client: '',
            services: [],
            priority: '',
            pm: '',
          })
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
  
  // Retry failed episodes
  const handleRetryFailed = () => {
    handleConfirmSplit(true, splitResult.failedEpisodes)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {/* PROJ-005-Client: "My Projects" for clients, "Projects" for admin/PM */}
          <h1 className="text-2xl font-semibold text-foreground">{isClient ? 'My Projects' : 'Projects'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredProjects.length} of {projects.length} projects
          </p>
        </div>
        {/* PROJ-005-Client: + New Project only visible to Client Admin (or admin/PM) */}
        {(!isClient || isClientAdmin) && (
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Link href="/projects/new" prefetch={true}>
              <Button className="gap-1.5">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* Filters Row - Order: Status · Service · Task Type · PM · Deadline per PRD */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            className="h-9 w-64 rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        
        {/* Status Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              Status
              {statusFilters.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {statusFilters.length}
                </span>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            {PROJECT_STATUSES.map((status) => (
              <div key={status.value} className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted rounded">
                <Checkbox
                  id={`status-${status.value}`}
                  checked={statusFilters.includes(status.value)}
                  onCheckedChange={() => toggleStatusFilter(status.value)}
                />
                <Label htmlFor={`status-${status.value}`} className="text-sm cursor-pointer flex-1">
                  {status.label}
                </Label>
              </div>
            ))}
          </PopoverContent>
        </Popover>
        
        {/* Service Filter - from Services Catalog */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              Service
              {serviceFilters.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {serviceFilters.length}
                </span>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 max-h-80 overflow-y-auto" align="start">
            {CATALOG_SERVICES.map((service) => (
              <div key={service} className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted rounded">
                <Checkbox
                  id={`service-${service}`}
                  checked={serviceFilters.includes(service)}
                  onCheckedChange={() => toggleServiceFilter(service)}
                />
                <Label htmlFor={`service-${service}`} className="text-sm cursor-pointer flex-1">
                  {service}
                </Label>
              </div>
            ))}
          </PopoverContent>
        </Popover>
        
        {/* Task Type Filter - from PROJ-004 Add Task */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              Task Type
              {taskTypeFilters.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {taskTypeFilters.length}
                </span>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 max-h-80 overflow-y-auto" align="start">
            {TASK_STEP_TYPES.map((taskType) => (
              <div key={taskType} className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted rounded">
                <Checkbox
                  id={`tasktype-${taskType}`}
                  checked={taskTypeFilters.includes(taskType)}
                  onCheckedChange={() => toggleTaskTypeFilter(taskType)}
                />
                <Label htmlFor={`tasktype-${taskType}`} className="text-sm cursor-pointer flex-1">
                  {taskType}
                </Label>
              </div>
            ))}
          </PopoverContent>
        </Popover>
        
        {/* PM Filter (Admin/PM) or Assignee Filter (Clients) - PROJ-005-Client */}
        {isClient ? (
          // ASSIGNEE FILTER FOR CLIENTS
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                Assignee
                {assigneeFilters.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {assigneeFilters.length}
                  </span>
                )}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              {/* Client team members */}
              <div className="text-xs font-medium text-muted-foreground px-2 py-1">Your Team</div>
              {CLIENT_TEAM_MEMBERS.map((member) => (
                <div key={member.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted rounded">
                  <Checkbox
                    id={`assignee-${member.id}`}
                    checked={assigneeFilters.includes(member.id)}
                    onCheckedChange={() => toggleAssigneeFilter(member.id)}
                  />
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <Label htmlFor={`assignee-${member.id}`} className="text-sm cursor-pointer flex-1">
                    {member.name}
                  </Label>
                </div>
              ))}
              <div className="border-t border-border my-2" />
              {/* Special options */}
              <div key="ng-assigned" className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted rounded">
                <Checkbox
                  id="assignee-ng"
                  checked={assigneeFilters.includes('ng-assigned')}
                  onCheckedChange={() => toggleAssigneeFilter('ng-assigned')}
                />
                <div className="h-5 w-5 flex items-center justify-center rounded-full bg-blue-100 text-[10px] font-medium text-blue-700">
                  NG
                </div>
                <Label htmlFor="assignee-ng" className="text-sm cursor-pointer flex-1">
                  NG-assigned
                </Label>
              </div>
              <div key="unassigned" className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted rounded">
                <Checkbox
                  id="assignee-unassigned"
                  checked={assigneeFilters.includes('unassigned')}
                  onCheckedChange={() => toggleAssigneeFilter('unassigned')}
                />
                <div className="h-5 w-5 flex items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-500">
                  ?
                </div>
                <Label htmlFor="assignee-unassigned" className="text-sm cursor-pointer flex-1">
                  Unassigned
                </Label>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          // PM FILTER FOR ADMIN/PM
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                PM
                {pmFilters.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {pmFilters.length}
                  </span>
                )}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              {pms.map((pm) => (
                <div key={pm.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted rounded">
                  <Checkbox
                    id={`pm-${pm.id}`}
                    checked={pmFilters.includes(pm.id)}
                    onCheckedChange={() => togglePMFilter(pm.id)}
                  />
                  <Label htmlFor={`pm-${pm.id}`} className="text-sm cursor-pointer flex-1">
                    {pm.name}
                  </Label>
                </div>
              ))}
            </PopoverContent>
          </Popover>
        )}
        
        {/* Deadline Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              Deadline
              {(deadlineRange.from || deadlineRange.to) && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  1
                </span>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <input
                  type="date"
                  value={deadlineRange.from}
                  onChange={(e) => { setDeadlineRange(prev => ({ ...prev, from: e.target.value })); setCurrentPage(1) }}
                  className="w-full h-8 rounded border border-input bg-background px-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <input
                  type="date"
                  value={deadlineRange.to}
                  onChange={(e) => { setDeadlineRange(prev => ({ ...prev, to: e.target.value })); setCurrentPage(1) }}
                  className="w-full h-8 rounded border border-input bg-background px-2 text-sm"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Sort - PROJ-005-Client: no Client Name sort for clients, add Project Name A-Z */}
        <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
          <SelectTrigger className="w-40 h-9">
            <ArrowUpDown className="h-3 w-3 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_created">Date Created</SelectItem>
            <SelectItem value="deadline">Deadline</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="project_name">Project Name (A-Z)</SelectItem>
            {!isClient && <SelectItem value="client_name">Client Name</SelectItem>}
          </SelectContent>
        </Select>
        
        {/* Include Archived */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="include-archived"
            checked={includeArchived}
            onCheckedChange={(checked) => { setIncludeArchived(!!checked); setCurrentPage(1) }}
          />
          <Label htmlFor="include-archived" className="text-sm cursor-pointer">
            Include archived
          </Label>
        </div>
        
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 text-muted-foreground">
            <X className="h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>
      
      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <span key={status} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {PROJECT_STATUSES.find(s => s.value === status)?.label}
              <button onClick={() => toggleStatusFilter(status)} className="hover:bg-primary/20 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {serviceFilters.map((service) => (
            <span key={service} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
              {service}
              <button onClick={() => toggleServiceFilter(service)} className="hover:bg-blue-200 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {taskTypeFilters.map((taskType) => (
            <span key={taskType} className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700">
              {taskType}
              <button onClick={() => toggleTaskTypeFilter(taskType)} className="hover:bg-teal-200 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {/* PM filter pills (admin/PM) or Assignee filter pills (clients) */}
          {isClient ? (
            // Assignee filter pills for clients
            assigneeFilters.map((assigneeId) => {
              const member = CLIENT_TEAM_MEMBERS.find(m => m.id === assigneeId)
              const label = assigneeId === 'ng-assigned' ? 'NG-assigned' : 
                            assigneeId === 'unassigned' ? 'Unassigned' : 
                            member?.name || assigneeId
              return (
                <span key={assigneeId} className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                  {label}
                  <button onClick={() => toggleAssigneeFilter(assigneeId)} className="hover:bg-purple-200 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })
          ) : (
            // PM filter pills for admin/PM
            pmFilters.map((pmId) => (
              <span key={pmId} className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                {pms.find(p => p.id === pmId)?.name}
                <button onClick={() => togglePMFilter(pmId)} className="hover:bg-purple-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
          {deadlineRange.from && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
              From: {deadlineRange.from}
              <button onClick={() => setDeadlineRange(prev => ({ ...prev, from: '' }))} className="hover:bg-amber-200 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {deadlineRange.to && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
              To: {deadlineRange.to}
              <button onClick={() => setDeadlineRange(prev => ({ ...prev, to: '' }))} className="hover:bg-amber-200 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Projects Table/List */}
      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/50">
              {/* PROJ-005-Client: Different columns for clients vs admin/PM */}
              <TableHead className={isClient ? "w-[300px]" : "w-[280px]"}>Project</TableHead>
              {!isClient && <TableHead className="w-[140px]">Client</TableHead>}
              <TableHead className="w-[160px]">Status</TableHead>
              {isClient ? (
                <TableHead className="w-[140px]">Assignee</TableHead>
              ) : (
                <TableHead className="w-[100px]">PM</TableHead>
              )}
              <TableHead className="w-[110px]">Deadline</TableHead>
              <TableHead className="w-[90px]">Priority</TableHead>
              <TableHead className="w-[80px] text-right">Progress</TableHead>
              {/* PROJ-005-Client: No actions menu for clients */}
              {!isClient && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProjects.map((project) => {
              const isArchived = project.status === 'closed'
              const canCancel = CANCELLABLE_STATUSES.includes(project.status)
              
              return (
                <TableRow
                  key={project.id}
                  className={cn(
                    "cursor-pointer bg-background hover:bg-muted/50",
                    isArchived && "opacity-60"
                  )}
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  {/* Project Name + Service */}
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {project.services.join(', ')}
                      </p>
                    </div>
                  </TableCell>
                  
                  {/* Client - only for admin/PM */}
                  {!isClient && (
                    <TableCell>
                      <span className="text-sm">{project.client}</span>
                    </TableCell>
                  )}
                  
                  {/* Status + badges */}
                  <TableCell>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={project.status} />
                      {/* PROJ-005-Client: "Assign your team" prompt for client-created projects */}
                      {isClient && 'needsTeamAssignment' in project && project.needsTeamAssignment && (
                        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                          Assign your team
                        </span>
                      )}
                      {/* Unassigned badge for NG-led projects */}
                      {project.isUnassigned && !('needsTeamAssignment' in project && project.needsTeamAssignment) && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* PM (admin/PM) or Assignee summary (clients) */}
                  {isClient ? (
                    <TableCell>
                      {/* PROJ-005-Client: Assignee summary with avatars */}
                      {'assignees' in project && project.assignees && project.assignees.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            {project.assignees.slice(0, 3).map((assignee) => (
                              <Tooltip key={assignee.id}>
                                <TooltipTrigger asChild>
                                  {assignee.type === 'ng' ? (
                                    <div className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-[10px] font-medium text-blue-700">
                                      NG
                                    </div>
                                  ) : (
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                        {assignee.initials}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </TooltipTrigger>
                                <TooltipContent>
                                  {assignee.type === 'ng' ? 'Handled by NG' : assignee.name}
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {project.assignees.length > 3 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                +{project.assignees.length - 3}
                              </span>
                            )}
                          </TooltipProvider>
                        </div>
                      ) : (
                        <div className="h-6 w-6 flex items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-500">
                          ?
                        </div>
                      )}
                    </TableCell>
                  ) : (
                    <TableCell>
                      <span className="text-sm">{project.pm}</span>
                    </TableCell>
                  )}
                  
                  {/* Deadline */}
                  <TableCell>
                    <span className="text-sm">{formatDate(project.deadline)}</span>
                  </TableCell>
                  
                  {/* Priority */}
                  <TableCell>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getPriorityColor(project.priority))}>
                      {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                    </span>
                  </TableCell>
                  
                  {/* Progress */}
                  <TableCell className="text-right">
                    <span className="text-sm font-medium">{project.progress}%</span>
                  </TableCell>
                  
                  {/* Actions Menu - PROJ-005-Client: Hidden for clients */}
                  {!isClient && (
                    <TableCell>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Duplicate Project - available on any non-archived status (PROJ-012) */}
                            {!isArchived && (
                              <DropdownMenuItem onClick={() => handleDuplicateProject(project.id)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate Project
                              </DropdownMenuItem>
                            )}
                            
                            {/* Split Project - available on any non-archived status (PROJ-013) */}
                            {!isArchived && (
                              <DropdownMenuItem onClick={() => handleSplitProject(project.id)}>
                                <Split className="mr-2 h-4 w-4" />
                                Split Project
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            {/* Archive/Unarchive */}
                            <DropdownMenuItem 
                              onClick={() => setArchiveDialog({ 
                                open: true, 
                                projectId: project.id, 
                                projectName: project.name,
                                isArchived 
                              })}
                            >
                              {isArchived ? (
                                <>
                                  <ArchiveRestore className="mr-2 h-4 w-4" />
                                  Unarchive Project
                                </>
                              ) : (
                                <>
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive Project
                                </>
                              )}
                            </DropdownMenuItem>
                            
                            {/* Cancel Project - only for cancellable statuses */}
                            {canCancel && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setCancelDialog({ 
                                  open: true, 
                                  projectId: project.id, 
                                  projectName: project.name 
                                })}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Cancel Project
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Empty State - PROJ-005-Client: Different messages for clients */}
      {filteredProjects.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
          <div className="text-center">
            <p className="text-muted-foreground">
              {searchQuery || activeFilterCount > 0 
                ? (searchQuery ? "No projects match your search." : "No projects match these filters.")
                : isClient 
                  ? (isClientAdmin 
                      ? "You don't have any projects yet. Click + New Project to create one."
                      : "You don't have any projects yet. Your Client Admin will create projects for your team.")
                  : "No projects yet"}
            </p>
            {(searchQuery || activeFilterCount > 0) ? (
              <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            ) : (!isClient || isClientAdmin) ? (
              <Link href="/projects/new" prefetch={true}>
                <Button className="mt-4 gap-1.5">
                  <Plus className="h-4 w-4" />
                  {isClient ? 'New Project' : 'Create First Project'}
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)} of {filteredProjects.length} projects
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  className="w-8"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveDialog.open} onOpenChange={(open) => setArchiveDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {archiveDialog.isArchived ? 'Unarchive' : 'Archive'} Project
            </DialogTitle>
            <DialogDescription>
              {archiveDialog.isArchived 
                ? `Are you sure you want to unarchive "${archiveDialog.projectName}"? It will appear in the main project list again.`
                : `Are you sure you want to archive "${archiveDialog.projectName}"? It will be hidden from the main project list but can be restored later.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialog(prev => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button onClick={handleArchive} variant={archiveDialog.isArchived ? 'default' : 'destructive'}>
              {archiveDialog.isArchived ? 'Unarchive' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Project Confirmation Dialog */}
      <Dialog open={cancelDialog.open} onOpenChange={(open) => { 
        setCancelDialog(prev => ({ ...prev, open }))
        if (!open) {
          setCancelReason('')
          setClientNote('')
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel {cancelDialog.projectName}?</DialogTitle>
            <DialogDescription>
              This will cancel the project and close all open tasks.
            </DialogDescription>
          </DialogHeader>
          
          {/* Warning Banner */}
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              All open tasks on this project will be closed. This action cannot be undone.
            </p>
          </div>
          
          <div className="space-y-4">
            {/* Cancellation Reason - Required */}
            <div className="space-y-2">
              <Label htmlFor="cancel-reason" className="text-sm font-medium">
                Reason for cancellation (internal, not visible to client) <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder="Enter the reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
            
            {/* Client Note - Optional */}
            <div className="space-y-2">
              <Label htmlFor="client-note" className="text-sm font-medium">
                Note for the client (optional — will be visible to client)
              </Label>
              <Textarea
                id="client-note"
                placeholder="Optional note to send to the client..."
                value={clientNote}
                onChange={(e) => setClientNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(prev => ({ ...prev, open: false }))}>
              Dismiss
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelProject}
              disabled={!cancelReason.trim()}
            >
              Cancel Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* PROJ-012: Duplicate Project Dialog */}
      <Dialog open={duplicateDialog.open} onOpenChange={(open) => { 
        setDuplicateDialog(prev => ({ ...prev, open }))
        if (!open) {
          setDuplicateName('')
          setIsDuplicating(false)
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Duplicate &quot;{duplicateDialog.originalName}&quot;?</DialogTitle>
            <DialogDescription>
              Create a new project with the same settings. Source files are not duplicated — you&apos;ll upload a new video after creation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* New Project Name */}
            <div className="space-y-2">
              <Label htmlFor="duplicate-name" className="text-sm font-medium">
                New project name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="duplicate-name"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="Enter project name..."
                autoFocus
              />
              {!duplicateName.trim() && (
                <p className="text-xs text-destructive">Project name is required.</p>
              )}
            </div>
            
            {/* What will be copied - Read-only summary */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-medium">What will be copied:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{duplicateDialog.client}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    getPriorityColor(duplicateDialog.priority)
                  )}>
                    {duplicateDialog.priority ? duplicateDialog.priority.charAt(0).toUpperCase() + duplicateDialog.priority.slice(1) : '-'}
                  </span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-muted-foreground">PM</span>
                  <span className="font-medium">{duplicateDialog.pm || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block mb-1">Services + Language Pairs</span>
                  <div className="flex flex-wrap gap-1">
                    {duplicateDialog.services.map((service, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-background rounded border border-border">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Also copied: reference files, internal notes
              </p>
            </div>
            
            {/* What is NOT copied */}
            <p className="text-xs text-muted-foreground">
              <strong>Not copied:</strong> source files, vendor assignments, billable volume, quotes/billing, delivered files, deadlines, status history
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDuplicateDialog(prev => ({ ...prev, open: false }))}
              disabled={isDuplicating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDuplicate}
              disabled={!duplicateName.trim() || isDuplicating}
            >
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
      <Dialog open={splitDialog.open} onOpenChange={(open) => { 
        setSplitDialog(prev => ({ ...prev, open }))
        if (!open) {
          setSplitTotalEpisodes('')
          setSplitPrefix('')
          setSplitError('')
          setIsSplitting(false)
          setSplitProgress({ created: 0, total: 0 })
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Split &quot;{splitDialog.projectName}&quot; into a series?</DialogTitle>
            <DialogDescription>
              &quot;{splitDialog.projectName}&quot; will be treated as Episode 01. We&apos;ll create additional episode projects for the rest of the series — same client, services, vendors, and settings. You&apos;ll upload each episode&apos;s source video after the split.
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
                  The original project ({splitDialog.projectName}) remains as Episode 01 — it is not modified or renamed.
                </p>
              </div>
            )}
            
            {/* What will be copied summary */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-medium">What each episode will inherit:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{splitDialog.client}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    getPriorityColor(splitDialog.priority)
                  )}>
                    {splitDialog.priority ? splitDialog.priority.charAt(0).toUpperCase() + splitDialog.priority.slice(1) : '-'}
                  </span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-muted-foreground">PM</span>
                  <span className="font-medium">{splitDialog.pm || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block mb-1">Services + Language Pairs</span>
                  <div className="flex flex-wrap gap-1">
                    {splitDialog.services.map((service, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-background rounded border border-border">
                        {service}
                      </span>
                    ))}
                  </div>
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
                    setSplitDialog(prev => ({ ...prev, open: false }))
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
                <Button 
                  variant="outline" 
                  onClick={() => setSplitDialog(prev => ({ ...prev, open: false }))}
                  disabled={isSplitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleConfirmSplit()}
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
    </div>
  )
}

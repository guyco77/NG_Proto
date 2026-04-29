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

type SortOption = 'date_created' | 'deadline' | 'priority' | 'client_name'

// Statuses that can be cancelled
const CANCELLABLE_STATUSES = ['draft', 'quoted', 'approved', 'in_progress', 'in_review', 'delivered', 'invoiced']

export default function ProjectsPage() {
  const { toast } = useToast()
  const router = useRouter()
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [serviceFilters, setServiceFilters] = useState<string[]>([])
  const [taskTypeFilters, setTaskTypeFilters] = useState<string[]>([])
  const [pmFilters, setPmFilters] = useState<string[]>([])
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
  
  const pms = mockUsers.filter(u => u.role === 'admin' || u.role === 'pm')
  
  // Use seed projects
  const projects = seedProjects
  
  // Filter projects
  const filteredProjects = useMemo(() => {
    let result = projects.filter((project) => {
      // Search
      const matchesSearch = !searchQuery || 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.client.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Status filter
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(project.status)
      
      // Service filter - match if project has any of the selected services
      const matchesService = serviceFilters.length === 0 || 
        project.services.some(s => serviceFilters.includes(s))
      
      // Task Type filter - for now, match based on service mapping (in real app, would check actual tasks)
      const matchesTaskType = taskTypeFilters.length === 0 // Simplified - would need task data
      
      // PM filter
      const matchesPM = pmFilters.length === 0 || pmFilters.includes(project.pmId)
      
      // Deadline range
      const matchesDeadline = (!deadlineRange.from || project.deadline >= deadlineRange.from) &&
        (!deadlineRange.to || project.deadline <= deadlineRange.to)
      
      // Archived
      const isArchived = project.status === 'closed'
      const matchesArchived = includeArchived || !isArchived
      
      return matchesSearch && matchesStatus && matchesService && matchesTaskType && matchesPM && matchesDeadline && matchesArchived
    })
    
    // Sort - default is date_created (newest first) per PRD
    result.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        case 'priority':
          const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'client_name':
          return a.client.localeCompare(b.client)
        case 'date_created':
        default:
          // Newest first
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
    
    return result
  }, [searchQuery, statusFilters, serviceFilters, taskTypeFilters, pmFilters, deadlineRange, includeArchived, sortBy, projects])
  
  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE)
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )
  
  // Active filter count
  const activeFilterCount = statusFilters.length + serviceFilters.length + taskTypeFilters.length + pmFilters.length + 
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
  
  const clearAllFilters = () => {
    setStatusFilters([])
    setServiceFilters([])
    setTaskTypeFilters([])
    setPmFilters([])
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
  
  const handleDuplicateProject = (projectId: string, projectName: string) => {
    toast({
      title: 'Duplicate Project',
      description: `Opening duplicate dialog for "${projectName}"...`,
    })
    // In real implementation, would open PROJ-012 modal
  }
  
  const handleSplitProject = (projectId: string, projectName: string) => {
    toast({
      title: 'Split Project',
      description: `Opening split dialog for "${projectName}"...`,
    })
    // In real implementation, would open PROJ-013 modal
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredProjects.length} of {projects.length} projects
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Link href="/projects/new" prefetch={true}>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
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
        
        {/* PM Filter */}
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
        
        {/* Sort */}
        <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
          <SelectTrigger className="w-40 h-9">
            <ArrowUpDown className="h-3 w-3 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_created">Date Created</SelectItem>
            <SelectItem value="deadline">Deadline</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="client_name">Client Name</SelectItem>
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
          {pmFilters.map((pmId) => (
            <span key={pmId} className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
              {pms.find(p => p.id === pmId)?.name}
              <button onClick={() => togglePMFilter(pmId)} className="hover:bg-purple-200 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
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
              <TableHead className="w-[280px]">Project</TableHead>
              <TableHead className="w-[140px]">Client</TableHead>
              <TableHead className="w-[160px]">Status</TableHead>
              <TableHead className="w-[100px]">PM</TableHead>
              <TableHead className="w-[110px]">Deadline</TableHead>
              <TableHead className="w-[90px]">Priority</TableHead>
              <TableHead className="w-[80px] text-right">Progress</TableHead>
              <TableHead className="w-[50px]"></TableHead>
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
                  
                  {/* Client */}
                  <TableCell>
                    <span className="text-sm">{project.client}</span>
                  </TableCell>
                  
                  {/* Status + Unassigned badge */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={project.status} />
                      {project.isUnassigned && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* PM */}
                  <TableCell>
                    <span className="text-sm">{project.pm}</span>
                  </TableCell>
                  
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
                  
                  {/* Actions Menu */}
                  <TableCell>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* Duplicate Project - available on any status */}
                          <DropdownMenuItem onClick={() => handleDuplicateProject(project.id, project.name)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate Project
                          </DropdownMenuItem>
                          
                          {/* Split Project - available on any status */}
                          <DropdownMenuItem onClick={() => handleSplitProject(project.id, project.name)}>
                            <Split className="mr-2 h-4 w-4" />
                            Split Project
                          </DropdownMenuItem>
                          
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
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
          <div className="text-center">
            <p className="text-muted-foreground">
              {searchQuery || activeFilterCount > 0 
                ? "No projects match your filters" 
                : "No projects yet"}
            </p>
            {(searchQuery || activeFilterCount > 0) ? (
              <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            ) : (
              <Link href="/projects/new" prefetch={true}>
                <Button className="mt-4 gap-1.5">
                  <Plus className="h-4 w-4" />
                  Create First Project
                </Button>
              </Link>
            )}
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
    </div>
  )
}

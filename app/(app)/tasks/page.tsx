'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  User,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  UserPlus,
  X,
  FileCheck,
  Trash2,
  Send,
  Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useToast } from '@/hooks/use-toast'
import { mockTasks, mockProjects, mockVendors, formatCurrency, formatDate, TASK_STATUSES, TASK_SERVICE_TYPES } from '@/lib/mock-data'
import { useRole } from '../layout'
import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/lib/types'

const ITEMS_PER_PAGE = 50

function getServiceIcon(serviceType: string): string {
  // Icons for all 16 canonical Task Step Types
  const icons: Record<string, string> = {
    'Transcription': '🎙️',
    'Transcription AI': '🤖',
    'Timing': '⏱️',
    'Timing AI': '⏰',
    'Translation': '🌐',
    'Translation from Audio': '🎧',
    'Upload TT': '📤',
    'Upload Text File': '📄',
    'QC': '✅',
    'PM Verification': '📋',
    'Proofread': '📝',
    'Client Review': '👤',
    'Upload Client Asset': '📁',
    'Upload Rough Cut': '🎬',
    'New Cut': '✂️',
    'Project Creation': '🆕',
  }
  return icons[serviceType] || '📄'
}

function isOverdue(dateString: string): boolean {
  return new Date(dateString) < new Date()
}

export default function TasksPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const acceptedTaskId = searchParams.get('accepted')
  
  // State for highlighting just-accepted task
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null)
  
  // Show highlight animation when task is just accepted from offers
  useEffect(() => {
    if (acceptedTaskId) {
      setHighlightedTaskId(acceptedTaskId)
      // Remove highlight after 3 seconds
      const timer = setTimeout(() => setHighlightedTaskId(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [acceptedTaskId])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [projectFilters, setProjectFilters] = useState<string[]>([])
  const [serviceTypeFilters, setServiceTypeFilters] = useState<string[]>([])
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'deadline' | 'status' | 'project' | 'service'>('deadline')
  const [includeCompleted, setIncludeCompleted] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  
  // TASK-003 & TASK-004: Assign Vendor dialog state (single or bulk)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null)
  const [assigningTaskIds, setAssigningTaskIds] = useState<string[]>([]) // TASK-004: bulk assign
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [vendorSearchQuery, setVendorSearchQuery] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  
  // TASK-009: Post as Open Offer dialog state
  const [showOfferDialog, setShowOfferDialog] = useState(false)
  const [offeringTaskId, setOfferingTaskId] = useState<string | null>(null)
  const [offerDescription, setOfferDescription] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  
  // TASK-009: Withdraw Offer confirmation
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [withdrawingTaskId, setWithdrawingTaskId] = useState<string | null>(null)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  
  // Delete task dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Local task state for inline updates (simulating backend)
  const [localTaskUpdates, setLocalTaskUpdates] = useState<Record<string, { status?: string; assignedVendor?: string; vendorId?: string }>>({})

  const isAdmin = currentRole === 'admin'
  const isPM = currentRole === 'pm'
  const isVendor = currentRole === 'vendor'

  // Filter tasks based on role and filters
  const filteredTasks = useMemo(() => {
    // Apply local updates to mock tasks
    let tasks = mockTasks.map(t => ({
      ...t,
      ...localTaskUpdates[t.id],
    }))
    
    // Filter out deleted tasks
    tasks = tasks.filter(t => t.status !== 'deleted')

    // Role-based filtering
    if (isVendor) {
      // Vendor sees only their own assigned tasks (simulated with vendor id 'v1')
      // In production, this is enforced at DB layer via RLS
      tasks = tasks.filter(t => t.vendorId === 'v1')
    } else if (isPM && !isAdmin) {
      // PM sees only tasks in projects assigned to them (simplified for mock - using PM id '2')
      const pmProjects = mockProjects.filter(p => p.pmId === '2').map(p => p.id)
      tasks = tasks.filter(t => pmProjects.includes(t.projectId))
    }

    // Exclude completed unless toggled
    if (!includeCompleted) {
      tasks = tasks.filter(t => t.status !== 'complete')
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      tasks = tasks.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.projectName.toLowerCase().includes(query) ||
        (t.assignedVendor && t.assignedVendor.toLowerCase().includes(query))
      )
    }

    // Status filter
    if (statusFilters.length > 0) {
      tasks = tasks.filter(t => statusFilters.includes(t.status))
    }

    // Project filter
    if (projectFilters.length > 0) {
      tasks = tasks.filter(t => projectFilters.includes(t.projectId))
    }

    // Service type filter
    if (serviceTypeFilters.length > 0) {
      tasks = tasks.filter(t => t.serviceType && serviceTypeFilters.includes(t.serviceType))
    }

    // Vendor filter
    if (vendorFilter !== 'all') {
      tasks = tasks.filter(t => t.vendorId === vendorFilter)
    }

    // Sort
    tasks.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'status':
          return TASK_STATUSES.findIndex(s => s.value === a.status) - TASK_STATUSES.findIndex(s => s.value === b.status)
        case 'project':
          return a.projectName.localeCompare(b.projectName)
        case 'service':
          return (a.serviceType || '').localeCompare(b.serviceType || '')
        default:
          return 0
      }
    })

    return tasks
  }, [searchQuery, statusFilters, projectFilters, serviceTypeFilters, vendorFilter, sortBy, includeCompleted, isPM, isAdmin, localTaskUpdates])

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Selection handlers
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const toggleAllSelection = () => {
    if (selectedTasks.length === paginatedTasks.length) {
      setSelectedTasks([])
    } else {
      setSelectedTasks(paginatedTasks.map(t => t.id))
    }
  }

  // Filter pill helpers
  const activeFilters = [
    ...statusFilters.map(s => ({ type: 'status', value: s, label: TASK_STATUSES.find(st => st.value === s)?.label || s })),
    ...projectFilters.map(p => ({ type: 'project', value: p, label: mockProjects.find(pr => pr.id === p)?.name || p })),
    ...serviceTypeFilters.map(st => ({ type: 'serviceType', value: st, label: st })),
  ]

  const removeFilter = (type: string, value: string) => {
    if (type === 'status') setStatusFilters(prev => prev.filter(v => v !== value))
    if (type === 'project') setProjectFilters(prev => prev.filter(v => v !== value))
    if (type === 'serviceType') setServiceTypeFilters(prev => prev.filter(v => v !== value))
  }

  const clearAllFilters = () => {
    setStatusFilters([])
    setProjectFilters([])
    setServiceTypeFilters([])
    setVendorFilter('all')
    setSearchQuery('')
  }

  // Count unassigned tasks in selection
  const unassignedSelected = selectedTasks.filter(id => {
    const task = filteredTasks.find(t => t.id === id)
    return task && task.status === 'unassigned'
  }).length
  
  // Get task being assigned/offered for dialog context
  const assigningTask = assigningTaskId ? filteredTasks.find(t => t.id === assigningTaskId) : null
  const offeringTask = offeringTaskId ? filteredTasks.find(t => t.id === offeringTaskId) : null
  const deletingTask = deletingTaskId ? filteredTasks.find(t => t.id === deletingTaskId) : null
  
  // TASK-004: Get tasks being bulk assigned
  const bulkAssignTasks = assigningTaskIds.length > 0 
    ? assigningTaskIds.map(id => filteredTasks.find(t => t.id === id)).filter(Boolean) as typeof filteredTasks
    : []
  const eligibleBulkTasks = bulkAssignTasks.filter(t => t.status === 'unassigned')
  const ineligibleCount = bulkAssignTasks.length - eligibleBulkTasks.length
  const isBulkAssign = assigningTaskIds.length > 0
  
  // TASK-003 & TASK-004: Handle vendor assignment (single or bulk)
  const handleAssignVendor = async () => {
    if (!selectedVendorId) return
    
    // Determine which tasks to assign
    const taskIdsToAssign = isBulkAssign 
      ? eligibleBulkTasks.map(t => t.id)
      : (assigningTaskId ? [assigningTaskId] : [])
    
    if (taskIdsToAssign.length === 0) return
    
    setIsAssigning(true)
    await new Promise(r => setTimeout(r, 500))
    
    const vendor = mockVendors.find(v => v.id === selectedVendorId)
    
    // Update all tasks
    const updates: Record<string, { status: string; assignedVendor?: string; vendorId?: string }> = {}
    taskIdsToAssign.forEach(id => {
      updates[id] = { status: 'assigned', assignedVendor: vendor?.name, vendorId: selectedVendorId }
    })
    setLocalTaskUpdates(prev => ({ ...prev, ...updates }))
    
    // Toast message
    if (isBulkAssign) {
      toast({
        title: `${vendor?.name} assigned to ${taskIdsToAssign.length} tasks.`,
        description: 'Vendor has been notified via a single consolidated notification.',
      })
      setSelectedTasks([]) // Clear selection after bulk assign
    } else {
      toast({
        title: `${vendor?.name} assigned to ${assigningTask?.name}.`,
        description: 'Vendor has been notified via email and in-app notification.',
      })
    }
    
    setIsAssigning(false)
    setShowAssignDialog(false)
    setAssigningTaskId(null)
    setAssigningTaskIds([])
    setSelectedVendorId(null)
    setVendorSearchQuery('')
  }
  
  // TASK-004: Open bulk assign modal
  const handleOpenBulkAssign = () => {
    const unassignedIds = selectedTasks.filter(id => {
      const task = filteredTasks.find(t => t.id === id)
      return task && task.status === 'unassigned'
    })
    setAssigningTaskIds(selectedTasks) // Include all selected, we'll filter in modal
    setShowAssignDialog(true)
  }
  
  // TASK-009: Handle post as open offer
  const handlePostOffer = async () => {
    if (!offeringTaskId) return
    setIsPosting(true)
    await new Promise(r => setTimeout(r, 500))
    
    setLocalTaskUpdates(prev => ({
      ...prev,
      [offeringTaskId]: { status: 'open_for_offers' }
    }))
    
    toast({
      title: `Task posted as open offer.`,
      description: 'Matching vendors have been notified.',
    })
    
    setIsPosting(false)
    setShowOfferDialog(false)
    setOfferingTaskId(null)
    setOfferDescription('')
  }
  
  // TASK-009: Handle withdraw offer
  const handleWithdrawOffer = async () => {
    if (!withdrawingTaskId) return
    setIsWithdrawing(true)
    await new Promise(r => setTimeout(r, 500))
    
    setLocalTaskUpdates(prev => ({
      ...prev,
      [withdrawingTaskId]: { status: 'unassigned' }
    }))
    
    toast({
      title: 'Offer withdrawn.',
      description: 'Task is now unassigned.',
    })
    
    setIsWithdrawing(false)
    setShowWithdrawDialog(false)
    setWithdrawingTaskId(null)
  }
  
  // Delete task handler
  const handleDeleteTask = async () => {
    if (!deletingTaskId) return
    setIsDeleting(true)
    await new Promise(r => setTimeout(r, 500))
    
    // For mock, just remove from local updates (in real app, soft delete)
    setLocalTaskUpdates(prev => ({
      ...prev,
      [deletingTaskId]: { status: 'deleted' as string }
    }))
    
    toast({
      title: 'Task deleted.',
      description: 'Task has been soft-deleted. Admin can recover within 30 days.',
    })
    
    setIsDeleting(false)
    setShowDeleteDialog(false)
    setDeletingTaskId(null)
  }
  
  // Bulk post as open offer
  const handleBulkPostOffer = async () => {
    const unassignedIds = selectedTasks.filter(id => {
      const task = filteredTasks.find(t => t.id === id)
      return task && task.status === 'unassigned'
    })
    
    if (unassignedIds.length === 0) return
    
    // Update all unassigned tasks to open_for_offers
    const updates: Record<string, { status: string }> = {}
    unassignedIds.forEach(id => {
      updates[id] = { status: 'open_for_offers' }
    })
    setLocalTaskUpdates(prev => ({ ...prev, ...updates }))
    
    toast({
      title: `${unassignedIds.length} tasks posted as open offers.`,
      description: 'Matching vendors have been notified.',
    })
    
    setSelectedTasks([])
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{isVendor ? 'My Tasks' : 'Tasks'}</h1>
        <p className="text-sm text-muted-foreground mt-1">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks, projects, vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-80 rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Project Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-4 w-4" />
              Project
              {projectFilters.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                  {projectFilters.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3">
            <div className="space-y-2">
              {mockProjects.map((project) => (
                <div key={project.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`project-${project.id}`}
                    checked={projectFilters.includes(project.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setProjectFilters([...projectFilters, project.id])
                      } else {
                        setProjectFilters(projectFilters.filter(p => p !== project.id))
                      }
                    }}
                  />
                  <Label htmlFor={`project-${project.id}`} className="text-sm cursor-pointer">
                    {project.name}
                  </Label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Status Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-4 w-4" />
              Status
              {statusFilters.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                  {statusFilters.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3">
            <div className="space-y-2">
              {TASK_STATUSES.map((status) => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={statusFilters.includes(status.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setStatusFilters([...statusFilters, status.value])
                      } else {
                        setStatusFilters(statusFilters.filter(s => s !== status.value))
                      }
                    }}
                  />
                  <Label htmlFor={`status-${status.value}`} className="text-sm cursor-pointer">
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Task Step (Service Type) Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-4 w-4" />
              Task Step
              {serviceTypeFilters.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                  {serviceTypeFilters.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3">
            <div className="space-y-2">
              {TASK_SERVICE_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`service-${type}`}
                    checked={serviceTypeFilters.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setServiceTypeFilters([...serviceTypeFilters, type])
                      } else {
                        setServiceTypeFilters(serviceTypeFilters.filter(s => s !== type))
                      }
                    }}
                  />
                  <Label htmlFor={`service-${type}`} className="text-sm cursor-pointer">
                    {getServiceIcon(type)} {type}
                  </Label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Vendor Filter - hidden for vendors (they only see their own tasks) */}
        {!isVendor && (
          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {mockVendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">Deadline soonest</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="project">Project</SelectItem>
            <SelectItem value="service">Service Type</SelectItem>
          </SelectContent>
        </Select>

        {/* Include Completed Toggle */}
        <div className="flex items-center space-x-2 ml-auto">
          <Switch
            id="include-completed"
            checked={includeCompleted}
            onCheckedChange={setIncludeCompleted}
          />
          <Label htmlFor="include-completed" className="text-sm cursor-pointer">
            Include completed
          </Label>
        </div>
      </div>

      {/* Active Filter Pills */}
      {activeFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {activeFilters.map((filter, index) => (
            <span
              key={`${filter.type}-${filter.value}-${index}`}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
            >
              {filter.label}
              <button
                onClick={() => removeFilter(filter.type, filter.value)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Bulk Action Bar - Admin/PM only */}
      {!isVendor && selectedTasks.length > 0 && (
        <div className="mb-4 flex items-center gap-4 rounded-lg bg-muted p-3">
          <span className="text-sm font-medium">{selectedTasks.length} tasks selected</span>
          {selectedTasks.length > 50 ? (
            <span className="text-sm text-muted-foreground">Select up to 50 tasks at a time for bulk actions</span>
          ) : unassignedSelected > 0 ? (
            <>
              <Button size="sm" className="gap-1.5" onClick={handleOpenBulkAssign}>
                <UserPlus className="h-4 w-4" />
                Assign Vendor to {unassignedSelected} Unassigned
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleBulkPostOffer}>
                <Send className="h-4 w-4" />
                Post {unassignedSelected} as Open Offer
              </Button>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No unassigned tasks selected</span>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSelectedTasks([])}>
            Clear selection
          </Button>
        </div>
      )}

      {/* Tasks Table */}
      <Card>
        <CardContent className="px-4 py-2">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {/* Checkbox column hidden for vendors - no bulk actions */}
                {!isVendor && (
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={selectedTasks.length === paginatedTasks.length && paginatedTasks.length > 0}
                      onCheckedChange={toggleAllSelection}
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Task</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Language</th>
                {/* Vendor column hidden for vendors - they only see their own tasks */}
                {!isVendor && <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Vendor</th>}
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Deadline</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedTasks.map((task) => {
                const taskOverdue = isOverdue(task.dueDate) && task.status !== 'complete'
                const isHighlighted = highlightedTaskId === task.id
                return (
                  <tr 
                    key={task.id} 
                    className={cn(
                      "hover:bg-muted/50 transition-colors duration-500",
                      taskOverdue && "bg-red-50/50",
                      isHighlighted && "animate-pulse bg-emerald-50 ring-2 ring-emerald-500 ring-inset"
                    )}
                  >
                    {/* Checkbox column hidden for vendors */}
                    {!isVendor && (
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={() => toggleTaskSelection(task.id)}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Link href={`/tasks/${task.id}`} className="hover:text-primary">
                        <div className="flex items-center gap-2">
                          <span>{getServiceIcon(task.serviceType || 'Translation')}</span>
                          <div>
                            <p className="font-medium text-sm">{task.name}</p>
                            <p className="text-xs text-muted-foreground">{task.serviceType || task.service}</p>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/projects/${task.projectId}`} className="text-sm text-muted-foreground hover:text-foreground">
                        {task.projectName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {task.sourceLanguage && task.targetLanguage ? (
                        <span className="flex items-center gap-1 text-sm">
                          {task.sourceLanguage}
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          {task.targetLanguage}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    {/* Vendor column hidden for vendors */}
                    {!isVendor && (
                      <td className="px-4 py-3">
                        {task.assignedVendor ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-sm">{task.assignedVendor}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={task.status} />
                        {taskOverdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            <AlertTriangle className="h-3 w-3" />
                            Overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className={cn("h-4 w-4", taskOverdue ? "text-red-500" : "text-muted-foreground")} />
                        <span className={cn(taskOverdue && "text-red-600 font-medium")}>
                          {formatDate(task.dueDate)}
                          {taskOverdue && (
                            <span className="ml-1 text-red-500">
                              ({Math.ceil((new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))}d overdue)
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
<DropdownMenuContent align="end">
                                          <DropdownMenuItem asChild>
                                            <Link href={`/tasks/${task.id}`}>View Details</Link>
                                          </DropdownMenuItem>
                                          {/* Admin/PM-only actions - hidden for vendors */}
                                          {!isVendor && (
                                            <>
                                              {/* TASK-003: Assign Vendor - available for unassigned and open_for_offers */}
                                              {(task.status === 'unassigned' || task.status === 'open_for_offers') && (
                                                <DropdownMenuItem onClick={() => {
                                                  setAssigningTaskId(task.id)
                                                  setShowAssignDialog(true)
                                                }}>
                                                  <UserPlus className="mr-2 h-4 w-4" />
                                                  Assign Vendor
                                                </DropdownMenuItem>
                                              )}
                                              {/* TASK-009: Post as Open Offer - only for unassigned */}
                                              {task.status === 'unassigned' && (
                                                <DropdownMenuItem onClick={() => {
                                                  setOfferingTaskId(task.id)
                                                  setShowOfferDialog(true)
                                                }}>
                                                  <Send className="mr-2 h-4 w-4" />
                                                  Post as Open Offer
                                                </DropdownMenuItem>
                                              )}
                                              {/* TASK-009: Withdraw Offer - only for open_for_offers */}
                                              {task.status === 'open_for_offers' && (
                                                <DropdownMenuItem onClick={() => {
                                                  setWithdrawingTaskId(task.id)
                                                  setShowWithdrawDialog(true)
                                                }}>
                                                  <Undo2 className="mr-2 h-4 w-4" />
                                                  Withdraw Offer
                                                </DropdownMenuItem>
                                              )}
                                              {/* Delete Task - not shown for assigned, in_progress, submitted, complete */}
                                              {!['assigned', 'in_progress', 'submitted', 'complete'].includes(task.status) && (
                                                <>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem 
                                                    className="text-destructive"
                                                    onClick={() => {
                                                      setDeletingTaskId(task.id)
                                                      setShowDeleteDialog(true)
                                                    }}
                                                  >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete Task
                                                  </DropdownMenuItem>
                                                </>
                                              )}
                                            </>
                                          )}
                                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Empty State */}
          {paginatedTasks.length === 0 && (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">No tasks match your filters.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredTasks.length)} of {filteredTasks.length} tasks
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* TASK-003 & TASK-004: Assign Vendor Modal (single or bulk) */}
      <Dialog open={showAssignDialog} onOpenChange={(open) => {
        setShowAssignDialog(open)
        if (!open) {
          setAssigningTaskId(null)
          setAssigningTaskIds([])
          setSelectedVendorId(null)
          setVendorSearchQuery('')
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Vendor</DialogTitle>
            <DialogDescription>
              {isBulkAssign ? (
                <>Select a vendor for {eligibleBulkTasks.length} task{eligibleBulkTasks.length !== 1 ? 's' : ''}</>
              ) : assigningTask ? (
                <>Select a vendor for {assigningTask.serviceType || assigningTask.service} ({assigningTask.sourceLanguage} → {assigningTask.targetLanguage})</>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* TASK-004: Ineligible tasks banner */}
            {isBulkAssign && ineligibleCount > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                {ineligibleCount} of {bulkAssignTasks.length} selected tasks aren&apos;t Unassigned and will be skipped.
              </div>
            )}
            
            {/* TASK-004: No eligible tasks warning */}
            {isBulkAssign && eligibleBulkTasks.length === 0 && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                No Unassigned tasks in selection. Select at least one Unassigned task to assign.
              </div>
            )}
            
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
                            {vendor.tasksDelivered || 0} tasks delivered in {isBulkAssign ? 'selected types' : (assigningTask?.serviceType || 'Translation')}, {vendor.onTimeRate || 95}% on-time
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
              setAssigningTaskId(null)
              setAssigningTaskIds([])
              setSelectedVendorId(null)
              setVendorSearchQuery('')
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignVendor}
              disabled={!selectedVendorId || isAssigning || (isBulkAssign && eligibleBulkTasks.length === 0)}
            >
              {isAssigning ? 'Assigning...' : isBulkAssign ? `Assign to ${eligibleBulkTasks.length} Tasks` : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* TASK-009: Post as Open Offer Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={(open) => {
        setShowOfferDialog(open)
        if (!open) {
          setOfferingTaskId(null)
          setOfferDescription('')
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Post as Open Offer</DialogTitle>
            <DialogDescription>
              Post this task to the vendor offers board? Matching vendors will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {offeringTask && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="font-medium text-sm">{offeringTask.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {offeringTask.serviceType || offeringTask.service} · {offeringTask.sourceLanguage} → {offeringTask.targetLanguage}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="offer-description">Additional instructions (optional)</Label>
              <Textarea
                id="offer-description"
                placeholder="Add any special requirements or notes for vendors..."
                value={offerDescription}
                onChange={(e) => setOfferDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowOfferDialog(false)
              setOfferingTaskId(null)
              setOfferDescription('')
            }}>
              Cancel
            </Button>
            <Button onClick={handlePostOffer} disabled={isPosting}>
              {isPosting ? 'Posting...' : 'Post Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* TASK-009: Withdraw Offer Confirmation Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={(open) => {
        setShowWithdrawDialog(open)
        if (!open) setWithdrawingTaskId(null)
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Withdraw Offer?</DialogTitle>
            <DialogDescription>
              This will remove the task from the vendor offers board and revert it to Unassigned status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowWithdrawDialog(false)
              setWithdrawingTaskId(null)
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleWithdrawOffer} disabled={isWithdrawing}>
              {isWithdrawing ? 'Withdrawing...' : 'Withdraw Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Task Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => {
        setShowDeleteDialog(open)
        if (!open) setDeletingTaskId(null)
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Task?</DialogTitle>
            <DialogDescription>
              {deletingTask && (
                <>
                  Are you sure you want to delete &quot;{deletingTask.name}&quot;? This action will soft-delete the task. Admins can recover it within 30 days.
                  {deletingTask.status === 'open_for_offers' && (
                    <span className="block mt-2 text-amber-600">
                      Note: This task has an active open offer which will be automatically withdrawn.
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false)
              setDeletingTaskId(null)
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

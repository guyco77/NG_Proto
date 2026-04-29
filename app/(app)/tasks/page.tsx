'use client'

import { useState, useMemo } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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
import { mockTasks, mockProjects, mockVendors, formatCurrency, formatDate, TASK_STATUSES, TASK_SERVICE_TYPES } from '@/lib/mock-data'
import { useRole } from '../layout'
import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/lib/types'

const ITEMS_PER_PAGE = 50

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

function isOverdue(dateString: string): boolean {
  return new Date(dateString) < new Date()
}

export default function TasksPage() {
  const { currentRole } = useRole()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [projectFilters, setProjectFilters] = useState<string[]>([])
  const [serviceTypeFilters, setServiceTypeFilters] = useState<string[]>([])
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'deadline' | 'status' | 'project' | 'service'>('deadline')
  const [includeCompleted, setIncludeCompleted] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const isAdmin = currentRole === 'admin'
  const isPM = currentRole === 'pm'

  // Filter tasks based on role and filters
  const filteredTasks = useMemo(() => {
    let tasks = [...mockTasks]

    // Role-based filtering
    if (isPM && !isAdmin) {
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
  }, [searchQuery, statusFilters, projectFilters, serviceTypeFilters, vendorFilter, sortBy, includeCompleted, isPM, isAdmin])

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
    const task = mockTasks.find(t => t.id === id)
    return task && task.status === 'unassigned'
  }).length

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">{filteredTasks.length} tasks</p>
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

        {/* Vendor Filter */}
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

      {/* Bulk Action Bar */}
      {selectedTasks.length > 0 && (
        <div className="mb-4 flex items-center gap-4 rounded-lg bg-muted p-3">
          <span className="text-sm font-medium">{selectedTasks.length} tasks selected</span>
          {unassignedSelected > 0 && selectedTasks.length <= 50 ? (
            <Button size="sm" className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              Assign Vendor to {unassignedSelected} Unassigned
            </Button>
          ) : selectedTasks.length > 50 ? (
            <span className="text-sm text-muted-foreground">Select up to 50 tasks at a time for bulk assign</span>
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
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={selectedTasks.length === paginatedTasks.length && paginatedTasks.length > 0}
                    onCheckedChange={toggleAllSelection}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Task</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Language</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Deadline</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedTasks.map((task) => {
                const taskOverdue = isOverdue(task.dueDate) && task.status !== 'complete'
                return (
                  <tr 
                    key={task.id} 
                    className={cn(
                      "hover:bg-muted/50",
                      taskOverdue && "bg-red-50/50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedTasks.includes(task.id)}
                        onCheckedChange={() => toggleTaskSelection(task.id)}
                      />
                    </td>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={task.status} />
                        {taskOverdue && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className={cn(taskOverdue && "text-red-600 font-medium")}>
                          {formatDate(task.dueDate)}
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
                          {task.status === 'unassigned' && (
                            <DropdownMenuItem>Assign Vendor</DropdownMenuItem>
                          )}
                          {task.status === 'unassigned' && (
                            <DropdownMenuItem>Post as Open Offer</DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Delete Task</DropdownMenuItem>
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
    </div>
  )
}

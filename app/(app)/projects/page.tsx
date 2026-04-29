'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Users,
  ListTodo,
  X,
  ChevronDown,
  ChevronUp,
  Archive,
  ArchiveRestore,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/status-badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
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
import { mockProjects, mockTasks, mockUsers, formatCurrency, formatDate, getPriorityColor, PROJECT_STATUSES } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const SERVICES = ['Subtitling', 'Dubbing', 'QC', 'Mixing', 'Closed Captions', 'Translation', 'Transcription']
const ITEMS_PER_PAGE = 25

type SortOption = 'date_created' | 'deadline' | 'priority' | 'client_name'

export default function ProjectsPage() {
  const { toast } = useToast()
  const router = useRouter()
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [serviceFilters, setServiceFilters] = useState<string[]>([])
  const [pmFilters, setPmFilters] = useState<string[]>([])
  const [deadlineRange, setDeadlineRange] = useState<{ from: string; to: string }>({ from: '', to: '' })
  const [includeArchived, setIncludeArchived] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('date_created')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  
  // Expanded rows for task summary
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  // Archive dialog
  const [archiveDialog, setArchiveDialog] = useState<{ open: boolean; projectId: string; projectName: string; isArchived: boolean }>({
    open: false,
    projectId: '',
    projectName: '',
    isArchived: false,
  })
  
  const pms = mockUsers.filter(u => u.role === 'admin' || u.role === 'pm')
  
  // Filter projects
  const filteredProjects = useMemo(() => {
    let result = mockProjects.filter((project) => {
      // Search
      const matchesSearch = !searchQuery || 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.client.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Status filter
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(project.status)
      
      // Service filter
      const matchesService = serviceFilters.length === 0 || 
        project.services.some(s => serviceFilters.includes(s))
      
      // PM filter
      const matchesPM = pmFilters.length === 0 || pmFilters.includes(project.pmId)
      
      // Deadline range
      const matchesDeadline = (!deadlineRange.from || project.deadline >= deadlineRange.from) &&
        (!deadlineRange.to || project.deadline <= deadlineRange.to)
      
      // Archived (mock - using closed status as archived)
      const isArchived = project.isArchived || project.status === 'closed'
      const matchesArchived = includeArchived || !isArchived
      
      return matchesSearch && matchesStatus && matchesService && matchesPM && matchesDeadline && matchesArchived
    })
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'client_name':
          return a.client.localeCompare(b.client)
        case 'date_created':
        default:
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      }
    })
    
    return result
  }, [searchQuery, statusFilters, serviceFilters, pmFilters, deadlineRange, includeArchived, sortBy])
  
  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE)
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )
  
  // Active filter count
  const activeFilterCount = statusFilters.length + serviceFilters.length + pmFilters.length + 
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
  
  const togglePMFilter = (pmId: string) => {
    setPmFilters(prev => 
      prev.includes(pmId) ? prev.filter(p => p !== pmId) : [...prev, pmId]
    )
    setCurrentPage(1)
  }
  
  const clearAllFilters = () => {
    setStatusFilters([])
    setServiceFilters([])
    setPmFilters([])
    setDeadlineRange({ from: '', to: '' })
    setSearchQuery('')
    setCurrentPage(1)
  }
  
  const toggleExpanded = (projectId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }
  
  const handleArchive = () => {
    const action = archiveDialog.isArchived ? 'unarchived' : 'archived'
    toast({
      title: `Project ${action}`,
      description: `${archiveDialog.projectName} has been ${action}.`,
    })
    setArchiveDialog({ open: false, projectId: '', projectName: '', isArchived: false })
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredProjects.length} of {mockProjects.length} projects
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
      
      {/* Filters Row */}
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
        
        {/* Service Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              Service Type
              {serviceFilters.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {serviceFilters.length}
                </span>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            {SERVICES.map((service) => (
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
        <div className="mb-4 flex flex-wrap gap-2">
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

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paginatedProjects.map((project) => {
          const projectTasks = mockTasks.filter(t => t.projectId === project.id)
          const isExpanded = expandedRows.has(project.id)
          const isArchived = project.isArchived || project.status === 'closed'
          
          return (
            <Link key={project.id} href={`/projects/${project.id}`} className="block">
              <Card className={cn(
                "hover:border-primary/50 transition-colors h-full cursor-pointer",
                isArchived && "opacity-60"
              )}>
                <CardContent className="px-5 py-1">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{project.client}</p>
                    </div>
                    <div onClick={(e) => e.preventDefault()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => setArchiveDialog({ 
                          open: true, 
                          projectId: project.id, 
                          projectName: project.name,
                          isArchived 
                        })}
                        className={isArchived ? '' : 'text-destructive'}
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
                    </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                <div className="mb-3 flex items-center gap-2">
                  <StatusBadge status={project.status} />
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getPriorityColor(project.priority))}>
                    {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                  </span>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {project.services.slice(0, 3).map((service) => (
                    <span
                      key={service}
                      className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {service}
                    </span>
                  ))}
                  {project.services.length > 3 && (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      +{project.services.length - 3}
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(project.deadline)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <ListTodo className="h-3.5 w-3.5" />
                    <span>{project.completedTasks}/{project.taskCount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{project.pm.split(' ')[0]}</span>
                  </div>
                </div>
                
                {/* Task Summary Expansion */}
                {projectTasks.length > 0 && (
                  <div className="mt-3 border-t border-border pt-3" onClick={(e) => e.preventDefault()}>
                    <button
                      onClick={(e) => { e.preventDefault(); toggleExpanded(project.id); }}
                      className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground"
                    >
                      <span>Tasks ({projectTasks.length})</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {projectTasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/tasks/${task.id}`); }}
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity',
                              task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              task.status === 'review' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            )}
                          >
                            {task.name.length > 20 ? task.name.slice(0, 20) + '...' : task.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="font-semibold">{formatCurrency(project.budget, project.currency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Spent</p>
                    <p className="font-semibold">{formatCurrency(project.spent, project.currency)}</p>
                  </div>
                </div>
              </CardContent>
              </Card>
            </Link>
          )
        })}
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
        <div className="mt-6 flex items-center justify-between">
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
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  Download,
  Send,
  Trash2,
  Edit,
  Eye,
  X,
  ChevronDown,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { StatusBadge } from '@/components/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { mockQuotes, mockProjects, mockClients, formatCurrency, formatDate, QUOTE_STATUSES } from '@/lib/mock-data'
import { useRole } from '../layout'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const ITEMS_PER_PAGE = 25

export default function QuotesPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [dateFilterType, setDateFilterType] = useState<'created' | 'approved'>('created')
  const [sortBy, setSortBy] = useState<string>('date_created')
  const [showDeleted, setShowDeleted] = useState(false)
  
  // Selection
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null)
  
  // Pagination (infinite scroll simulation)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  
  const isAdmin = currentRole === 'admin'
  const isPM = currentRole === 'pm'
  const isFinance = currentRole === 'finance'
  const isClient = currentRole === 'client'
  
  // Data scoping based on role
  const scopedQuotes = useMemo(() => {
    let quotes = [...mockQuotes]
    
    if (isClient) {
      // Client sees only their own quotes
      quotes = quotes.filter(q => q.clientId === 'c1') // Simplified for mock
    } else if (isPM && !isAdmin) {
      // PM sees all quotes but can only edit/send/delete on assigned projects
      // All quotes visible for now, actions restricted per-row
    }
    
    // Filter out deleted unless admin with toggle
    if (!showDeleted) {
      quotes = quotes.filter(q => !q.isDeleted)
    }
    
    return quotes
  }, [isClient, isPM, isAdmin, showDeleted])
  
  // Filtered and sorted quotes
  const filteredQuotes = useMemo(() => {
    let quotes = [...scopedQuotes]
    
    // Update 02: Search matches quote number, quote name, and client name (not project name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      quotes = quotes.filter(q => 
        q.quoteNumber.toLowerCase().includes(query) ||
        q.name.toLowerCase().includes(query) ||
        q.clientName.toLowerCase().includes(query)
      )
    }
    
    // Status filter
    if (statusFilters.length > 0) {
      quotes = quotes.filter(q => statusFilters.includes(q.status))
    }
    
    // Client filter
    if (clientFilter !== 'all') {
      quotes = quotes.filter(q => q.clientId === clientFilter)
    }
    
    // Project filter
    if (projectFilter !== 'all') {
      quotes = quotes.filter(q => q.projectId === projectFilter)
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      quotes = quotes.filter(q => {
        const dateField = dateFilterType === 'approved' ? q.approvedAt : q.createdAt
        if (!dateField) return dateFilterType === 'created' // Always include if filtering by created date
        const date = new Date(dateField)
        if (dateFrom && date < new Date(dateFrom)) return false
        if (dateTo && date > new Date(dateTo + 'T23:59:59')) return false
        return true
      })
    }
    
    // Sort
    quotes.sort((a, b) => {
      switch (sortBy) {
        case 'date_created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'amount':
          return b.totalAmount - a.totalAmount
        case 'client':
          return a.clientName.localeCompare(b.clientName)
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })
    
    return quotes
  }, [scopedQuotes, searchQuery, statusFilters, clientFilter, projectFilter, dateFrom, dateTo, dateFilterType, sortBy])
  
  const visibleQuotes = filteredQuotes.slice(0, visibleCount)
  const hasMore = visibleCount < filteredQuotes.length
  
  // Check if user can edit/send/delete a specific quote
  const canEditQuote = (quote: typeof mockQuotes[0]) => {
    if (isAdmin) return true
    if (isPM) {
      // Only assigned PM can edit
      const project = mockProjects.find(p => p.id === quote.projectId)
      return project?.pmId === '2' // Simplified: PM user id is '2'
    }
    return false
  }
  
  // Check if quote status allows editing
  const isEditable = (status: string) => ['unsent', 'draft', 'changes_requested'].includes(status)
  const isSendable = (status: string) => ['unsent', 'draft', 'changes_requested'].includes(status)
  const isDeletable = (status: string) => ['unsent', 'draft'].includes(status)
  
  const handleToggleStatus = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }
  
  const clearFilters = () => {
    setStatusFilters([])
    setClientFilter('all')
    setProjectFilter('all')
    setDateFrom('')
    setDateTo('')
    setSearchQuery('')
  }
  
  const handleSelectAll = () => {
    if (selectedQuotes.length === visibleQuotes.length) {
      setSelectedQuotes([])
    } else {
      setSelectedQuotes(visibleQuotes.map(q => q.id))
    }
  }
  
  const handleSelectQuote = (quoteId: string) => {
    setSelectedQuotes(prev => 
      prev.includes(quoteId)
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    )
  }
  
  const handleBulkSend = () => {
    const sendableQuotes = selectedQuotes.filter(id => {
      const quote = mockQuotes.find(q => q.id === id)
      return quote && isSendable(quote.status) && canEditQuote(quote)
    })
    
    if (sendableQuotes.length === 0) {
      toast({ title: 'No quotes can be sent', description: 'Selected quotes are not in a sendable status or you lack permission.', variant: 'destructive' })
      return
    }
    
    toast({ title: 'Quotes sent', description: `${sendableQuotes.length} quote(s) sent to clients.` })
    setSelectedQuotes([])
  }
  
  const handleBulkDelete = () => {
    const deletableQuotes = selectedQuotes.filter(id => {
      const quote = mockQuotes.find(q => q.id === id)
      return quote && isDeletable(quote.status) && canEditQuote(quote)
    })
    
    if (deletableQuotes.length === 0) {
      toast({ title: 'No quotes can be deleted', description: 'Selected quotes are not in a deletable status or you lack permission.', variant: 'destructive' })
      return
    }
    
    toast({ title: 'Quotes deleted', description: `${deletableQuotes.length} quote(s) deleted.` })
    setSelectedQuotes([])
  }
  
  const handleExportCSV = () => {
    toast({ title: 'Export started', description: 'CSV file will download shortly.' })
  }
  
  const handleDeleteQuote = (quoteId: string) => {
    setQuoteToDelete(quoteId)
    setDeleteDialogOpen(true)
  }
  
  const confirmDelete = () => {
    if (quoteToDelete) {
      toast({ title: 'Quote deleted', description: 'The quote has been deleted.' })
      setQuoteToDelete(null)
    }
    setDeleteDialogOpen(false)
  }
  
  const loadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE)
  }
  
  const activeFilterCount = statusFilters.length + (clientFilter !== 'all' ? 1 : 0) + (projectFilter !== 'all' ? 1 : 0) + (dateFrom || dateTo ? 1 : 0)
  
  // Highlight row for Unsent and Changes Requested
  const getRowHighlight = (status: string) => {
    if (status === 'unsent') return 'bg-gray-50'
    if (status === 'changes_requested') return 'bg-amber-50'
    return ''
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Quotes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Showing {visibleQuotes.length} of {filteredQuotes.length} quotes
          </p>
        </div>
        
        {(isAdmin || isPM) && (
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Link href="/quotes/new" prefetch={true}>
              <Button className="gap-1.5">
                <Plus className="h-4 w-4" />
                New Quote
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        
        {/* Status Filter (Multi-select) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-1.5">
              <Filter className="h-4 w-4" />
              Status
              {statusFilters.length > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                  {statusFilters.length}
                </span>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1">
              {QUOTE_STATUSES.map(status => (
                <div
                  key={status.value}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer"
                  onClick={() => handleToggleStatus(status.value)}
                >
                  <Checkbox checked={statusFilters.includes(status.value)} />
                  <span className="text-sm">{status.label}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Client Filter (Admin/PM only) */}
        {(isAdmin || isPM) && (
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {mockClients.map(client => (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {/* Project Filter */}
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {mockProjects.map(project => (
              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              Date Range
              {(dateFrom || dateTo) && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">1</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Select value={dateFilterType} onValueChange={(v) => setDateFilterType(v as 'created' | 'approved')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created">Created date</SelectItem>
                    <SelectItem value="approved">Approval date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                  />
                </div>
              </div>
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo('') }} className="w-full text-xs">
                  Clear dates
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_created">Date created (newest)</SelectItem>
            <SelectItem value="amount">Amount (highest)</SelectItem>
            <SelectItem value="client">Client name (A-Z)</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Show Deleted (Admin only) */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Checkbox 
              id="show-deleted" 
              checked={showDeleted} 
              onCheckedChange={(checked) => setShowDeleted(checked === true)} 
            />
            <label htmlFor="show-deleted" className="text-sm text-muted-foreground cursor-pointer">
              Show deleted
            </label>
          </div>
        )}
      </div>
      
      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {statusFilters.map(status => {
            const statusLabel = QUOTE_STATUSES.find(s => s.value === status)?.label || status
            return (
              <span key={status} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                {statusLabel}
                <button onClick={() => handleToggleStatus(status)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
          {clientFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
              {mockClients.find(c => c.id === clientFilter)?.name}
              <button onClick={() => setClientFilter('all')} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {projectFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
              {mockProjects.find(p => p.id === projectFilter)?.name}
              <button onClick={() => setProjectFilter('all')} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {(dateFrom || dateTo) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
              {dateFilterType === 'approved' ? 'Approved' : 'Created'}: {dateFrom || '...'} - {dateTo || '...'}
              <button onClick={() => { setDateFrom(''); setDateTo('') }} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button onClick={clearFilters} className="text-sm text-primary hover:underline">
            Clear all filters
          </button>
        </div>
      )}
      
      {/* Bulk Actions */}
      {selectedQuotes.length > 0 && (isAdmin || isPM) && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-muted p-3">
          <span className="text-sm font-medium">{selectedQuotes.length} selected</span>
          <Button size="sm" variant="outline" onClick={handleBulkSend} className="gap-1">
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkDelete} className="gap-1 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          {(isAdmin || isFinance) && (
            <Button size="sm" variant="outline" onClick={handleExportCSV} className="gap-1">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          )}
          <button onClick={() => setSelectedQuotes([])} className="ml-auto text-sm text-muted-foreground hover:text-foreground">
            Clear selection
          </button>
        </div>
      )}
      
      {/* Export button for Finance (always visible) */}
      {isFinance && selectedQuotes.length === 0 && (
        <div className="mb-4 flex justify-end">
          <Button variant="outline" onClick={handleExportCSV} className="gap-1.5">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      )}

      {/* Quotes Table */}
      <Card>
        <CardContent className="px-4 py-2">
          <Table>
            <TableHeader>
              <TableRow>
                {(isAdmin || isPM) && (
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={selectedQuotes.length === visibleQuotes.length && visibleQuotes.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                {/* Update 02: Name column replaces Project column */}
                <TableHead>Quote</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Update 02: Entire row is clickable */}
              {visibleQuotes.map((quote) => (
                <TableRow 
                  key={quote.id} 
                  className={cn('cursor-pointer hover:bg-muted/50', getRowHighlight(quote.status))}
                  onClick={() => window.location.href = `/quotes/${quote.id}`}
                  role="link"
                  tabIndex={0}
                  aria-label={`${quote.quoteNumber} - ${quote.name} - ${quote.clientName}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      window.location.href = `/quotes/${quote.id}`
                    }
                  }}
                >
                  {(isAdmin || isPM) && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedQuotes.includes(quote.id)}
                        onCheckedChange={() => handleSelectQuote(quote.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{quote.quoteNumber}</span>
                    </div>
                  </TableCell>
                  {/* Update 02: Show quote name instead of project name */}
                  <TableCell>
                    <span className="text-foreground">{quote.name}</span>
                  </TableCell>
                  <TableCell>{quote.clientName}</TableCell>
                  {/* Update 01: Show price with currency, handle optional price */}
                  <TableCell className="font-semibold">
                    {quote.price ? (
                      <>
                        {formatCurrency(quote.price)}
                        {quote.currency && <span className="ml-1 text-xs text-muted-foreground">{quote.currency}</span>}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={quote.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(quote.createdAt)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/quotes/${quote.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Quote
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        
                        {canEditQuote(quote) && isEditable(quote.status) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/quotes/${quote.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {canEditQuote(quote) && isSendable(quote.status) && (
                          <DropdownMenuItem>
                            <Send className="mr-2 h-4 w-4" />
                            Send
                          </DropdownMenuItem>
                        )}
                        
                        {canEditQuote(quote) && isDeletable(quote.status) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteQuote(quote.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredQuotes.length === 0 && (
        <div className="mt-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-muted-foreground">
            {searchQuery || activeFilterCount > 0 ? 'No quotes match your search.' : 'No quotes yet.'}
          </p>
        </div>
      )}
      
      {/* Load More */}
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={loadMore}>
            Load more quotes
          </Button>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quote? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

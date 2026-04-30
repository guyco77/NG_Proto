'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Check,
  Search,
  ArrowUpDown,
  FileText,
  Mic,
  Languages,
  CheckCircle,
  History,
  Calendar,
  LayoutGrid,
  List,
  DollarSign,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../../layout'
import { cn } from '@/lib/utils'

type PayableStatus = 'pending' | 'approved' | 'paid'

interface VendorPayable {
  id: string
  vendorName: string
  projectId: string
  projectName: string
  episodeName: string
  jobType: 'transcription' | 'translation' | 'review' | 'subtitling'
  status: PayableStatus
  amount: number
  originalCurrency?: string
  originalAmount?: number
  period: string // UPDATE-004: YYYY-MM format
  completedDate: string // Task completion date
}

// Realistic mock data with project AND episode names - UPDATE-004: Added period and completedDate
const vendorPayables: VendorPayable[] = [
  { id: 'vp1', vendorName: 'Dana Cohen', projectId: 'p1', projectName: 'Channel 12 Drama', episodeName: 'Episodes 44–47', jobType: 'translation', status: 'pending', amount: 1840, period: '2026-04', completedDate: '2026-04-20' },
  { id: 'vp2', vendorName: 'Roni Levi', projectId: 'p2', projectName: 'Weekly News', episodeName: 'April 21–27 Package', jobType: 'transcription', status: 'pending', amount: 620, period: '2026-04', completedDate: '2026-04-27' },
  { id: 'vp3', vendorName: 'Amir Shahar', projectId: 'p3', projectName: 'Documentary S2', episodeName: 'Episode 5 QA', jobType: 'review', status: 'approved', amount: 980, period: '2026-04', completedDate: '2026-04-15' },
  { id: 'vp4', vendorName: 'Dana Cohen', projectId: 'p4', projectName: 'Channel 12 Drama', episodeName: 'Episodes 40–43', jobType: 'translation', status: 'paid', amount: 1840, period: '2026-03', completedDate: '2026-03-25' },
  { id: 'vp5', vendorName: 'Yael Mizrahi', projectId: 'p5', projectName: 'Keshet Monthly', episodeName: 'April Package', jobType: 'transcription', status: 'paid', amount: 1200, period: '2026-04', completedDate: '2026-04-30' },
  { id: 'vp6', vendorName: 'Roni Levi', projectId: 'p6', projectName: 'Channel 12 Drama', episodeName: 'Ep 38–39 Special', jobType: 'review', status: 'paid', amount: 440, period: '2026-03', completedDate: '2026-03-15' },
  { id: 'vp7', vendorName: 'Tal Ben-David', projectId: 'p7', projectName: 'Corporate Training', episodeName: 'Onboarding Video', jobType: 'subtitling', status: 'pending', amount: 750, originalCurrency: 'USD', originalAmount: 200, period: '2026-04', completedDate: '2026-04-22' },
  { id: 'vp8', vendorName: 'Noa Katz', projectId: 'p8', projectName: 'Training Series', episodeName: 'Module 3–4', jobType: 'translation', status: 'approved', amount: 1560, period: '2026-04', completedDate: '2026-04-18' },
]

const jobTypeConfig = {
  transcription: { label: 'Transcription', icon: Mic },
  translation: { label: 'Translation', icon: Languages },
  review: { label: 'Review', icon: CheckCircle },
  subtitling: { label: 'Subtitling', icon: FileText },
}

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', className: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-800' },
}

// Sort order for status
const statusOrder = { pending: 0, approved: 1, paid: 2 }

export default function VendorPaymentsPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  // Filters - UPDATE-004: Added period filter
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all')
  const [periodFilter, setPeriodFilter] = useState<string>('all')
  const [vendorPopoverOpen, setVendorPopoverOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped') // UPDATE-004: Default to grouped view
  
  // Table state
  const [payables, setPayables] = useState(vendorPayables)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'status' | 'amount' | 'vendor'>('status')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  
  // Dialog state
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  
  // UPDATE-005: Mark-as-Paid confirmation dialog
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false)
  const [markPaidGroup, setMarkPaidGroup] = useState<{ vendorName: string; period: string; total: number; count: number; ids: string[] } | null>(null)
  
  // Payment History state - tracks approved items that disappear from main list
  const [paymentHistory, setPaymentHistory] = useState<Array<{
    id: string
    vendorName: string
    projectName: string
    episodeName: string
    amount: number
    approvedDate: Date
  }>>([])
  const [animatingOutId, setAnimatingOutId] = useState<string | null>(null)

  const isFinance = currentRole === 'finance'
  const isAdmin = currentRole === 'admin'
  const canManagePayments = isFinance || isAdmin

  // Get unique vendors
  const vendors = useMemo(() => 
    Array.from(new Set(payables.map(p => p.vendorName))).sort(),
    [payables]
  )
  
  // UPDATE-004: Get unique periods for filter
  const periods = useMemo(() => 
    Array.from(new Set(payables.map(p => p.period))).sort().reverse(),
    [payables]
  )

  // Filter and sort payables - UPDATE-004: Added period filter
  const filteredPayables = useMemo(() => {
    let filtered = [...payables]
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }
    if (vendorFilter !== 'all') {
      filtered = filtered.filter(p => p.vendorName === vendorFilter)
    }
    if (jobTypeFilter !== 'all') {
      filtered = filtered.filter(p => p.jobType === jobTypeFilter)
    }
    if (periodFilter !== 'all') {
      filtered = filtered.filter(p => p.period === periodFilter)
    }
    
    // Sort
    filtered.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'status') {
        cmp = statusOrder[a.status] - statusOrder[b.status]
      } else if (sortBy === 'amount') {
        cmp = a.amount - b.amount
      } else if (sortBy === 'vendor') {
        cmp = a.vendorName.localeCompare(b.vendorName)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    
    return filtered
  }, [payables, statusFilter, vendorFilter, jobTypeFilter, periodFilter, sortBy, sortDir])
  
  // UPDATE-004: Group payables by vendor and period
  const groupedPayables = useMemo(() => {
    const groups: Record<string, {
      vendorName: string
      period: string
      items: VendorPayable[]
      totalAmount: number
      taskCount: number
      status: PayableStatus
    }> = {}
    
    filteredPayables.forEach(p => {
      const key = `${p.vendorName}__${p.period}`
      if (!groups[key]) {
        groups[key] = {
          vendorName: p.vendorName,
          period: p.period,
          items: [],
          totalAmount: 0,
          taskCount: 0,
          status: p.status,
        }
      }
      groups[key].items.push(p)
      groups[key].totalAmount += p.amount
      groups[key].taskCount += 1
      // Use lowest status in group (pending < approved < paid)
      if (statusOrder[p.status] < statusOrder[groups[key].status]) {
        groups[key].status = p.status
      }
    })
    
    return Object.values(groups).sort((a, b) => {
      // Sort by period desc, then vendor name
      if (a.period !== b.period) return b.period.localeCompare(a.period)
      return a.vendorName.localeCompare(b.vendorName)
    })
  }, [filteredPayables])

  // Get selected payables that can be advanced
  const selectedPayables = useMemo(() => 
    filteredPayables.filter(p => selectedIds.includes(p.id)),
    [filteredPayables, selectedIds]
  )
  
  const selectedPending = selectedPayables.filter(p => p.status === 'pending')
  const selectedApproved = selectedPayables.filter(p => p.status === 'approved')
  const hasMixedSelection = selectedPending.length > 0 && selectedApproved.length > 0

  // Toggle sort
  const toggleSort = (column: 'status' | 'amount' | 'vendor') => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
  }

  // Handle single row approval with animation
  const handleApprove = (id: string) => {
    const payable = payables.find(p => p.id === id)
    if (!payable) return
    
    // Start exit animation
    setAnimatingOutId(id)
    
    // After animation, move to history
    setTimeout(() => {
      // Remove from payables list
      setPayables(prev => prev.filter(p => p.id !== id))
      
      // Add to payment history
      setPaymentHistory(prev => [{
        id: `history-${id}`,
        vendorName: payable.vendorName,
        projectName: payable.projectName,
        episodeName: payable.episodeName,
        amount: payable.amount,
        approvedDate: new Date(),
      }, ...prev])
      
      setAnimatingOutId(null)
      
      toast({
        title: 'Payment Approved',
        description: `${payable.vendorName} - ₪${payable.amount.toLocaleString()} moved to Payment History`,
      })
    }, 300) // Match animation duration
  }

  // Handle bulk approval
  const handleBulkApprove = () => {
    const toUpdate = hasMixedSelection ? [] : selectedPending.length > 0 ? selectedPending : selectedApproved
    
    setPayables(prev => prev.map(p => {
      if (!toUpdate.find(u => u.id === p.id)) return p
      const newStatus: PayableStatus = p.status === 'pending' ? 'approved' : 'paid'
      return { ...p, status: newStatus }
    }))
    
    setSelectedIds([])
    setShowBulkDialog(false)
    
    const newStatus = selectedPending.length > 0 ? 'Approved' : 'Paid'
    toast({
      title: `Bulk action completed`,
      description: `${toUpdate.length} payments marked as ${newStatus}`,
    })
  }
  
  // UPDATE-005: Handle mark group as paid with confirmation
  const handleOpenMarkPaidDialog = (group: typeof groupedPayables[0]) => {
    setMarkPaidGroup({
      vendorName: group.vendorName,
      period: group.period,
      total: group.totalAmount,
      count: group.taskCount,
      ids: group.items.map(i => i.id),
    })
    setShowMarkPaidDialog(true)
  }
  
  // UPDATE-005: Confirm mark as paid
  const handleConfirmMarkPaid = () => {
    if (!markPaidGroup) return
    
    // Update status to paid
    setPayables(prev => prev.map(p => {
      if (!markPaidGroup.ids.includes(p.id)) return p
      return { ...p, status: 'paid' as PayableStatus }
    }))
    
    // Simulate vendor notification
    toast({
      title: 'Payments marked as paid',
      description: `Payment of ₪${markPaidGroup.total.toLocaleString()} processed. Vendor notification sent.`,
    })
    
    setShowMarkPaidDialog(false)
    setMarkPaidGroup(null)
  }

  // Select all visible (non-paid only)
  const selectablePayables = filteredPayables.filter(p => p.status !== 'paid')
  const allSelected = selectablePayables.length > 0 && selectablePayables.every(p => selectedIds.includes(p.id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(selectablePayables.map(p => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status Multi-select */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        {/* Searchable Vendor Dropdown */}
        <Popover open={vendorPopoverOpen} onOpenChange={setVendorPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[160px] justify-between">
              {vendorFilter === 'all' ? 'All Vendors' : vendorFilter}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search vendors..." />
              <CommandList>
                <CommandEmpty>No vendor found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      setVendorFilter('all')
                      setVendorPopoverOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", vendorFilter === 'all' ? "opacity-100" : "opacity-0")} />
                    All Vendors
                  </CommandItem>
                  {vendors.map((vendor) => (
                    <CommandItem
                      key={vendor}
                      value={vendor}
                      onSelect={() => {
                        setVendorFilter(vendor)
                        setVendorPopoverOpen(false)
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", vendorFilter === vendor ? "opacity-100" : "opacity-0")} />
                      {vendor}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Job Type Dropdown */}
        <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Job Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Job Types</SelectItem>
            {Object.entries(jobTypeConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* UPDATE-004: Period Filter */}
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Periods</SelectItem>
            {periods.map((period) => (
              <SelectItem key={period} value={period}>{period}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* UPDATE-004: View Toggle */}
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grouped' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2"
            onClick={() => setViewMode('grouped')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Bulk Action Button */}
        {canManagePayments && selectedIds.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            {hasMixedSelection && (
              <span className="text-sm text-amber-600">
                Please select rows with the same status
              </span>
            )}
            <Button 
              onClick={() => setShowBulkDialog(true)}
              disabled={hasMixedSelection}
              className="gap-1.5"
            >
              <Check className="h-4 w-4" />
              Approve Selected ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>

      {/* UPDATE-004: Grouped View */}
      {viewMode === 'grouped' && (
        <div className="space-y-4">
          {groupedPayables.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No payables found.
              </CardContent>
            </Card>
          ) : (
            groupedPayables.map((group) => {
              const statusCfg = statusConfig[group.status]
              return (
                <Card key={`${group.vendorName}__${group.period}`}>
                  <CardContent className="p-4">
                    {/* UPDATE-004: Group Summary Header with Period and Task Count */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold text-lg">{group.vendorName}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {group.period}
                            </span>
                            <span>{group.taskCount} task{group.taskCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg">₪{group.totalAmount.toLocaleString()}</p>
                          <span className={cn('rounded px-2 py-0.5 text-xs font-medium', statusCfg.className)}>
                            {statusCfg.label}
                          </span>
                        </div>
                        {/* UPDATE-005: Mark as Paid button for approved groups */}
                        {canManagePayments && group.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenMarkPaidDialog(group)}
                            className="gap-1.5"
                          >
                            <DollarSign className="h-4 w-4" />
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* Task list within group */}
                    <div className="space-y-2">
                      {group.items.map((payable) => {
                        const JobIcon = jobTypeConfig[payable.jobType].icon
                        return (
                          <div key={payable.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <JobIcon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <Link 
                                  href={`/projects/${payable.projectId}`}
                                  className="text-sm font-medium text-primary hover:underline"
                                >
                                  {payable.projectName}
                                </Link>
                                <p className="text-xs text-muted-foreground">{payable.episodeName}</p>
                              </div>
                            </div>
                            <span className="font-medium">₪{payable.amount.toLocaleString()}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* List View (original table) */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="px-4 py-2">
            <Table>
              <TableHeader>
                <TableRow>
                  {canManagePayments && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                  )}
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1 -ml-3 h-8"
                      onClick={() => toggleSort('vendor')}
                    >
                      Vendor
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Job Type</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1 -ml-3 h-8"
                      onClick={() => toggleSort('status')}
                    >
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1 -ml-3 h-8"
                      onClick={() => toggleSort('amount')}
                    >
                      Amount
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  {canManagePayments && <TableHead className="w-24">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManagePayments ? 8 : 6} className="py-8 text-center text-muted-foreground">
                      No payables found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayables.map((payable) => {
                    const JobIcon = jobTypeConfig[payable.jobType].icon
                    const statusCfg = statusConfig[payable.status]
                    
                    return (
                      <TableRow 
                        key={payable.id}
                        className={cn(
                          'transition-all duration-300',
                          animatingOutId === payable.id && 'opacity-0 -translate-x-4'
                        )}
                      >
                        {canManagePayments && (
                          <TableCell>
                            {payable.status !== 'paid' && (
                              <Checkbox
                                checked={selectedIds.includes(payable.id)}
                                onCheckedChange={() => toggleSelect(payable.id)}
                                aria-label={`Select ${payable.vendorName}`}
                              />
                            )}
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{payable.vendorName}</TableCell>
                        <TableCell>
                          <div>
                            <Link 
                              href={`/projects/${payable.projectId}`}
                              className="text-primary hover:underline"
                            >
                              {payable.projectName}
                            </Link>
                            <p className="text-xs text-muted-foreground">{payable.episodeName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{payable.period}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <JobIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{jobTypeConfig[payable.jobType].label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn('rounded px-2 py-0.5 text-xs font-medium', statusCfg.className)}>
                            {statusCfg.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-semibold cursor-default">
                                  ₪{payable.amount.toLocaleString()}
                                </span>
                              </TooltipTrigger>
                              {payable.originalCurrency && (
                                <TooltipContent>
                                  Original: {payable.originalCurrency === 'USD' ? '$' : '€'}{payable.originalAmount?.toLocaleString()}
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        {canManagePayments && (
                          <TableCell>
                            {payable.status === 'paid' ? (
                              <Check className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleApprove(payable.id)}
                              >
                                Approve
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {/* Footer */}
            <div className="border-t border-border p-4">
              <p className="text-sm text-muted-foreground">
                {filteredPayables.length} payable{filteredPayables.length !== 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History Section */}
      {paymentHistory.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Payment History</h3>
              <span className="text-sm text-muted-foreground">({paymentHistory.length} approved today)</span>
            </div>
            <div className="space-y-2">
              {paymentHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3 animate-in slide-in-from-top-2 fade-in duration-300"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entry.vendorName}</p>
                    <p className="text-sm text-foreground/80">{entry.projectName} — {entry.episodeName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
                      Paid
                    </span>
                    <span className="text-sm font-semibold">₪{entry.amount.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">
                      {entry.approvedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Approval Confirmation Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Approval</DialogTitle>
            <DialogDescription>
              {selectedPending.length > 0 
                ? `${selectedPending.length} payment(s) will be marked as Approved.`
                : `${selectedApproved.length} payment(s) will be marked as Paid.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              <span className="text-muted-foreground">Total amount:</span>{' '}
              <span className="font-semibold">
                ₪{(selectedPending.length > 0 ? selectedPending : selectedApproved)
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString()}
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkApprove}>
              <Check className="mr-2 h-4 w-4" />
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* UPDATE-005: Mark as Paid Confirmation Dialog */}
      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payments as Paid</DialogTitle>
            <DialogDescription>
              {markPaidGroup && (
                <>Mark {markPaidGroup.count} payment{markPaidGroup.count !== 1 ? 's' : ''} (₪{markPaidGroup.total.toLocaleString()}) for {markPaidGroup.vendorName} as paid?</>
              )}
            </DialogDescription>
          </DialogHeader>
          {markPaidGroup && (
            <div className="py-4 space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Vendor:</span>{' '}
                <span className="font-medium">{markPaidGroup.vendorName}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Period:</span>{' '}
                <span className="font-medium">{markPaidGroup.period}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Tasks:</span>{' '}
                <span className="font-medium">{markPaidGroup.count}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Total:</span>{' '}
                <span className="font-semibold">₪{markPaidGroup.total.toLocaleString()}</span>
              </p>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <Send className="inline h-4 w-4 mr-1" />
                  Vendor will receive notification: &quot;Payment of ₪{markPaidGroup.total.toLocaleString()} processed.&quot;
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkPaidDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmMarkPaid}>
              <DollarSign className="mr-2 h-4 w-4" />
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
}

// Realistic mock data with project AND episode names
const vendorPayables: VendorPayable[] = [
  { id: 'vp1', vendorName: 'Dana Cohen', projectId: 'p1', projectName: 'Channel 12 Drama', episodeName: 'Episodes 44–47', jobType: 'translation', status: 'pending', amount: 1840 },
  { id: 'vp2', vendorName: 'Roni Levi', projectId: 'p2', projectName: 'Weekly News', episodeName: 'April 21–27 Package', jobType: 'transcription', status: 'pending', amount: 620 },
  { id: 'vp3', vendorName: 'Amir Shahar', projectId: 'p3', projectName: 'Documentary S2', episodeName: 'Episode 5 QA', jobType: 'review', status: 'approved', amount: 980 },
  { id: 'vp4', vendorName: 'Dana Cohen', projectId: 'p4', projectName: 'Channel 12 Drama', episodeName: 'Episodes 40–43', jobType: 'translation', status: 'paid', amount: 1840 },
  { id: 'vp5', vendorName: 'Yael Mizrahi', projectId: 'p5', projectName: 'Keshet Monthly', episodeName: 'April Package', jobType: 'transcription', status: 'paid', amount: 1200 },
  { id: 'vp6', vendorName: 'Roni Levi', projectId: 'p6', projectName: 'Channel 12 Drama', episodeName: 'Ep 38–39 Special', jobType: 'review', status: 'paid', amount: 440 },
  { id: 'vp7', vendorName: 'Tal Ben-David', projectId: 'p7', projectName: 'Corporate Training', episodeName: 'Onboarding Video', jobType: 'subtitling', status: 'pending', amount: 750, originalCurrency: 'USD', originalAmount: 200 },
  { id: 'vp8', vendorName: 'Noa Katz', projectId: 'p8', projectName: 'Training Series', episodeName: 'Module 3–4', jobType: 'translation', status: 'approved', amount: 1560 },
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
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all')
  const [vendorPopoverOpen, setVendorPopoverOpen] = useState(false)
  
  // Table state
  const [payables, setPayables] = useState(vendorPayables)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'status' | 'amount' | 'vendor'>('status')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  
  // Dialog state
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  
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

  // Filter and sort payables
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
  }, [payables, statusFilter, vendorFilter, jobTypeFilter, sortBy, sortDir])

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

      {/* Table */}
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
                  <TableCell colSpan={canManagePayments ? 7 : 5} className="py-8 text-center text-muted-foreground">
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
    </div>
  )
}

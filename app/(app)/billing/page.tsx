'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  MoreHorizontal,
  Send,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Search,
  Check,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../layout'
import {
  mockInvoices,
  mockVendorPayments,
  formatCurrency,
  formatDate,
  INVOICE_STATUSES,
  mockClients,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { Invoice } from '@/lib/types'

export default function BillingPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [currencyFilter, setCurrencyFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showMarkSentDialog, setShowMarkSentDialog] = useState(false)
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false)
  const [dateRangeOpen, setDateRangeOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' })
  const pageSize = 25
  
  // UPDATE-002: Local invoice list state for optimistic UI
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>(mockInvoices)
  const [highlightedInvoiceId, setHighlightedInvoiceId] = useState<string | null>(null)
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    invoiceNumber: '',
    amount: '',
    currency: 'USD' as 'ILS' | 'USD' | 'EUR',
    dueDate: '',
    clientId: '',
  })

  const isAdmin = currentRole === 'admin'
  const isFinance = currentRole === 'finance'
  const isPM = currentRole === 'pm'
  const canManageInvoices = isAdmin || isFinance
  const canMarkSent = isAdmin || isPM

  // Filter invoices - UPDATE-002: Use localInvoices for optimistic UI
  const filteredInvoices = useMemo(() => {
    let filtered = [...localInvoices]
    if (statusFilter !== 'all') {
      filtered = filtered.filter((i) => i.status === statusFilter)
    }
    if (clientFilter !== 'all') {
      filtered = filtered.filter((i) => i.clientId === clientFilter)
    }
    if (currencyFilter !== 'all') {
      filtered = filtered.filter((i) => i.currency === currencyFilter)
    }
    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter((i) => i.dueDate >= dateRange.from)
    }
    if (dateRange.to) {
      filtered = filtered.filter((i) => i.dueDate <= dateRange.to)
    }
    return filtered
  }, [localInvoices, statusFilter, clientFilter, currencyFilter, dateRange])

  // Pagination
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(filteredInvoices.length / pageSize)

  // Unique clients for filter - use mockClients for complete list
  const clients = mockClients.map(c => ({ id: c.id, name: c.displayName }))

  // Handle iCount sync
  const handleSyncFromICount = async () => {
    setIsSyncing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSyncing(false)
    toast({
      title: 'Invoice synced from iCount',
      description: 'Invoice data has been updated.',
    })
  }

  // Handle manual upload - UPDATE-002: Add to local state for immediate display
  const handleUpload = () => {
    if (!uploadForm.clientId || !uploadForm.invoiceNumber || !uploadForm.amount) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }
    
    const selectedClient = mockClients.find(c => c.id === uploadForm.clientId)
    const newInvoiceId = `inv-new-${Date.now()}`
    
    // Create new invoice record
    const newInvoice: Invoice = {
      id: newInvoiceId,
      invoiceNumber: uploadForm.invoiceNumber,
      clientId: uploadForm.clientId,
      clientName: selectedClient?.displayName || 'Unknown Client',
      projectId: '',
      projectName: '-',
      amount: parseFloat(uploadForm.amount) || 0,
      currency: uploadForm.currency,
      status: 'draft',
      dueDate: uploadForm.dueDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    }
    
    // Add to top of list
    setLocalInvoices(prev => [newInvoice, ...prev])
    setHighlightedInvoiceId(newInvoiceId)
    
    // Clear highlight after animation
    setTimeout(() => setHighlightedInvoiceId(null), 2000)
    
    // Reset form and close dialog
    setShowUploadDialog(false)
    setUploadForm({
      invoiceNumber: '',
      amount: '',
      currency: 'USD',
      dueDate: '',
      clientId: '',
    })
    
    toast({
      title: 'Invoice uploaded',
      description: `Invoice ${uploadForm.invoiceNumber} has been stored successfully.`,
    })
  }

  // Handle mark as sent
  const handleMarkSent = () => {
    setShowMarkSentDialog(false)
    setSelectedInvoice(null)
    toast({
      title: 'Invoice marked as sent',
      description: 'Client has been notified via email.',
    })
  }

  // Handle mark as paid
  const handleMarkPaid = () => {
    setShowMarkPaidDialog(false)
    setSelectedInvoice(null)
    toast({
      title: 'Invoice marked as paid',
      description: 'Payment has been recorded.',
    })
  }

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusConfig = INVOICE_STATUSES.find(s => s.value === status)
    const colorMap: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-800',
      slate: 'bg-slate-200 text-slate-700',  // Neutral for Unpaid (within due date)
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      green: 'bg-emerald-100 text-emerald-800',
      red: 'bg-red-600 text-white',  // Urgent for Overdue
    }
    return colorMap[statusConfig?.color || 'gray'] || colorMap.gray
  }

  // Format currency with symbol
  const formatWithCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      ILS: '₪',
      USD: '$',
      EUR: '€',
    }
    return `${symbols[currency] || currency}${amount.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        {canManageInvoices && (
          <>
            <Button 
              variant="outline" 
              className="gap-1.5"
              onClick={handleSyncFromICount}
              disabled={isSyncing}
            >
              <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
              {isSyncing ? 'Syncing...' : 'Sync from iCount'}
            </Button>
            <Button 
              variant="outline" 
              className="gap-1.5"
              onClick={() => setShowUploadDialog(true)}
            >
              <Upload className="h-4 w-4" />
              Upload Invoice
            </Button>
          </>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href="https://icount.co.il"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-1.5">
                  Open iCount
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open iCount accounting software</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Filters */}
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {INVOICE_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Searchable Client Dropdown */}
            <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[160px] justify-between">
                  {clientFilter === 'all' 
                    ? 'All Clients' 
                    : clients.find(c => c.id === clientFilter)?.name || 'Select client'}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search clients..." />
                  <CommandList>
                    <CommandEmpty>No client found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setClientFilter('all')
                          setClientPopoverOpen(false)
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", clientFilter === 'all' ? "opacity-100" : "opacity-0")} />
                        All Clients
                      </CommandItem>
                      {clients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.name}
                          onSelect={() => {
                            setClientFilter(client.id)
                            setClientPopoverOpen(false)
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", clientFilter === client.id ? "opacity-100" : "opacity-0")} />
                          {client.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Date Range Filter */}
            <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[180px] justify-start gap-2", (dateRange.from || dateRange.to) && "text-foreground")}>
                  <Calendar className="h-4 w-4" />
                  {dateRange.from && dateRange.to 
                    ? `${dateRange.from} - ${dateRange.to}` 
                    : dateRange.from 
                      ? `From ${dateRange.from}`
                      : dateRange.to
                        ? `Until ${dateRange.to}`
                        : 'Date Range'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">From</Label>
                    <Input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="w-[160px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">To</Label>
                    <Input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className="w-[160px]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setDateRange({ from: '', to: '' })
                        setDateRangeOpen(false)
                      }}
                    >
                      Clear
                    </Button>
                    <Button size="sm" onClick={() => setDateRangeOpen(false)}>
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                <SelectItem value="ILS">ILS</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>

            {(statusFilter !== 'all' || clientFilter !== 'all' || currencyFilter !== 'all' || dateRange.from || dateRange.to) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('all')
                  setClientFilter('all')
                  setCurrencyFilter('all')
                  setDateRange({ from: '', to: '' })
                }}
                className="gap-1"
              >
                <X className="h-3 w-3" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Invoices Table */}
          <Card>
            <CardContent className="px-4 py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* UPDATE-003: Renamed Project to Show */}
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Show</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        No invoices found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedInvoices.map((invoice) => (
                      <TableRow 
                        key={invoice.id}
                        className={cn(
                          highlightedInvoiceId === invoice.id && 'bg-primary/10 animate-pulse'
                        )}
                      >
                        <TableCell>
                          <Link 
                            href={`/billing/invoices/${invoice.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{invoice.clientName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          <Link href={`/projects/${invoice.projectId}`} className="hover:underline">
                            {invoice.projectName}
                          </Link>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatWithCurrency(invoice.amount, invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'rounded px-2 py-0.5 text-xs font-medium',
                            getStatusBadge(invoice.status)
                          )}>
                            {INVOICE_STATUSES.find(s => s.value === invoice.status)?.label || invoice.status}
                          </span>
                        </TableCell>
                        <TableCell className={cn(
                          'text-muted-foreground',
                          invoice.status === 'overdue' && 'text-red-600 font-medium'
                        )}>
                          {formatDate(invoice.dueDate)}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {invoice.iCountId ? 'iCount' : 'Manual'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/billing/invoices/${invoice.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {invoice.pdfUrl ? (
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download PDF
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem disabled>
                                  <Download className="mr-2 h-4 w-4" />
                                  <span className="text-muted-foreground">No PDF attached</span>
                                </DropdownMenuItem>
                              )}
                              {invoice.status === 'draft' && canMarkSent && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedInvoice(invoice)
                                      setShowMarkSentDialog(true)
                                    }}
                                  >
                                    <Send className="mr-2 h-4 w-4" />
                                    Mark as Sent
                                  </DropdownMenuItem>
                                </>
                              )}
                              {(invoice.status === 'sent' || invoice.status === 'viewed' || invoice.status === 'overdue') && canManageInvoices && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedInvoice(invoice)
                                      setShowMarkPaidDialog(true)
                                    }}
                                  >
                                    Mark as Paid
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border p-4">
                <p className="text-sm text-muted-foreground">
                  {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

      {/* Upload Invoice Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Invoice</DialogTitle>
            <DialogDescription>
              Upload an invoice PDF and enter the metadata manually. Use this when iCount sync is unavailable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Invoice PDF</Label>
              <Input type="file" accept=".pdf" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Number *</Label>
                <Input 
                  placeholder="INV-2024-XXX" 
                  value={uploadForm.invoiceNumber}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={uploadForm.amount}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select 
                  value={uploadForm.currency}
                  onValueChange={(value: 'ILS' | 'USD' | 'EUR') => setUploadForm(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ILS">ILS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input 
                  type="date" 
                  value={uploadForm.dueDate}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select 
                value={uploadForm.clientId}
                onValueChange={(value) => setUploadForm(prev => ({ ...prev, clientId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {mockClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>
              Upload Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Sent Dialog */}
      <Dialog open={showMarkSentDialog} onOpenChange={setShowMarkSentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Invoice as Sent</DialogTitle>
            <DialogDescription>
              This will notify the client via email and make the invoice visible in their portal.
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="py-4">
              <p className="text-sm">
                <span className="text-muted-foreground">Invoice:</span>{' '}
                <span className="font-medium">{selectedInvoice.invoiceNumber}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Client:</span>{' '}
                <span className="font-medium">{selectedInvoice.clientName}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Amount:</span>{' '}
                <span className="font-medium">{formatWithCurrency(selectedInvoice.amount, selectedInvoice.currency)}</span>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkSentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkSent}>
              <Send className="mr-2 h-4 w-4" />
              Mark as Sent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
            <DialogDescription>
              Confirm that payment has been received for this invoice.
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="py-4">
              <p className="text-sm">
                <span className="text-muted-foreground">Invoice:</span>{' '}
                <span className="font-medium">{selectedInvoice.invoiceNumber}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Client:</span>{' '}
                <span className="font-medium">{selectedInvoice.clientName}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Amount:</span>{' '}
                <span className="font-medium">{formatWithCurrency(selectedInvoice.amount, selectedInvoice.currency)}</span>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkPaidDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkPaid}>
              Mark as Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

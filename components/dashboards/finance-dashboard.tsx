'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  Calendar,
  History,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  mockVendorPayables,
  mockQuotes,
  formatCurrency,
  formatDate,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { DashboardRefresh } from '@/components/dashboard-refresh'

// Realistic client payment data with proper status differentiation
const clientPayments = [
  { id: 'cp1', clientName: 'Channel 12', invoiceNumber: 'INV-0041', projectName: 'Episodes 44–47 Translation', amount: 3200, dueDate: '2026-04-30', status: 'unpaid' as const },
  { id: 'cp2', clientName: 'Keshet', invoiceNumber: 'INV-0038', projectName: 'Weekly News Transcription', amount: 1100, dueDate: '2026-04-22', status: 'overdue' as const },
  { id: 'cp3', clientName: 'Reshet', invoiceNumber: 'INV-0035', projectName: 'Documentary QA', amount: 870, paidDate: '2026-04-18', status: 'paid' as const },
  { id: 'cp4', clientName: 'Channel 12', invoiceNumber: 'INV-0032', projectName: 'Episodes 40–43 Translation', amount: 3200, paidDate: '2026-04-10', status: 'paid' as const },
  { id: 'cp5', clientName: 'Kan 11', invoiceNumber: 'INV-0029', projectName: 'Monthly Transcription', amount: 1450, paidDate: '2026-03-28', status: 'paid' as const },
]

// Payment history entry type
interface PaymentHistoryEntry {
  id: string
  vendorName: string
  projectName: string
  amount: number
  approvedDate: Date
}


type Period = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'custom'

const periodLabels: Record<Period, string> = {
  this_month: 'This Month',
  last_month: 'Last Month',
  this_quarter: 'This Quarter',
  last_quarter: 'Last Quarter',
  this_year: 'This Year',
  custom: 'Custom Range',
}

export function FinanceDashboard() {
  const [period, setPeriod] = useState<Period>('this_month')
  const [customDateOpen, setCustomDateOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [approvedPayableIds, setApprovedPayableIds] = useState<string[]>([])
  const [animatingOutId, setAnimatingOutId] = useState<string | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([])
  const { toast } = useToast()

  // Calculate KPI data
  const unpaidClientPayments = clientPayments.filter((p) => p.status === 'unpaid' || p.status === 'overdue')
  const paidClientPayments = clientPayments.filter((p) => p.status === 'paid')
  const pendingPayables = mockVendorPayables.filter((p) => p.status === 'pending')
  const paidPayables = mockVendorPayables.filter((p) => p.status === 'paid')
  const openQuotes = mockQuotes.filter((q) => q.status === 'pending_approval' || q.status === 'sent')

  const unpaidTotal = unpaidClientPayments.reduce((sum, i) => sum + i.amount, 0)
  const collectedTotal = paidClientPayments.reduce((sum, i) => sum + i.amount, 0)
  const owedTotal = pendingPayables.reduce((sum, p) => sum + p.amount, 0)
  const paidTotal = paidPayables.reduce((sum, p) => sum + p.amount, 0)
  const quotesTotal = openQuotes.reduce((sum, q) => sum + q.totalAmount, 0)

  // Mock MoM revenue data (last 12 months)
  const momRevenue = [
    { month: 'May', amount: 125000 },
    { month: 'Jun', amount: 142000 },
    { month: 'Jul', amount: 138000 },
    { month: 'Aug', amount: 156000 },
    { month: 'Sep', amount: 167000 },
    { month: 'Oct', amount: 175000 },
    { month: 'Nov', amount: 189000 },
    { month: 'Dec', amount: 195000 },
    { month: 'Jan', amount: 178000 },
    { month: 'Feb', amount: 185000 },
    { month: 'Mar', amount: 198000 },
    { month: 'Apr', amount: 210000 },
  ]
  const maxRevenue = Math.max(...momRevenue.map((m) => m.amount))

  // Filter out approved payables from visible list
  const visiblePendingPayables = pendingPayables.filter(p => !approvedPayableIds.includes(p.id))

  // Handle vendor payable approval with animation
  const handleApprove = (payable: typeof pendingPayables[0]) => {
    // Start exit animation
    setAnimatingOutId(payable.id)
    
    // After animation, move to history
    setTimeout(() => {
      setApprovedPayableIds(prev => [...prev, payable.id])
      
      // Add to payment history
      const historyEntry: PaymentHistoryEntry = {
        id: `history-${payable.id}`,
        vendorName: payable.vendorName,
        projectName: payable.projectName,
        amount: payable.amount,
        approvedDate: new Date(),
      }
      setPaymentHistory(prev => [historyEntry, ...prev])
      setAnimatingOutId(null)
      
      toast({
        title: 'Payment Approved',
        description: `${payable.vendorName} - ${formatCurrency(payable.amount)} marked as paid`,
      })
    }, 300)
  }

  // Handle period change with custom date picker
  const handlePeriodChange = (value: Period) => {
    setPeriod(value)
    if (value === 'custom') {
      setCustomDateOpen(true)
    }
  }

  // Apply custom date range
  const applyCustomRange = () => {
    setCustomDateOpen(false)
    toast({
      title: 'Date Range Applied',
      description: dateRange.from && dateRange.to 
        ? `${formatDate(dateRange.from.toISOString())} - ${formatDate(dateRange.to.toISOString())}`
        : 'Custom range selected',
    })
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header with Period Selector */}
<div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
  <div>
<h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
  <p className="text-sm text-muted-foreground mt-1">Financial command center</p>
  </div>
  <div className="flex items-center gap-3">
  <DashboardRefresh />
          <span className="text-sm text-muted-foreground">Period:</span>
          <Popover open={customDateOpen} onOpenChange={setCustomDateOpen}>
            <PopoverTrigger asChild>
              <div>
                <Select value={period} onValueChange={(v) => handlePeriodChange(v as Period)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(periodLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <div className="flex items-center gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">From</Label>
                      <Input
                        type="date"
                        value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))}
                        className="w-[140px]"
                      />
                    </div>
                    <span className="text-muted-foreground mt-5">—</span>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">To</Label>
                      <Input
                        type="date"
                        value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))}
                        className="w-[140px]"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCustomDateOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={applyCustomRange}>
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Link href={`/billing?status=sent`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Unpaid Invoices
              </div>
              <p className="text-2xl font-bold">{formatCurrency(unpaidTotal)}</p>
              <p className="text-xs text-muted-foreground">{unpaidClientPayments.length} invoices</p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/billing?status=paid`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4 text-[#10b981]" />
                Collected
              </div>
              <p className="text-2xl font-bold">{formatCurrency(collectedTotal)}</p>
              <p className="text-xs text-muted-foreground">{paidClientPayments.length} invoices</p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/billing/vendor-payments?status=pending`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4 text-[#f59e0b]" />
                Vendor Payables (Owed)
              </div>
              <p className="text-2xl font-bold">{formatCurrency(owedTotal)}</p>
              <p className="text-xs text-muted-foreground">{pendingPayables.length} pending</p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/billing/vendor-payments?status=paid`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Check className="h-4 w-4 text-[#10b981]" />
                Vendor Payables (Paid)
              </div>
              <p className="text-2xl font-bold">{formatCurrency(paidTotal)}</p>
              <p className="text-xs text-muted-foreground">{paidPayables.length} paid</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/quotes">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <FileText className="h-4 w-4" />
                Open Quotes
              </div>
              <p className="text-2xl font-bold">{formatCurrency(quotesTotal)}</p>
              <p className="text-xs text-muted-foreground">{openQuotes.length} quotes</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Client Payments & Vendor Payables Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Client Payments Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Client Payments</CardTitle>
                <p className="text-sm text-muted-foreground">{unpaidClientPayments.length} awaiting payment</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">View payment statuses, client details, and history.</p>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="space-y-2">
              {/* Unpaid and Overdue first, then Paid */}
              {clientPayments.map((payment) => (
                <div
                  key={payment.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-3',
                    payment.status === 'paid' ? 'border-border bg-muted/30' : 'border-border'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{payment.clientName}</p>
                      <span className="text-xs text-muted-foreground">·</span>
                      <p className="text-xs text-muted-foreground">{payment.invoiceNumber}</p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{payment.projectName}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.status === 'paid' 
                        ? `Paid ${formatDate(payment.paidDate || '')}` 
                        : `Due ${formatDate(payment.dueDate || '')}`
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'rounded px-2 py-0.5 text-xs font-medium',
                      payment.status === 'overdue' && 'bg-red-600 text-white',
                      payment.status === 'unpaid' && 'bg-slate-500 text-white',
                      payment.status === 'paid' && 'bg-emerald-600 text-white'
                    )}>
                      {payment.status === 'overdue' ? 'Overdue' : 
                       payment.status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                    <span className="text-sm font-semibold whitespace-nowrap">{formatCurrency(payment.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/billing">
              <Button variant="outline" className="w-full mt-3 gap-2">
                View Details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Vendor Payables Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Vendor Payables</CardTitle>
                <p className="text-sm text-muted-foreground">{visiblePendingPayables.length} pending payables</p>
              </div>
              {paymentHistory.length > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <History className="h-4 w-4" />
                  {paymentHistory.length} approved today
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Approve and export to iCount.</p>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="space-y-2">
              {visiblePendingPayables.slice(0, 5).map((payable) => (
                <div
                  key={payable.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border border-border p-3 transition-all duration-300',
                    animatingOutId === payable.id && 'opacity-0 -translate-x-4'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{payable.vendorName}</p>
                    <p className="text-xs text-muted-foreground">{payable.projectName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded px-2 py-0.5 text-xs font-medium bg-amber-500 text-amber-950">
                      Pending
                    </span>
                    <span className="text-sm font-semibold whitespace-nowrap">{formatCurrency(payable.amount)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7"
                      onClick={() => handleApprove(payable)}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
              
              {visiblePendingPayables.length === 0 && paymentHistory.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  All vendor payables approved
                </p>
              )}
            </div>
            
            {/* Payment History Section - Always visible when there are approved items */}
            {paymentHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Payment History</p>
                <div className="space-y-2">
                  {paymentHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3 animate-in fade-in duration-300"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{entry.vendorName}</p>
                        <p className="text-xs text-muted-foreground">{entry.projectName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded px-2 py-0.5 text-xs font-medium bg-emerald-600 text-white">
                          Paid
                        </span>
                        <span className="text-sm font-semibold whitespace-nowrap">{formatCurrency(entry.amount)}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(entry.approvedDate.toISOString())}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Link href="/billing/vendor-payments">
              <Button variant="outline" className="w-full mt-3 gap-2">
                View Details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Monthly Revenue</CardTitle>
            <p className="text-sm text-muted-foreground">Last 12 months (ILS)</p>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2">
          <div className="flex h-64 items-end gap-2">
            {momRevenue.map((month) => (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-primary rounded-t transition-all hover:bg-primary/80 group relative"
                  style={{ height: `${(month.amount / maxRevenue) * 200}px` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                    {formatCurrency(month.amount)}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{month.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

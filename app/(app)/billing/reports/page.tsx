'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Download,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../../layout'
import { mockInvoices, mockClients, formatDate } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { BillingCurrency } from '@/lib/types'

// Mock internal costs data (BILL-008 absorbed repairs)
const mockInternalCosts = [
  { id: 'ic1', quoteRef: 'Q-2024-010', projectId: 'p1', projectName: 'Netflix Q1 Localization', serviceType: 'Extra QC', amount: 1200, currency: 'USD' as BillingCurrency, dateAbsorbed: '2024-02-10' },
  { id: 'ic2', quoteRef: 'Q-2024-012', projectId: 'p3', projectName: 'HBO Max Documentary', serviceType: 'Client Corrections', amount: 800, currency: 'USD' as BillingCurrency, dateAbsorbed: '2024-02-15' },
]

// Format currency with symbol
function formatWithCurrency(amount: number, currency: string) {
  const symbols: Record<string, string> = {
    ILS: '₪',
    USD: '$',
    EUR: '€',
  }
  return `${symbols[currency] || currency}${amount.toLocaleString()}`
}

// Calculate days outstanding
function getDaysOutstanding(dueDate: string): number {
  const due = new Date(dueDate)
  const today = new Date()
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
}

// Get aging bucket
function getAgingBucket(days: number): string {
  if (days <= 0) return 'current'
  if (days <= 30) return '0-30'
  if (days <= 60) return '31-60'
  if (days <= 90) return '61-90'
  return '90+'
}

// Aging bucket colors
const agingColors: Record<string, string> = {
  'current': 'text-emerald-600',
  '0-30': 'text-amber-600',
  '31-60': 'text-orange-600',
  '61-90': 'text-red-500',
  '90+': 'text-red-700 font-bold',
}

export default function ReportsPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('revenue-month')
  const [currencyFilter, setCurrencyFilter] = useState<BillingCurrency>('USD')
  const [periodFilter, setPeriodFilter] = useState<string>('all')

  const isAdmin = currentRole === 'admin'
  const isFinance = currentRole === 'finance'
  const canViewReports = isAdmin || isFinance

  // Revenue by Month data (only Paid invoices)
  const revenueByMonth = useMemo(() => {
    const paidInvoices = mockInvoices.filter(
      (i) => i.status === 'paid' && i.currency === currencyFilter
    )

    const monthly: Record<string, number> = {}
    paidInvoices.forEach((invoice) => {
      const month = invoice.issuedDate.slice(0, 7) // YYYY-MM
      monthly[month] = (monthly[month] || 0) + invoice.amount
    })

    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
        amount,
      }))
  }, [currencyFilter])

  // Revenue by Client data
  const revenueByClient = useMemo(() => {
    const paidInvoices = mockInvoices.filter(
      (i) => i.status === 'paid' && (currencyFilter === 'all' || i.currency === currencyFilter)
    )

    const clientRevenue: Record<string, { name: string; total: number; count: number; lastInvoice: string }> = {}
    paidInvoices.forEach((invoice) => {
      if (!clientRevenue[invoice.clientId]) {
        clientRevenue[invoice.clientId] = {
          name: invoice.clientName,
          total: 0,
          count: 0,
          lastInvoice: invoice.issuedDate,
        }
      }
      clientRevenue[invoice.clientId].total += invoice.amount
      clientRevenue[invoice.clientId].count++
      if (invoice.issuedDate > clientRevenue[invoice.clientId].lastInvoice) {
        clientRevenue[invoice.clientId].lastInvoice = invoice.issuedDate
      }
    })

    return Object.values(clientRevenue).sort((a, b) => b.total - a.total)
  }, [currencyFilter])

  // Outstanding Invoices Aging
  const agingReport = useMemo(() => {
    const unpaidInvoices = mockInvoices.filter(
      (i) => i.status === 'sent' || i.status === 'viewed' || i.status === 'overdue'
    )

    return unpaidInvoices.map((invoice) => {
      const daysOut = getDaysOutstanding(invoice.dueDate)
      return {
        ...invoice,
        daysOutstanding: daysOut,
        bucket: getAgingBucket(daysOut),
      }
    }).sort((a, b) => b.daysOutstanding - a.daysOutstanding)
  }, [])

  // Group aging by buckets
  const agingBuckets = useMemo(() => {
    const buckets: Record<string, { count: number; total: number }> = {
      'current': { count: 0, total: 0 },
      '0-30': { count: 0, total: 0 },
      '31-60': { count: 0, total: 0 },
      '61-90': { count: 0, total: 0 },
      '90+': { count: 0, total: 0 },
    }

    agingReport.forEach((invoice) => {
      buckets[invoice.bucket].count++
      buckets[invoice.bucket].total += invoice.amount
    })

    return buckets
  }, [agingReport])

  // Export to CSV
  const handleExport = (reportType: string) => {
    toast({
      title: 'Export started',
      description: `Exporting ${reportType} report to CSV...`,
    })
    // In real app: generate and download CSV
  }

  if (!canViewReports) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive/50" />
          <h2 className="mt-4 text-lg font-semibold">Access Denied</h2>
          <p className="mt-2 text-muted-foreground">
            Only Admin and Finance users can view financial reports.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Report Type Filter */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground mr-2">Report:</span>
          <TabsList className="h-9 p-1 bg-muted/50">
            <TabsTrigger value="revenue-month" className="gap-1.5 text-xs px-3 h-7">
              <TrendingUp className="h-3.5 w-3.5" />
              Revenue by Month
            </TabsTrigger>
            <TabsTrigger value="revenue-client" className="gap-1.5 text-xs px-3 h-7">
              <Users className="h-3.5 w-3.5" />
              Revenue by Client
            </TabsTrigger>
            <TabsTrigger value="aging" className="gap-1.5 text-xs px-3 h-7">
              <Clock className="h-3.5 w-3.5" />
              Aging Report
            </TabsTrigger>
            <TabsTrigger value="internal-costs" className="gap-1.5 text-xs px-3 h-7">
              <AlertCircle className="h-3.5 w-3.5" />
              Internal Costs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Revenue by Month */}
        <TabsContent value="revenue-month">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Currency:</span>
              <Select value={currencyFilter} onValueChange={(v) => setCurrencyFilter(v as BillingCurrency)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ILS">ILS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="gap-1.5" onClick={() => handleExport('Revenue by Month')}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Revenue ({currencyFilter})</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              {revenueByMonth.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No paid invoices found for {currencyFilter}.</p>
                  <p className="text-sm mt-1">Select a different currency to view data.</p>
                </div>
              ) : (
                <>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueByMonth}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="month" 
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis 
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={(value) => `${value / 1000}k`}
                        />
                        <Tooltip
                          formatter={(value: number) => [formatWithCurrency(value, currencyFilter), 'Revenue']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                          }}
                        />
                        <Bar 
                          dataKey="amount" 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <Table className="mt-6">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueByMonth.map((row) => (
                        <TableRow key={row.month}>
                          <TableCell>{row.month}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatWithCurrency(row.amount, currencyFilter)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue by Client */}
        <TabsContent value="revenue-client">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Currency:</span>
              <Select value={currencyFilter} onValueChange={(v) => setCurrencyFilter(v as BillingCurrency)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ILS">ILS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="gap-1.5" onClick={() => handleExport('Revenue by Client')}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <Card>
            <CardContent className="px-4 py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">Invoices</TableHead>
                    <TableHead>Last Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueByClient.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        No paid invoices found for {currencyFilter}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    revenueByClient.map((client) => (
                      <TableRow key={client.name}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatWithCurrency(client.total, currencyFilter)}
                        </TableCell>
                        <TableCell className="text-right">{client.count}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(client.lastInvoice)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aging Report */}
        <TabsContent value="aging">
          <div className="mb-4 flex items-center justify-end">
            <Button variant="outline" className="gap-1.5" onClick={() => handleExport('Aging Report')}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Aging Summary */}
          <div className="mb-6 grid gap-4 md:grid-cols-5">
            {Object.entries(agingBuckets).map(([bucket, data]) => (
              <Card key={bucket}>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    {bucket === 'current' ? 'Current' : `${bucket} days`}
                  </p>
                  <p className={cn("text-xl font-semibold", agingColors[bucket])}>
                    ${data.total.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{data.count} invoice{data.count !== 1 ? 's' : ''}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="px-4 py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Days Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agingReport.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        No outstanding invoices.
                      </TableCell>
                    </TableRow>
                  ) : (
                    agingReport.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Link href={`/billing/invoices/${invoice.id}`} className="font-medium text-primary hover:underline">
                            {invoice.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{invoice.clientName}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatWithCurrency(invoice.amount, invoice.currency)}
                        </TableCell>
                        <TableCell className={cn("text-right font-medium", agingColors[invoice.bucket])}>
                          {invoice.daysOutstanding <= 0 ? 'Due today' : `${invoice.daysOutstanding} days`}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'rounded px-2 py-0.5 text-xs font-medium',
                            invoice.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : invoice.status === 'viewed'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          )}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Internal Costs (Absorbed Repairs) */}
        <TabsContent value="internal-costs">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Repair costs absorbed by the company (not charged to clients)
            </p>
            <Button variant="outline" className="gap-1.5" onClick={() => handleExport('Internal Costs')}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Absorbed Costs</p>
                    <p className="text-2xl font-semibold text-amber-600">
                      ${mockInternalCosts.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Records</p>
                    <p className="text-2xl font-semibold">{mockInternalCosts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="px-4 py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote Ref</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date Absorbed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInternalCosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        No internal cost records.
                      </TableCell>
                    </TableRow>
                  ) : (
                    mockInternalCosts.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell className="font-medium">{cost.quoteRef}</TableCell>
                        <TableCell>
                          <Link href={`/projects/${cost.projectId}`} className="text-primary hover:underline">
                            {cost.projectName}
                          </Link>
                        </TableCell>
                        <TableCell>{cost.serviceType}</TableCell>
                        <TableCell className="text-right font-medium text-amber-600">
                          {formatWithCurrency(cost.amount, cost.currency)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(cost.dateAbsorbed)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

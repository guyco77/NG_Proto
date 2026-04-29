'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  Download,
  Send,
  RefreshCw,
  Upload,
  ExternalLink,
  Clock,
  CheckCircle2,
  Eye,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useRole } from '../../../layout'
import { mockInvoices, formatDate, INVOICE_STATUSES } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { currentRole } = useRole()
  const { toast } = useToast()
  const invoice = mockInvoices.find((i) => i.id === id) || mockInvoices[0]

  const [isSyncing, setIsSyncing] = useState(false)
  const [showMarkSentDialog, setShowMarkSentDialog] = useState(false)
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false)

  const isAdmin = currentRole === 'admin'
  const isFinance = currentRole === 'finance'
  const isPM = currentRole === 'pm'
  const isClient = currentRole === 'client'
  const canManageInvoices = isAdmin || isFinance
  const canMarkSent = isAdmin || isPM

  // Format currency with symbol
  const formatWithCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      ILS: '₪',
      USD: '$',
      EUR: '€',
    }
    return `${symbols[currency] || currency}${amount.toLocaleString()}`
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = INVOICE_STATUSES.find(s => s.value === status)
    const colorMap: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      green: 'bg-emerald-100 text-emerald-800',
      red: 'bg-red-100 text-red-800',
    }
    return colorMap[statusConfig?.color || 'gray'] || colorMap.gray
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-5 w-5 text-gray-500" />
      case 'sent':
        return <Send className="h-5 w-5 text-blue-500" />
      case 'viewed':
        return <Eye className="h-5 w-5 text-purple-500" />
      case 'paid':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  // Handle iCount sync
  const handleSync = async () => {
    setIsSyncing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSyncing(false)
    toast({
      title: 'Invoice synced from iCount',
      description: 'Invoice data has been updated.',
    })
  }

  // Handle mark as sent
  const handleMarkSent = () => {
    setShowMarkSentDialog(false)
    toast({
      title: 'Invoice marked as sent',
      description: 'Client has been notified via email.',
    })
  }

  // Handle mark as paid
  const handleMarkPaid = () => {
    setShowMarkPaidDialog(false)
    toast({
      title: 'Invoice marked as paid',
      description: 'Payment has been recorded.',
    })
  }

  // Calculate days overdue
  const daysOverdue = invoice.status === 'overdue'
    ? Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{invoice.invoiceNumber}</h1>
              <span className={cn(
                'rounded px-2 py-0.5 text-xs font-medium',
                getStatusBadge(invoice.status)
              )}>
                {INVOICE_STATUSES.find(s => s.value === invoice.status)?.label || invoice.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {invoice.clientName} - {invoice.projectName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canManageInvoices && (
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                {isSyncing ? 'Syncing...' : 'Re-sync from iCount'}
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    disabled={!invoice.pdfUrl}
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {invoice.pdfUrl ? 'Download invoice PDF' : 'No invoice document attached yet.'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {invoice.status === 'draft' && canMarkSent && (
              <Button onClick={() => setShowMarkSentDialog(true)} className="gap-1.5">
                <Send className="h-4 w-4" />
                Mark as Sent
              </Button>
            )}
            {(invoice.status === 'sent' || invoice.status === 'viewed' || invoice.status === 'overdue') && canManageInvoices && (
              <Button onClick={() => setShowMarkPaidDialog(true)}>
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sync Error Banner (if applicable) */}
      {invoice.syncError && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Could not reach iCount</p>
              <p className="text-sm text-amber-700 mt-1">
                You can upload the invoice manually or try syncing again later.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold">{formatWithCurrency(invoice.amount, invoice.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="text-lg font-medium">{invoice.currency}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Issue Date</p>
                  <p className="font-medium">{formatDate(invoice.issuedDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className={cn(
                    "font-medium",
                    invoice.status === 'overdue' && 'text-red-600'
                  )}>
                    {formatDate(invoice.dueDate)}
                    {daysOverdue > 0 && (
                      <span className="ml-2 text-red-600">({daysOverdue} days overdue)</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{invoice.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <Link href={`/projects/${invoice.projectId}`} className="font-medium text-primary hover:underline">
                    {invoice.projectName}
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="font-medium">
                    {invoice.iCountId ? (
                      <span className="flex items-center gap-2">
                        iCount
                        <a 
                          href="https://icount.co.il" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </span>
                    ) : (
                      'Manual Upload'
                    )}
                  </p>
                </div>
                {invoice.syncedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Synced</p>
                    <p className="font-medium">{formatDate(invoice.syncedAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PDF Preview Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Document</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              {invoice.pdfUrl ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {invoice.pdfFileName || `${invoice.invoiceNumber}.pdf`}
                  </p>
                  <Button variant="outline" className="mt-4 gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No invoice document attached yet.
                  </p>
                  {canManageInvoices && (
                    <Button variant="outline" className="mt-4 gap-2">
                      <Upload className="h-4 w-4" />
                      Upload PDF
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Timeline */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status History</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="space-y-4">
                {/* Created */}
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    <FileText className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Invoice Created</p>
                    <p className="text-xs text-muted-foreground">{formatDate(invoice.issuedDate)}</p>
                  </div>
                </div>

                {/* Sent */}
                {invoice.sentAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <Send className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Sent to Client</p>
                      <p className="text-xs text-muted-foreground">{formatDate(invoice.sentAt)}</p>
                    </div>
                  </div>
                )}

                {/* Viewed */}
                {invoice.viewedAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                      <Eye className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Viewed by Client</p>
                      <p className="text-xs text-muted-foreground">{formatDate(invoice.viewedAt)}</p>
                    </div>
                  </div>
                )}

                {/* Paid */}
                {invoice.paidAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Payment Received</p>
                      <p className="text-xs text-muted-foreground">{formatDate(invoice.paidAt)}</p>
                    </div>
                  </div>
                )}

                {/* Overdue */}
                {invoice.status === 'overdue' && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-red-600">Overdue</p>
                      <p className="text-xs text-muted-foreground">{daysOverdue} days past due date</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={cn(
                  'rounded px-2 py-0.5 text-xs font-medium',
                  getStatusBadge(invoice.status)
                )}>
                  {INVOICE_STATUSES.find(s => s.value === invoice.status)?.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-medium">{formatWithCurrency(invoice.amount, invoice.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Due</span>
                <span className={cn(
                  "font-medium",
                  invoice.status === 'overdue' && 'text-red-600'
                )}>
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mark as Sent Dialog */}
      <Dialog open={showMarkSentDialog} onOpenChange={setShowMarkSentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Invoice as Sent</DialogTitle>
            <DialogDescription>
              This will notify the client via email and make the invoice visible in their portal.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              <span className="text-muted-foreground">Invoice:</span>{' '}
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Client:</span>{' '}
              <span className="font-medium">{invoice.clientName}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Amount:</span>{' '}
              <span className="font-medium">{formatWithCurrency(invoice.amount, invoice.currency)}</span>
            </p>
          </div>
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
          <div className="py-4">
            <p className="text-sm">
              <span className="text-muted-foreground">Invoice:</span>{' '}
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Client:</span>{' '}
              <span className="font-medium">{invoice.clientName}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Amount:</span>{' '}
              <span className="font-medium">{formatWithCurrency(invoice.amount, invoice.currency)}</span>
            </p>
          </div>
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

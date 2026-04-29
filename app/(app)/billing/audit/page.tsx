'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FileText,
  Receipt,
  DollarSign,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { cn } from '@/lib/utils'
import type { BillingAuditEntry, BillingAuditAction, UserRole } from '@/lib/types'

// BILL-009: Mock audit data
const mockAuditEntries: BillingAuditEntry[] = [
  {
    id: 'aud1',
    timestamp: '2024-02-20T14:32:00Z',
    actorId: 'u1',
    actorName: 'Sarah Cohen',
    actorRole: 'finance',
    action: 'invoice_marked_paid',
    targetType: 'invoice',
    targetId: 'inv1',
    targetRef: 'INV-2024-001',
    details: 'Status changed from Sent to Paid',
  },
  {
    id: 'aud2',
    timestamp: '2024-02-20T12:15:00Z',
    actorId: 'u2',
    actorName: 'David Levi',
    actorRole: 'admin',
    action: 'repair_charge_decision',
    targetType: 'quote',
    targetId: 'q10',
    targetRef: 'Q-2024-010',
    details: 'Charge decision: Absorb Cost (NG pays)',
  },
  {
    id: 'aud3',
    timestamp: '2024-02-20T10:45:00Z',
    actorId: 'u3',
    actorName: 'Maya Stern',
    actorRole: 'pm',
    action: 'repair_quote_created',
    targetType: 'quote',
    targetId: 'q10',
    targetRef: 'Q-2024-010',
    details: 'Repair quote created for project Netflix Q1 Localization',
  },
  {
    id: 'aud4',
    timestamp: '2024-02-19T16:20:00Z',
    actorId: 'u1',
    actorName: 'Sarah Cohen',
    actorRole: 'finance',
    action: 'vendor_payment_marked_paid',
    targetType: 'vendor_payment',
    targetId: 'vp5',
    targetRef: 'VP-2024-005',
    details: 'Payment of $1,200 marked as paid for vendor John Smith',
  },
  {
    id: 'aud5',
    timestamp: '2024-02-19T14:00:00Z',
    actorId: 'system',
    actorName: 'System',
    actorRole: 'admin',
    action: 'vendor_payment_created',
    targetType: 'vendor_payment',
    targetId: 'vp5',
    targetRef: 'VP-2024-005',
    details: 'Auto-created on task completion: Translation - HBO Max Documentary',
  },
  {
    id: 'aud6',
    timestamp: '2024-02-19T11:30:00Z',
    actorId: 'u1',
    actorName: 'Sarah Cohen',
    actorRole: 'finance',
    action: 'invoice_synced',
    targetType: 'invoice',
    targetId: 'inv2',
    targetRef: 'INV-2024-002',
    details: 'Synced from iCount: Amount $8,500 USD',
  },
  {
    id: 'aud7',
    timestamp: '2024-02-18T15:45:00Z',
    actorId: 'u2',
    actorName: 'David Levi',
    actorRole: 'admin',
    action: 'invoice_sent',
    targetType: 'invoice',
    targetId: 'inv1',
    targetRef: 'INV-2024-001',
    details: 'Invoice sent to client. Email notification dispatched.',
  },
  {
    id: 'aud8',
    timestamp: '2024-02-18T09:20:00Z',
    actorId: 'client1',
    actorName: 'Netflix (John Doe)',
    actorRole: 'client',
    action: 'invoice_viewed',
    targetType: 'invoice',
    targetId: 'inv1',
    targetRef: 'INV-2024-001',
    details: 'Client viewed invoice in portal. First view logged.',
  },
  {
    id: 'aud9',
    timestamp: '2024-02-17T14:10:00Z',
    actorId: 'u3',
    actorName: 'Maya Stern',
    actorRole: 'pm',
    action: 'quote_sent',
    targetType: 'quote',
    targetId: 'q8',
    targetRef: 'Q-2024-008',
    details: 'Quote sent to client for approval',
  },
  {
    id: 'aud10',
    timestamp: '2024-02-17T10:00:00Z',
    actorId: 'client2',
    actorName: 'HBO Max (Jane Smith)',
    actorRole: 'client',
    action: 'quote_approved',
    targetType: 'quote',
    targetId: 'q7',
    targetRef: 'Q-2024-007',
    details: 'Quote approved by client. Digital signature captured.',
  },
]

// Action labels
const actionLabels: Record<BillingAuditAction, string> = {
  quote_created: 'Quote Created',
  quote_edited: 'Quote Edited',
  quote_sent: 'Quote Sent',
  quote_approved: 'Quote Approved',
  quote_rejected: 'Quote Rejected',
  quote_expired: 'Quote Expired',
  invoice_synced: 'Invoice Synced',
  invoice_uploaded: 'Invoice Uploaded',
  invoice_sent: 'Invoice Sent',
  invoice_viewed: 'Invoice Viewed',
  invoice_marked_paid: 'Invoice Paid',
  invoice_voided: 'Invoice Voided',
  vendor_payment_created: 'Payment Created',
  vendor_payment_marked_paid: 'Payment Paid',
  repair_quote_created: 'Repair Quote Created',
  repair_charge_decision: 'Charge Decision',
}

// Action colors
const actionColors: Record<string, string> = {
  quote_created: 'bg-gray-100 text-gray-800',
  quote_edited: 'bg-gray-100 text-gray-800',
  quote_sent: 'bg-blue-100 text-blue-800',
  quote_approved: 'bg-emerald-100 text-emerald-800',
  quote_rejected: 'bg-red-100 text-red-800',
  quote_expired: 'bg-amber-100 text-amber-800',
  invoice_synced: 'bg-blue-100 text-blue-800',
  invoice_uploaded: 'bg-gray-100 text-gray-800',
  invoice_sent: 'bg-blue-100 text-blue-800',
  invoice_viewed: 'bg-purple-100 text-purple-800',
  invoice_marked_paid: 'bg-emerald-100 text-emerald-800',
  invoice_voided: 'bg-red-100 text-red-800',
  vendor_payment_created: 'bg-gray-100 text-gray-800',
  vendor_payment_marked_paid: 'bg-emerald-100 text-emerald-800',
  repair_quote_created: 'bg-amber-100 text-amber-800',
  repair_charge_decision: 'bg-purple-100 text-purple-800',
}

// Target type icons
function getTargetIcon(targetType: string) {
  switch (targetType) {
    case 'quote':
      return <FileText className="h-4 w-4" />
    case 'invoice':
      return <Receipt className="h-4 w-4" />
    case 'vendor_payment':
      return <DollarSign className="h-4 w-4" />
    case 'internal_cost':
      return <AlertCircle className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

// Format timestamp with UTC to prevent hydration mismatch
function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
  }
}

// Role badge colors
const roleBadgeColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800',
  pm: 'bg-blue-100 text-blue-800',
  finance: 'bg-emerald-100 text-emerald-800',
  client: 'bg-purple-100 text-purple-800',
  vendor: 'bg-amber-100 text-amber-800',
  it: 'bg-gray-100 text-gray-800',
}

export default function BillingAuditPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [targetFilter, setTargetFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 25

  const isAdmin = currentRole === 'admin'
  const isFinance = currentRole === 'finance'
  const isIT = currentRole === 'it'
  const canViewAudit = isAdmin || isFinance || isIT

  // Filter entries
  const filteredEntries = useMemo(() => {
    let filtered = [...mockAuditEntries]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (entry) =>
          entry.targetRef.toLowerCase().includes(query) ||
          entry.actorName.toLowerCase().includes(query) ||
          entry.details.toLowerCase().includes(query)
      )
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter((entry) => entry.action === actionFilter)
    }

    if (targetFilter !== 'all') {
      filtered = filtered.filter((entry) => entry.targetType === targetFilter)
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [searchQuery, actionFilter, targetFilter])

  // Pagination
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(filteredEntries.length / pageSize)

  // Export to CSV
  const handleExport = () => {
    toast({
      title: 'Export started',
      description: 'Exporting audit log to CSV...',
    })
  }

  // Get unique actions for filter
  const uniqueActions = Array.from(new Set(mockAuditEntries.map((e) => e.action)))

  if (!canViewAudit) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive/50" />
          <h2 className="mt-4 text-lg font-semibold">Access Denied</h2>
          <p className="mt-2 text-muted-foreground">
            Only Admin, Finance, and IT users can view the billing audit trail.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Append-Only Audit Log</p>
            <p className="text-sm text-blue-700 mt-1">
              All billing actions are logged and cannot be edited or deleted. This log is for compliance and audit purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by reference, actor, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Action Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {actionLabels[action]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={targetFilter} onValueChange={setTargetFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Target Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="quote">Quotes</SelectItem>
            <SelectItem value="invoice">Invoices</SelectItem>
            <SelectItem value="vendor_payment">Vendor Payments</SelectItem>
            <SelectItem value="internal_cost">Internal Costs</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="gap-1.5 ml-auto" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Audit Table */}
      <Card>
        <CardContent className="px-4 py-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="min-w-[300px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No audit entries found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEntries.map((entry) => {
                  const { date, time } = formatTimestamp(entry.timestamp)
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">
                        <div className="font-medium">{date}</div>
                        <div className="text-muted-foreground">{time}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{entry.actorName}</span>
                          <span className={cn(
                            'rounded px-1.5 py-0.5 text-xs font-medium capitalize',
                            roleBadgeColors[entry.actorRole]
                          )}>
                            {entry.actorRole}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          'rounded px-2 py-0.5 text-xs font-medium',
                          actionColors[entry.action]
                        )}>
                          {actionLabels[entry.action]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {getTargetIcon(entry.targetType)}
                          </span>
                          <Link
                            href={
                              entry.targetType === 'invoice'
                                ? `/billing/invoices/${entry.targetId}`
                                : entry.targetType === 'quote'
                                ? `/quotes/${entry.targetId}`
                                : '#'
                            }
                            className="font-medium text-primary hover:underline"
                          >
                            {entry.targetRef}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.details}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border p-4">
            <p className="text-sm text-muted-foreground">
              {filteredEntries.length} entr{filteredEntries.length !== 1 ? 'ies' : 'y'}
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
    </div>
  )
}

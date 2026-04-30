'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Download,
  Send,
  Edit,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Building2,
  MessageSquare,
  Eye,
  Wrench,
  DollarSign,
  Building,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { mockQuotes, mockProjects, formatCurrency, formatDate } from '@/lib/mock-data'
import { useRole } from '../../layout'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  const quote = mockQuotes.find(q => q.id === id) || mockQuotes[0]
  const project = mockProjects.find(p => p.id === quote.projectId)
  
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [supersedeDialogOpen, setSupersedeDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [changesDialogOpen, setChangesDialogOpen] = useState(false)
  const [signature, setSignature] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [changesComment, setChangesComment] = useState('')
  const [isSending, setIsSending] = useState(false)
  
  // BILL-008: Repair quote charge decision
  const [chargeDecisionDialogOpen, setChargeDecisionDialogOpen] = useState(false)
  const [selectedChargeDecision, setSelectedChargeDecision] = useState<'charge_client' | 'absorb_cost' | null>(null)
  
  // Check if there's another active quote for this project
  const existingActiveQuote = mockQuotes.find(q => 
    q.projectId === quote.projectId && 
    q.id !== quote.id && 
    ['sent', 'changes_requested', 'approved'].includes(q.status)
  )
  
  const isAdmin = currentRole === 'admin'
  const isPM = currentRole === 'pm'
  const isClient = currentRole === 'client'
  const isFinance = currentRole === 'finance'
  
  // Check if this user can edit/send the quote
  const canEditQuote = () => {
    if (isAdmin) return true
    if (isPM && project?.pmId === '2') return true // Simplified PM check
    return false
  }
  
  // Client Admin can approve/reject/request changes
  const canRespondToQuote = isClient && quote.status === 'sent'
  
  // Check statuses for actions
  const isEditable = ['unsent', 'draft', 'changes_requested'].includes(quote.status)
  const isSendable = ['unsent', 'draft', 'changes_requested'].includes(quote.status)
  
  // BILL-008: Repair quote logic
  // For demo purposes, simulate some quotes as repair quotes
  const isRepairQuote = quote.id === 'q3' || quote.quoteNumber?.includes('010') // Demo: mark q3 as repair
  const chargeDecision = quote.id === 'q3' ? 'pending' : undefined // Demo: q3 awaits decision
  const needsChargeDecision = isRepairQuote && chargeDecision === 'pending'
  const canMakeChargeDecision = isAdmin && needsChargeDecision
  
  const handleSendQuote = async () => {
    setIsSending(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsSending(false)
    setSendDialogOpen(false)
    toast({
      title: 'Quote sent',
      description: `Quote ${quote.quoteNumber} has been sent to ${quote.clientName}.`,
    })
  }
  
  const handleApproveQuote = async () => {
    if (!signature.trim()) {
      toast({ title: 'Signature required', description: 'Please enter your signature to approve.', variant: 'destructive' })
      return
    }
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    setApproveDialogOpen(false)
    toast({
      title: 'Quote approved',
      description: 'Thank you! The project will begin shortly.',
    })
    setSignature('')
  }
  
  const handleRejectQuote = async () => {
    if (!rejectionReason.trim()) {
      toast({ title: 'Reason required', description: 'Please provide a reason for rejection.', variant: 'destructive' })
      return
    }
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    setRejectDialogOpen(false)
    toast({
      title: 'Quote rejected',
      description: 'The PM has been notified of your decision.',
    })
    setRejectionReason('')
  }
  
  const handleRequestChanges = async () => {
    if (!changesComment.trim()) {
      toast({ title: 'Comment required', description: 'Please describe the changes you need.', variant: 'destructive' })
      return
    }
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    setChangesDialogOpen(false)
    toast({
      title: 'Changes requested',
      description: 'The PM will revise the quote and send an updated version.',
    })
    setChangesComment('')
  }
  
  const handleDownloadPDF = () => {
    toast({ title: 'Downloading PDF', description: 'Your quote PDF will download shortly.' })
  }
  
  // BILL-008: Handle charge decision
  const handleChargeDecision = async () => {
    if (!selectedChargeDecision) return
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    setChargeDecisionDialogOpen(false)
    
    if (selectedChargeDecision === 'charge_client') {
      toast({
        title: 'Charge Decision: Charge Client',
        description: 'This repair quote can now be sent to the client for approval.',
      })
    } else {
      toast({
        title: 'Charge Decision: Absorb Cost',
        description: 'Internal cost record created. This cost will not be charged to the client.',
      })
    }
    setSelectedChargeDecision(null)
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            {/* Update 01/02: Show quote name as primary title */}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{quote.name}</h1>
              <StatusBadge status={quote.status} />
              {/* BILL-008: Repair Badge */}
              {isRepairQuote && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                  <Wrench className="h-3 w-3" />
                  Repair
                </span>
              )}
            </div>
            <p className="mt-1 text-muted-foreground">
              {quote.quoteNumber}
              {quote.projectId && quote.projectName && (
                <> &middot; <Link href={`/projects/${quote.projectId}`} className="hover:underline">{quote.projectName}</Link></>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPDF} className="gap-1.5">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            
            {canEditQuote() && isEditable && (
              <Link href={`/quotes/${quote.id}/edit`}>
                <Button variant="outline" className="gap-1.5">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            )}
            
            {canEditQuote() && isSendable && (
              <Button 
                onClick={() => {
                  if (existingActiveQuote) {
                    setSupersedeDialogOpen(true)
                  } else {
                    setSendDialogOpen(true)
                  }
                }} 
                className="gap-1.5"
                disabled={needsChargeDecision}
                title={needsChargeDecision ? 'Waiting for Admin charge decision' : undefined}
              >
                <Send className="h-4 w-4" />
                Send Quote
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* BILL-008: Repair Quote Charge Decision Card (Admin Only) */}
      {canMakeChargeDecision && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200">
                <Wrench className="h-5 w-5 text-amber-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Repair Quote - Charge Decision Required</h3>
                <p className="text-sm text-amber-700 mt-1">
                  This repair quote cannot be sent to the client until you decide whether to charge them or absorb the cost.
                  If no decision is made within 48 hours, you will receive a reminder notification.
                </p>
              </div>
              <Button onClick={() => setChargeDecisionDialogOpen(true)} className="gap-1.5">
                <DollarSign className="h-4 w-4" />
                Make Decision
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Repair Quote Pending Decision Notice (PM view) */}
      {isRepairQuote && needsChargeDecision && isPM && !isAdmin && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Awaiting Admin Charge Decision</p>
              <p className="text-sm text-amber-700 mt-1">
                This repair quote is waiting for Admin to decide whether to charge the client or absorb the cost.
                You cannot send this quote until a decision is made.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Client Changes Requested Banner */}
      {isClient && quote.status === 'changes_requested' && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">You requested changes on this quote</p>
              <p className="text-sm text-amber-700">Your PM is revising it - you&apos;ll be notified when the updated quote is ready.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Client Actions (Only for Client Admin when quote is Sent) */}
      {canRespondToQuote && (
        <Card className="mb-6 border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Review this quote</p>
                <p className="text-sm text-muted-foreground">Please review and respond to this quote.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setChangesDialogOpen(true)}>
                  Request Changes
                </Button>
                <Button variant="outline" onClick={() => setRejectDialogOpen(true)} className="text-destructive hover:text-destructive">
                  Reject
                </Button>
                <Button onClick={() => setApproveDialogOpen(true)} className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Quote
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Update 01/04: Quote Info - only show populated fields */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quote Details</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2 space-y-4">
              {/* Description (if present) */}
              {quote.description && (
                <p className="text-muted-foreground">{quote.description}</p>
              )}
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Client</p>
                    <p className="font-medium">{quote.clientName}</p>
                  </div>
                </div>
                {/* Update 01: Project is optional */}
                {quote.projectId && quote.projectName && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Project</p>
                      <Link href={`/projects/${quote.projectId}`} className="font-medium hover:underline">{quote.projectName}</Link>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Project Manager</p>
                    <p className="font-medium">{quote.pmName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(quote.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              {/* Update 01: Services (if present) */}
              {quote.services && quote.services.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Services</p>
                  <div className="flex flex-wrap gap-2">
                    {quote.services.map((service) => (
                      <span key={service} className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Update 01: Languages (if present) */}
              {(quote.sourceLanguage || (quote.targetLanguages && quote.targetLanguages.length > 0)) && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Languages</p>
                  <div className="flex items-center gap-2 text-sm">
                    {quote.sourceLanguage && (
                      <span className="font-medium">{quote.sourceLanguage}</span>
                    )}
                    {quote.sourceLanguage && quote.targetLanguages && quote.targetLanguages.length > 0 && (
                      <span className="text-muted-foreground">→</span>
                    )}
                    {quote.targetLanguages && quote.targetLanguages.length > 0 && (
                      <span>{quote.targetLanguages.join(', ')}</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Update 01: Line Items (only show if present) */}
          {quote.items && quote.items.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Line Items</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-0 pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Rate</TableHead>
                      <TableHead className="text-right">Line Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quote.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.service}</TableCell>
                        <TableCell className="text-muted-foreground">{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitRate)}
                          {item.isRateOverridden && (
                            <span className="ml-1 text-xs text-amber-600" title="Rate overridden">*</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.lineTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Line Items Total */}
                <div className="border-t border-border p-4">
                  <div className="flex items-center justify-end gap-8">
                    <span className="text-muted-foreground">Line Items Total {quote.currency && `(${quote.currency})`}</span>
                    <span className="text-2xl font-bold">{formatCurrency(quote.items.reduce((sum, item) => sum + item.lineTotal, 0))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Update 01: Price display (only show if price is set) */}
          {quote.price !== undefined && quote.price !== null && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Price</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Price</span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(quote.price)} {quote.currency}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Notes to Client */}
          {quote.notesToClient && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <MessageSquare className="h-4 w-4" />
                  Notes to Client
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <p className="text-muted-foreground whitespace-pre-wrap">{quote.notesToClient}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Internal Notes (Admin/PM/Finance only) */}
          {quote.internalNotes && (isAdmin || isPM || isFinance) && (
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Eye className="h-4 w-4" />
                  Internal Notes
                  <span className="text-xs font-normal text-muted-foreground">(Not visible to client)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <p className="text-muted-foreground whitespace-pre-wrap">{quote.internalNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Status History</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">{formatDate(quote.createdAt)}</p>
                  </div>
                </div>
                
                {quote.sentAt && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Sent to client</p>
                      <p className="text-xs text-muted-foreground">{formatDate(quote.sentAt)}</p>
                    </div>
                  </div>
                )}
                
                {quote.status === 'changes_requested' && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Changes requested</p>
                      <p className="text-xs text-muted-foreground">Awaiting revision</p>
                    </div>
                  </div>
                )}
                
                {quote.approvedAt && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">Approved</p>
                      <p className="text-xs text-muted-foreground">{formatDate(quote.approvedAt)} by {quote.approvedBy}</p>
                    </div>
                  </div>
                )}
                
                {quote.rejectedAt && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-red-500" />
                    <div>
                      <p className="text-sm font-medium">Rejected</p>
                      <p className="text-xs text-muted-foreground">{formatDate(quote.rejectedAt)}</p>
                      {quote.rejectionReason && (
                        <p className="mt-1 text-xs text-muted-foreground italic">&quot;{quote.rejectionReason}&quot;</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Approval Info (if approved) */}
          {quote.approvedAt && quote.signatureData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Approval Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Approved by</p>
                  <p className="font-medium">{quote.approvedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Signature</p>
                  <p className="font-medium italic">{quote.signatureData}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(quote.approvedAt)}</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Version History (Admin/PM/Finance only) */}
          {(isAdmin || isPM || isFinance) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Clock className="h-4 w-4" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current version</span>
                    <span className="font-medium">v{quote.version || 1}</span>
                  </div>
                  {quote.sentAt && (
                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div>
                          <p className="font-medium">v{quote.version || 1} - Sent</p>
                          <p className="text-xs text-muted-foreground">{formatDate(quote.sentAt)} by {quote.pmName}</p>
                        </div>
                      </div>
                      {(quote.version || 1) > 1 && (
                        <div className="flex items-start gap-2 text-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                          <div>
                            <p className="text-muted-foreground">v1 - Initial</p>
                            <p className="text-xs text-muted-foreground">{formatDate(quote.createdAt)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Supersede Warning Dialog */}
      <AlertDialog open={supersedeDialogOpen} onOpenChange={setSupersedeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supersede Existing Quote?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This project already has an active quote: <strong>{existingActiveQuote?.quoteNumber}</strong></p>
              <p>Sending this quote will supersede the existing one. The client will be notified that the previous quote has been replaced.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setSupersedeDialogOpen(false)
              setSendDialogOpen(true)
            }}>
              Continue & Supersede
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Send this quote to {quote.clientName}? They will receive an email notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendQuote} disabled={isSending}>
              {isSending ? 'Sending...' : 'Send Quote'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Quote</DialogTitle>
            <DialogDescription>
              By signing below, you agree to the terms and pricing in this quote.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Digital Signature</label>
              <p className="text-xs text-muted-foreground mb-2">Type your full name as your signature</p>
              <Input 
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Your full name"
                className="font-medium italic"
              />
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm">
              {/* Update 01: totalAmount renamed to price */}
              <p className="font-medium">Total: {quote.price ? `${formatCurrency(quote.price)} ${quote.currency || ''}` : 'Price not set'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApproveQuote} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Approve Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Quote</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this quote. This action is final.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Rejection Reason</label>
            <Textarea 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please explain why you are rejecting this quote..."
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectQuote} className="gap-1.5">
              <XCircle className="h-4 w-4" />
              Reject Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Request Changes Dialog */}
      <Dialog open={changesDialogOpen} onOpenChange={setChangesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Describe the changes you need. Your PM will revise the quote and send an updated version.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Changes Needed</label>
            <Textarea 
              value={changesComment}
              onChange={(e) => setChangesComment(e.target.value)}
              placeholder="Please describe what changes you need..."
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangesDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRequestChanges}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* BILL-008: Charge Decision Dialog */}
      <Dialog open={chargeDecisionDialogOpen} onOpenChange={setChargeDecisionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-600" />
              Repair Quote - Charge Decision
            </DialogTitle>
            <DialogDescription>
              Decide whether to charge the client for this repair work or absorb the cost internally.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p><span className="text-muted-foreground">Quote:</span> <span className="font-medium">{quote.quoteNumber}</span></p>
              {/* Update 01: totalAmount renamed to price, projectName optional */}
              <p><span className="text-muted-foreground">Amount:</span> <span className="font-medium">{quote.price ? `${formatCurrency(quote.price)} ${quote.currency || ''}` : '—'}</span></p>
              {quote.projectName && <p><span className="text-muted-foreground">Project:</span> <span className="font-medium">{quote.projectName}</span></p>}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => setSelectedChargeDecision('charge_client')}
                className={cn(
                  'w-full rounded-lg border-2 p-4 text-left transition-colors',
                  selectedChargeDecision === 'charge_client'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Charge Client</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Send this repair quote to the client for approval. They will be billed for the repair work.
                    </p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedChargeDecision('absorb_cost')}
                className={cn(
                  'w-full rounded-lg border-2 p-4 text-left transition-colors',
                  selectedChargeDecision === 'absorb_cost'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">Absorb Cost (NG Pays)</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The company absorbs this repair cost. An internal cost record will be created. No invoice to client.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setChargeDecisionDialogOpen(false)
              setSelectedChargeDecision(null)
            }}>
              Cancel
            </Button>
            <Button onClick={handleChargeDecision} disabled={!selectedChargeDecision}>
              Confirm Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Plus,
  Trash2,
  Save,
  Send,
  GripVertical,
  Wrench,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { mockProjects, mockClients, mockQuotes, formatCurrency, SERVICES_LIST } from '@/lib/mock-data'
import { useRole } from '../../layout'
import { useToast } from '@/hooks/use-toast'
import type { QuoteCurrency } from '@/lib/types'

interface LineItem {
  id: string
  service: string
  description: string
  quantity: number
  unitRate: number
}

export default function NewQuotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  // BILL-008: Check if this is a repair quote
  const isRepairMode = searchParams.get('repair') === 'true'
  const linkedProjectId = searchParams.get('projectId') || ''
  
  const [projectId, setProjectId] = useState<string>(linkedProjectId)
  const [currency, setCurrency] = useState<QuoteCurrency>('USD')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', service: '', description: '', quantity: 1, unitRate: 0 }
  ])
  const [notesToClient, setNotesToClient] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [supersedeDialogOpen, setSupersedeDialogOpen] = useState(false)
  
  const selectedProject = mockProjects.find(p => p.id === projectId)
  
  // Check if selected project has an existing active quote
  const existingActiveQuote = projectId ? mockQuotes.find(q => 
    q.projectId === projectId && 
    ['sent', 'changes_requested', 'approved'].includes(q.status)
  ) : null
  const selectedClient = selectedProject ? mockClients.find(c => c.id === selectedProject.clientId) : null
  
  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitRate), 0)
  
  // Validation
  const isValid = projectId && lineItems.length > 0 && lineItems.every(item => 
    item.service && item.quantity > 0 && item.unitRate >= 0
  )
  
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now().toString(), service: '', description: '', quantity: 1, unitRate: 0 }
    ])
  }
  
  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id))
    }
  }
  
  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }
  
  const handleSaveDraft = async () => {
    if (!isValid) {
      toast({ title: 'Validation error', description: 'Please fill in all required fields.', variant: 'destructive' })
      return
    }
    
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsSaving(false)
    
    toast({ title: 'Quote saved', description: 'Quote has been saved as draft.' })
    router.push('/quotes')
  }
  
  const handleSaveAndSend = async () => {
    if (!isValid) {
      toast({ title: 'Validation error', description: 'Please fill in all required fields.', variant: 'destructive' })
      return
    }
    
    // Show supersede warning if project has an active quote
    if (existingActiveQuote) {
      setSupersedeDialogOpen(true)
    } else {
      setSendDialogOpen(true)
    }
  }
  
  const confirmSendQuote = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setSendDialogOpen(false)
    
    toast({ title: 'Quote sent', description: `Quote has been sent to ${selectedClient?.name}.` })
    router.push('/quotes')
  }
  
  // Generate quote number preview
  const currentYear = new Date().getFullYear()
  const quoteNumberPreview = `Q-${currentYear}-XXX`

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                {isRepairMode ? 'New Repair Quote' : 'New Quote'}
              </h1>
              {/* BILL-008: Repair Badge */}
              {isRepairMode && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                  <Wrench className="h-3 w-3" />
                  Repair
                </span>
              )}
            </div>
            <p className="mt-1 text-muted-foreground">
              Quote number will be assigned on save: {quoteNumberPreview}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving || !isValid}>
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <Button onClick={handleSaveAndSend} disabled={isSaving || !isValid}>
              <Send className="mr-2 h-4 w-4" />
              Save & Send
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project & Currency */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quote Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Project *</label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProjects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Currency *</label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as QuoteCurrency)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="ILS">ILS - Israeli Shekel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedProject && selectedClient && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p><span className="text-muted-foreground">Client:</span> {selectedClient.name}</p>
                  <p><span className="text-muted-foreground">Contact:</span> {selectedProject.clientContact}</p>
                </div>
              )}
              
              {existingActiveQuote && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                  <p className="font-medium text-amber-900">This project has an active quote</p>
                  <p className="text-amber-700 mt-1">
                    Quote <strong>{existingActiveQuote.quoteNumber}</strong> ({existingActiveQuote.status.replace('_', ' ')}) will be superseded when you send this new quote.
                  </p>
                </div>
              )}
              
              {/* BILL-008: Repair Quote Notice */}
              {isRepairMode && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-900">Repair Quote - Requires Admin Charge Decision</p>
                      <p className="text-amber-700 mt-1">
                        This quote cannot be sent to the client until Admin decides whether to <strong>Charge Client</strong> or <strong>Absorb Cost</strong>. 
                        If no decision is made within 48 hours, Admin will be notified.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Line Items */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Line Items</CardTitle>
              <Button variant="outline" size="sm" onClick={addLineItem} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Line Item
              </Button>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="space-y-4">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                  <div className="col-span-3">Service</div>
                  <div className="col-span-4">Description</div>
                  <div className="col-span-1 text-right">Qty</div>
                  <div className="col-span-2 text-right">Unit Rate</div>
                  <div className="col-span-1 text-right">Total</div>
                  <div className="col-span-1"></div>
                </div>
                
                {/* Items */}
                {lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3">
                      <Select 
                        value={item.service} 
                        onValueChange={(v) => updateLineItem(item.id, 'service', v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICES_LIST.map(service => (
                            <SelectItem key={service} value={service}>{service}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Input 
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Description"
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input 
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="h-9 text-right"
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number"
                        value={item.unitRate}
                        onChange={(e) => updateLineItem(item.id, 'unitRate', parseFloat(e.target.value) || 0)}
                        className="h-9 text-right"
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div className="col-span-1 text-right font-medium">
                      {formatCurrency(item.quantity * item.unitRate)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLineItem(item.id)}
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Subtotal */}
                <div className="border-t border-border pt-4 flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total ({currency})</p>
                    <p className="text-2xl font-bold">{formatCurrency(subtotal)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Notes */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Notes to Client</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <Textarea 
                  value={notesToClient}
                  onChange={(e) => setNotesToClient(e.target.value)}
                  placeholder="These notes will be visible to the client on the quote..."
                  rows={4}
                />
              </CardContent>
            </Card>
            
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Internal Notes
                  <span className="ml-2 text-xs font-normal text-muted-foreground">(Not visible to client)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <Textarea 
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Internal notes for Admin/PM/Finance only..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Line items</span>
                <span>{lineItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Currency</span>
                <span>{currency}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">{formatCurrency(subtotal)}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Help */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quote Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Quotes do not expire - clients can approve at any time.</p>
              <p>Each project can only have one active quote at a time.</p>
              <p>Sending a new quote will supersede any previous active quote.</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Supersede Warning Dialog */}
      <AlertDialog open={supersedeDialogOpen} onOpenChange={setSupersedeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supersede Existing Quote?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This project already has an active quote: <strong>{existingActiveQuote?.quoteNumber}</strong></p>
              <p>Sending this new quote will supersede the existing one. The client will be notified that the previous quote has been replaced.</p>
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
              This will save the quote and send it to {selectedClient?.name}. They will receive an email notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSendQuote} disabled={isSaving}>
              {isSaving ? 'Sending...' : 'Save & Send'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

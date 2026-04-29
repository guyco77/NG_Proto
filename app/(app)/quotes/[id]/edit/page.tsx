'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  Save,
  X,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockQuotes, mockProjects, formatCurrency, SERVICES_LIST } from '@/lib/mock-data'
import { useRole } from '../../../layout'
import { useToast } from '@/hooks/use-toast'
import type { QuoteItem, QuoteCurrency } from '@/lib/types'

export default function QuoteEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  const quote = mockQuotes.find(q => q.id === id) || mockQuotes[0]
  const project = mockProjects.find(p => p.id === quote.projectId)
  
  const isAdmin = currentRole === 'admin'
  const isPM = currentRole === 'pm'
  
  // Check if user can edit
  const canEdit = isAdmin || (isPM && project?.pmId === '2')
  
  // Redirect if not authorized or quote not editable
  const isEditable = ['unsent', 'draft', 'changes_requested'].includes(quote.status)
  
  const [currency, setCurrency] = useState<QuoteCurrency>(quote.currency)
  const [notesToClient, setNotesToClient] = useState(quote.notesToClient || '')
  const [internalNotes, setInternalNotes] = useState(quote.internalNotes || '')
  const [items, setItems] = useState<QuoteItem[]>(quote.items.map(item => ({...item})))
  const [isSaving, setIsSaving] = useState(false)
  
  const addLineItem = () => {
    const newItem: QuoteItem = {
      id: `new-${Date.now()}`,
      service: '',
      description: '',
      quantity: 1,
      unitRate: 0,
      lineTotal: 0,
    }
    setItems([...items, newItem])
  }
  
  const updateLineItem = (itemId: string, field: keyof QuoteItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id !== itemId) return item
      
      const updated = { ...item, [field]: value }
      
      // Recalculate line total if quantity or unitRate changed
      if (field === 'quantity' || field === 'unitRate') {
        updated.lineTotal = Number(updated.quantity) * Number(updated.unitRate)
      }
      
      return updated
    }))
  }
  
  const removeLineItem = (itemId: string) => {
    if (items.length <= 1) {
      toast({ title: 'Cannot remove', description: 'Quote must have at least one line item.', variant: 'destructive' })
      return
    }
    setItems(items.filter(item => item.id !== itemId))
  }
  
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.lineTotal, 0)
  }
  
  const handleSave = async () => {
    // Validate
    const hasEmptyService = items.some(item => !item.service)
    if (hasEmptyService) {
      toast({ title: 'Validation error', description: 'All line items must have a service selected.', variant: 'destructive' })
      return
    }
    
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsSaving(false)
    
    toast({
      title: 'Quote saved',
      description: 'Your changes have been saved.',
    })
    
    router.push(`/quotes/${quote.id}`)
  }
  
  const handleCancel = () => {
    router.push(`/quotes/${quote.id}`)
  }
  
  if (!canEdit || !isEditable) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don&apos;t have permission to edit this quote, or it&apos;s no longer editable.</p>
          <Link href={`/quotes/${quote.id}`}>
            <Button variant="outline" className="mt-4">View Quote</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Edit {quote.quoteNumber}</h1>
            <p className="mt-1 text-muted-foreground">
              {quote.projectName} - {quote.clientName}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Currency */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quote Settings</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="max-w-xs">
              <label className="text-sm font-medium">Currency</label>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-9 flex items-center rounded-md border border-input bg-muted px-3 text-sm">
                  {currency === 'ILS' ? 'ILS - Israeli Shekel' : currency === 'USD' ? 'USD - US Dollar' : 'EUR - Euro'}
                </div>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Currency is locked after the quote is saved.</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Line Items */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Line Items</CardTitle>
            <Button variant="outline" size="sm" onClick={addLineItem} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Line
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-0 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Service</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px] text-right">Quantity</TableHead>
                  <TableHead className="w-[120px] text-right">Unit Rate</TableHead>
                  <TableHead className="w-[120px] text-right">Line Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Select 
                        value={item.service} 
                        onValueChange={(val) => updateLineItem(item.id, 'service', val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICES_LIST.map((service) => (
                            <SelectItem key={service} value={service}>{service}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Description"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitRate}
                        onChange={(e) => updateLineItem(item.id, 'unitRate', parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.lineTotal)}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeLineItem(item.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Total */}
            <div className="border-t border-border p-4">
              <div className="flex items-center justify-end gap-8">
                <span className="text-muted-foreground">Total ({currency})</span>
                <span className="text-2xl font-bold">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Notes */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Notes to Client</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <Textarea 
                value={notesToClient}
                onChange={(e) => setNotesToClient(e.target.value)}
                placeholder="Enter any notes or terms for the client..."
                rows={4}
              />
              <p className="mt-2 text-xs text-muted-foreground">This will be visible to the client.</p>
            </CardContent>
          </Card>
          
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <Textarea 
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Internal notes (not visible to client)..."
                rows={4}
              />
              <p className="mt-2 text-xs text-muted-foreground">Only visible to Admin, PM, and Finance.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

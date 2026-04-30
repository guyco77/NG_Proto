'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Plus,
  Trash2,
  Save,
  Send,
  Wrench,
  AlertCircle,
  Check,
  ChevronsUpDown,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { mockProjects, mockClients, mockQuotes, formatCurrency, SERVICES_LIST, SERVICES_BY_CATEGORY } from '@/lib/mock-data'
import { useRole } from '../../layout'
import { useToast } from '@/hooks/use-toast'
import type { QuoteCurrency } from '@/lib/types'
import { cn } from '@/lib/utils'

// Update 01: Line items are optional, simplified structure
interface LineItem {
  id: string
  service: string
  description: string
  quantity: number
  unitRate: number
}

// Available languages for selection
const LANGUAGES = [
  'EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'JA', 'KO', 'ZH', 'AR', 'RU', 'HI', 'NL', 'PL', 'TR', 'VI', 'TH', 'ID', 'HE', 'SV'
]

export default function NewQuotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  // BILL-008: Check if this is a repair quote
  const isRepairMode = searchParams.get('repair') === 'true'
  const linkedProjectId = searchParams.get('projectId') || ''
  
  // Update 01: name is the only required field
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  
  // Update 01: Project is optional
  const [projectId, setProjectId] = useState<string>(linkedProjectId)
  const [clientId, setClientId] = useState<string>('')
  
  // Update 01: Services multi-select (optional)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [servicesOpen, setServicesOpen] = useState(false)
  
  // Update 01: Languages (optional)
  const [sourceLanguage, setSourceLanguage] = useState<string>('')
  const [targetLanguages, setTargetLanguages] = useState<string[]>([])
  const [targetLangOpen, setTargetLangOpen] = useState(false)
  
  // Update 01: Price (optional) with currency selector
  const [price, setPrice] = useState<string>('')
  const [currency, setCurrency] = useState<QuoteCurrency>('USD')
  
  // Notes
  const [notesToClient, setNotesToClient] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  
  // Line items (optional)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [showLineItems, setShowLineItems] = useState(false)
  
  const [isSaving, setIsSaving] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [supersedeDialogOpen, setSupersedeDialogOpen] = useState(false)
  
  // Auto-select client when project is selected
  const selectedProject = mockProjects.find(p => p.id === projectId)
  const selectedClient = useMemo(() => {
    if (projectId && selectedProject) {
      return mockClients.find(c => c.id === selectedProject.clientId)
    }
    if (clientId) {
      return mockClients.find(c => c.id === clientId)
    }
    return null
  }, [projectId, selectedProject, clientId])
  
  // Check if selected project has an existing active quote
  const existingActiveQuote = projectId ? mockQuotes.find(q => 
    q.projectId === projectId && 
    ['sent', 'changes_requested', 'approved'].includes(q.status)
  ) : null
  
  // Calculate line items total
  const lineItemsTotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitRate), 0)
  
  // Update 01: Only name is required for validation
  const isValid = name.trim().length > 0 && (clientId || selectedProject)
  
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now().toString(), service: '', description: '', quantity: 1, unitRate: 0 }
    ])
    setShowLineItems(true)
  }
  
  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id))
    if (lineItems.length <= 1) {
      setShowLineItems(false)
    }
  }
  
  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }
  
  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }
  
  const handleTargetLanguageToggle = (lang: string) => {
    setTargetLanguages(prev => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    )
  }
  
  const handleSaveDraft = async () => {
    if (!isValid) {
      toast({ title: 'Validation error', description: 'Please enter a quote name and select a client.', variant: 'destructive' })
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
      toast({ title: 'Validation error', description: 'Please enter a quote name and select a client.', variant: 'destructive' })
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
    
    toast({ title: 'Quote sent', description: `Quote has been sent to ${selectedClient?.displayName || selectedClient?.legalName}.` })
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
          {/* Update 01: Quote Details - Name is only required field */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quote Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name - Required */}
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Netflix Series Subtitling Q1 2024"
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Human-readable label for this quote/request
                </p>
              </div>
              
              {/* Description - Optional */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Longer context for the quote/request..."
                  rows={3}
                  className="mt-1.5"
                />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Update 01: Project is optional */}
                <div>
                  <Label className="text-sm font-medium">Project (Optional)</Label>
                  <Select value={projectId} onValueChange={(v) => {
                    setProjectId(v)
                    const proj = mockProjects.find(p => p.id === v)
                    if (proj) {
                      setClientId(proj.clientId)
                    }
                  }}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Link to project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None - Standalone Quote</SelectItem>
                      {mockProjects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Client - Required (auto-set if project selected) */}
                <div>
                  <Label className="text-sm font-medium">
                    Client <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={clientId || (selectedProject?.clientId || '')} 
                    onValueChange={setClientId}
                    disabled={!!projectId}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.displayName || client.legalName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {projectId && (
                    <p className="mt-1 text-xs text-muted-foreground">Auto-set from project</p>
                  )}
                </div>
              </div>
              
              {selectedClient && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p><span className="text-muted-foreground">Client:</span> {selectedClient.displayName || selectedClient.legalName}</p>
                  {selectedProject && (
                    <p><span className="text-muted-foreground">Project:</span> {selectedProject.name}</p>
                  )}
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
          
          {/* Update 01: Services Selection (Optional) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Services (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Select Services</Label>
                <Popover open={servicesOpen} onOpenChange={setServicesOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={servicesOpen}
                      className="w-full justify-between mt-1.5 h-auto min-h-10"
                    >
                      {selectedServices.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedServices.map(service => (
                            <span
                              key={service}
                              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary"
                            >
                              {service}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleServiceToggle(service)
                                }}
                                className="hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Select services...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search services..." />
                      <CommandList>
                        <CommandEmpty>No service found.</CommandEmpty>
                        {Object.entries(SERVICES_BY_CATEGORY).map(([category, services]) => (
                          <CommandGroup key={category} heading={category}>
                            {services.map((service) => (
                              <CommandItem
                                key={service}
                                value={service}
                                onSelect={() => handleServiceToggle(service)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedServices.includes(service) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {service}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="mt-1 text-xs text-muted-foreground">
                  Service names only - task workflows are configured separately in Shows
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Update 01: Languages (Optional) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Languages (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Source Language</Label>
                  <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select source language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not specified</SelectItem>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Target Languages</Label>
                  <Popover open={targetLangOpen} onOpenChange={setTargetLangOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={targetLangOpen}
                        className="w-full justify-between mt-1.5 h-auto min-h-10"
                      >
                        {targetLanguages.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {targetLanguages.map(lang => (
                              <span
                                key={lang}
                                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary"
                              >
                                {lang}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleTargetLanguageToggle(lang)
                                  }}
                                  className="hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Select target languages...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search languages..." />
                        <CommandList>
                          <CommandEmpty>No language found.</CommandEmpty>
                          <CommandGroup>
                            {LANGUAGES.map((lang) => (
                              <CommandItem
                                key={lang}
                                value={lang}
                                onSelect={() => handleTargetLanguageToggle(lang)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    targetLanguages.includes(lang) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {lang}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Update 01: Price (Optional) with Currency */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Pricing (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="price" className="text-sm font-medium">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="mt-1.5"
                    min={0}
                    step={0.01}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Currency</Label>
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
              
              {/* Optional Line Items */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Line Items (Optional)</Label>
                  <Button variant="outline" size="sm" onClick={addLineItem} className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    Add Line Item
                  </Button>
                </div>
                
                {showLineItems && lineItems.length > 0 && (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                      <div className="col-span-3">Service</div>
                      <div className="col-span-4">Description</div>
                      <div className="col-span-1 text-right">Qty</div>
                      <div className="col-span-2 text-right">Rate</div>
                      <div className="col-span-1 text-right">Total</div>
                      <div className="col-span-1"></div>
                    </div>
                    
                    {/* Items */}
                    {lineItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                          <Select 
                            value={item.service} 
                            onValueChange={(v) => updateLineItem(item.id, 'service', v)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Service" />
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
                        <div className="col-span-1 text-right font-medium text-sm">
                          {formatCurrency(item.quantity * item.unitRate)}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeLineItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Line Items Total */}
                    <div className="border-t border-border pt-3 flex justify-end">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Line Items Total ({currency})</p>
                        <p className="text-lg font-bold">{formatCurrency(lineItemsTotal)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Notes */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Notes to Client (Optional)</CardTitle>
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
                <span className="text-muted-foreground">Quote Name</span>
                <span className="font-medium truncate max-w-[150px]">{name || '—'}</span>
              </div>
              {selectedClient && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Client</span>
                  <span>{selectedClient.displayName || selectedClient.legalName}</span>
                </div>
              )}
              {selectedServices.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Services</span>
                  <span>{selectedServices.length}</span>
                </div>
              )}
              {lineItems.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Line items</span>
                  <span>{lineItems.length}</span>
                </div>
              )}
              {(price || lineItemsTotal > 0) && (
                <>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-medium">Price</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(parseFloat(price) || lineItemsTotal)} {currency}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Help */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quote Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Only the quote name is required. Fill in what you have.</p>
              <p>Quotes do not expire - clients can approve at any time.</p>
              <p>A quote can be created without a project and linked later.</p>
              <p>Sending a new quote for a project will supersede any previous active quote.</p>
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
              This will save the quote and send it to {selectedClient?.displayName || selectedClient?.legalName}. They will receive an email notification.
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

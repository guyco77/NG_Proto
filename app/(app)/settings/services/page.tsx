'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  GripVertical,
  Trash2,
  Save,
  X,
  ChevronRight,
  AlertCircle,
  DollarSign,
  User,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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
import { StatusBadge } from '@/components/status-badge'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../../layout'
import {
  mockServices,
  SERVICE_CATEGORIES,
  WORKFLOW_STEP_TYPES,
  PRICING_MODELS,
  LANGUAGE_PAIRS,
} from '@/lib/mock-data'
import type { Service, WorkflowStep, ServiceCategory, ServicePricingModel, BillingCurrency } from '@/lib/types'

const CURRENCIES: { value: BillingCurrency; label: string }[] = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'ILS', label: 'ILS' },
]

export default function ServicesCatalogPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentRole } = useRole()
  const canEdit = currentRole === 'admin' || currentRole === 'pm'

  // Redirect non-admin/pm users
  if (!canEdit) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">Only Admin and PM can access the Services Catalog.</p>
        </div>
      </div>
    )
  }

  const [services, setServices] = useState<Service[]>(mockServices)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const filtered = services.filter(
      (s) =>
        !s.isArchived &&
        (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.category.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    return SERVICE_CATEGORIES.map((cat) => ({
      ...cat,
      services: filtered.filter((s) => s.category === cat.value),
    })).filter((cat) => cat.services.length > 0)
  }, [services, searchQuery])

  const selectedService = selectedServiceId
    ? services.find((s) => s.id === selectedServiceId)
    : null

  const handleSelectService = (id: string) => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) return
    }
    setSelectedServiceId(id)
    setEditingService(null)
    setIsCreatingNew(false)
    setHasUnsavedChanges(false)
  }

  const handleStartEdit = () => {
    if (selectedService) {
      setEditingService({ ...selectedService, workflow: [...selectedService.workflow] })
    }
  }

  const handleStartCreate = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) return
    }
    const newService: Service = {
      id: `srv-new-${Date.now()}`,
      name: '',
      category: 'transcription',
      pricingModel: 'per_minute',
      defaultBaseRate: 0,
      rateCurrency: 'USD',
      workflow: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }
    setEditingService(newService)
    setIsCreatingNew(true)
    setSelectedServiceId(null)
    setHasUnsavedChanges(true)
  }

  const handleCancelEdit = () => {
    setEditingService(null)
    setIsCreatingNew(false)
    setHasUnsavedChanges(false)
  }

  const handleSave = () => {
    if (!editingService) return

    // Validation
    if (!editingService.name.trim()) {
      toast({ title: 'Validation Error', description: 'Service name is required.', variant: 'destructive' })
      return
    }
    if (editingService.workflow.length === 0) {
      toast({ title: 'Validation Error', description: 'A service must have at least 1 workflow step.', variant: 'destructive' })
      return
    }
    // Check for duplicate name
    const duplicate = services.find(
      (s) => s.id !== editingService.id && s.name.toLowerCase() === editingService.name.toLowerCase()
    )
    if (duplicate) {
      toast({ title: 'Validation Error', description: 'Service name must be unique.', variant: 'destructive' })
      return
    }

    const updatedService = {
      ...editingService,
      updatedAt: new Date().toISOString().split('T')[0],
    }

    if (isCreatingNew) {
      setServices([...services, updatedService])
      setSelectedServiceId(updatedService.id)
    } else {
      setServices(services.map((s) => (s.id === updatedService.id ? updatedService : s)))
    }

    setEditingService(null)
    setIsCreatingNew(false)
    setHasUnsavedChanges(false)

    // Send notification (SERV-001 requirement)
    toast({
      title: 'Services catalog updated',
      description: 'Changes saved. Notification sent to Admin, PM, and IT.',
    })
  }

  const handleArchive = (id: string) => {
    setServices(services.map((s) => (s.id === id ? { ...s, isArchived: true } : s)))
    setConfirmArchiveId(null)
    if (selectedServiceId === id) {
      setSelectedServiceId(null)
    }
    toast({ title: 'Service archived', description: 'The service has been archived and will not appear in new projects.' })
  }

  // Workflow step management
  const handleAddStep = () => {
    if (!editingService) return
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      name: '',
      type: 'other',
      order: editingService.workflow.length + 1,
    }
    setEditingService({
      ...editingService,
      workflow: [...editingService.workflow, newStep],
    })
    setHasUnsavedChanges(true)
  }

  const handleUpdateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    if (!editingService) return
    const stepType = WORKFLOW_STEP_TYPES.find((t) => t.value === (updates.type || ''))
    const isHumanOnly = stepType?.isHumanOnly || false
    setEditingService({
      ...editingService,
      workflow: editingService.workflow.map((s) =>
        s.id === stepId ? { ...s, ...updates, isHumanOnly } : s
      ),
    })
    setHasUnsavedChanges(true)
  }

  const handleRemoveStep = (stepId: string) => {
    if (!editingService) return
    setEditingService({
      ...editingService,
      workflow: editingService.workflow
        .filter((s) => s.id !== stepId)
        .map((s, i) => ({ ...s, order: i + 1 })),
    })
    setHasUnsavedChanges(true)
  }

  const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
    if (!editingService) return
    const idx = editingService.workflow.findIndex((s) => s.id === stepId)
    if (idx < 0) return
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= editingService.workflow.length) return

    const newWorkflow = [...editingService.workflow]
    ;[newWorkflow[idx], newWorkflow[newIdx]] = [newWorkflow[newIdx], newWorkflow[idx]]
    newWorkflow.forEach((s, i) => (s.order = i + 1))

    setEditingService({ ...editingService, workflow: newWorkflow })
    setHasUnsavedChanges(true)
  }

  const displayService = editingService || selectedService

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Column: Services List */}
      <div className="w-80 shrink-0 border-r border-border overflow-y-auto bg-muted/30">
        <div className="p-4 border-b border-border bg-background sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Services</h2>
            <Button size="sm" onClick={handleStartCreate} className="gap-1">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="p-2">
          {servicesByCategory.map((cat) => (
            <div key={cat.value} className="mb-4">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {cat.label}
              </div>
              {cat.services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleSelectService(service.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors ${
                    selectedServiceId === service.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="truncate">{service.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {service.workflow.length} steps
                  </span>
                </button>
              ))}
            </div>
          ))}

          {servicesByCategory.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No services found
            </div>
          )}
        </div>

        {/* Pricing Link */}
        <div className="p-4 border-t border-border">
          <Link href="/settings/services/pricing">
            <Button variant="outline" className="w-full gap-1.5">
              <DollarSign className="h-4 w-4" />
              Pricing Configuration
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Right Column: Service Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        {!displayService && !isCreatingNew && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Select a service</h3>
              <p className="text-sm text-muted-foreground">
                Choose a service from the list to view or edit its details
              </p>
            </div>
          </div>
        )}

        {displayService && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold">
                  {isCreatingNew ? 'New Service' : displayService.name}
                </h1>
                {!isCreatingNew && !editingService && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Last updated: {displayService.updatedAt}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editingService ? (
                  <>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setConfirmArchiveId(displayService.id)}>
                      Archive
                    </Button>
                    <Button onClick={handleStartEdit}>Edit Service</Button>
                  </>
                )}
              </div>
            </div>

            {/* Service Details Form */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Service Name</Label>
                    <input
                      id="name"
                      type="text"
                      value={editingService?.name ?? displayService.name}
                      onChange={(e) =>
                        editingService &&
                        setEditingService({ ...editingService, name: e.target.value })
                      }
                      disabled={!editingService}
                      className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm disabled:bg-muted disabled:cursor-not-allowed"
                      placeholder="Enter service name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={editingService?.category ?? displayService.category}
                      onValueChange={(v) =>
                        editingService &&
                        setEditingService({ ...editingService, category: v as ServiceCategory })
                      }
                      disabled={!editingService}
                    >
                      <SelectTrigger id="category" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="pricing">Pricing Model</Label>
                    <Select
                      value={editingService?.pricingModel ?? displayService.pricingModel}
                      onValueChange={(v) =>
                        editingService &&
                        setEditingService({ ...editingService, pricingModel: v as ServicePricingModel })
                      }
                      disabled={!editingService}
                    >
                      <SelectTrigger id="pricing" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRICING_MODELS.map((pm) => (
                          <SelectItem key={pm.value} value={pm.value}>
                            {pm.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rate">Default Base Rate</Label>
                    <input
                      id="rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingService?.defaultBaseRate ?? displayService.defaultBaseRate}
                      onChange={(e) =>
                        editingService &&
                        setEditingService({
                          ...editingService,
                          defaultBaseRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={!editingService}
                      className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm disabled:bg-muted disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={editingService?.rateCurrency ?? displayService.rateCurrency}
                      onValueChange={(v) =>
                        editingService &&
                        setEditingService({ ...editingService, rateCurrency: v as BillingCurrency })
                      }
                      disabled={!editingService}
                    >
                      <SelectTrigger id="currency" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Rate Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={editingService?.rateNotes ?? displayService.rateNotes ?? ''}
                    onChange={(e) =>
                      editingService &&
                      setEditingService({ ...editingService, rateNotes: e.target.value })
                    }
                    disabled={!editingService}
                    placeholder="Additional pricing notes..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Translation Language Overrides Note */}
                {(editingService?.category === 'translation' ||
                  displayService.category === 'translation') && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="font-medium">Translation Language Overrides</p>
                        <p className="text-muted-foreground">
                          Language-pair pricing is configured in the{' '}
                          <Link href="/settings/services/pricing" className="text-primary underline">
                            Pricing Configuration
                          </Link>
                          . When a project has source/target languages defined, the rate card will
                          override the default base rate.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Workflow Steps */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Default Workflow Steps</CardTitle>
                  <CardDescription>
                    Define the tasks that will be created when this service is added to a project
                  </CardDescription>
                </div>
                {editingService && (
                  <Button size="sm" variant="outline" onClick={handleAddStep}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Step
                  </Button>
                )}
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                {(editingService?.workflow ?? displayService.workflow).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No workflow steps defined.{' '}
                    {editingService && (
                      <button onClick={handleAddStep} className="text-primary underline">
                        Add the first step
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(editingService?.workflow ?? displayService.workflow).map((step, idx) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background"
                      >
                        {editingService && (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveStep(step.id, 'up')}
                              disabled={idx === 0}
                              className="p-1 hover:bg-muted rounded disabled:opacity-30"
                            >
                              <ChevronRight className="h-3 w-3 -rotate-90" />
                            </button>
                            <button
                              onClick={() => handleMoveStep(step.id, 'down')}
                              disabled={idx === (editingService?.workflow ?? []).length - 1}
                              className="p-1 hover:bg-muted rounded disabled:opacity-30"
                            >
                              <ChevronRight className="h-3 w-3 rotate-90" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                          {step.order}
                        </div>

                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div>
                            <input
                              type="text"
                              value={step.name}
                              onChange={(e) =>
                                handleUpdateStep(step.id, { name: e.target.value })
                              }
                              disabled={!editingService}
                              placeholder="Step name"
                              className="h-8 w-full rounded border border-input bg-background px-2 text-sm disabled:bg-muted disabled:cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <Select
                              value={step.type}
                              onValueChange={(v) =>
                                handleUpdateStep(step.id, { type: v as WorkflowStep['type'] })
                              }
                              disabled={!editingService}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {WORKFLOW_STEP_TYPES.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            {step.isHumanOnly && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                                <User className="h-3 w-3" />
                                Human only
                              </span>
                            )}
                          </div>
                        </div>

                        {editingService && (
                          <button
                            onClick={() => handleRemoveStep(step.id)}
                            className="p-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!confirmArchiveId} onOpenChange={() => setConfirmArchiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Service</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the service. It will no longer appear when creating new projects,
              but existing projects using this service will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmArchiveId && handleArchive(confirmArchiveId)}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

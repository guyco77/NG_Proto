'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  Trash2,
  Save,
  X,
  AlertCircle,
  DollarSign,
  GripVertical,
  ExternalLink,
  ShieldCheck,
  MoreHorizontal,
  Copy,
  Archive,
  ChevronRight,
  FileText,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../../layout'

// Types
type ServiceCategory = 'transcription' | 'translation' | 'editing_qc' | 'technical' | 'billing_only'
type ServicePricingModel = 'per_minute' | 'per_subtitle' | 'per_file' | 'custom'

interface WorkflowStep {
  id: string
  name: string
  type: string
  description?: string
  order: number
  isHumanOnly?: boolean
}

interface Service {
  id: string
  name: string
  category: ServiceCategory
  pricingModel: ServicePricingModel
  defaultBaseRate: number
  rateCurrency: string
  workflow: WorkflowStep[]
  isArchived: boolean
  lastEditedBy: string
  lastEditedAt: string
}

// Task Types from /settings/task-types (Update-001/002)
const TASK_TYPES = [
  { code: 'TRN', name: 'Transcription', isHumanOnly: true },
  { code: 'TRN_AI', name: 'Transcription AI', isHumanOnly: false },
  { code: 'TIM', name: 'Timing', isHumanOnly: true },
  { code: 'TIM_AI', name: 'Timing AI', isHumanOnly: false },
  { code: 'TRL', name: 'Translation', isHumanOnly: true },
  { code: 'TRL_AUDIO', name: 'Translation from Audio', isHumanOnly: true },
  { code: 'UPLOAD_TT', name: 'Upload TT', isHumanOnly: false },
  { code: 'UPLOAD_TEXT', name: 'Upload Text File', isHumanOnly: false },
  { code: 'QC', name: 'QC', isHumanOnly: true },
  { code: 'QC2', name: 'QC2', isHumanOnly: true },
  { code: 'PM_VERIFY', name: 'PM Verification', isHumanOnly: true },
  { code: 'PROOFREAD', name: 'Proofread', isHumanOnly: true },
  { code: 'CLIENT_REVIEW', name: 'Client Review', isHumanOnly: true },
  { code: 'UPLOAD_ASSET', name: 'Upload Client Asset', isHumanOnly: false },
  { code: 'UPLOAD_ROUGH', name: 'Upload Rough Cut', isHumanOnly: false },
  { code: 'NEW_CUT', name: 'New Cut', isHumanOnly: true },
  { code: 'PROJECT_CREATE', name: 'Project Creation', isHumanOnly: false },
  { code: 'TRL_AI', name: 'Translation AI', isHumanOnly: false },
]

const CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: 'transcription', label: 'Transcription' },
  { value: 'translation', label: 'Translation' },
  { value: 'editing_qc', label: 'Editing & QC' },
  { value: 'technical', label: 'Technical' },
  { value: 'billing_only', label: 'Billing Only' },
]

const PRICING_MODELS: { value: ServicePricingModel; label: string }[] = [
  { value: 'per_minute', label: 'Per minute of video' },
  { value: 'per_subtitle', label: 'Per subtitle / per line' },
  { value: 'per_file', label: 'Per file / fixed fee' },
  { value: 'custom', label: 'Custom (manual price)' },
]

// Canonical 17 services with default workflows (from Update-004)
const mockServices: Service[] = [
  {
    id: 'svc-1', name: 'Subtitles Transcription', category: 'transcription', pricingModel: 'per_minute',
    defaultBaseRate: 3.50, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'Admin User', lastEditedAt: '2024-01-15T10:30:00Z',
    workflow: [
      { id: 's1-1', name: 'Transcription', type: 'TRN', order: 1, description: 'Transcribing source language by ear', isHumanOnly: true },
      { id: 's1-2', name: 'Timing', type: 'TIM', order: 2, description: 'Manual human timing', isHumanOnly: true },
      { id: 's1-3', name: 'PM Verification', type: 'PM_VERIFY', order: 3, isHumanOnly: true },
      { id: 's1-4', name: 'Client Review', type: 'CLIENT_REVIEW', order: 4, isHumanOnly: true },
    ],
  },
  {
    id: 'svc-2', name: 'Subtitles Transcription AI', category: 'transcription', pricingModel: 'per_minute',
    defaultBaseRate: 1.50, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'Admin User', lastEditedAt: '2024-01-15T10:30:00Z',
    workflow: [
      { id: 's2-1', name: 'Transcription + Timing AI', type: 'TRN_AI', order: 1, isHumanOnly: false },
      { id: 's2-2', name: 'QC', type: 'QC', order: 2, isHumanOnly: true },
      { id: 's2-3', name: 'PM Verification', type: 'PM_VERIFY', order: 3, isHumanOnly: true },
      { id: 's2-4', name: 'Client Review', type: 'CLIENT_REVIEW', order: 4, isHumanOnly: true },
    ],
  },
  {
    id: 'svc-3', name: 'Translation from Audio + Template', category: 'translation', pricingModel: 'per_minute',
    defaultBaseRate: 5.00, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'Admin User', lastEditedAt: '2024-01-14T09:00:00Z',
    workflow: [
      { id: 's3-1', name: 'Transcription', type: 'TRN', order: 1, isHumanOnly: true },
      { id: 's3-2', name: 'Timing', type: 'TIM', order: 2, isHumanOnly: true },
      { id: 's3-3', name: 'Translation', type: 'TRL', order: 3, isHumanOnly: true },
      { id: 's3-4', name: 'QC', type: 'QC', order: 4, isHumanOnly: true },
      { id: 's3-5', name: 'PM Verification', type: 'PM_VERIFY', order: 5, isHumanOnly: true },
      { id: 's3-6', name: 'Client Review', type: 'CLIENT_REVIEW', order: 6, isHumanOnly: true },
    ],
  },
  {
    id: 'svc-4', name: 'Translation from Audio', category: 'translation', pricingModel: 'per_minute',
    defaultBaseRate: 4.50, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'PM User', lastEditedAt: '2024-01-13T14:20:00Z',
    workflow: [
      { id: 's4-1', name: 'Translation from Audio', type: 'TRL_AUDIO', order: 1, isHumanOnly: true },
      { id: 's4-2', name: 'Timing', type: 'TIM', order: 2, isHumanOnly: true },
      { id: 's4-3', name: 'PM Verification', type: 'PM_VERIFY', order: 3, isHumanOnly: true },
      { id: 's4-4', name: 'Client Review', type: 'CLIENT_REVIEW', order: 4, isHumanOnly: true },
    ],
  },
  {
    id: 'svc-5', name: 'Translation from Audio + Template AI', category: 'translation', pricingModel: 'per_minute',
    defaultBaseRate: 3.00, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'Admin User', lastEditedAt: '2024-01-12T11:00:00Z',
    workflow: [
      { id: 's5-1', name: 'Transcription + Timing AI', type: 'TRN_AI', order: 1, isHumanOnly: false },
      { id: 's5-2', name: 'QC', type: 'QC', order: 2, isHumanOnly: true },
      { id: 's5-3', name: 'Translation AI', type: 'TRL_AI', order: 3, isHumanOnly: false },
      { id: 's5-4', name: 'QC', type: 'QC', order: 4, isHumanOnly: true },
      { id: 's5-5', name: 'PM Verification', type: 'PM_VERIFY', order: 5, isHumanOnly: true },
      { id: 's5-6', name: 'Client Review', type: 'CLIENT_REVIEW', order: 6, isHumanOnly: true },
    ],
  },
  {
    id: 'svc-6', name: 'Translation from Template AI', category: 'translation', pricingModel: 'per_minute',
    defaultBaseRate: 2.50, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'Admin User', lastEditedAt: '2024-01-11T16:45:00Z',
    workflow: [
      { id: 's6-1', name: 'Upload TT', type: 'UPLOAD_TT', order: 1, isHumanOnly: false },
      { id: 's6-2', name: 'Translation AI', type: 'TRL_AI', order: 2, isHumanOnly: false },
      { id: 's6-3', name: 'QC', type: 'QC', order: 3, isHumanOnly: true },
      { id: 's6-4', name: 'QC2', type: 'QC2', order: 4, isHumanOnly: true },
      { id: 's6-5', name: 'PM Verification', type: 'PM_VERIFY', order: 5, isHumanOnly: true },
      { id: 's6-6', name: 'Client Review', type: 'CLIENT_REVIEW', order: 6, isHumanOnly: true },
    ],
  },
  {
    id: 'svc-7', name: 'Text Translation', category: 'translation', pricingModel: 'per_file',
    defaultBaseRate: 50.00, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'PM User', lastEditedAt: '2024-01-10T08:30:00Z',
    workflow: [
      { id: 's7-1', name: 'Upload Text File', type: 'UPLOAD_TEXT', order: 1, isHumanOnly: false },
      { id: 's7-2', name: 'Translation', type: 'TRL', order: 2, isHumanOnly: true },
      { id: 's7-3', name: 'PM Verification', type: 'PM_VERIFY', order: 3, isHumanOnly: true },
      { id: 's7-4', name: 'Client Review', type: 'CLIENT_REVIEW', order: 4, isHumanOnly: true },
    ],
  },
  {
    id: 'svc-8', name: 'Translation Pivot Language', category: 'translation', pricingModel: 'per_minute',
    defaultBaseRate: 6.00, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'Admin User', lastEditedAt: '2024-01-09T13:15:00Z',
    workflow: [
      { id: 's8-1', name: 'Translation from Audio', type: 'TRL_AUDIO', order: 1, isHumanOnly: true },
      { id: 's8-2', name: 'Timing', type: 'TIM', order: 2, isHumanOnly: true },
      { id: 's8-3', name: 'Translation', type: 'TRL', order: 3, isHumanOnly: true },
      { id: 's8-4', name: 'PM Verification', type: 'PM_VERIFY', order: 4, isHumanOnly: true },
      { id: 's8-5', name: 'Client Review', type: 'CLIENT_REVIEW', order: 5, isHumanOnly: true },
    ],
  },
  {
    id: 'svc-9', name: 'Proofread', category: 'editing_qc', pricingModel: 'per_minute',
    defaultBaseRate: 1.00, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'PM User', lastEditedAt: '2024-01-08T10:00:00Z',
    workflow: [
      { id: 's9-1', name: 'Proofread', type: 'PROOFREAD', order: 1, isHumanOnly: true },
      { id: 's9-2', name: 'PM Verification', type: 'PM_VERIFY', order: 2, isHumanOnly: true },
      { id: 's9-3', name: 'Client Review', type: 'CLIENT_REVIEW', order: 3, isHumanOnly: true },
    ],
  },
  {
    id: 'svc-10', name: 'Extra QC', category: 'editing_qc', pricingModel: 'per_minute',
    defaultBaseRate: 1.50, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'Admin User', lastEditedAt: '2024-01-07T15:30:00Z',
    workflow: [
      { id: 's10-1', name: 'Upload Client Asset', type: 'UPLOAD_ASSET', order: 1, isHumanOnly: false },
      { id: 's10-2', name: 'QC', type: 'QC', order: 2, isHumanOnly: true },
      { id: 's10-3', name: 'PM Verification', type: 'PM_VERIFY', order: 3, isHumanOnly: true },
      { id: 's10-4', name: 'Client Review', type: 'CLIENT_REVIEW', order: 4, isHumanOnly: true },
    ],
  },
  {
    id: 'svc-11', name: 'Timing', category: 'technical', pricingModel: 'per_minute',
    defaultBaseRate: 2.00, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'PM User', lastEditedAt: '2024-01-06T09:45:00Z',
    workflow: [
      { id: 's11-1', name: 'Transcription', type: 'TRN', order: 1, isHumanOnly: true },
      { id: 's11-2', name: 'Timing', type: 'TIM', order: 2, isHumanOnly: true },
      { id: 's11-3', name: 'PM Verification', type: 'PM_VERIFY', order: 3, isHumanOnly: true },
      { id: 's11-4', name: 'Client Review', type: 'CLIENT_REVIEW', order: 4, isHumanOnly: true },
    ],
  },
  {
    id: 'svc-12', name: 'Client Corrections', category: 'technical', pricingModel: 'per_file',
    defaultBaseRate: 25.00, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'Admin User', lastEditedAt: '2024-01-05T14:00:00Z',
    workflow: [
      { id: 's12-1', name: 'Upload Client Asset', type: 'UPLOAD_ASSET', order: 1, isHumanOnly: false },
      { id: 's12-2', name: 'Client Review', type: 'CLIENT_REVIEW', order: 2, isHumanOnly: true },
    ],
  },
  {
    id: 'svc-13', name: 'New Version (Re-conforming)', category: 'technical', pricingModel: 'per_minute',
    defaultBaseRate: 2.50, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'PM User', lastEditedAt: '2024-01-04T11:30:00Z',
    workflow: [
      { id: 's13-1', name: 'Upload Rough Cut', type: 'UPLOAD_ROUGH', order: 1, isHumanOnly: false },
      { id: 's13-2', name: 'New Cut', type: 'NEW_CUT', order: 2, isHumanOnly: true },
      { id: 's13-3', name: 'PM Verification', type: 'PM_VERIFY', order: 3, isHumanOnly: true },
      { id: 's13-4', name: 'Client Review', type: 'CLIENT_REVIEW', order: 4, isHumanOnly: true },
    ],
  },
  {
    id: 'svc-14', name: 'Convert Files', category: 'technical', pricingModel: 'per_file',
    defaultBaseRate: 15.00, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'Admin User', lastEditedAt: '2024-01-03T16:20:00Z',
    workflow: [
      { id: 's14-1', name: 'PM Verification', type: 'PM_VERIFY', order: 1, isHumanOnly: true },
      { id: 's14-2', name: 'Client Review', type: 'CLIENT_REVIEW', order: 2, isHumanOnly: true },
    ],
  },
  {
    id: 'svc-15', name: 'Other', category: 'technical', pricingModel: 'custom',
    defaultBaseRate: 0, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'PM User', lastEditedAt: '2024-01-02T08:00:00Z',
    workflow: [
      { id: 's15-1', name: 'PM Verification', type: 'PM_VERIFY', order: 1, isHumanOnly: true },
      { id: 's15-2', name: 'Client Review', type: 'CLIENT_REVIEW', order: 2, isHumanOnly: true },
    ],
  },
  {
    id: 'svc-16', name: 'Raw Materials', category: 'billing_only', pricingModel: 'custom',
    defaultBaseRate: 0, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'Admin User', lastEditedAt: '2024-01-01T12:00:00Z',
    workflow: [
      { id: 's16-1', name: 'Project Creation', type: 'PROJECT_CREATE', order: 1, isHumanOnly: false },
    ],
  },
  {
    id: 'svc-17', name: 'Translation On-Site', category: 'billing_only', pricingModel: 'custom',
    defaultBaseRate: 0, rateCurrency: 'USD', isArchived: false, lastEditedBy: 'PM User', lastEditedAt: '2023-12-31T10:30:00Z',
    workflow: [
      { id: 's17-1', name: 'Project Creation', type: 'PROJECT_CREATE', order: 1, isHumanOnly: false },
    ],
  },
]

/**
 * SERV-001/Update-004: Services Catalog Page (Table View)
 */
export default function ServicesPage() {
  const { toast } = useToast()
  const { currentRole } = useRole()
  const canEdit = currentRole === 'admin' || currentRole === 'pm'

  const [services, setServices] = useState<Service[]>(mockServices)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'all'>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null)

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter
      const matchesArchived = showArchived ? true : !service.isArchived
      return matchesSearch && matchesCategory && matchesArchived
    })
  }, [services, searchQuery, categoryFilter, showArchived])

  const handleOpenService = (service: Service) => {
    setSelectedService(service)
    setEditingService(null)
    setIsEditorOpen(true)
    setHasUnsavedChanges(false)
  }

  const handleEditService = (service: Service) => {
    setSelectedService(service)
    setEditingService({ ...service, workflow: service.workflow.map(s => ({ ...s })) })
    setIsEditorOpen(true)
    setHasUnsavedChanges(false)
  }

  const handleCreateService = () => {
    const newService: Service = {
      id: `svc-${Date.now()}`,
      name: '',
      category: 'transcription',
      pricingModel: 'per_minute',
      defaultBaseRate: 0,
      rateCurrency: 'USD',
      workflow: [],
      isArchived: false,
      lastEditedBy: 'Current User',
      lastEditedAt: new Date().toISOString(),
    }
    setSelectedService(newService)
    setEditingService(newService)
    setIsEditorOpen(true)
    setHasUnsavedChanges(false)
  }

  const handleDuplicateService = (service: Service) => {
    const duplicated: Service = {
      ...service,
      id: `svc-${Date.now()}`,
      name: `${service.name} (Copy)`,
      workflow: service.workflow.map((s) => ({ ...s, id: `step-${Date.now()}-${s.order}` })),
      lastEditedBy: 'Current User',
      lastEditedAt: new Date().toISOString(),
    }
    setServices([...services, duplicated])
    toast({ title: 'Service duplicated', description: `"${duplicated.name}" has been created.` })
  }

  const handleArchiveService = (service: Service) => {
    setServices(services.map((s) => s.id === service.id ? { ...s, isArchived: !s.isArchived } : s))
    toast({ title: service.isArchived ? 'Service reactivated' : 'Service archived' })
  }

  const handleSaveService = () => {
    if (!editingService) return
    if (!editingService.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' })
      return
    }
    if (editingService.workflow.length === 0) {
      toast({ title: 'Workflow required', description: 'A service must have at least one step.', variant: 'destructive' })
      return
    }
    const isDuplicate = services.some((s) => s.id !== editingService.id && s.name.toLowerCase() === editingService.name.toLowerCase())
    if (isDuplicate) {
      toast({ title: 'Name already exists', variant: 'destructive' })
      return
    }

    const isNew = !services.find((s) => s.id === editingService.id)
    const updatedService = { ...editingService, lastEditedBy: 'Current User', lastEditedAt: new Date().toISOString() }

    if (isNew) {
      setServices([...services, updatedService])
    } else {
      setServices(services.map((s) => (s.id === updatedService.id ? updatedService : s)))
    }

    toast({ title: 'Services catalog updated', description: 'Notification sent to Admin, PM, and IT.' })
    setSelectedService(updatedService)
    setEditingService(null)
    setHasUnsavedChanges(false)
  }

  const handleCancelEdit = () => {
    if (hasUnsavedChanges && !confirm('Discard unsaved changes?')) return
    setEditingService(null)
    setHasUnsavedChanges(false)
    if (!selectedService || !services.find((s) => s.id === selectedService.id)) setIsEditorOpen(false)
  }

  const handleAddStep = () => {
    if (!editingService) return
    const defaultTaskType = TASK_TYPES[0]
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      name: '',
      type: defaultTaskType.code,
      order: editingService.workflow.length + 1,
      isHumanOnly: defaultTaskType.isHumanOnly,
    }
    setEditingService({ ...editingService, workflow: [...editingService.workflow, newStep] })
    setHasUnsavedChanges(true)
  }

  const handleUpdateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    if (!editingService) return
    const taskType = TASK_TYPES.find((t) => t.code === (updates.type || ''))
    setEditingService({
      ...editingService,
      workflow: editingService.workflow.map((s) =>
        s.id === stepId ? { ...s, ...updates, isHumanOnly: taskType?.isHumanOnly || false } : s
      ),
    })
    setHasUnsavedChanges(true)
  }

  const handleRemoveStep = (stepId: string) => {
    if (!editingService) return
    setEditingService({
      ...editingService,
      workflow: editingService.workflow.filter((s) => s.id !== stepId).map((s, i) => ({ ...s, order: i + 1 })),
    })
    setHasUnsavedChanges(true)
  }

  const handleDragStart = (stepId: string) => setDraggedStepId(stepId)
  const handleDragEnd = () => setDraggedStepId(null)
  const handleDragOver = (e: React.DragEvent, targetStepId: string) => {
    e.preventDefault()
    if (!editingService || !draggedStepId || draggedStepId === targetStepId) return
    const draggedIndex = editingService.workflow.findIndex((s) => s.id === draggedStepId)
    const targetIndex = editingService.workflow.findIndex((s) => s.id === targetStepId)
    if (draggedIndex === -1 || targetIndex === -1) return
    const newWorkflow = [...editingService.workflow]
    const [draggedItem] = newWorkflow.splice(draggedIndex, 1)
    newWorkflow.splice(targetIndex, 0, draggedItem)
    setEditingService({ ...editingService, workflow: newWorkflow.map((s, i) => ({ ...s, order: i + 1 })) })
    setHasUnsavedChanges(true)
  }

  if (!canEdit) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">Only Admin and PM can access Services Catalog.</p>
        </div>
      </div>
    )
  }

  const displayService = editingService || selectedService

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Services</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage service definitions and default workflows</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings/services/pricing">
            <Button variant="outline" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing
            </Button>
          </Link>
          <Button onClick={handleCreateService} className="gap-2">
            <Plus className="h-4 w-4" />
            New Service
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search services..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ServiceCategory | 'all')}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch checked={showArchived} onCheckedChange={setShowArchived} id="show-archived" />
          <Label htmlFor="show-archived" className="text-sm">Show archived</Label>
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Steps</TableHead>
              <TableHead>Pricing Model</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Edited</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No services found.</TableCell>
              </TableRow>
            ) : (
              filteredServices.map((service) => (
                <TableRow key={service.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenService(service)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{service.name}</span>
                      {service.isArchived && <Badge variant="secondary" className="text-xs">Archived</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{CATEGORIES.find((c) => c.value === service.category)?.label}</Badge></TableCell>
                  <TableCell className="text-center">{service.workflow.length}</TableCell>
                  <TableCell>{PRICING_MODELS.find((p) => p.value === service.pricingModel)?.label}</TableCell>
                  <TableCell><Badge variant={service.isArchived ? 'secondary' : 'default'}>{service.isArchived ? 'Archived' : 'Active'}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{service.lastEditedBy} · {new Date(service.lastEditedAt).toLocaleDateString()}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenService(service)}><ChevronRight className="mr-2 h-4 w-4" />Open</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditService(service)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateService(service)}><Copy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleArchiveService(service)}><Archive className="mr-2 h-4 w-4" />{service.isArchived ? 'Reactivate' : 'Archive'}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Service Detail Sheet */}
      <Sheet open={isEditorOpen} onOpenChange={(open) => {
        if (!open && hasUnsavedChanges && !confirm('Discard unsaved changes?')) return
        setIsEditorOpen(open)
        if (!open) { setSelectedService(null); setEditingService(null); setHasUnsavedChanges(false) }
      }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {displayService && (
            <>
              <SheetHeader>
                <SheetTitle>{editingService ? (services.find((s) => s.id === editingService.id) ? 'Edit Service' : 'New Service') : displayService.name}</SheetTitle>
                <SheetDescription>{editingService ? 'Configure the service details and workflow steps.' : 'View service configuration and workflow.'}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Service Name</Label>
                      {editingService ? (
                        <Input value={editingService.name} onChange={(e) => { setEditingService({ ...editingService, name: e.target.value }); setHasUnsavedChanges(true) }} placeholder="Enter service name" className="mt-1" />
                      ) : (
                        <p className="mt-1 text-sm">{displayService.name}</p>
                      )}
                    </div>
                    <div>
                      <Label>Category</Label>
                      {editingService ? (
                        <Select value={editingService.category} onValueChange={(v) => { setEditingService({ ...editingService, category: v as ServiceCategory }); setHasUnsavedChanges(true) }}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>{CATEGORIES.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : (
                        <p className="mt-1 text-sm">{CATEGORIES.find((c) => c.value === displayService.category)?.label}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Pricing Model</Label>
                      {editingService ? (
                        <Select value={editingService.pricingModel} onValueChange={(v) => { setEditingService({ ...editingService, pricingModel: v as ServicePricingModel }); setHasUnsavedChanges(true) }}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>{PRICING_MODELS.map((pm) => <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : (
                        <p className="mt-1 text-sm">{PRICING_MODELS.find((p) => p.value === displayService.pricingModel)?.label}</p>
                      )}
                    </div>
                    <div>
                      <Label>Default Base Rate</Label>
                      <p className="mt-1 text-sm">{displayService.defaultBaseRate.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <p className="mt-1 text-sm">{displayService.rateCurrency}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 mt-0.5 text-primary" />
                        <div className="text-sm">
                          <p className="font-medium">Pricing managed in Rate Cards</p>
                          <p className="text-muted-foreground">Base rates and currency are configured centrally.</p>
                        </div>
                      </div>
                      <Link href="/settings/services/pricing">
                        <Button variant="outline" size="sm" className="gap-1">Go to Pricing<ExternalLink className="h-3 w-3" /></Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Workflow Steps */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-medium">Default Workflow (Task Flow)</Label>
                    {editingService && <Button variant="outline" size="sm" onClick={handleAddStep}><Plus className="h-4 w-4 mr-1" />Add Step</Button>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">Steps are applied in this order when the service is selected on a new project.</p>

                  {displayService.workflow.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground border rounded-lg">No workflow steps defined. {editingService && 'Click "Add Step" to create one.'}</div>
                  ) : (
                    <div className="space-y-2">
                      {(editingService?.workflow || displayService.workflow).map((step, idx) => {
                        const taskType = TASK_TYPES.find((t) => t.code === step.type)
                        const isHumanOnly = taskType?.isHumanOnly || step.type === 'QC' || step.type === 'QC2'
                        return (
                          <div
                            key={step.id}
                            draggable={!!editingService}
                            onDragStart={() => editingService && handleDragStart(step.id)}
                            onDragOver={(e) => editingService && handleDragOver(e, step.id)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${editingService ? 'cursor-grab active:cursor-grabbing' : ''} ${draggedStepId === step.id ? 'opacity-50 border-dashed' : ''}`}
                          >
                            {editingService && <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />}
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium shrink-0">{idx + 1}</span>
                            {editingService ? (
                              <>
                                <Input value={step.name} onChange={(e) => handleUpdateStep(step.id, { name: e.target.value })} placeholder="Step name" className="h-8 flex-1" />
                                <Select value={step.type} onValueChange={(v) => handleUpdateStep(step.id, { type: v })}>
                                  <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {TASK_TYPES.map((t) => (
                                      <SelectItem key={t.code} value={t.code}>
                                        <span className="flex items-center gap-2">{t.name}{t.isHumanOnly && <ShieldCheck className="h-3 w-3 text-amber-600" />}</span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {isHumanOnly && <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 shrink-0"><ShieldCheck className="h-3 w-3 mr-1" />Human only</Badge>}
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleRemoveStep(step.id)}><Trash2 className="h-4 w-4" /></Button>
                              </>
                            ) : (
                              <>
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{step.name}</span>
                                  {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}
                                </div>
                                <span className="text-xs text-muted-foreground">{taskType?.name || step.type}</span>
                                {isHumanOnly && <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50"><ShieldCheck className="h-3 w-3 mr-1" />Human only</Badge>}
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  {editingService ? (
                    <>
                      <Button variant="outline" onClick={handleCancelEdit}><X className="h-4 w-4 mr-1" />Cancel</Button>
                      <Button onClick={handleSaveService}><Save className="h-4 w-4 mr-1" />Save Service</Button>
                    </>
                  ) : (
                    <Button onClick={() => handleEditService(displayService)}><Pencil className="h-4 w-4 mr-1" />Edit Service</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

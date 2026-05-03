'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  MoreHorizontal,
  Copy,
  Pencil,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  AlertTriangle,
  X,
  Download,
  GripVertical,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { mockProjectTemplates, mockClients, mockVendors, formatDate, type ProjectTemplate } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../../layout'

/**
 * Update-005: Templates Page (SERV-005)
 * 
 * Dedicated Settings page for managing reusable Project Templates.
 * Templates bundle Client, Languages, Workflow, and Vendor assignments.
 * 
 * Location: /settings/templates (separate from Service Configuration)
 * Permissions: Admin + PM only
 */

// Task Types from Update-003 for workflow step types
const TASK_TYPES = [
  { code: 'TRN', name: 'Transcription', isHumanOnly: true },
  { code: 'TRN_AI', name: 'Transcription AI', isHumanOnly: false },
  { code: 'TIM', name: 'Timing', isHumanOnly: true },
  { code: 'TIM_AI', name: 'Timing AI', isHumanOnly: false },
  { code: 'TRL', name: 'Translation', isHumanOnly: true },
  { code: 'TRL_AUD', name: 'Translation from Audio', isHumanOnly: true },
  { code: 'SUB', name: 'Subtitling', isHumanOnly: false },
  { code: 'QC', name: 'Quality Control', isHumanOnly: true },
  { code: 'QC2', name: 'QC Level 2', isHumanOnly: true },
  { code: 'PRF', name: 'Proofread', isHumanOnly: true },
  { code: 'PM_VER', name: 'PM Verification', isHumanOnly: true },
  { code: 'CLT_RVW', name: 'Client Review', isHumanOnly: true },
]

// Available languages
const LANGUAGES = ['EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'HE', 'AR', 'RU', 'JA', 'KO', 'ZH', 'NL', 'PL', 'TR']

// Mock services for "Load from Service" feature (from Update-002)
const MOCK_SERVICES = [
  { 
    id: 'svc-1', 
    name: 'Standard Subtitling', 
    workflow: [
      { serviceType: 'TRN', order: 1 },
      { serviceType: 'TIM', order: 2 },
      { serviceType: 'TRL', order: 3 },
      { serviceType: 'QC', order: 4 },
    ]
  },
  { 
    id: 'svc-2', 
    name: 'AI-Assisted Subtitling', 
    workflow: [
      { serviceType: 'TRN_AI', order: 1 },
      { serviceType: 'TIM_AI', order: 2 },
      { serviceType: 'TRL', order: 3 },
      { serviceType: 'QC', order: 4 },
      { serviceType: 'QC2', order: 5 },
    ]
  },
  { 
    id: 'svc-3', 
    name: 'Translation Only', 
    workflow: [
      { serviceType: 'TRL', order: 1 },
      { serviceType: 'PRF', order: 2 },
      { serviceType: 'QC', order: 3 },
    ]
  },
]

// Workflow step with vendor assignment
interface WorkflowStepWithVendor {
  serviceType: string
  order: number
  vendorId?: string
  vendorPoolIds?: string[]
}

// Extended template type for form
interface TemplateFormData {
  name: string
  clientId: string
  sourceLanguage: string
  targetLanguages: string[]
  workflow: WorkflowStepWithVendor[]
  notes: string
}

export default function TemplatesPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [templates, setTemplates] = useState<ProjectTemplate[]>(mockProjectTemplates)
  const [showArchived, setShowArchived] = useState(false)
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState<{ open: boolean; template: ProjectTemplate | null }>({
    open: false,
    template: null,
  })
  const [showLoadServiceDialog, setShowLoadServiceDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    clientId: '',
    sourceLanguage: 'EN',
    targetLanguages: ['ES'],
    workflow: [{ serviceType: 'TRN', order: 1 }],
    notes: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  
  // Drag state for workflow reordering
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null)
  
  // Access control - only Admin/PM
  const canManageTemplates = currentRole === 'admin' || currentRole === 'pm'
  
  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = templates
    
    // Filter by archived status
    if (!showArchived) {
      result = result.filter(t => !t.isArchived)
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.clientName.toLowerCase().includes(query)
      )
    }
    
    return result
  }, [templates, searchQuery, showArchived])
  
  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      clientId: '',
      sourceLanguage: 'EN',
      targetLanguages: ['ES'],
      workflow: [{ serviceType: 'TRN', order: 1 }],
      notes: '',
    })
    setEditingTemplate(null)
  }
  
  // Open create dialog
  const openCreateDialog = () => {
    resetForm()
    setShowCreateDialog(true)
  }
  
  // Open edit dialog
  const openEditDialog = (template: ProjectTemplate) => {
    setFormData({
      name: template.name,
      clientId: template.clientId,
      sourceLanguage: template.languages[0]?.source || 'EN',
      targetLanguages: template.languages.map(l => l.target),
      workflow: template.workflow.map(w => ({
        serviceType: w.serviceType,
        order: w.order,
        vendorId: w.vendorId,
        vendorPoolIds: w.vendorPoolIds,
      })),
      notes: template.internalNotes || '',
    })
    setEditingTemplate(template)
    setShowCreateDialog(true)
  }
  
  // Case-insensitive unique name validation
  const isNameUnique = (name: string, excludeId?: string) => {
    const normalizedName = name.trim().toLowerCase()
    return !templates.some(t => 
      t.id !== excludeId && 
      t.name.trim().toLowerCase() === normalizedName &&
      !t.isArchived
    )
  }
  
  // Handle save (create or update)
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.clientId) return
    
    // Validate unique name
    if (!isNameUnique(formData.name, editingTemplate?.id)) {
      toast({
        title: 'Name already exists',
        description: 'A template with this name already exists. Please choose a different name.',
        variant: 'destructive',
      })
      return
    }
    
    // Validate required fields per spec
    if (!formData.sourceLanguage || formData.targetLanguages.length === 0) {
      toast({
        title: 'Languages required',
        description: 'Please select a source language and at least one target language.',
        variant: 'destructive',
      })
      return
    }
    
    if (formData.workflow.length === 0) {
      toast({
        title: 'Workflow required',
        description: 'Please add at least one workflow step.',
        variant: 'destructive',
      })
      return
    }
    
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 500))
    
    const client = mockClients.find(c => c.id === formData.clientId)
    
    // Convert form data to template languages format
    const languages = formData.targetLanguages.map(target => ({
      source: formData.sourceLanguage,
      target,
    }))
    
    if (editingTemplate) {
      // Update existing template
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id
          ? {
              ...t,
              name: formData.name,
              clientId: formData.clientId,
              clientName: client?.displayName || 'Unknown Client',
              languages,
              workflow: formData.workflow,
              internalNotes: formData.notes || undefined,
              updatedAt: new Date().toISOString(),
            }
          : t
      ))
      toast({
        title: 'Template updated',
        description: `"${formData.name}" has been updated. Changes apply to new projects only.`,
      })
      // Simulated audit log entry
      console.log('[v0] Audit: Template updated', { templateId: editingTemplate.id, name: formData.name })
    } else {
      // Create new template
      const newTemplate: ProjectTemplate = {
        id: `tpl-${Date.now()}`,
        name: formData.name,
        clientId: formData.clientId,
        clientName: client?.displayName || 'Unknown Client',
        languages,
        workflow: formData.workflow,
        preferredVendors: [],
        internalNotes: formData.notes || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: currentRole === 'admin' ? '1' : '2',
        ownerName: currentRole === 'admin' ? 'Admin User' : 'PM User',
        usageCount: 0,
      }
      setTemplates(prev => [newTemplate, ...prev])
      toast({
        title: 'Template created',
        description: `"${formData.name}" has been created.`,
      })
      // Simulated audit log entry and notification
      console.log('[v0] Audit: Template created', { templateId: newTemplate.id, name: formData.name })
      console.log('[v0] Notification: "Project templates updated" sent to Admin + PM')
    }
    
    setIsSaving(false)
    setShowCreateDialog(false)
    resetForm()
  }
  
  // Handle duplicate
  const handleDuplicate = (template: ProjectTemplate) => {
    const newTemplate: ProjectTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      lastUsedAt: undefined,
      isArchived: false,
    }
    setTemplates(prev => [newTemplate, ...prev])
    toast({
      title: 'Template duplicated',
      description: `"${newTemplate.name}" has been created.`,
    })
  }
  
  // Handle archive (instead of delete per Update-005)
  const handleArchive = () => {
    if (!showArchiveDialog.template) return
    
    setTemplates(prev => prev.map(t => 
      t.id === showArchiveDialog.template!.id
        ? { ...t, isArchived: true, updatedAt: new Date().toISOString() }
        : t
    ))
    toast({
      title: 'Template archived',
      description: `"${showArchiveDialog.template.name}" has been archived. Historical references are preserved.`,
    })
    console.log('[v0] Audit: Template archived', { templateId: showArchiveDialog.template.id })
    setShowArchiveDialog({ open: false, template: null })
  }
  
  // Handle reactivate
  const handleReactivate = (template: ProjectTemplate) => {
    setTemplates(prev => prev.map(t => 
      t.id === template.id
        ? { ...t, isArchived: false, updatedAt: new Date().toISOString() }
        : t
    ))
    toast({
      title: 'Template reactivated',
      description: `"${template.name}" is now active again.`,
    })
  }
  
  // Load workflow from service (Update-005 feature)
  const handleLoadFromService = (serviceId: string) => {
    const service = MOCK_SERVICES.find(s => s.id === serviceId)
    if (service) {
      setFormData(prev => ({
        ...prev,
        workflow: service.workflow.map((w, i) => ({
          serviceType: w.serviceType,
          order: i + 1,
        })),
      }))
      toast({
        title: 'Workflow loaded',
        description: `Loaded workflow from "${service.name}". You can now customize it.`,
      })
    }
    setShowLoadServiceDialog(false)
  }
  
  // Add target language
  const addTargetLanguage = () => {
    const availableLanguages = LANGUAGES.filter(l => 
      l !== formData.sourceLanguage && !formData.targetLanguages.includes(l)
    )
    if (availableLanguages.length > 0) {
      setFormData(prev => ({
        ...prev,
        targetLanguages: [...prev.targetLanguages, availableLanguages[0]],
      }))
    }
  }
  
  // Remove target language
  const removeTargetLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      targetLanguages: prev.targetLanguages.filter((_, i) => i !== index),
    }))
  }
  
  // Add workflow step
  const addWorkflowStep = () => {
    const nextOrder = formData.workflow.length + 1
    setFormData(prev => ({
      ...prev,
      workflow: [...prev.workflow, { serviceType: 'QC', order: nextOrder }],
    }))
  }
  
  // Remove workflow step
  const removeWorkflowStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workflow: prev.workflow.filter((_, i) => i !== index).map((w, i) => ({ ...w, order: i + 1 })),
    }))
  }
  
  // Update workflow step
  const updateWorkflowStep = (index: number, updates: Partial<WorkflowStepWithVendor>) => {
    setFormData(prev => ({
      ...prev,
      workflow: prev.workflow.map((w, i) => i === index ? { ...w, ...updates } : w),
    }))
  }
  
  // Drag handlers for workflow reordering
  const handleDragStart = (index: number) => {
    setDraggedStepIndex(index)
  }
  
  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedStepIndex === null || draggedStepIndex === targetIndex) return
    
    setFormData(prev => {
      const newWorkflow = [...prev.workflow]
      const [draggedItem] = newWorkflow.splice(draggedStepIndex, 1)
      newWorkflow.splice(targetIndex, 0, draggedItem)
      setDraggedStepIndex(targetIndex)
      return {
        ...prev,
        workflow: newWorkflow.map((w, i) => ({ ...w, order: i + 1 })),
      }
    })
  }
  
  const handleDragEnd = () => {
    setDraggedStepIndex(null)
  }
  
  // Get filtered vendors by task type and languages (Epic 8 filtering)
  const getFilteredVendors = (taskType: string) => {
    // In a real implementation, this would filter by:
    // - Vendor skills matching task type
    // - Vendor language pairs matching source/target
    // - Vendor availability status
    return mockVendors.filter(v => v.availability !== 'unavailable')
  }
  
  if (!canManageTemplates) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Only Admin and PM can manage project templates.
          </p>
          <Link href="/settings">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">
              Settings
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">Templates</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Project Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage reusable project configurations with workflow and vendor assignments
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by template name or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="show-archived"
            checked={showArchived}
            onCheckedChange={setShowArchived}
          />
          <Label htmlFor="show-archived" className="text-sm cursor-pointer">
            Show archived
          </Label>
        </div>
      </div>
      
      {/* Templates Table */}
      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-medium">Template Name</TableHead>
              <TableHead className="font-medium">Client</TableHead>
              <TableHead className="font-medium">Languages</TableHead>
              <TableHead className="font-medium"># Steps</TableHead>
              <TableHead className="font-medium">Last Edited</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  {templates.filter(t => !t.isArchived).length === 0 ? (
                    <div>
                      <p className="text-muted-foreground">No templates yet.</p>
                      <Button variant="link" className="mt-2" onClick={openCreateDialog}>
                        Create your first template
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No templates match your search.</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((template) => (
                <TableRow 
                  key={template.id} 
                  className={`hover:bg-muted/50 ${template.isArchived ? 'opacity-60' : ''}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        {template.usageCount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      {template.isArchived && (
                        <Badge variant="secondary" className="text-xs">Archived</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{template.clientName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.languages.slice(0, 3).map((l, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 bg-muted rounded">
                          {l.source} → {l.target}
                        </span>
                      ))}
                      {template.languages.length > 3 && (
                        <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                          +{template.languages.length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{template.workflow.length}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{formatDate(template.updatedAt)}</p>
                      <p className="text-xs text-muted-foreground">by {template.ownerName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {template.isArchived ? (
                          <DropdownMenuItem onClick={() => handleReactivate(template)}>
                            <ArchiveRestore className="h-4 w-4 mr-2" />
                            Reactivate
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => openEditDialog(template)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setShowArchiveDialog({ open: true, template })}
                              className="text-amber-600"
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Create/Edit Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
            <DialogDescription>
              {editingTemplate 
                ? 'Update the template configuration. Changes apply only to new projects.'
                : 'Create a reusable project configuration with workflow and vendor assignments.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="template-name">
                Template Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Netflix Series - Standard Subtitles"
              />
            </div>
            
            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="template-client">
                Client <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
              >
                <SelectTrigger id="template-client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {mockClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Languages */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Languages</CardTitle>
                <CardDescription className="text-xs">
                  Select source language and target language(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Source Language */}
                <div className="space-y-2">
                  <Label>Source Language <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.sourceLanguage}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, sourceLanguage: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Target Languages */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Target Language(s) <span className="text-destructive">*</span></Label>
                    <Button type="button" variant="outline" size="sm" onClick={addTargetLanguage}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.targetLanguages.map((lang, index) => (
                      <div key={index} className="flex items-center gap-1 bg-muted rounded-md pl-1">
                        <Select
                          value={lang}
                          onValueChange={(value) => {
                            setFormData(prev => ({
                              ...prev,
                              targetLanguages: prev.targetLanguages.map((l, i) => 
                                i === index ? value : l
                              ),
                            }))
                          }}
                        >
                          <SelectTrigger className="h-7 w-20 border-0 bg-transparent">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.filter(l => 
                              l !== formData.sourceLanguage && 
                              (l === lang || !formData.targetLanguages.includes(l))
                            ).map((l) => (
                              <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.targetLanguages.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeTargetLanguage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Workflow */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">Workflow Steps</CardTitle>
                    <CardDescription className="text-xs">
                      Define the task sequence. QC/QC2 steps are human-only.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowLoadServiceDialog(true)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Load from Service
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={addWorkflowStep}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Step
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {formData.workflow.map((step, index) => {
                    const taskType = TASK_TYPES.find(t => t.code === step.serviceType)
                    const isHumanOnly = taskType?.isHumanOnly || step.serviceType === 'QC' || step.serviceType === 'QC2'
                    const filteredVendors = getFilteredVendors(step.serviceType)
                    
                    return (
                      <div 
                        key={index} 
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-2 p-2 border rounded-lg bg-background transition-all ${
                          draggedStepIndex === index ? 'opacity-50 border-dashed' : ''
                        } cursor-grab active:cursor-grabbing`}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground w-6 shrink-0">{step.order}.</span>
                        
                        {/* Task Type */}
                        <Select
                          value={step.serviceType}
                          onValueChange={(value) => updateWorkflowStep(index, { serviceType: value })}
                        >
                          <SelectTrigger className="w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TASK_TYPES.map((type) => (
                              <SelectItem key={type.code} value={type.code}>
                                <span className="flex items-center gap-2">
                                  {type.name}
                                  {type.isHumanOnly && <ShieldCheck className="h-3 w-3 text-amber-600" />}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {/* Human only badge */}
                        {isHumanOnly && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 shrink-0">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Human
                          </Badge>
                        )}
                        
                        {/* Vendor assignment */}
                        <Select
                          value={step.vendorId || ''}
                          onValueChange={(value) => updateWorkflowStep(index, { 
                            vendorId: value || undefined 
                          })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Default vendor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-3 w-3" />
                                Any qualified
                              </span>
                            </SelectItem>
                            {filteredVendors.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                <span className="flex items-center gap-2">
                                  <User className="h-3 w-3" />
                                  {vendor.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {formData.workflow.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => removeWorkflowStep(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="template-notes">Notes (optional)</Label>
              <Textarea
                id="template-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Internal notes about this template..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={
                !formData.name.trim() || 
                !formData.clientId || 
                !formData.sourceLanguage ||
                formData.targetLanguages.length === 0 ||
                formData.workflow.length === 0 ||
                isSaving
              }
            >
              {isSaving ? 'Saving...' : editingTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Load from Service Dialog */}
      <Dialog open={showLoadServiceDialog} onOpenChange={setShowLoadServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Workflow from Service</DialogTitle>
            <DialogDescription>
              Select a service to use as the starting workflow. You can customize it after loading.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {MOCK_SERVICES.map((service) => (
              <button
                key={service.id}
                onClick={() => handleLoadFromService(service.id)}
                className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium">{service.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {service.workflow.length} steps: {service.workflow.map(w => {
                    const taskType = TASK_TYPES.find(t => t.code === w.serviceType)
                    return taskType?.name || w.serviceType
                  }).join(' → ')}
                </p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveDialog.open} onOpenChange={(open) => 
        setShowArchiveDialog(prev => ({ ...prev, open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive &quot;{showArchiveDialog.template?.name}&quot;? 
              Historical references on existing projects will be preserved.
              You can reactivate it later if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveDialog({ open: false, template: null })}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleArchive} className="bg-amber-600 hover:bg-amber-700">
              <Archive className="h-4 w-4 mr-2" />
              Archive Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  MoreHorizontal,
  Copy,
  Pencil,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { mockProjectTemplates, mockClients, mockVendors, formatDate, type ProjectTemplate } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../../layout'

// Available service types for workflow
const SERVICE_TYPES = [
  'Transcription',
  'Transcription AI',
  'Timing',
  'Timing AI',
  'Translation',
  'Translation from Audio',
  'QC',
  'Proofread',
  'PM Verification',
  'Client Review',
]

// Available languages
const LANGUAGES = ['EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'HE', 'AR', 'RU', 'JA', 'KO', 'ZH']

export default function ProjectTemplatesPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [templates, setTemplates] = useState<ProjectTemplate[]>(mockProjectTemplates)
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ open: boolean; template: ProjectTemplate | null }>({
    open: false,
    template: null,
  })
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    showName: '',
    languages: [{ source: 'EN', target: 'ES' }] as { source: string; target: string }[],
    workflow: [{ serviceType: 'Transcription', order: 1 }] as { serviceType: string; order: number }[],
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    internalNotes: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  
  // Access control - only Admin/PM
  const canManageTemplates = currentRole === 'admin' || currentRole === 'pm'
  
  // Filter templates
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates
    const query = searchQuery.toLowerCase()
    return templates.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.clientName.toLowerCase().includes(query) ||
      (t.showName && t.showName.toLowerCase().includes(query))
    )
  }, [templates, searchQuery])
  
  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      clientId: '',
      showName: '',
      languages: [{ source: 'EN', target: 'ES' }],
      workflow: [{ serviceType: 'Transcription', order: 1 }],
      priority: 'medium',
      internalNotes: '',
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
      showName: template.showName || '',
      languages: template.languages,
      workflow: template.workflow,
      priority: template.priority || 'medium',
      internalNotes: template.internalNotes || '',
    })
    setEditingTemplate(template)
    setShowCreateDialog(true)
  }
  
  // Handle save (create or update)
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.clientId) return
    
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 500))
    
    const client = mockClients.find(c => c.id === formData.clientId)
    
    if (editingTemplate) {
      // Update existing template
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id
          ? {
              ...t,
              name: formData.name,
              clientId: formData.clientId,
              clientName: client?.displayName || 'Unknown Client',
              showName: formData.showName || undefined,
              languages: formData.languages,
              workflow: formData.workflow,
              priority: formData.priority,
              internalNotes: formData.internalNotes || undefined,
              updatedAt: new Date().toISOString(),
            }
          : t
      ))
      toast({
        title: 'Template updated',
        description: `"${formData.name}" has been updated.`,
      })
    } else {
      // Create new template
      const newTemplate: ProjectTemplate = {
        id: `tpl-${Date.now()}`,
        name: formData.name,
        clientId: formData.clientId,
        clientName: client?.displayName || 'Unknown Client',
        showName: formData.showName || undefined,
        languages: formData.languages,
        workflow: formData.workflow,
        preferredVendors: [],
        priority: formData.priority,
        internalNotes: formData.internalNotes || undefined,
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
    }
    setTemplates(prev => [newTemplate, ...prev])
    toast({
      title: 'Template duplicated',
      description: `"${newTemplate.name}" has been created.`,
    })
  }
  
  // Handle delete
  const handleDelete = () => {
    if (!showDeleteDialog.template) return
    
    setTemplates(prev => prev.filter(t => t.id !== showDeleteDialog.template!.id))
    toast({
      title: 'Template deleted',
      description: `"${showDeleteDialog.template.name}" has been deleted.`,
    })
    setShowDeleteDialog({ open: false, template: null })
  }
  
  // Add language pair
  const addLanguagePair = () => {
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, { source: 'EN', target: 'FR' }],
    }))
  }
  
  // Remove language pair
  const removeLanguagePair = (index: number) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
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
            <span className="text-sm font-medium">Project Templates</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Project Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage reusable project configurations
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>
      
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by template name, client, or Show..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {/* Templates Table */}
      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-medium">Template Name</TableHead>
              <TableHead className="font-medium">Client</TableHead>
              <TableHead className="font-medium">Show</TableHead>
              <TableHead className="font-medium">Languages</TableHead>
              <TableHead className="font-medium">Tasks</TableHead>
              <TableHead className="font-medium">Last Updated</TableHead>
              <TableHead className="font-medium">Owner</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  {templates.length === 0 ? (
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
                <TableRow key={template.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{template.name}</p>
                      {template.usageCount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{template.clientName}</TableCell>
                  <TableCell>{template.showName || '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.languages.slice(0, 2).map((l, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 bg-muted rounded">
                          {l.source}→{l.target}
                        </span>
                      ))}
                      {template.languages.length > 2 && (
                        <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                          +{template.languages.length - 2}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{template.workflow.length}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(template.updatedAt)}
                  </TableCell>
                  <TableCell className="text-sm">{template.ownerName}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                          onClick={() => setShowDeleteDialog({ open: true, template })}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
            <DialogDescription>
              {editingTemplate 
                ? 'Update the template configuration. Changes do not affect existing projects.'
                : 'Create a reusable project configuration.'}
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
            
            {/* Show (optional) */}
            <div className="space-y-2">
              <Label htmlFor="template-show">Show (optional)</Label>
              <Input
                id="template-show"
                value={formData.showName}
                onChange={(e) => setFormData(prev => ({ ...prev, showName: e.target.value }))}
                placeholder="e.g., Stranger Things"
              />
            </div>
            
            {/* Language Pairs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Language Pairs</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLanguagePair}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              {formData.languages.map((lang, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={lang.source}
                    onValueChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        languages: prev.languages.map((l, i) => 
                          i === index ? { ...l, source: value } : l
                        ),
                      }))
                    }}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">→</span>
                  <Select
                    value={lang.target}
                    onValueChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        languages: prev.languages.map((l, i) => 
                          i === index ? { ...l, target: value } : l
                        ),
                      }))
                    }}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.languages.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeLanguagePair(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Workflow */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Workflow Steps</Label>
                <Button type="button" variant="outline" size="sm" onClick={addWorkflowStep}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Step
                </Button>
              </div>
              {formData.workflow.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-6">{step.order}.</span>
                  <Select
                    value={step.serviceType}
                    onValueChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        workflow: prev.workflow.map((w, i) => 
                          i === index ? { ...w, serviceType: value } : w
                        ),
                      }))
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.workflow.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeWorkflowStep(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="template-priority">Default Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger id="template-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Internal Notes */}
            <div className="space-y-2">
              <Label htmlFor="template-notes">Internal Notes (optional)</Label>
              <Textarea
                id="template-notes"
                value={formData.internalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
                placeholder="Notes visible only to Admin/PM..."
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
              disabled={!formData.name.trim() || !formData.clientId || isSaving}
            >
              {isSaving ? 'Saving...' : editingTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog.open} onOpenChange={(open) => 
        setShowDeleteDialog(prev => ({ ...prev, open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{showDeleteDialog.template?.name}&quot;? 
              This action cannot be undone. Existing projects created from this template are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog({ open: false, template: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Save,
  X,
  Search,
  Edit2,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Users,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/status-badge'
import { useToast } from '@/hooks/use-toast'

// Update-003: Task Type definition with audience scope
type TaskTypeAudience = 'admin_pm' | 'client'

interface TaskType {
  id: string
  name: string
  code: string
  description?: string
  audience: TaskTypeAudience
  isHumanOnly: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Update-003: Types that are forced to be Human Only (cannot be marked AI)
const FORCED_HUMAN_ONLY_TYPES = ['QC', 'QC2', 'PM Verification', 'Client Review']

// Update-003: Mock services using task types (for affected services warning)
const MOCK_SERVICES_USING_TYPES: Record<string, string[]> = {
  'Transcription': ['Basic Transcription', 'Full Transcription Service'],
  'QC': ['Basic Transcription', 'Subtitling Service', 'Full Dubbing Package'],
  'Translation': ['Translation Service', 'Subtitling Service'],
  'Timing': ['Subtitling Service', 'Caption Creation'],
  'PM Verification': ['Full Dubbing Package', 'Premium Subtitling'],
}

// Update-003: Mock templates using task types
const MOCK_TEMPLATES_USING_TYPES: Record<string, string[]> = {
  'Transcription': ['Standard Show Template', 'Documentary Template'],
  'QC': ['Standard Show Template', 'Fast Turnaround Template'],
  'Client Review': ['Premium Client Template'],
}

// Update-003: Canonical Admin & PM Task Types (seed list per specification)
const ADMIN_PM_TASK_TYPES: TaskType[] = [
  { id: 'tt-1', name: 'Transcription', code: 'TRN', audience: 'admin_pm', isHumanOnly: true, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20' },
  { id: 'tt-2', name: 'Transcription AI', code: 'TRN-AI', audience: 'admin_pm', isHumanOnly: false, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20' },
  { id: 'tt-3', name: 'Timing', code: 'TMG', audience: 'admin_pm', isHumanOnly: true, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20' },
  { id: 'tt-4', name: 'Timing AI', code: 'TMG-AI', audience: 'admin_pm', isHumanOnly: false, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20' },
  { id: 'tt-5', name: 'Translation', code: 'TRL', audience: 'admin_pm', isHumanOnly: true, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20' },
  { id: 'tt-6', name: 'Translation from Audio', code: 'TRL-AUD', audience: 'admin_pm', isHumanOnly: true, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20' },
  { id: 'tt-7', name: 'Upload TT', code: 'UPL-TT', audience: 'admin_pm', isHumanOnly: false, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20' },
  { id: 'tt-8', name: 'Upload Text File', code: 'UPL-TXT', audience: 'admin_pm', isHumanOnly: false, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20' },
  { id: 'tt-9', name: 'QC', code: 'QC', audience: 'admin_pm', isHumanOnly: true, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20', description: 'Quality Control - requires human review' },
  { id: 'tt-10', name: 'QC2', code: 'QC2', audience: 'admin_pm', isHumanOnly: true, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20', description: 'Quality Control Level 2 - requires human review' },
  { id: 'tt-11', name: 'PM Verification', code: 'PM-VRF', audience: 'admin_pm', isHumanOnly: true, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20', description: 'Project Manager verification step' },
  { id: 'tt-12', name: 'Proofread', code: 'PRF', audience: 'admin_pm', isHumanOnly: true, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20' },
  { id: 'tt-13', name: 'Project Creation', code: 'PRJ-CRT', audience: 'admin_pm', isHumanOnly: false, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20' },
]

// Update-003: Canonical Client Task Types (seed list)
const CLIENT_TASK_TYPES: TaskType[] = [
  { id: 'tt-c1', name: 'Client Review', code: 'CLT-RVW', audience: 'client', isHumanOnly: true, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20', description: 'Client reviews and approves deliverables' },
  { id: 'tt-c2', name: 'Upload Client Asset', code: 'CLT-UPL', audience: 'client', isHumanOnly: false, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20', description: 'Client uploads source materials' },
  { id: 'tt-c3', name: 'Upload Rough Cut', code: 'CLT-RC', audience: 'client', isHumanOnly: false, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20', description: 'Client uploads rough cut video' },
  { id: 'tt-c4', name: 'New Cut', code: 'CLT-NC', audience: 'client', isHumanOnly: false, isActive: true, createdAt: '2024-01-15', updatedAt: '2024-02-20', description: 'Client provides new version of content' },
]

/**
 * Update-003: Task Types Sub-Tab
 * 
 * Manages task type definitions (building blocks for services).
 * Two scoped lists: Admin & PM Task Types and Client Task Types.
 */
export function TaskTypesTab() {
  const { toast } = useToast()

  // Update-003: Separate state for each audience scope
  const [adminPmTaskTypes, setAdminPmTaskTypes] = useState<TaskType[]>(ADMIN_PM_TASK_TYPES)
  const [clientTaskTypes, setClientTaskTypes] = useState<TaskType[]>(CLIENT_TASK_TYPES)
  
  // Update-003: Inner sub-tab state
  const [activeAudienceTab, setActiveAudienceTab] = useState<TaskTypeAudience>('admin_pm')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [editingTaskType, setEditingTaskType] = useState<TaskType | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null)
  const [affectedItemsWarning, setAffectedItemsWarning] = useState<{
    services: string[]
    templates: string[]
    taskTypeName: string
  } | null>(null)

  // Get current task types based on active audience tab
  const currentTaskTypes = activeAudienceTab === 'admin_pm' ? adminPmTaskTypes : clientTaskTypes
  const setCurrentTaskTypes = activeAudienceTab === 'admin_pm' ? setAdminPmTaskTypes : setClientTaskTypes

  // Filter task types
  const filteredTaskTypes = useMemo(() => {
    return currentTaskTypes.filter((tt) => {
      const matchesSearch =
        tt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tt.code.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesArchived = showArchived || tt.isActive
      return matchesSearch && matchesArchived
    })
  }, [currentTaskTypes, searchQuery, showArchived])

  // Check if a task type name is forced to be Human Only
  const isForcedHumanOnly = (name: string) => {
    return FORCED_HUMAN_ONLY_TYPES.some(
      (forced) => forced.toLowerCase() === name.toLowerCase()
    )
  }

  // Get affected services and templates for a task type
  const getAffectedItems = (taskTypeName: string) => {
    const services = MOCK_SERVICES_USING_TYPES[taskTypeName] || []
    const templates = MOCK_TEMPLATES_USING_TYPES[taskTypeName] || []
    return { services, templates }
  }

  const handleStartCreate = () => {
    const newTaskType: TaskType = {
      id: `tt-new-${Date.now()}`,
      name: '',
      code: '',
      description: '',
      audience: activeAudienceTab,
      isHumanOnly: true,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }
    setEditingTaskType(newTaskType)
    setIsCreatingNew(true)
  }

  const handleStartEdit = (taskType: TaskType) => {
    // Check for affected items and show warning
    const { services, templates } = getAffectedItems(taskType.name)
    if (services.length > 0 || templates.length > 0) {
      setAffectedItemsWarning({ services, templates, taskTypeName: taskType.name })
    }
    setEditingTaskType({ ...taskType })
    setIsCreatingNew(false)
  }

  const handleCancelEdit = () => {
    setEditingTaskType(null)
    setIsCreatingNew(false)
    setAffectedItemsWarning(null)
  }

  const handleSave = () => {
    if (!editingTaskType) return

    // Validation
    if (!editingTaskType.name.trim()) {
      toast({ title: 'Validation Error', description: 'Task type name is required.', variant: 'destructive' })
      return
    }
    if (!editingTaskType.code.trim()) {
      toast({ title: 'Validation Error', description: 'Task type code is required.', variant: 'destructive' })
      return
    }

    // Update-003: Case-insensitive unique name validation within audience scope
    const duplicate = currentTaskTypes.find(
      (tt) => tt.id !== editingTaskType.id && tt.name.toLowerCase() === editingTaskType.name.toLowerCase()
    )
    if (duplicate) {
      toast({ title: 'Validation Error', description: 'Task type name must be unique within this audience.', variant: 'destructive' })
      return
    }

    // Update-003: Enforce Human Only for QC/QC2/PM Verification/Client Review
    const finalTaskType = {
      ...editingTaskType,
      isHumanOnly: isForcedHumanOnly(editingTaskType.name) ? true : editingTaskType.isHumanOnly,
      updatedAt: new Date().toISOString().split('T')[0],
    }

    if (isCreatingNew) {
      setCurrentTaskTypes([...currentTaskTypes, finalTaskType])
    } else {
      setCurrentTaskTypes(currentTaskTypes.map((tt) => (tt.id === finalTaskType.id ? finalTaskType : tt)))
    }

    setEditingTaskType(null)
    setIsCreatingNew(false)
    setAffectedItemsWarning(null)

    toast({
      title: 'Task type saved',
      description: 'Notification sent to Admin, PM, and IT.',
    })
  }

  const handleArchiveClick = (taskType: TaskType) => {
    // Check for affected items before archiving
    const { services, templates } = getAffectedItems(taskType.name)
    if (services.length > 0 || templates.length > 0) {
      setAffectedItemsWarning({ services, templates, taskTypeName: taskType.name })
    }
    setConfirmArchiveId(taskType.id)
  }

  const handleArchive = (id: string) => {
    setCurrentTaskTypes(currentTaskTypes.map((tt) => (tt.id === id ? { ...tt, isActive: false } : tt)))
    setConfirmArchiveId(null)
    setAffectedItemsWarning(null)
    toast({ title: 'Task type archived', description: 'Historical references on existing projects are preserved.' })
  }

  const handleReactivate = (id: string) => {
    setCurrentTaskTypes(currentTaskTypes.map((tt) => (tt.id === id ? { ...tt, isActive: true } : tt)))
    toast({ title: 'Task type reactivated' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Task Types</CardTitle>
            <CardDescription>
              Define building-block task types used across services and workflows
            </CardDescription>
          </div>
          <Button onClick={handleStartCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Task Type
          </Button>
        </CardHeader>
        <CardContent>
          {/* Update-003: Segmented control for Admin/PM vs Client task types */}
          <Tabs value={activeAudienceTab} onValueChange={(v) => setActiveAudienceTab(v as TaskTypeAudience)} className="mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="admin_pm" className="gap-2">
                <Building2 className="h-4 w-4" />
                Admin & PM Task Types
              </TabsTrigger>
              <TabsTrigger value="client" className="gap-2">
                <Users className="h-4 w-4" />
                Client Task Types
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search task types..."
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
              <Label htmlFor="show-archived" className="text-sm text-muted-foreground">
                Show archived
              </Label>
            </div>
          </div>

          {/* Task Types Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Human Only</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTaskTypes.map((taskType) => {
                const isForced = isForcedHumanOnly(taskType.name)
                return (
                  <TableRow key={taskType.id} className={!taskType.isActive ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{taskType.name}</span>
                        {isForced && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Enforced
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm font-medium bg-muted px-2 py-1 rounded">
                        {taskType.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {taskType.description || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {taskType.isHumanOnly ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Human only
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                          AI eligible
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={taskType.isActive ? 'active' : 'archived'} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStartEdit(taskType)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {taskType.isActive ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleArchiveClick(taskType)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleReactivate(taskType.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredTaskTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No task types found. Click &quot;New Task Type&quot; to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingTaskType} onOpenChange={() => handleCancelEdit()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isCreatingNew ? 'Add Task Type' : 'Edit Task Type'}</DialogTitle>
            <DialogDescription>
              {isCreatingNew
                ? `Define a new ${activeAudienceTab === 'admin_pm' ? 'Admin & PM' : 'Client'} task type.`
                : 'Update the task type details.'}
            </DialogDescription>
          </DialogHeader>
          
          {/* Update-003: Affected items warning */}
          {affectedItemsWarning && (affectedItemsWarning.services.length > 0 || affectedItemsWarning.templates.length > 0) && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">This task type is in use</p>
                  {affectedItemsWarning.services.length > 0 && (
                    <p className="text-amber-700">
                      Services: {affectedItemsWarning.services.join(', ')}
                    </p>
                  )}
                  {affectedItemsWarning.templates.length > 0 && (
                    <p className="text-amber-700">
                      Templates: {affectedItemsWarning.templates.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {editingTaskType && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editingTaskType.name}
                    onChange={(e) => {
                      const name = e.target.value
                      // Auto-enforce human only for certain types
                      const forceHumanOnly = isForcedHumanOnly(name)
                      setEditingTaskType({ 
                        ...editingTaskType, 
                        name,
                        isHumanOnly: forceHumanOnly ? true : editingTaskType.isHumanOnly 
                      })
                    }}
                    placeholder="e.g. Transcription"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    value={editingTaskType.code}
                    onChange={(e) =>
                      setEditingTaskType({ ...editingTaskType, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. TRN"
                    className="mt-1 font-mono"
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={editingTaskType.description || ''}
                  onChange={(e) =>
                    setEditingTaskType({ ...editingTaskType, description: e.target.value })
                  }
                  placeholder="Brief description of this task type..."
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label>Human Only</Label>
                {isForcedHumanOnly(editingTaskType.name) ? (
                  <div className="mt-1 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-800">
                        This task type must be Human Only (QC / QC2 / PM Verification / Client Review cannot be automated)
                      </span>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={editingTaskType.isHumanOnly ? 'yes' : 'no'}
                    onValueChange={(v) =>
                      setEditingTaskType({ ...editingTaskType, isHumanOnly: v === 'yes' })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes - Requires human</SelectItem>
                      <SelectItem value="no">No - Can be automated (AI eligible)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label>Audience</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <span className="text-sm">
                    {editingTaskType.audience === 'admin_pm' ? (
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Admin & PM Task Type
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Client Task Type
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!confirmArchiveId} onOpenChange={() => { setConfirmArchiveId(null); setAffectedItemsWarning(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Task Type?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This task type will no longer appear when creating new workflows.
              </p>
              
              {/* Update-003: Show affected services and templates */}
              {affectedItemsWarning && (affectedItemsWarning.services.length > 0 || affectedItemsWarning.templates.length > 0) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">This will affect:</p>
                      {affectedItemsWarning.services.length > 0 && (
                        <p className="text-amber-700">
                          Services: {affectedItemsWarning.services.join(', ')}
                        </p>
                      )}
                      {affectedItemsWarning.templates.length > 0 && (
                        <p className="text-amber-700">
                          Templates: {affectedItemsWarning.templates.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                Historical references on existing projects will be preserved.
              </p>
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

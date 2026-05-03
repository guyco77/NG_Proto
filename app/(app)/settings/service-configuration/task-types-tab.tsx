'use client'

import { useState } from 'react'
import {
  Plus,
  Trash2,
  Save,
  X,
  Search,
  CheckSquare,
  Edit2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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
import { StatusBadge } from '@/components/status-badge'
import { useToast } from '@/hooks/use-toast'
import { WORKFLOW_STEP_TYPES, SERVICE_CATEGORIES } from '@/lib/mock-data'

// Task Type definition
interface TaskType {
  id: string
  name: string
  code: string // short code like 'TRN', 'QC', 'SUB'
  category: string
  description?: string
  defaultDurationHours?: number
  isHumanOnly: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Mock task types data
const mockTaskTypes: TaskType[] = [
  {
    id: 'tt-1',
    name: 'Transcription',
    code: 'TRN',
    category: 'transcription',
    description: 'Convert audio/video to text',
    defaultDurationHours: 4,
    isHumanOnly: true,
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
  },
  {
    id: 'tt-2',
    name: 'Quality Control',
    code: 'QC',
    category: 'post_production',
    description: 'Review and verify deliverables',
    defaultDurationHours: 2,
    isHumanOnly: true,
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
  },
  {
    id: 'tt-3',
    name: 'Subtitling',
    code: 'SUB',
    category: 'subtitling',
    description: 'Create timed subtitles',
    defaultDurationHours: 6,
    isHumanOnly: false,
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
  },
  {
    id: 'tt-4',
    name: 'Translation',
    code: 'TRL',
    category: 'translation',
    description: 'Translate content between languages',
    defaultDurationHours: 8,
    isHumanOnly: true,
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
  },
  {
    id: 'tt-5',
    name: 'Audio Description',
    code: 'AD',
    category: 'accessibility',
    description: 'Create audio descriptions for visually impaired',
    defaultDurationHours: 4,
    isHumanOnly: true,
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
  },
  {
    id: 'tt-6',
    name: 'Dubbing',
    code: 'DUB',
    category: 'dubbing',
    description: 'Voice-over recording and lip sync',
    defaultDurationHours: 12,
    isHumanOnly: true,
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
  },
]

/**
 * Update-003: Task Types Sub-Tab
 * 
 * Manages task type definitions (building blocks for services).
 * Part of the Service Configuration umbrella page.
 */
export function TaskTypesTab() {
  const { toast } = useToast()

  const [taskTypes, setTaskTypes] = useState<TaskType[]>(mockTaskTypes)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [editingTaskType, setEditingTaskType] = useState<TaskType | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null)

  // Filter task types
  const filteredTaskTypes = taskTypes.filter((tt) => {
    const matchesSearch =
      tt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tt.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || tt.category === categoryFilter
    return matchesSearch && matchesCategory && tt.isActive
  })

  const handleStartCreate = () => {
    const newTaskType: TaskType = {
      id: `tt-new-${Date.now()}`,
      name: '',
      code: '',
      category: 'transcription',
      description: '',
      defaultDurationHours: 4,
      isHumanOnly: true,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }
    setEditingTaskType(newTaskType)
    setIsCreatingNew(true)
  }

  const handleStartEdit = (taskType: TaskType) => {
    setEditingTaskType({ ...taskType })
    setIsCreatingNew(false)
  }

  const handleCancelEdit = () => {
    setEditingTaskType(null)
    setIsCreatingNew(false)
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
    // Check for duplicate code
    const duplicate = taskTypes.find(
      (tt) => tt.id !== editingTaskType.id && tt.code.toLowerCase() === editingTaskType.code.toLowerCase()
    )
    if (duplicate) {
      toast({ title: 'Validation Error', description: 'Task type code must be unique.', variant: 'destructive' })
      return
    }

    const updatedTaskType = {
      ...editingTaskType,
      updatedAt: new Date().toISOString().split('T')[0],
    }

    if (isCreatingNew) {
      setTaskTypes([...taskTypes, updatedTaskType])
    } else {
      setTaskTypes(taskTypes.map((tt) => (tt.id === updatedTaskType.id ? updatedTaskType : tt)))
    }

    setEditingTaskType(null)
    setIsCreatingNew(false)

    // Send notification (shared rule)
    toast({
      title: 'Services catalog updated',
      description: 'Task type saved. Notification sent to Admin, PM, and IT.',
    })
  }

  const handleArchive = (id: string) => {
    setTaskTypes(taskTypes.map((tt) => (tt.id === id ? { ...tt, isActive: false } : tt)))
    setConfirmArchiveId(null)
    toast({ title: 'Task type archived', description: 'The task type has been archived.' })
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
            Add Task Type
          </Button>
        </CardHeader>
        <CardContent>
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {SERVICE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Types Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Default Duration</TableHead>
                <TableHead>Human Only</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTaskTypes.map((taskType) => (
                <TableRow key={taskType.id}>
                  <TableCell>
                    <span className="font-mono text-sm font-medium bg-muted px-2 py-1 rounded">
                      {taskType.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{taskType.name}</p>
                      {taskType.description && (
                        <p className="text-xs text-muted-foreground">{taskType.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-sm">
                      {SERVICE_CATEGORIES.find((c) => c.value === taskType.category)?.label || taskType.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    {taskType.defaultDurationHours ? `${taskType.defaultDurationHours}h` : '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={taskType.isHumanOnly ? 'active' : 'inactive'}>
                      {taskType.isHumanOnly ? 'Yes' : 'No'}
                    </StatusBadge>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmArchiveId(taskType.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTaskTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No task types found. Click &quot;Add Task Type&quot; to create one.
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
                ? 'Define a new task type for use in service workflows.'
                : 'Update the task type details.'}
            </DialogDescription>
          </DialogHeader>
          {editingTaskType && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editingTaskType.name}
                    onChange={(e) =>
                      setEditingTaskType({ ...editingTaskType, name: e.target.value })
                    }
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
                    maxLength={5}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={editingTaskType.category}
                  onValueChange={(v) => setEditingTaskType({ ...editingTaskType, category: v })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Default Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={0}
                    value={editingTaskType.defaultDurationHours || ''}
                    onChange={(e) =>
                      setEditingTaskType({
                        ...editingTaskType,
                        defaultDurationHours: parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="e.g. 4"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Human Only</Label>
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
                      <SelectItem value="no">No - Can be automated</SelectItem>
                    </SelectContent>
                  </Select>
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
      <AlertDialog open={!!confirmArchiveId} onOpenChange={() => setConfirmArchiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Task Type?</AlertDialogTitle>
            <AlertDialogDescription>
              This task type will no longer appear when creating new workflows. Existing tasks
              using this type will not be affected.
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

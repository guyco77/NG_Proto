'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  Plus,
  FileText,
  Check,
  AlertCircle,
  Clock,
  Video,
  Loader2,
  Search,
  Pencil,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { cn } from '@/lib/utils'
import { mockClients, mockUsers, formatCurrency, mockServices, SERVICE_CATEGORIES } from '@/lib/mock-data'
import type { Service, WorkflowStep } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../../layout'

const LANGUAGES = [
  'EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'JA', 'KO', 'ZH', 'AR', 'RU', 'HI', 'NL', 'PL', 'TR', 'SV'
]

const PRIORITY_MULTIPLIERS = {
  low: 1.0,
  medium: 1.0,
  high: 1.2,
  urgent: 1.5,
}

// PROJ-010: Task Types for Client self-service wizard (matches PROJ-004 + Add Task)
const TASK_TYPES = [
  { id: 'transcription', name: 'Transcription', description: 'Convert audio to text', requiresLanguagePair: true },
  { id: 'transcription_ai', name: 'Transcription AI', description: 'AI-powered transcription', requiresLanguagePair: true },
  { id: 'timing', name: 'Timing', description: 'Create time-coded captions', requiresLanguagePair: false },
  { id: 'timing_ai', name: 'Timing AI', description: 'AI-powered timing', requiresLanguagePair: false },
  { id: 'translation', name: 'Translation', description: 'Translate text between languages', requiresLanguagePair: true },
  { id: 'translation_from_audio', name: 'Translation from Audio', description: 'Direct audio translation', requiresLanguagePair: true },
  { id: 'upload_tt', name: 'Upload TT', description: 'Upload timed text file', requiresLanguagePair: false },
  { id: 'upload_text_file', name: 'Upload Text File', description: 'Upload text document', requiresLanguagePair: false },
  { id: 'qc', name: 'QC', description: 'Quality control review', requiresLanguagePair: true },
  { id: 'pm_verification', name: 'PM Verification', description: 'Project manager sign-off', requiresLanguagePair: false },
  { id: 'proofread', name: 'Proofread', description: 'Proofread and correct text', requiresLanguagePair: true },
  { id: 'client_review', name: 'Client Review', description: 'Client approval step', requiresLanguagePair: true },
  { id: 'upload_client_asset', name: 'Upload Client Asset', description: 'Upload client-provided asset', requiresLanguagePair: false },
  { id: 'upload_rough_cut', name: 'Upload Rough Cut', description: 'Upload rough cut video', requiresLanguagePair: false },
  { id: 'new_cut', name: 'New Cut', description: 'Create new video cut', requiresLanguagePair: false },
  { id: 'project_creation', name: 'Project Creation', description: 'Initial project setup', requiresLanguagePair: false },
] as const

interface TaskTypeLanguagePair {
  id: string
  source: string
  target: string
}

interface SelectedTaskType {
  id: string
  taskTypeId: string
  taskType: typeof TASK_TYPES[number]
  languagePairs: TaskTypeLanguagePair[]
  order: number
}

interface ServiceLanguagePair {
  id: string
  source: string
  target: string
}

interface SelectedService {
  id: string
  serviceId: string
  service: Service
  languagePairs: ServiceLanguagePair[]
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: 'source' | 'reference'
  duration?: number // Video/audio duration in minutes
  isProcessing?: boolean // Whether duration is being detected
}

export default function NewProjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentRole } = useRole()
  const [currentStep, setCurrentStep] = useState(1)
  
  // PROJ-010: Client self-service - auto-associate client, hide PM selector
  const isClientRole = currentRole === 'client'
  // In real app, would get client ID from user's session/profile
  const autoClientId = isClientRole ? 'c1' : '' // Demo: auto-assign first client for client role
  
  // Step 1: Overview
  const [projectName, setProjectName] = useState('')
  const [clientId, setClientId] = useState(autoClientId)
  const [clientSearchOpen, setClientSearchOpen] = useState(false)
  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [editingFileName, setEditingFileName] = useState('')
  const [pmId, setPmId] = useState('')
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null)
  const [durationOverride, setDurationOverride] = useState<number | null>(null)
  const [sourceFiles, setSourceFiles] = useState<UploadedFile[]>([])
  const [referenceFiles, setReferenceFiles] = useState<UploadedFile[]>([])
  const [importUrl, setImportUrl] = useState('')
  
  // Step 2: Services & Timeline (Admin/PM)
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [serviceSearchOpen, setServiceSearchOpen] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  
  // Step 2: Task Types (Client self-service - PROJ-010)
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<SelectedTaskType[]>([])
  const [taskTypeSearchOpen, setTaskTypeSearchOpen] = useState(false)
  
  // Step 3: Billing & Notes
  const [notes, setNotes] = useState('')
  const [estimatedVolume, setEstimatedVolume] = useState(60) // minutes
  
  const pms = mockUsers.filter(u => u.role === 'admin' || u.role === 'pm')
  
  // Available services (not yet selected)
  const availableServices = mockServices.filter(
    s => !s.isArchived && !selectedServices.some(ss => ss.serviceId === s.id)
  )

  // Check if service requires language pairs (has translation/transcription steps)
  const serviceRequiresLanguagePair = (service: Service) => {
    return service.workflow.some(step => 
      step.type === 'translation' || step.type === 'transcription'
    )
  }
  
  // Calculated cost per service
  const calculateServiceCost = (selectedService: SelectedService) => {
    const volume = durationOverride ?? detectedDuration ?? estimatedVolume
    const pairsCount = Math.max(1, selectedService.languagePairs.length)
    const baseRate = selectedService.service.defaultBaseRate
    return baseRate * volume * pairsCount * PRIORITY_MULTIPLIERS[priority]
  }

  // Total cost
  const calculateTotalCost = () => {
    return selectedServices.reduce((total, ss) => total + calculateServiceCost(ss), 0)
  }

  // Add a service from catalog
  const addService = (service: Service) => {
    const newSelected: SelectedService = {
      id: Math.random().toString(36).substr(2, 9),
      serviceId: service.id,
      service,
      languagePairs: serviceRequiresLanguagePair(service) 
        ? [{ id: Math.random().toString(36).substr(2, 9), source: 'EN', target: '' }]
        : [],
    }
    setSelectedServices([...selectedServices, newSelected])
    setServiceSearchOpen(false)
  }

  // Remove a selected service
  const removeSelectedService = (id: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== id))
  }

  // Add language pair to a service
  const addLanguagePairToService = (selectedServiceId: string) => {
    setSelectedServices(selectedServices.map(ss => 
      ss.id === selectedServiceId 
        ? {
            ...ss,
            languagePairs: [...ss.languagePairs, { id: Math.random().toString(36).substr(2, 9), source: 'EN', target: '' }]
          }
        : ss
    ))
  }

  // Update language pair
  const updateLanguagePair = (selectedServiceId: string, pairId: string, field: 'source' | 'target', value: string) => {
    setSelectedServices(selectedServices.map(ss => 
      ss.id === selectedServiceId 
        ? {
            ...ss,
            languagePairs: ss.languagePairs.map(lp => 
              lp.id === pairId ? { ...lp, [field]: value } : lp
            )
          }
        : ss
    ))
  }

  // Remove language pair
  const removeLanguagePair = (selectedServiceId: string, pairId: string) => {
    setSelectedServices(selectedServices.map(ss => 
      ss.id === selectedServiceId 
        ? {
            ...ss,
            languagePairs: ss.languagePairs.filter(lp => lp.id !== pairId)
          }
        : ss
    ))
  }

  // PROJ-010: Task Type functions for client self-service
  const availableTaskTypes = TASK_TYPES.filter(
    tt => !selectedTaskTypes.some(st => st.taskTypeId === tt.id)
  )

  const addTaskType = (taskType: typeof TASK_TYPES[number]) => {
    const newSelected: SelectedTaskType = {
      id: Math.random().toString(36).substr(2, 9),
      taskTypeId: taskType.id,
      taskType,
      languagePairs: taskType.requiresLanguagePair 
        ? [{ id: Math.random().toString(36).substr(2, 9), source: 'EN', target: '' }]
        : [],
      order: selectedTaskTypes.length + 1,
    }
    setSelectedTaskTypes([...selectedTaskTypes, newSelected])
    setTaskTypeSearchOpen(false)
  }

  const removeTaskType = (id: string) => {
    const filtered = selectedTaskTypes.filter(t => t.id !== id)
    // Re-order remaining tasks
    setSelectedTaskTypes(filtered.map((t, idx) => ({ ...t, order: idx + 1 })))
  }

  const addLanguagePairToTaskType = (taskTypeId: string) => {
    setSelectedTaskTypes(selectedTaskTypes.map(st => 
      st.id === taskTypeId 
        ? {
            ...st,
            languagePairs: [...st.languagePairs, { id: Math.random().toString(36).substr(2, 9), source: 'EN', target: '' }]
          }
        : st
    ))
  }

  const updateTaskTypeLanguagePair = (taskTypeId: string, pairId: string, field: 'source' | 'target', value: string) => {
    setSelectedTaskTypes(selectedTaskTypes.map(st => 
      st.id === taskTypeId 
        ? {
            ...st,
            languagePairs: st.languagePairs.map(lp => 
              lp.id === pairId ? { ...lp, [field]: value } : lp
            )
          }
        : st
    ))
  }

  const removeTaskTypeLanguagePair = (taskTypeId: string, pairId: string) => {
    setSelectedTaskTypes(selectedTaskTypes.map(st => 
      st.id === taskTypeId 
        ? {
            ...st,
            languagePairs: st.languagePairs.filter(lp => lp.id !== pairId)
          }
        : st
    ))
  }

  // Reorder task types (for drag-and-drop)
  const moveTaskType = (fromIndex: number, toIndex: number) => {
    const reordered = [...selectedTaskTypes]
    const [removed] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, removed)
    setSelectedTaskTypes(reordered.map((t, idx) => ({ ...t, order: idx + 1 })))
  }
  
  const handleFileUpload = (type: 'source' | 'reference') => {
    // Simulate file upload with video duration detection
    const isVideoFile = type === 'source' // Assume source files are video/audio
    const mockFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${type === 'source' ? 'video_master' : 'reference_doc'}_${Date.now()}.mov`,
      size: Math.floor(Math.random() * 2000000000) + 500000000,
      type,
      isProcessing: isVideoFile, // Show processing state for video files
    }
    
    if (type === 'source') {
      // PROJ-006: Client can only have one source video - replace instead of append
      if (isClientRole && sourceFiles.length > 0) {
        // Clear existing source files first
        setSourceFiles([mockFile])
        setDetectedDuration(null)
      } else {
        setSourceFiles([...sourceFiles, mockFile])
      }
      
      // Simulate video duration detection (1-2 second delay)
      if (isVideoFile) {
        setTimeout(() => {
          const detectedMinutes = Math.round((Math.random() * 90 + 10) * 10) / 10 // 10-100 minutes
          setSourceFiles(prev => prev.map(f => 
            f.id === mockFile.id 
              ? { ...f, duration: detectedMinutes, isProcessing: false }
              : f
          ))
          // Update total detected duration
          setDetectedDuration(prev => (prev || 0) + detectedMinutes)
          toast({ 
            title: 'Duration detected', 
            description: `${mockFile.name}: ${detectedMinutes} minutes` 
          })
        }, 1500)
      }
    } else {
      setReferenceFiles([...referenceFiles, mockFile])
    }
    toast({ title: 'File uploaded', description: mockFile.name })
  }
  
  const removeFile = (id: string, type: 'source' | 'reference') => {
    if (type === 'source') {
      const fileToRemove = sourceFiles.find(f => f.id === id)
      if (fileToRemove?.duration) {
        setDetectedDuration(prev => Math.max(0, (prev || 0) - fileToRemove.duration!))
      }
      setSourceFiles(sourceFiles.filter(f => f.id !== id))
    } else {
      setReferenceFiles(referenceFiles.filter(f => f.id !== id))
    }
  }
  
  // For client role, clientId is auto-set so just check name and files
  const canProceedStep1 = projectName.trim() && (isClientRole || clientId) && sourceFiles.length > 0
  
  // Step 2 validation: different for client vs admin/PM
  // Client: at least one task type selected, all language pairs complete, deadline set
  // Admin/PM: at least one service selected, all language pairs complete, deadline set
  const canProceedStep2 = isClientRole
    ? (selectedTaskTypes.length > 0 && 
       selectedTaskTypes.every(st => 
         st.languagePairs.length === 0 || st.languagePairs.every(lp => lp.source && lp.target)
       ) && deadline)
    : (selectedServices.length > 0 && 
       selectedServices.every(ss => 
         ss.languagePairs.length === 0 || ss.languagePairs.every(lp => lp.source && lp.target)
       ) && deadline)
  
  const handleSubmit = () => {
    if (isClientRole) {
      // PROJ-010: Client creates project in Approved status directly, no quote
      toast({
        title: 'Project created. Assign your team to get started.',
        description: `${projectName} is ready for team assignment.`,
      })
      // In real app, would POST to API then redirect
      setTimeout(() => {
        router.push('/projects/new/success?name=' + encodeURIComponent(projectName) + '&client=true')
      }, 500)
    } else {
      // Admin/PM creates project in Draft status
      toast({
        title: 'Project Created',
        description: `${projectName} has been created successfully.`,
      })
      // In real app, would POST to API then redirect
      setTimeout(() => {
        router.push('/projects/new/success?name=' + encodeURIComponent(projectName))
      }, 500)
    }
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(1)} GB`
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`
    return `${(bytes / 1000).toFixed(1)} KB`
  }

  // Inline file name editing
  const startEditingFileName = (file: UploadedFile) => {
    setEditingFileId(file.id)
    setEditingFileName(file.name)
  }

  const saveFileName = (fileId: string, type: 'source' | 'reference') => {
    if (editingFileName.trim()) {
      if (type === 'source') {
        setSourceFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, name: editingFileName.trim() } : f
        ))
      } else {
        setReferenceFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, name: editingFileName.trim() } : f
        ))
      }
    }
    setEditingFileId(null)
    setEditingFileName('')
  }

  const handleFileNameKeyDown = (e: React.KeyboardEvent, fileId: string, type: 'source' | 'reference') => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveFileName(fileId, type)
    } else if (e.key === 'Escape') {
      setEditingFileId(null)
      setEditingFileName('')
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Create New Project</h1>
        <p className="text-sm text-muted-foreground mt-1">Step {currentStep} of 3</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { step: 1, label: 'Overview' },
            { step: 2, label: isClientRole ? 'Tasks & Timeline' : 'Services & Timeline' },
            { step: 3, label: isClientRole ? 'Notes & Review' : 'Billing, Notes & Review' },
          ].map((item, index) => (
            <div key={item.step} className="flex items-center flex-1">
              <div className="flex items-center">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  currentStep >= item.step 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                )}>
                  {currentStep > item.step ? <Check className="h-4 w-4" /> : item.step}
                </div>
                <span className={cn(
                  'ml-2 text-sm font-medium',
                  currentStep >= item.step ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {item.label}
                </span>
              </div>
              {index < 2 && (
                <div className={cn(
                  'flex-1 mx-4 h-0.5',
                  currentStep > item.step ? 'bg-primary' : 'bg-muted'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Overview */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  placeholder="e.g., Netflix Series S2"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="max-w-md"
                />
              </div>
              {/* PROJ-010: Client role doesn't see client/PM selectors */}
              {!isClientRole && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="client">Client *</Label>
                    <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={clientSearchOpen}
                          className="w-full justify-between font-normal"
                        >
                          {clientId
                            ? mockClients.find((c) => c.id === clientId)?.displayName
                            : "Search clients..."}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search clients..." />
                          <CommandList>
                            <CommandEmpty>No client found.</CommandEmpty>
                            <CommandGroup>
                              {mockClients.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={client.displayName}
                                  onSelect={() => {
                                    setClientId(client.id)
                                    setClientSearchOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      clientId === client.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {client.displayName}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pm">Project Manager</Label>
                    <Select value={pmId} onValueChange={setPmId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign a PM" />
                      </SelectTrigger>
                      <SelectContent>
                        {pms.map((pm) => (
                          <SelectItem key={pm.id} value={pm.id}>
                            {pm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={priority === p ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPriority(p)}
                      className={cn(
                        'flex-1',
                        priority === p && p === 'low' && 'bg-gray-600 hover:bg-gray-700',
                        priority === p && p === 'medium' && 'bg-blue-600 hover:bg-blue-700',
                        priority === p && p === 'high' && 'bg-amber-600 hover:bg-amber-700',
                        priority === p && p === 'urgent' && 'bg-red-600 hover:bg-red-700',
                      )}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Button>
                  ))}
                </div>
                {(priority === 'high' || priority === 'urgent') && (
                  <p className="text-xs text-muted-foreground">
                    {priority === 'high' ? '+20%' : '+50%'} priority multiplier applied
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Source Files *</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              {/* PROJ-006: Client role - one source video per project, hide upload once file exists */}
              {(!isClientRole || sourceFiles.length === 0) && (
                <div
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => handleFileUpload('source')}
                >
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">
                    {isClientRole ? 'Upload your source video' : 'Drag and drop files here'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports: MP4, MOV, MKV{!isClientRole && ', SRT, VTT'}
                  </p>
                  {isClientRole && (
                    <p className="text-xs text-muted-foreground mt-1">One source video per project</p>
                  )}
                </div>
              )}
              
              {sourceFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {sourceFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Video className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          {editingFileId === file.id ? (
                            <Input
                              value={editingFileName}
                              onChange={(e) => setEditingFileName(e.target.value)}
                              onBlur={() => saveFileName(file.id, 'source')}
                              onKeyDown={(e) => handleFileNameKeyDown(e, file.id, 'source')}
                              autoFocus
                              className="h-7 text-sm"
                            />
                          ) : (
                            <button
                              onClick={() => startEditingFileName(file)}
                              className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors text-left group"
                            >
                              <span className="truncate">{file.name}</span>
                              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0" />
                            </button>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatFileSize(file.size)}</span>
                            {file.isProcessing && (
                              <span className="flex items-center gap-1 text-amber-600">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Detecting duration...
                              </span>
                            )}
                            {file.duration && (
                              <span className="flex items-center gap-1 text-green-600">
                                <Clock className="h-3 w-3" />
                                {file.duration} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => removeFile(file.id, 'source')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Detected Duration Summary */}
              {detectedDuration !== null && detectedDuration > 0 && (
                <div className="mt-4 rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Total Detected Duration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{detectedDuration.toFixed(1)} min</span>
                      {!isClientRole && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-auto p-0 text-xs"
                          onClick={() => {
                            const override = prompt('Override duration (minutes):', detectedDuration.toString())
                            if (override && !isNaN(parseFloat(override))) {
                              setDurationOverride(parseFloat(override))
                            }
                          }}
                        >
                          Override
                        </Button>
                      )}
                    </div>
                  </div>
                  {durationOverride !== null && (
                    <p className="text-xs text-amber-600 mt-1">
                      Manual override: {durationOverride} min (detected: {detectedDuration.toFixed(1)} min)
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <Input
                  placeholder="Or import from URL (e.g., S3, Google Drive)"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" disabled={!importUrl}>Import</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reference Files</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => handleFileUpload('reference')}
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Upload style guides, glossaries, etc.</p>
              </div>
              
              {referenceFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {referenceFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          {editingFileId === file.id ? (
                            <Input
                              value={editingFileName}
                              onChange={(e) => setEditingFileName(e.target.value)}
                              onBlur={() => saveFileName(file.id, 'reference')}
                              onKeyDown={(e) => handleFileNameKeyDown(e, file.id, 'reference')}
                              autoFocus
                              className="h-7 text-sm"
                            />
                          ) : (
                            <button
                              onClick={() => startEditingFileName(file)}
                              className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors text-left group"
                            >
                              <span className="truncate">{file.name}</span>
                              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0" />
                            </button>
                          )}
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => removeFile(file.id, 'reference')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => setCurrentStep(2)} disabled={!canProceedStep1}>
              Next: Services & Timeline
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Services & Timeline (Admin/PM) or Tasks & Timeline (Client) */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* PROJ-010: Client sees Task Type picker, Admin/PM sees Service Catalog */}
          {isClientRole ? (
            // CLIENT TASK TYPE PICKER
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Task Types</CardTitle>
                <p className="text-sm text-muted-foreground">Choose the tasks you need for this project. You can mix and match — there&apos;s no fixed workflow.</p>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                {/* Add Task Type Button */}
                <Popover open={taskTypeSearchOpen} onOpenChange={setTaskTypeSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2 mb-4">
                      <Plus className="h-4 w-4" />
                      Add Task Type
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search task types..." />
                      <CommandList>
                        <CommandEmpty>No task types found.</CommandEmpty>
                        <CommandGroup heading="Available Task Types">
                          {availableTaskTypes.map((taskType) => (
                            <CommandItem
                              key={taskType.id}
                              value={taskType.name}
                              onSelect={() => addTaskType(taskType)}
                              className="flex flex-col items-start"
                            >
                              <span>{taskType.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {taskType.description}
                                {taskType.requiresLanguagePair && ' • Requires language pair'}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected Task Types */}
                {selectedTaskTypes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8">
                    <p className="text-muted-foreground mb-1">No tasks selected yet</p>
                    <p className="text-xs text-muted-foreground">Click &quot;Add Task Type&quot; to begin building your workflow</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedTaskTypes.map((st, index) => (
                      <div key={st.id} className="rounded-lg border border-border">
                        {/* Task Type Header */}
                        <div className="flex items-center justify-between p-3 bg-muted/30">
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                              {st.order}
                            </span>
                            <div>
                              <h4 className="font-medium">{st.taskType.name}</h4>
                              <p className="text-xs text-muted-foreground">{st.taskType.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Reorder buttons */}
                            {index > 0 && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7"
                                onClick={() => moveTaskType(index, index - 1)}
                              >
                                <ArrowLeft className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {index < selectedTaskTypes.length - 1 && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7"
                                onClick={() => moveTaskType(index, index + 1)}
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" onClick={() => removeTaskType(st.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Language Pairs (if task type requires them) */}
                        {st.taskType.requiresLanguagePair && (
                          <div className="p-3 space-y-2 border-t border-border">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">Language Pairs</Label>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => addLanguagePairToTaskType(st.id)}
                                className="h-7 text-xs gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add Language Pair
                              </Button>
                            </div>
                            {st.languagePairs.map((lp) => (
                              <div key={lp.id} className="flex items-center gap-2">
                                <Select value={lp.source} onValueChange={(v) => updateTaskTypeLanguagePair(st.id, lp.id, 'source', v)}>
                                  <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Source" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {LANGUAGES.map((lang) => (
                                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                <Select value={lp.target} onValueChange={(v) => updateTaskTypeLanguagePair(st.id, lp.id, 'target', v)}>
                                  <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Target" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {LANGUAGES.filter(l => l !== lp.source).map((lang) => (
                                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8"
                                  onClick={() => removeTaskTypeLanguagePair(st.id, lp.id)}
                                  disabled={st.languagePairs.length <= 1}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            // ADMIN/PM SERVICE CATALOG SELECTOR
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Services</CardTitle>
                <p className="text-sm text-muted-foreground">Choose services from the catalog. Each service includes a default workflow.</p>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                {/* Add Service Button */}
                <Popover open={serviceSearchOpen} onOpenChange={setServiceSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2 mb-4">
                      <Plus className="h-4 w-4" />
                      Add Service from Catalog
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search services..." />
                      <CommandList>
                        <CommandEmpty>No services found.</CommandEmpty>
                        {SERVICE_CATEGORIES.map(category => {
                          const categoryServices = availableServices.filter(s => s.category === category.value)
                          if (categoryServices.length === 0) return null
                          return (
                            <CommandGroup key={category.value} heading={category.label}>
                              {categoryServices.map((service) => (
                                <CommandItem
                                  key={service.id}
                                  value={service.name}
                                  onSelect={() => addService(service)}
                                  className="flex items-center justify-between"
                                >
                                  <div>
                                    <span>{service.name}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      {service.workflow.length} steps
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {formatCurrency(service.defaultBaseRate)}/{service.pricingModel === 'per_minute' ? 'min' : 'unit'}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )
                        })}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected Services */}
                {selectedServices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8">
                    <p className="text-muted-foreground mb-1">No services selected yet</p>
                    <p className="text-xs text-muted-foreground">Click &quot;Add Service from Catalog&quot; to begin</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedServices.map((ss) => (
                      <div key={ss.id} className="rounded-lg border border-border">
                        {/* Service Header */}
                        <div className="flex items-center justify-between p-3 bg-muted/30">
                          <div>
                            <h4 className="font-medium">{ss.service.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {ss.service.workflow.length} workflow steps - {formatCurrency(ss.service.defaultBaseRate)}/{ss.service.pricingModel === 'per_minute' ? 'min' : 'unit'}
                            </p>
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => removeSelectedService(ss.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Workflow Preview */}
                        <div className="px-3 py-2 border-b border-border bg-muted/10">
                          <p className="text-xs text-muted-foreground mb-1">Workflow:</p>
                          <div className="flex flex-wrap gap-1">
                            {ss.service.workflow.map((step, idx) => (
                              <span key={step.id} className="text-xs px-2 py-0.5 bg-background rounded border border-border">
                                {idx + 1}. {step.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Language Pairs (if service requires them) */}
                        {serviceRequiresLanguagePair(ss.service) && (
                          <div className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">Language Pairs</Label>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => addLanguagePairToService(ss.id)}
                                className="h-7 text-xs gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add Language Pair
                              </Button>
                            </div>
                            {ss.languagePairs.map((lp) => (
                              <div key={lp.id} className="flex items-center gap-2">
                                <Select value={lp.source} onValueChange={(v) => updateLanguagePair(ss.id, lp.id, 'source', v)}>
                                  <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Source" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {LANGUAGES.map((lang) => (
                                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                <Select value={lp.target} onValueChange={(v) => updateLanguagePair(ss.id, lp.id, 'target', v)}>
                                  <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Target" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {LANGUAGES.filter(l => l !== lp.source).map((lang) => (
                                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8"
                                  onClick={() => removeLanguagePair(ss.id, lp.id)}
                                  disabled={ss.languagePairs.length <= 1}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline - Deadline on left (required), Start date on right (optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date (optional)</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={deadline || undefined}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => setCurrentStep(3)} disabled={!canProceedStep2}>
              Next: {isClientRole ? 'Notes & Review' : 'Review'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Notes & Review (Client) or Billing, Notes & Review (Admin/PM) */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* PROJ-010: Client sees Project Summary (no cost), Admin/PM sees full billing */}
          {isClientRole ? (
            // CLIENT PROJECT SUMMARY (no pricing)
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Summary</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <div className="space-y-4">
                  {/* Task Summary */}
                  <div className="space-y-3">
                    {selectedTaskTypes.map((st) => {
                      const taskCount = Math.max(1, st.languagePairs.length)
                      return (
                        <div key={st.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                              {st.order}
                            </span>
                            <div>
                              <h4 className="font-medium">{st.taskType.name}</h4>
                              {st.languagePairs.length > 0 ? (
                                <p className="text-xs text-muted-foreground">
                                  {st.languagePairs.map(lp => `${lp.source} → ${lp.target}`).join(', ')} — {taskCount} task{taskCount > 1 ? 's' : ''}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">1 task</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Timeline */}
                  <div className="rounded-lg bg-muted/30 p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deadline</span>
                      <span className="font-medium">{deadline}</span>
                    </div>
                    {startDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Start Date</span>
                        <span className="font-medium">{startDate}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Footer notice */}
                  <p className="text-xs text-muted-foreground">
                    NG will confirm pricing and timing for your project. You&apos;ll see updates in My Projects.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            // ADMIN/PM BILLING SUMMARY
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Summary & Estimated Cost</CardTitle>
                <p className="text-sm text-muted-foreground">This is an estimate. Final pricing is set when creating the quote.</p>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <div className="space-y-4">
                  {/* Billable Volume */}
                  <div className="space-y-2">
                    <Label htmlFor="volume">Billable Volume (minutes)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="volume"
                        type="number"
                        value={durationOverride ?? detectedDuration ?? estimatedVolume}
                        onChange={(e) => setDurationOverride(Number(e.target.value))}
                        min={1}
                        readOnly={detectedDuration !== null && durationOverride === null}
                        className={cn("max-w-[200px]", detectedDuration !== null && durationOverride === null && 'bg-muted')}
                      />
                      {detectedDuration !== null && durationOverride === null && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setDurationOverride(detectedDuration)}
                        >
                          Override
                        </Button>
                      )}
                      {durationOverride !== null && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setDurationOverride(null)}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                    {detectedDuration !== null && (
                      <p className="text-xs text-muted-foreground">
                        Auto-detected from uploaded video files
                        {durationOverride !== null && ` (original: ${detectedDuration.toFixed(1)} min)`}
                      </p>
                    )}
                  </div>
                  
                  {/* Service Breakdown */}
                  <div className="space-y-4">
                    {selectedServices.map((ss) => {
                      const volume = durationOverride ?? detectedDuration ?? estimatedVolume
                      const serviceCost = calculateServiceCost(ss)
                      const hasRateMissing = ss.service.defaultBaseRate === 0
                      
                      return (
                        <div key={ss.id} className="rounded-lg border border-border overflow-hidden">
                          {/* Service Header */}
                          <div className="flex items-center justify-between p-3 bg-muted/30">
                            <div>
                              <h4 className="font-medium">{ss.service.name}</h4>
                              {ss.languagePairs.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {ss.languagePairs.map(lp => `${lp.source} → ${lp.target}`).join(', ')}
                                </p>
                              )}
                            </div>
                            <span className="font-semibold">
                              {hasRateMissing ? (
                                <span className="text-amber-600 text-sm">Rate unavailable</span>
                              ) : (
                                formatCurrency(serviceCost)
                              )}
                            </span>
                          </div>
                          
                          {/* Task Breakdown */}
                          <div className="p-3 space-y-1.5">
                            {ss.service.workflow.map((step) => {
                              const taskRate = ss.service.defaultBaseRate / ss.service.workflow.length
                              const pairsCount = Math.max(1, ss.languagePairs.length)
                              const taskCost = taskRate * volume * pairsCount * PRIORITY_MULTIPLIERS[priority]
                              
                              return (
                                <div key={step.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">
                                      {step.order}
                                    </span>
                                    <span className="text-muted-foreground">{step.name}</span>
                                    {ss.languagePairs.length > 0 && (step.type === 'translation' || step.type === 'transcription') && (
                                      <span className="text-xs text-muted-foreground">
                                        ({ss.languagePairs.length} pair{ss.languagePairs.length > 1 ? 's' : ''})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-muted-foreground text-xs">
                                    {hasRateMissing ? '—' : (
                                      <>
                                        {volume} min × {formatCurrency(taskRate)}/min = {formatCurrency(taskCost)}
                                      </>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          
                          {/* Service Subtotal */}
                          <div className="flex items-center justify-between p-3 border-t border-border bg-muted/10">
                            <span className="text-sm font-medium">Service Subtotal</span>
                            <span className="font-medium">
                              {hasRateMissing ? '—' : formatCurrency(serviceCost)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Grand Total */}
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Grand Total</span>
                      <span className="text-xl font-semibold">{formatCurrency(calculateTotalCost())}</span>
                    </div>
                    {priority !== 'medium' && priority !== 'low' && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <AlertCircle className="h-3 w-3" />
                        <span>Includes {priority === 'high' ? '20%' : '50%'} priority multiplier</span>
                      </div>
                    )}
                  </div>

                  {/* Missing Rates Warning */}
                  {selectedServices.some(ss => ss.service.defaultBaseRate === 0) && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p className="text-sm">
                        Some tasks are missing rates — configure in <span className="font-medium">Settings → Services</span>.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isClientRole ? 'Notes for the NG team (optional)' : 'Project Notes'}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <Textarea
                placeholder={isClientRole ? 'Add any notes or instructions for the NG team...' : 'Add any notes for the team (internal only)...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review Summary</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project Name</span>
                  <span className="font-medium">{projectName}</span>
                </div>
                {/* Client and PM only shown for Admin/PM */}
                {!isClientRole && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client</span>
                      <span className="font-medium">{mockClients.find(c => c.id === clientId)?.displayName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Project Manager</span>
                      <span className="font-medium">{pms.find(p => p.id === pmId)?.name || 'Not assigned'}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timeline</span>
                  <span className="font-medium">{startDate || 'TBD'} → {deadline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    priority === 'low' && 'bg-gray-100 text-gray-700',
                    priority === 'medium' && 'bg-blue-100 text-blue-700',
                    priority === 'high' && 'bg-amber-100 text-amber-700',
                    priority === 'urgent' && 'bg-red-100 text-red-700',
                  )}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source Files</span>
                  <span className="font-medium">{sourceFiles.length} file(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isClientRole ? 'Tasks' : 'Services'}</span>
                  <span className="font-medium">
                    {isClientRole ? selectedTaskTypes.length : selectedServices.length} {isClientRole ? 'task type(s)' : 'service(s)'}
                  </span>
                </div>
                {/* Estimated Cost only for Admin/PM */}
                {!isClientRole && (
                  <div className="flex justify-between border-t border-border pt-3">
                    <span className="text-muted-foreground">Estimated Cost</span>
                    <span className="font-semibold text-lg">{formatCurrency(calculateTotalCost())}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleSubmit}>
              Create Project
              <Check className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

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
import { cn } from '@/lib/utils'
import { mockClients, mockUsers, formatCurrency } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../../layout'

const SERVICES = [
  { id: 'subtitling', name: 'Subtitling', rate: 3000 },
  { id: 'dubbing', name: 'Dubbing', rate: 15000 },
  { id: 'transcription', name: 'Transcription', rate: 500 },
  { id: 'translation', name: 'Translation', rate: 2000 },
  { id: 'qc', name: 'QC', rate: 1000 },
  { id: 'mixing', name: 'Mixing', rate: 5000 },
  { id: 'closed_captions', name: 'Closed Captions', rate: 2500 },
]

const LANGUAGES = [
  'EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'JA', 'KO', 'ZH', 'AR', 'RU', 'HI', 'NL', 'PL', 'TR', 'SV'
]

const PRIORITY_MULTIPLIERS = {
  low: 1.0,
  medium: 1.0,
  high: 1.2,
  urgent: 1.5,
}

interface LanguagePair {
  id: string
  source: string
  target: string
  service: string
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
  const [displayName, setDisplayName] = useState('')
  const [clientId, setClientId] = useState(autoClientId)
  const [pmId, setPmId] = useState('')
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null)
  const [durationOverride, setDurationOverride] = useState<number | null>(null)
  const [sourceFiles, setSourceFiles] = useState<UploadedFile[]>([])
  const [referenceFiles, setReferenceFiles] = useState<UploadedFile[]>([])
  const [importUrl, setImportUrl] = useState('')
  
  // Step 2: Services & Timeline
  const [languagePairs, setLanguagePairs] = useState<LanguagePair[]>([])
  const [startDate, setStartDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  
  // Step 3: Billing & Notes
  const [notes, setNotes] = useState('')
  const [estimatedVolume, setEstimatedVolume] = useState(60) // minutes
  
  const pms = mockUsers.filter(u => u.role === 'admin' || u.role === 'pm')
  
  // Calculated cost
  const calculateCost = () => {
    let total = 0
    languagePairs.forEach(pair => {
      const service = SERVICES.find(s => s.id === pair.service)
      if (service) {
        total += service.rate * PRIORITY_MULTIPLIERS[priority]
      }
    })
    return total
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
      setSourceFiles([...sourceFiles, mockFile])
      
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
  
  const addLanguagePair = () => {
    setLanguagePairs([
      ...languagePairs,
      { id: Math.random().toString(36).substr(2, 9), source: 'EN', target: '', service: '' }
    ])
  }
  
  const updateLanguagePair = (id: string, field: keyof LanguagePair, value: string) => {
    setLanguagePairs(languagePairs.map(lp => 
      lp.id === id ? { ...lp, [field]: value } : lp
    ))
  }
  
  const removeLanguagePair = (id: string) => {
    setLanguagePairs(languagePairs.filter(lp => lp.id !== id))
  }
  
  // For client role, clientId is auto-set so just check name and files
  const canProceedStep1 = projectName.trim() && (isClientRole || clientId) && sourceFiles.length > 0
  const canProceedStep2 = languagePairs.length > 0 && languagePairs.every(lp => lp.target && lp.service) && deadline
  
  const handleSubmit = () => {
    toast({
      title: 'Project Created',
      description: `${projectName} has been created successfully.`,
    })
    // In real app, would POST to API then redirect
    setTimeout(() => {
      router.push('/projects/new/success?name=' + encodeURIComponent(projectName))
    }, 500)
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(1)} GB`
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`
    return `${(bytes / 1000).toFixed(1)} KB`
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
            { step: 2, label: 'Services & Timeline' },
            { step: 3, label: 'Billing, Notes & Review' },
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    placeholder="e.g., Netflix Series S2"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name Override</Label>
                  <Input
                    id="displayName"
                    placeholder="Optional client-facing name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>
              {/* PROJ-010: Client role doesn't see client/PM selectors */}
              {!isClientRole && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="client">Client *</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger>
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
              <div
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => handleFileUpload('source')}
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Drag and drop files here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                <p className="text-xs text-muted-foreground mt-2">Supports: MP4, MOV, MKV, SRT, VTT</p>
              </div>
              
              {sourceFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {sourceFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <Video className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
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
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
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

      {/* Step 2: Services & Timeline */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Language Pairs & Services</CardTitle>
              <Button size="sm" variant="outline" onClick={addLanguagePair} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Language Pair
              </Button>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              {languagePairs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8">
                  <p className="text-muted-foreground mb-3">No language pairs added yet</p>
                  <Button variant="outline" onClick={addLanguagePair} className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    Add Language Pair
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {languagePairs.map((pair) => (
                    <div key={pair.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <Select value={pair.source} onValueChange={(v) => updateLanguagePair(pair.id, 'source', v)}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Select value={pair.target} onValueChange={(v) => updateLanguagePair(pair.id, 'target', v)}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Target" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.filter(l => l !== pair.source).map((lang) => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={pair.service} onValueChange={(v) => updateLanguagePair(pair.id, 'service', v)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICES.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} ({formatCurrency(service.rate)}/language)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" onClick={() => removeLanguagePair(pair.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
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
              Next: Review
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Billing, Notes & Review */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cost Estimate</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="volume">Billable Volume (minutes)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="volume"
                      type="number"
                      value={durationOverride ?? detectedDuration ?? estimatedVolume}
                      onChange={(e) => setDurationOverride(Number(e.target.value))}
                      min={1}
                      readOnly={!isClientRole && detectedDuration !== null && durationOverride === null}
                      className={detectedDuration !== null && durationOverride === null ? 'bg-muted' : ''}
                    />
                    {detectedDuration !== null && durationOverride === null && !isClientRole && (
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
                
                <div className="rounded-lg bg-muted p-4">
                  <div className="space-y-2">
                    {languagePairs.map((pair) => {
                      const service = SERVICES.find(s => s.id === pair.service)
                      const cost = service ? service.rate * PRIORITY_MULTIPLIERS[priority] : 0
                      return (
                        <div key={pair.id} className="flex justify-between text-sm">
                          <span>{pair.source} → {pair.target} ({service?.name || 'Unknown'})</span>
                          <span>{formatCurrency(cost)}</span>
                        </div>
                      )
                    })}
                    <div className="border-t border-border pt-2 mt-2 flex justify-between font-medium">
                      <span>Total Estimate</span>
                      <span className="text-lg">{formatCurrency(calculateCost())}</span>
                    </div>
                    {priority !== 'medium' && priority !== 'low' && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        <span>Includes {priority === 'high' ? '20%' : '50%'} priority multiplier</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Notes</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <Textarea
                placeholder="Add any notes for the team (internal only)..."
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{mockClients.find(c => c.id === clientId)?.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project Manager</span>
                  <span className="font-medium">{pms.find(p => p.id === pmId)?.name || 'Not assigned'}</span>
                </div>
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
                  <span className="text-muted-foreground">Language Pairs</span>
                  <span className="font-medium">{languagePairs.length} pair(s)</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="text-muted-foreground">Estimated Cost</span>
                  <span className="font-semibold text-lg">{formatCurrency(calculateCost())}</span>
                </div>
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

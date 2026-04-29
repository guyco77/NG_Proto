'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Check, AlertTriangle, Languages, Mic, CheckCircle2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockVendors, VENDOR_AVAILABILITY_OPTIONS } from '@/lib/mock-data'
import type { Vendor, VendorAvailability } from '@/lib/types'

// Service type icons for display
const serviceTypeIcons: Record<string, React.ReactNode> = {
  'Transcription': <Mic className="h-3 w-3" />,
  'Translation': <Languages className="h-3 w-3" />,
  'QA': <CheckCircle2 className="h-3 w-3" />,
  'Review': <Eye className="h-3 w-3" />,
}

interface AssignVendorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: {
    project: string
    taskType: string
    language: string
    dueDate: string
  } | null
  onAssign: (vendorId: string) => void
}

export function AssignVendorDialog({ open, onOpenChange, task, onAssign }: AssignVendorDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)

  // Filter and sort vendors per VENDOR-002/003 requirements
  const filteredVendors = useMemo(() => {
    // Only show active vendors (not archived)
    let vendors = mockVendors.filter(v => v.status === 'active' && v.profileCompleted)
    
    // Filter by search query
    if (searchQuery) {
      vendors = vendors.filter(v => 
        v.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Filter by task requirements (language pair / service type)
    if (task) {
      vendors = vendors.filter(v => {
        const matchesService = v.serviceTypes.some(s => 
          s.toLowerCase().includes(task.taskType.toLowerCase()) ||
          task.taskType.toLowerCase().includes(s.toLowerCase())
        )
        const matchesLanguage = v.languagePairs.some(lp => 
          task.language.toUpperCase().includes(lp.source) ||
          task.language.toUpperCase().includes(lp.target) ||
          `${lp.source}-${lp.target}`.includes(task.language.toUpperCase())
        )
        return matchesService || matchesLanguage
      })
    }
    
    // Sort by availability: Available first, then Limited, then Unavailable
    const availabilityOrder: Record<VendorAvailability, number> = {
      'available': 0,
      'limited': 1,
      'unavailable': 2,
    }
    
    vendors.sort((a, b) => {
      const orderA = availabilityOrder[a.availability] ?? 2
      const orderB = availabilityOrder[b.availability] ?? 2
      if (orderA !== orderB) return orderA - orderB
      // Secondary sort by on-time rate
      return b.onTimeRate - a.onTimeRate
    })
    
    return vendors
  }, [searchQuery, task])

  const handleAssign = async () => {
    if (!selectedVendor) return
    
    // Check if vendor is unavailable (should not be selectable)
    const vendor = mockVendors.find(v => v.id === selectedVendor)
    if (vendor?.availability === 'unavailable') return
    
    setIsAssigning(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    onAssign(selectedVendor)
    setIsAssigning(false)
    setSelectedVendor(null)
    setSearchQuery('')
    onOpenChange(false)
  }

  const handleVendorSelect = (vendor: Vendor) => {
    // Unavailable vendors cannot be selected
    if (vendor.availability === 'unavailable') return
    setSelectedVendor(vendor.id)
  }

  const handleClose = () => {
    setSelectedVendor(null)
    setSearchQuery('')
    onOpenChange(false)
  }

  const getAvailabilityDot = (availability: VendorAvailability) => {
    const opt = VENDOR_AVAILABILITY_OPTIONS.find(o => o.value === availability)
    return opt?.dot || 'bg-gray-400'
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Assign Vendor</DialogTitle>
          <DialogDescription>
            {task && (
              <span>
                Select a vendor for <strong>{task.taskType}</strong> ({task.language}) on <strong>{task.project}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Vendor List - sorted by availability */}
          <div className="max-h-[350px] space-y-2 overflow-y-auto">
            {filteredVendors.map((vendor) => {
              const isUnavailable = vendor.availability === 'unavailable'
              const isLimited = vendor.availability === 'limited'
              const isSelected = selectedVendor === vendor.id
              
              return (
                <button
                  key={vendor.id}
                  onClick={() => handleVendorSelect(vendor)}
                  disabled={isUnavailable}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                    isUnavailable 
                      ? 'cursor-not-allowed border-border bg-muted/30 opacity-60'
                      : isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={cn(
                      'text-sm',
                      isUnavailable ? 'bg-gray-300 text-gray-600' : 'bg-primary/10 text-primary'
                    )}>
                      {vendor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'font-medium truncate',
                          isUnavailable ? 'text-muted-foreground' : 'text-foreground'
                        )}>
                          {vendor.name}
                        </p>
                        {/* Availability dot */}
                        <span className={cn('h-2 w-2 rounded-full flex-shrink-0', getAvailabilityDot(vendor.availability))} />
                      </div>
                      {/* Performance stats - last 90 days per PRD */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                        <span>{vendor.tasksDelivered} tasks</span>
                        <span>|</span>
                        <span className={cn(
                          vendor.onTimeRate >= 95 ? 'text-green-600' :
                          vendor.onTimeRate >= 85 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {vendor.onTimeRate}% on-time
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{vendor.languagePairs.map(lp => `${lp.source}→${lp.target}`).join(', ')}</span>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        {vendor.serviceTypes.slice(0, 2).map(type => (
                          <span key={type} className="flex items-center gap-0.5">
                            {serviceTypeIcons[type]}
                            <span>{type}</span>
                          </span>
                        ))}
                        {vendor.serviceTypes.length > 2 && (
                          <span>+{vendor.serviceTypes.length - 2}</span>
                        )}
                      </div>
                    </div>
                    {/* Limited availability warning */}
                    {isLimited && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span>This vendor has limited availability.</span>
                      </div>
                    )}
                    {/* Unavailable message */}
                    {isUnavailable && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <span>Not accepting work</span>
                      </div>
                    )}
                  </div>
                  {isSelected && !isUnavailable && (
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </button>
              )
            })}
            {filteredVendors.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No vendors found matching your criteria.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedVendor || isAssigning}
          >
            {isAssigning ? 'Assigning...' : 'Assign Vendor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { Search, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { mockVendors } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface AssignVendorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskName?: string
  taskCount?: number // For bulk assign
  serviceType?: string
  sourceLanguage?: string
  targetLanguage?: string
  onAssign: (vendorId: string, vendorName: string) => void
}

// Mock vendor stats - in real app would come from API
const vendorStats: Record<string, { tasksDelivered: number; onTimeRate: number; currentWorkload: number }> = {
  v1: { tasksDelivered: 156, onTimeRate: 95, currentWorkload: 2 },
  v2: { tasksDelivered: 203, onTimeRate: 88, currentWorkload: 5 },
  v3: { tasksDelivered: 89, onTimeRate: 92, currentWorkload: 1 },
  v4: { tasksDelivered: 412, onTimeRate: 99, currentWorkload: 4 },
  v5: { tasksDelivered: 78, onTimeRate: 91, currentWorkload: 0 },
}

function getAvailabilityIcon(status: string) {
  switch (status) {
    case 'available':
      return { icon: '🟢', label: 'Available', color: 'text-emerald-600' }
    case 'busy':
      return { icon: '🟡', label: 'Limited', color: 'text-amber-600' }
    case 'inactive':
      return { icon: '🔴', label: 'Unavailable', color: 'text-red-600' }
    default:
      return { icon: '⚪', label: 'Unknown', color: 'text-muted-foreground' }
  }
}

export function AssignVendorModal({
  open,
  onOpenChange,
  taskName,
  taskCount,
  serviceType,
  sourceLanguage,
  targetLanguage,
  onAssign,
}: AssignVendorModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)

  // Filter vendors by service type and language pair
  const eligibleVendors = useMemo(() => {
    let vendors = [...mockVendors]

    // Filter by service type if provided
    if (serviceType) {
      vendors = vendors.filter(v => 
        v.specializations.some(s => 
          s.toLowerCase().includes(serviceType.toLowerCase()) ||
          serviceType.toLowerCase().includes(s.toLowerCase())
        )
      )
    }

    // Filter by language pair if provided
    if (sourceLanguage && targetLanguage) {
      vendors = vendors.filter(v => 
        v.languages.includes(sourceLanguage) && v.languages.includes(targetLanguage)
      )
    }

    // Search filter
    if (searchQuery) {
      vendors = vendors.filter(v => 
        v.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort: available first, then by on-time rate descending
    vendors.sort((a, b) => {
      // Availability priority
      const availOrder = { available: 0, busy: 1, inactive: 2 }
      const aOrder = availOrder[a.status] ?? 2
      const bOrder = availOrder[b.status] ?? 2
      if (aOrder !== bOrder) return aOrder - bOrder

      // Then by on-time rate
      const aStats = vendorStats[a.id] || { onTimeRate: 0 }
      const bStats = vendorStats[b.id] || { onTimeRate: 0 }
      return bStats.onTimeRate - aStats.onTimeRate
    })

    return vendors
  }, [mockVendors, serviceType, sourceLanguage, targetLanguage, searchQuery])

  const handleAssign = async () => {
    if (!selectedVendorId) return

    const vendor = mockVendors.find(v => v.id === selectedVendorId)
    if (!vendor) return

    setIsAssigning(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onAssign(selectedVendorId, vendor.name)
    setIsAssigning(false)
    setSelectedVendorId(null)
    setSearchQuery('')
    onOpenChange(false)
  }

  const isBulkAssign = taskCount && taskCount > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Assign Vendor</DialogTitle>
          <DialogDescription>
            {isBulkAssign 
              ? `Select a vendor to assign to ${taskCount} tasks`
              : taskName 
                ? `Select a vendor for "${taskName}"`
                : 'Select a vendor for this task'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Vendor List */}
        <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg p-2">
          {eligibleVendors.length > 0 ? (
            eligibleVendors.map((vendor) => {
              const availability = getAvailabilityIcon(vendor.status)
              const stats = vendorStats[vendor.id] || { tasksDelivered: 0, onTimeRate: 0, currentWorkload: 0 }
              const isUnavailable = vendor.status === 'inactive'
              const isSelected = selectedVendorId === vendor.id

              return (
                <button
                  key={vendor.id}
                  onClick={() => !isUnavailable && setSelectedVendorId(vendor.id)}
                  disabled={isUnavailable}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-colors",
                    isSelected && "border-primary bg-primary/5",
                    !isSelected && !isUnavailable && "border-border hover:border-primary/50 hover:bg-muted/50",
                    isUnavailable && "opacity-50 cursor-not-allowed bg-muted/30"
                  )}
                  title={isUnavailable ? "Currently unavailable" : undefined}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{vendor.name}</span>
                        <span className={cn("text-sm", availability.color)}>
                          {availability.icon} {availability.label}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {stats.tasksDelivered > 0 
                            ? `${stats.tasksDelivered} tasks delivered, ${stats.onTimeRate}% on-time`
                            : 'New — no history yet'
                          }
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {stats.currentWorkload} active task{stats.currentWorkload !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="shrink-0">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                          <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No vendors available for this service type
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add vendors in Vendor Management.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAssigning}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedVendorId || isAssigning}
          >
            {isAssigning ? 'Assigning...' : isBulkAssign ? `Assign to ${taskCount} Tasks` : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

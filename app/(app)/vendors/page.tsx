'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  MoreHorizontal,
  Languages,
  FileText,
  CheckCircle2,
  Mic,
  Eye,
  Archive,
  RotateCcw,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { mockVendors, mockTasks, VENDOR_SERVICE_TYPES, VENDOR_AVAILABILITY_OPTIONS, LANGUAGE_PAIRS } from '@/lib/mock-data'
import { useRole } from '../layout'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// Service type icons
const serviceTypeIcons: Record<string, React.ReactNode> = {
  'Transcription': <Mic className="h-4 w-4" />,
  'Translation': <Languages className="h-4 w-4" />,
  'QA': <CheckCircle2 className="h-4 w-4" />,
  'Review': <Eye className="h-4 w-4" />,
}

export default function VendorsPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all')
  const [languagePairFilter, setLanguagePairFilter] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all')
  
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<typeof mockVendors[0] | null>(null)

  const isAdmin = currentRole === 'admin'
  const isPM = currentRole === 'pm'
  const isFinance = currentRole === 'finance'
  const canEdit = isAdmin || isPM
  const canArchive = isAdmin

  // Get active tasks count for each vendor
  const getActiveTasksCount = (vendorId: string) => {
    return mockTasks.filter(t => t.vendorId === vendorId && t.status !== 'complete').length
  }

  // Filter vendors
  const filteredVendors = useMemo(() => {
    let vendors = [...mockVendors]
    
    // Filter by archived status
    if (!includeArchived) {
      vendors = vendors.filter(v => v.status !== 'archived')
    }
    
    // Search by name
    if (searchQuery) {
      vendors = vendors.filter(v => 
        v.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Filter by service type
    if (serviceTypeFilter !== 'all') {
      vendors = vendors.filter(v => v.serviceTypes.includes(serviceTypeFilter))
    }
    
    // Filter by language pair
    if (languagePairFilter !== 'all') {
      const [source, target] = languagePairFilter.split('-')
      vendors = vendors.filter(v => 
        v.languagePairs.some(lp => lp.source === source && lp.target === target)
      )
    }
    
    // Filter by availability
    if (availabilityFilter !== 'all') {
      vendors = vendors.filter(v => v.availability === availabilityFilter)
    }
    
    return vendors
  }, [searchQuery, includeArchived, serviceTypeFilter, languagePairFilter, availabilityFilter])

  const handleArchiveClick = (vendor: typeof mockVendors[0]) => {
    const activeCount = getActiveTasksCount(vendor.id)
    if (activeCount > 0) {
      toast({
        title: 'Cannot archive vendor',
        description: 'Complete or reassign all tasks before archiving.',
        variant: 'destructive',
      })
      return
    }
    setSelectedVendor(vendor)
    setArchiveDialogOpen(true)
  }

  const handleReactivateClick = (vendor: typeof mockVendors[0]) => {
    setSelectedVendor(vendor)
    setReactivateDialogOpen(true)
  }

  const confirmArchive = () => {
    if (selectedVendor) {
      toast({
        title: 'Vendor archived',
        description: `${selectedVendor.name} has been archived. Their user account has been deactivated.`,
      })
    }
    setArchiveDialogOpen(false)
    setSelectedVendor(null)
  }

  const confirmReactivate = () => {
    if (selectedVendor) {
      toast({
        title: 'Vendor reactivated',
        description: `${selectedVendor.name} has been reactivated. A re-invite email has been sent.`,
      })
    }
    setReactivateDialogOpen(false)
    setSelectedVendor(null)
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Link href="/vendors/new" prefetch={true}>
              <Button className="gap-1.5">
                <Plus className="h-4 w-4" />
                New Vendor
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by vendor name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {VENDOR_SERVICE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={languagePairFilter} onValueChange={setLanguagePairFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Language Pair" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {LANGUAGE_PAIRS.map(lp => (
                  <SelectItem key={`${lp.source}-${lp.target}`} value={`${lp.source}-${lp.target}`}>
                    {lp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {VENDOR_AVAILABILITY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full', opt.dot)} />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="includeArchived"
                checked={includeArchived}
                onCheckedChange={(checked) => setIncludeArchived(checked === true)}
              />
              <label htmlFor="includeArchived" className="text-sm text-muted-foreground cursor-pointer">
                Include archived
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardContent className="px-4 py-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Vendor Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Services
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Availability
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Active Tasks
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    On-Time %
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVendors.map((vendor) => {
                  const activeTasksCount = getActiveTasksCount(vendor.id)
                  const availabilityOption = VENDOR_AVAILABILITY_OPTIONS.find(o => o.value === vendor.availability)
                  const isArchived = vendor.status === 'archived'
                  
                  return (
                    <tr 
                      key={vendor.id} 
                      className={cn(
                        'hover:bg-muted/30 transition-colors cursor-pointer',
                        isArchived && 'opacity-60'
                      )}
                      onClick={() => window.location.href = `/vendors/${vendor.id}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {vendor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{vendor.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {vendor.languagePairs.map(lp => `${lp.source}→${lp.target}`).join(', ')}
                            </p>
                          </div>
                          {isArchived && (
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              Archived
                            </span>
                          )}
                          {!vendor.profileCompleted && (
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                              Pending Setup
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {vendor.serviceTypes.map(type => (
                            <div 
                              key={type} 
                              className="flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-xs text-primary"
                              title={type}
                            >
                              {serviceTypeIcons[type] || <FileText className="h-3.5 w-3.5" />}
                              <span>{type}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={cn('h-2.5 w-2.5 rounded-full', availabilityOption?.dot || 'bg-gray-400')} />
                          <span className="text-sm">{availabilityOption?.label || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          'text-sm font-medium',
                          activeTasksCount > 0 ? 'text-blue-600' : 'text-muted-foreground'
                        )}>
                          {activeTasksCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {vendor.tasksDelivered > 0 ? (
                          <span className={cn(
                            'text-sm font-medium',
                            vendor.onTimeRate >= 95 ? 'text-green-600' :
                            vendor.onTimeRate >= 85 ? 'text-amber-600' : 'text-red-600'
                          )}>
                            {vendor.onTimeRate}%
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/vendors/${vendor.id}`}>
                              <DropdownMenuItem>
                                <ChevronRight className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                            </Link>
                            {canEdit && !isArchived && (
                              <Link href={`/vendors/${vendor.id}?edit=true`}>
                                <DropdownMenuItem>
                                  Edit Vendor
                                </DropdownMenuItem>
                              </Link>
                            )}
                            {canArchive && (
                              <>
                                <DropdownMenuSeparator />
                                {isArchived ? (
                                  <DropdownMenuItem onClick={() => handleReactivateClick(vendor)}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reactivate Vendor
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleArchiveClick(vendor)}
                                    className="text-destructive"
                                    disabled={activeTasksCount > 0}
                                  >
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archive Vendor
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {filteredVendors.length === 0 && (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">No vendors yet. Add your first vendor to get started.</p>
                {canEdit && (
                  <Link href="/vendors/new" prefetch={true}>
<Button className="mt-4 gap-1.5">
                <Plus className="h-4 w-4" />
                New Vendor
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Vendor</DialogTitle>
            <DialogDescription>
              Archive {selectedVendor?.name}? They will be removed from assignment suggestions. 
              Historical data is preserved. Their user account will be deactivated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmArchive}>
              Archive Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Confirmation Dialog */}
      <Dialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Vendor</DialogTitle>
            <DialogDescription>
              Reactivate {selectedVendor?.name}? Their user account will also be reactivated 
              and they will receive a re-invite email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmReactivate}>
              Reactivate Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, use, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  Clock,
  Calendar,
  Edit,
  Save,
  X,
  Archive,
  RotateCcw,
  Languages,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { mockVendors, mockTasks, mockVendorPayments, VENDOR_AVAILABILITY_OPTIONS, LANGUAGE_PAIRS, formatCurrency, formatDate } from '@/lib/mock-data'
import { useRole } from '../../layout'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// Period filter options for performance stats
const PERIOD_OPTIONS = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last year' },
  { value: 'all', label: 'All time' },
]

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  const vendor = mockVendors.find(v => v.id === id) || mockVendors[0]
  
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true')
  const [activeTab, setActiveTab] = useState('profile')
  const [periodFilter, setPeriodFilter] = useState('90')
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false)
  
  // VENDOR-002: Blackout date picker state
  const [showBlackoutDialog, setShowBlackoutDialog] = useState(false)
  const [blackoutStartDate, setBlackoutStartDate] = useState('')
  const [blackoutEndDate, setBlackoutEndDate] = useState('')
  const [blackoutNotes, setBlackoutNotes] = useState('')
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: vendor.name,
    email: vendor.email,
    phone: vendor.phone || '',
    whatsapp: vendor.whatsapp || '',
    timezone: vendor.timezone,
    location: vendor.location || '',
    legalTaxDetails: vendor.legalTaxDetails || '',
    paymentMethod: vendor.paymentMethod || 'payoneer',
    paymentDetails: vendor.paymentDetails || '',
    availability: vendor.availability,
    internalNotes: vendor.internalNotes || '',
  })

  const isAdmin = currentRole === 'admin'
  const isPM = currentRole === 'pm'
  const isFinance = currentRole === 'finance'
  const canEdit = isAdmin || isPM
  const canArchive = isAdmin
  const isArchived = vendor.status === 'archived'
  
  // Get vendor tasks
  const vendorTasks = useMemo(() => {
    return mockTasks.filter(t => t.vendorId === vendor.id)
  }, [vendor.id])
  
  const activeTasks = vendorTasks.filter(t => t.status !== 'complete')
  const completedTasks = vendorTasks.filter(t => t.status === 'complete')
  
  // Get vendor payments
  const vendorPayments = useMemo(() => {
    return mockVendorPayments.filter(p => p.vendorId === vendor.id)
  }, [vendor.id])

  const handleSave = () => {
    toast({
      title: 'Vendor updated',
      description: 'Profile changes have been saved.',
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditForm({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone || '',
      whatsapp: vendor.whatsapp || '',
      timezone: vendor.timezone,
      location: vendor.location || '',
      legalTaxDetails: vendor.legalTaxDetails || '',
      paymentMethod: vendor.paymentMethod || 'payoneer',
      paymentDetails: vendor.paymentDetails || '',
      availability: vendor.availability,
      internalNotes: vendor.internalNotes || '',
    })
    setIsEditing(false)
  }

  const handleArchive = () => {
    if (activeTasks.length > 0) {
      toast({
        title: 'Cannot archive vendor',
        description: 'Complete or reassign all tasks before archiving.',
        variant: 'destructive',
      })
      return
    }
    setArchiveDialogOpen(true)
  }

  const confirmArchive = () => {
    toast({
      title: 'Vendor archived',
      description: `${vendor.name} has been archived. Their user account has been deactivated.`,
    })
    setArchiveDialogOpen(false)
  }

  const confirmReactivate = () => {
    toast({
      title: 'Vendor reactivated',
      description: `${vendor.name} has been reactivated. A re-invite email has been sent.`,
    })
    setReactivateDialogOpen(false)
  }

  // VENDOR-002: Add blackout period
  const handleAddBlackout = () => {
    if (!blackoutStartDate || !blackoutEndDate) {
      toast({
        title: 'Invalid dates',
        description: 'Please select both start and end dates.',
        variant: 'destructive',
      })
      return
    }
    
    if (new Date(blackoutEndDate) < new Date(blackoutStartDate)) {
      toast({
        title: 'Invalid date range',
        description: 'End date must be after start date.',
        variant: 'destructive',
      })
      return
    }
    
    toast({
      title: 'Blackout period added',
      description: `${vendor.name} will be unavailable from ${blackoutStartDate} to ${blackoutEndDate}.`,
    })
    setShowBlackoutDialog(false)
    setBlackoutStartDate('')
    setBlackoutEndDate('')
    setBlackoutNotes('')
  }

  const availabilityOption = VENDOR_AVAILABILITY_OPTIONS.find(o => o.value === vendor.availability)

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-medium text-primary">
            {vendor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{vendor.name}</h1>
              {isArchived && (
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Archived</span>
              )}
              {!vendor.profileCompleted && (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Pending Setup</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', availabilityOption?.dot || 'bg-gray-400')} />
                {availabilityOption?.label}
              </div>
              <span>|</span>
              <span>{vendor.serviceTypes.join(', ')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              {canEdit && !isArchived && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
              {canArchive && (
                isArchived ? (
                  <Button onClick={() => setReactivateDialogOpen(true)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reactivate Vendor
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={handleArchive}
                    disabled={activeTasks.length > 0}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Incomplete Profile Banner */}
      {!vendor.profileCompleted && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Profile Incomplete</p>
                <p className="text-sm text-amber-700">
                  This vendor needs to complete their profile setup before they can be assigned to tasks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="tasks">Task History</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Contact & Identity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact & Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>WhatsApp</Label>
                        <Input
                          value={editForm.whatsapp}
                          onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Input
                        value={editForm.timezone}
                        onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location / Address</Label>
                      <Input
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Legal / Tax Details</Label>
                      <Textarea
                        value={editForm.legalTaxDetails}
                        onChange={(e) => setEditForm({ ...editForm, legalTaxDetails: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{vendor.email}</span>
                    </div>
                    {vendor.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{vendor.timezone}</span>
                    </div>
                    {vendor.location && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{vendor.location}</span>
                      </div>
                    )}
                    {vendor.legalTaxDetails && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">Legal / Tax Details</p>
                        <p className="text-sm">{vendor.legalTaxDetails}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select
                        value={editForm.paymentMethod}
                        onValueChange={(v) => setEditForm({ ...editForm, paymentMethod: v as 'payoneer' | 'bank_transfer' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="payoneer">Payoneer</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Account Details</Label>
                      <Textarea
                        value={editForm.paymentDetails}
                        onChange={(e) => setEditForm({ ...editForm, paymentDetails: e.target.value })}
                        placeholder="Enter account details..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">{vendor.paymentMethod?.replace('_', ' ') || 'Not set'}</span>
                    </div>
                    {vendor.paymentDetails && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">Account Details</p>
                        <p className="text-sm font-mono">{vendor.paymentDetails}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills / Services */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skills & Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Service Types</p>
                  <div className="flex flex-wrap gap-2">
                    {vendor.serviceTypes.map(type => (
                      <span key={type} className="rounded bg-primary/10 px-2 py-1 text-sm text-primary">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Language Pairs</p>
                  <div className="flex flex-wrap gap-2">
                    {vendor.languagePairs.map((lp, i) => (
                      <span key={i} className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-700">
                        {lp.source} → {lp.target}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editForm.availability}
                      onValueChange={(v) => setEditForm({ ...editForm, availability: v as 'available' | 'limited' | 'unavailable' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className={cn('h-3 w-3 rounded-full', availabilityOption?.dot)} />
                    <span className="font-medium">{availabilityOption?.label}</span>
                  </div>
                )}
                
                {/* Blackout Periods */}
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">Blackout Periods</p>
                    {canEdit && (
                      <Button variant="outline" size="sm" onClick={() => setShowBlackoutDialog(true)}>
                        Add Blackout
                      </Button>
                    )}
                  </div>
                  {vendor.blackoutPeriods && vendor.blackoutPeriods.length > 0 ? (
                    <div className="space-y-2">
                      {vendor.blackoutPeriods.map((period, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded px-2 py-1.5">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(period.startDate)} - {formatDate(period.endDate)}</span>
                          {period.notes && <span className="text-muted-foreground">({period.notes})</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No blackout periods scheduled.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rate Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rate Card (Vendor Pay Rates)</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              {vendor.rateCard.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Service Type</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Language Pair</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Rate</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Unit</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Minimum</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Rush</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {vendor.rateCard.map(line => (
                        <tr key={line.id}>
                          <td className="px-4 py-2">{line.serviceType}</td>
                          <td className="px-4 py-2">{line.languagePair.source} → {line.languagePair.target}</td>
                          <td className="px-4 py-2 text-right font-medium">
                            {line.currency} {line.rate}
                          </td>
                          <td className="px-4 py-2 capitalize">{line.unit.replace('_', ' ')}</td>
                          <td className="px-4 py-2 text-right">
                            {line.minimum ? `${line.currency} ${line.minimum}` : '—'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {line.rushMultiplier ? `${line.rushMultiplier}x` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No rates configured yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes - Admin/PM only */}
          {(isAdmin || isPM) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                {isEditing ? (
                  <Textarea
                    value={editForm.internalNotes}
                    onChange={(e) => setEditForm({ ...editForm, internalNotes: e.target.value })}
                    placeholder="Internal notes visible only to Admin/PM..."
                    rows={3}
                  />
                ) : (
                  <p className="text-sm">{vendor.internalNotes || 'No internal notes.'}</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Period Filter */}
          <div className="flex justify-end">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">On-Time Rate</p>
                    <p className="text-3xl font-bold text-foreground">{vendor.onTimeRate}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(vendor.tasksDelivered * vendor.onTimeRate / 100)}/{vendor.tasksDelivered} tasks
                    </p>
                  </div>
                  <div className="relative h-16 w-16">
                    <svg className="h-16 w-16 -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        className="text-muted/30"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${vendor.onTimeRate * 1.76} 176`}
                        className={cn(
                          vendor.onTimeRate >= 95 ? 'text-green-500' :
                          vendor.onTimeRate >= 85 ? 'text-amber-500' : 'text-red-500'
                        )}
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tasks Delivered</p>
                    <p className="text-3xl font-bold text-foreground">{vendor.tasksDelivered}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Turnaround</p>
                    <p className="text-3xl font-bold text-foreground">{vendor.avgTurnaroundDays}</p>
                    <p className="text-xs text-muted-foreground">days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks by Service Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tasks by Service Type</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="space-y-3">
                {vendor.serviceTypes.map(type => {
                  const count = vendorTasks.filter(t => t.serviceType === type || t.service.includes(type)).length
                  const percentage = vendor.tasksDelivered > 0 ? (count / vendor.tasksDelivered) * 100 : 0
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{type}</span>
                        <span className="font-medium">{count} tasks</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task History Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Task History</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              {vendorTasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Task</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Project</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {vendorTasks.map(task => (
                        <tr key={task.id} className="hover:bg-muted/30">
                          <td className="px-4 py-2">
                            <Link href={`/tasks/${task.id}`} className="text-primary hover:underline">
                              {task.name}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{task.projectName}</td>
                          <td className="px-4 py-2">
                            <span className={cn(
                              'rounded px-2 py-0.5 text-xs font-medium capitalize',
                              task.status === 'complete' ? 'bg-green-100 text-green-700' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            )}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{formatDate(task.dueDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tasks assigned yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment History</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              {vendorPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Task / Period</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Type</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Amount</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {vendorPayments.map(payment => (
                        <tr key={payment.id} className="hover:bg-muted/30">
                          <td className="px-4 py-2">
                            {payment.taskName || payment.period || '—'}
                          </td>
                          <td className="px-4 py-2 capitalize">{payment.rateType.replace('_', ' ')}</td>
                          <td className="px-4 py-2 text-right font-medium">
                            {payment.currency} {payment.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-2">
                            <span className={cn(
                              'rounded px-2 py-0.5 text-xs font-medium',
                              payment.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            )}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No payment records yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Archive Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Vendor</DialogTitle>
            <DialogDescription>
              Archive {vendor.name}? They will be removed from assignment suggestions. 
              Historical data is preserved. Their user account will be deactivated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmArchive}>Archive Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Dialog */}
      <Dialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Vendor</DialogTitle>
            <DialogDescription>
              Reactivate {vendor.name}? Their user account will also be reactivated 
              and they will receive a re-invite email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivateDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmReactivate}>Reactivate Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* VENDOR-002: Blackout Date Range Picker Dialog */}
      <Dialog open={showBlackoutDialog} onOpenChange={setShowBlackoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Blackout Period</DialogTitle>
            <DialogDescription>
              Set a date range when {vendor.name} will be unavailable for assignments. 
              Availability will auto-reset to Available when the blackout ends.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blackoutStart">Start Date</Label>
                <Input
                  id="blackoutStart"
                  type="date"
                  value={blackoutStartDate}
                  onChange={(e) => setBlackoutStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blackoutEnd">End Date</Label>
                <Input
                  id="blackoutEnd"
                  type="date"
                  value={blackoutEndDate}
                  onChange={(e) => setBlackoutEndDate(e.target.value)}
                  min={blackoutStartDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="blackoutNotes">Reason (optional)</Label>
              <Input
                id="blackoutNotes"
                value={blackoutNotes}
                onChange={(e) => setBlackoutNotes(e.target.value)}
                placeholder="e.g. Vacation, Medical leave"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlackoutDialog(false)}>Cancel</Button>
            <Button onClick={handleAddBlackout}>Add Blackout Period</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

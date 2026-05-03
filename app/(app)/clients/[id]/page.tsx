'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  Users,

  FileText,
  Receipt,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  UserPlus,
  Upload,
  MoreHorizontal,
  Archive,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/status-badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { mockClients, mockClientUsers, mockProjects, mockQuotes, mockInvoices, PAYMENT_TERMS, CLIENT_ROLES, SERVICES_LIST, formatCurrency, formatDate } from '@/lib/mock-data'
import { TIMEZONES, TIMEZONE_GROUPS, COUNTRY_CODES, getTimezoneLabel } from '@/lib/locale-data'
import { useRole } from '../../layout'
import { useToast } from '@/hooks/use-toast'
import type { ClientContact, ClientRateCard, ClientUser } from '@/lib/types'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, Clapperboard } from 'lucide-react'
import { Label } from '@/components/ui/label'

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  const client = mockClients.find((c) => c.id === id) || mockClients[0]
  const clientUsers = mockClientUsers.filter((u) => u.clientId === id)
  const clientProjects = mockProjects.filter((p) => p.clientId === id)
  const clientQuotes = mockQuotes.filter((q) => q.clientId === id)
  const clientInvoices = mockInvoices.filter((i) => i.clientId === id)
  
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true')
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile')
  
  // Update-002: Timezone selector popover
  const [timezoneOpen, setTimezoneOpen] = useState(false)
  
  // Update-005: Local state for invited members (optimistic UI)
  const [invitedMembers, setInvitedMembers] = useState<Array<{ id: string; name: string; email: string; status: 'pending' }>>([])
  
  // Update-006: Archive dialog state
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [reactivateUsersDialogOpen, setReactivateUsersDialogOpen] = useState(false)
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    legalName: client.legalName,
    displayName: client.displayName,
    companyId: client.companyId || '',
    timezone: client.timezone,
    contacts: client.contacts.map(c => ({
      ...c,
      phoneCountryCode: c.phoneCountryCode || '+972',
      phoneNumber: c.phoneNumber || '',
      preferredChannel: c.preferredChannel || 'email',
      receiveNotifications: c.receiveNotifications ?? true,
    })),
    billingAddress: client.billingAddress || '',
    paymentTerms: client.paymentTerms,
    defaultCurrency: client.defaultCurrency,
    taxDetails: client.taxDetails || '',
    // Update-001: Client Discount fields
    discountPercent: client.discountPercent ?? 0,
    discountNotes: client.discountNotes || '',
    preferredChannel: client.preferredChannel,
    internalNotes: client.internalNotes || '',
    rateCard: [...client.rateCard],
  })
  
  // Add member dialog
  const [addMemberDialog, setAddMemberDialog] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', email: '', phone: '', clientRole: 'viewer' as const })
  const [isInviting, setIsInviting] = useState(false)
  
  // Edit role dialog
  const [editRoleDialog, setEditRoleDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null)
  const [newRole, setNewRole] = useState<string>('')
  
  // Import CSV dialog
  const [importCSVDialog, setImportCSVDialog] = useState(false)
  
  // Deactivate confirmation dialog
  const [deactivateDialog, setDeactivateDialog] = useState(false)
  const [userToDeactivate, setUserToDeactivate] = useState<ClientUser | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)
  
  const isAdmin = currentRole === 'admin'
  const isPM = currentRole === 'pm'
  const isFinance = currentRole === 'finance'
  const canEdit = isAdmin || isPM
  const canSeeInternalNotes = isAdmin || isPM
  const canSeeRateCard = isAdmin || isFinance
  const canManageTeam = isAdmin || isPM

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsSaving(false)
    setIsEditing(false)
    toast({
      title: 'Client Saved',
      description: 'Client profile has been updated.',
    })
  }
  
  // Update-006: Archive client handler
  const handleArchiveClient = () => {
    // Check for active projects
    if (clientProjects.some(p => !['closed', 'cancelled'].includes(p.status))) {
      toast({
        title: 'Cannot Archive',
        description: 'Close all active projects before archiving this client.',
        variant: 'destructive',
      })
      setArchiveDialogOpen(false)
      return
    }
    
    toast({
      title: 'Client Archived',
      description: `${client.displayName} has been archived. All team members have been deactivated.`,
    })
    setArchiveDialogOpen(false)
    
    // Check if there are users to reactivate later
    const deactivatedUsers = clientUsers.filter(u => u.status === 'inactive' || u.status === 'active')
    if (deactivatedUsers.length > 0) {
      // In real app, would mark users as inactive
    }
  }
  
  const handleReactivateClient = () => {
    toast({
      title: 'Client Reactivated',
      description: `${client.displayName} has been reactivated.`,
    })
    setArchiveDialogOpen(false)
    
    // Check for deactivated users
    const deactivatedUsers = clientUsers.filter(u => u.status === 'inactive')
    if (deactivatedUsers.length > 0) {
      setReactivateUsersDialogOpen(true)
    }
  }
  
  const handleBulkReactivateUsers = () => {
    const count = clientUsers.filter(u => u.status === 'inactive').length
    toast({
      title: 'Users Reactivated',
      description: `${count} team member(s) have been reactivated.`,
    })
    setReactivateUsersDialogOpen(false)
  }

  const handleAddContact = () => {
    setEditForm({
      ...editForm,
      contacts: [
        ...editForm.contacts,
        { 
          id: `cc-new-${Date.now()}`, 
          name: '', 
          email: '', 
          isPrimary: false,
          phoneCountryCode: '+972',
          phoneNumber: '',
          preferredChannel: 'email' as const,
          receiveNotifications: true,
        },
      ],
    })
  }

  const handleRemoveContact = (contactId: string) => {
    setEditForm({
      ...editForm,
      contacts: editForm.contacts.filter((c) => c.id !== contactId),
    })
  }

  const handleAddRateCard = () => {
    setEditForm({
      ...editForm,
      rateCard: [
        ...editForm.rateCard,
        { serviceType: '', rate: 0, currency: client.defaultCurrency },
      ],
    })
  }

  const handleRemoveRateCard = (index: number) => {
    setEditForm({
      ...editForm,
      rateCard: editForm.rateCard.filter((_, i) => i !== index),
    })
  }

const handleInviteMember = async () => {
    if (!newMember.name || !newMember.email) return
    
    setIsInviting(true)
    
    // Update-005: Add to invitedMembers immediately (optimistic UI)
    const newInvitedMember = {
      id: `invited-${Date.now()}`,
      name: newMember.name,
      email: newMember.email,
      status: 'pending' as const,
    }
    setInvitedMembers(prev => [newInvitedMember, ...prev])
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsInviting(false)
    setAddMemberDialog(false)
    setNewMember({ name: '', email: '', phone: '', clientRole: 'viewer' })
    toast({
      title: 'Invite Sent',
      description: `Invite sent to ${newMember.email}`,
    })
  }

  const handleEditRole = (user: ClientUser) => {
    setSelectedUser(user)
    setNewRole(user.clientRole)
    setEditRoleDialog(true)
  }

  const handleSaveRole = async () => {
    if (!selectedUser) return
    await new Promise(resolve => setTimeout(resolve, 500))
    setEditRoleDialog(false)
    setSelectedUser(null)
    toast({
      title: 'Role Updated',
      description: `${selectedUser.name}'s role has been updated.`,
    })
  }

  const handleStatusChange = async (user: ClientUser, action: 'deactivate' | 'reactivate' | 'resend') => {
    if (action === 'deactivate') {
      setUserToDeactivate(user)
      setDeactivateDialog(true)
      return
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
    const messages = {
      reactivate: { title: 'User Reactivated', description: `${user.name} has been reactivated. They can now access the client portal again.` },
      resend: { title: 'Invite Resent', description: `Invitation resent to ${user.email}.` },
    }
    toast(messages[action])
  }

  const handleConfirmDeactivate = async () => {
    if (!userToDeactivate) return
    
    setIsDeactivating(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // In a real app, this would:
    // 1. Set user status to 'inactive'
    // 2. Revoke all active sessions
    // 3. Remove from any pending task assignments
    // 4. Log the action in audit trail
    
    setIsDeactivating(false)
    setDeactivateDialog(false)
    toast({
      title: 'User Deactivated',
      description: `${userToDeactivate.name} has been deactivated. They can no longer access the client portal. Their historical data and task assignments remain intact.`,
    })
    setUserToDeactivate(null)
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    setImportCSVDialog(false)
    toast({
      title: 'Import Complete',
      description: `Successfully imported team members from ${file.name}`,
    })
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">{client.displayName}</h1>
                <StatusBadge status={client.status} />
              </div>
              {client.legalName !== client.displayName && (
                <p className="text-sm text-muted-foreground">{client.legalName}</p>
              )}
            </div>
          </div>
          
          {/* Update-006: Header actions with Archive Client */}
          {canEdit && !isEditing && (
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-1.5">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {client.status === 'active' ? (
                    <DropdownMenuItem
                      onClick={() => setArchiveDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Client
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleReactivateClient()}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reactivate Client
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          
          {isEditing && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Client
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="h-4 w-4" />
            Team ({clientUsers.length})
          </TabsTrigger>
{/* Update-004: Renamed Projects to Shows */}
                <TabsTrigger value="projects" className="gap-1.5">
                  <Clapperboard className="h-4 w-4" />
                  Shows ({clientProjects.length})
          </TabsTrigger>
          <TabsTrigger value="quotes" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Quotes ({clientQuotes.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5">
            <Receipt className="h-4 w-4" />
            Invoices ({clientInvoices.length})
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Company Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Legal Name *</label>
                      <Input
                        value={editForm.legalName}
                        onChange={(e) => setEditForm({ ...editForm, legalName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Display Name</label>
                      <Input
                        value={editForm.displayName}
                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Company ID / VAT</label>
                      <Input
                        value={editForm.companyId}
                        onChange={(e) => setEditForm({ ...editForm, companyId: e.target.value })}
                      />
                    </div>
                    {/* Update-002: Timezone searchable dropdown */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Timezone</label>
                      <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={timezoneOpen}
                            className="w-full justify-between font-normal"
                          >
                            {editForm.timezone 
                              ? getTimezoneLabel(editForm.timezone) 
                              : "Select timezone..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search timezone..." />
                            <CommandList>
                              <CommandEmpty>No timezone found.</CommandEmpty>
                              {Object.entries(TIMEZONE_GROUPS).map(([region, timezones]) => (
                                <CommandGroup key={region} heading={region}>
                                  {timezones.map((tz) => (
                                    <CommandItem
                                      key={tz.value}
                                      value={`${tz.value} ${tz.label}`}
                                      onSelect={() => {
                                        setEditForm({ ...editForm, timezone: tz.value })
                                        setTimezoneOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          editForm.timezone === tz.value ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {tz.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* UPDATE-008: Default Currency in Company Details */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Default Currency</label>
                      <Select
                        value={editForm.defaultCurrency}
                        onValueChange={(value) => setEditForm({ ...editForm, defaultCurrency: value as typeof editForm.defaultCurrency })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ILS">ILS (Israeli Shekel)</SelectItem>
                          <SelectItem value="USD">USD (US Dollar)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Used as default for quotes and invoices</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{client.legalName}</p>
                        {client.companyId && (
                          <p className="text-sm text-muted-foreground">ID: {client.companyId}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{getTimezoneLabel(client.timezone)}</p>
                    </div>
                    {/* UPDATE-008: Show Default Currency in read mode */}
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">Default: {client.defaultCurrency}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Primary Contacts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Contacts</CardTitle>
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={handleAddContact}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Update-003: Contact editing with phone country code + communication preferences */}
                {isEditing ? (
                  editForm.contacts.map((contact, index) => (
                    <div key={contact.id} className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Contact {index + 1}</span>
                        {editForm.contacts.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveContact(contact.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Name *"
                          value={contact.name}
                          onChange={(e) => {
                            const newContacts = [...editForm.contacts]
                            newContacts[index] = { ...contact, name: e.target.value }
                            setEditForm({ ...editForm, contacts: newContacts })
                          }}
                        />
                        <Input
                          placeholder="Email *"
                          type="email"
                          value={contact.email}
                          onChange={(e) => {
                            const newContacts = [...editForm.contacts]
                            newContacts[index] = { ...contact, email: e.target.value }
                            setEditForm({ ...editForm, contacts: newContacts })
                          }}
                        />
                      </div>
                      {/* Update-003: Phone with country code selector */}
                      <div className="flex gap-2">
                        <Select
                          value={contact.phoneCountryCode || '+972'}
                          onValueChange={(value) => {
                            const newContacts = [...editForm.contacts]
                            newContacts[index] = { ...contact, phoneCountryCode: value }
                            setEditForm({ ...editForm, contacts: newContacts })
                          }}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRY_CODES.map((cc) => (
                              <SelectItem key={cc.code} value={cc.code}>
                                {cc.flag} {cc.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Phone number"
                          value={contact.phoneNumber || ''}
                          onChange={(e) => {
                            const newContacts = [...editForm.contacts]
                            newContacts[index] = { ...contact, phoneNumber: e.target.value }
                            setEditForm({ ...editForm, contacts: newContacts })
                          }}
                          className="flex-1"
                        />
                      </div>
                      <Input
                        placeholder="Role/Department (optional)"
                        value={contact.role || ''}
                        onChange={(e) => {
                          const newContacts = [...editForm.contacts]
                          newContacts[index] = { ...contact, role: e.target.value }
                          setEditForm({ ...editForm, contacts: newContacts })
                        }}
                      />
                      {/* Update-003: Per-contact communication preferences */}
                      <div className="pt-2 border-t space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Communication Preferences</p>
                        <div className="flex items-center gap-4">
                          <Select
                            value={contact.preferredChannel || 'email'}
                            onValueChange={(value: 'email' | 'phone' | 'whatsapp') => {
                              const newContacts = [...editForm.contacts]
                              newContacts[index] = { ...contact, preferredChannel: value }
                              setEditForm({ ...editForm, contacts: newContacts })
                            }}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Channel" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            </SelectContent>
                          </Select>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={contact.receiveNotifications ?? true}
                              onChange={(e) => {
                                const newContacts = [...editForm.contacts]
                                newContacts[index] = { ...contact, receiveNotifications: e.target.checked }
                                setEditForm({ ...editForm, contacts: newContacts })
                              }}
                              className="rounded border-input"
                            />
                            Receive notifications
                          </label>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  /* Update-003: Contact display with per-contact preferences */
                  client.contacts.map((contact) => (
                    <div key={contact.id} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{contact.name}</p>
                        {contact.isPrimary && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Primary</span>
                        )}
                      </div>
                      {contact.role && (
                        <p className="text-xs text-muted-foreground">{contact.role}</p>
                      )}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                        {(contact.phoneCountryCode && contact.phoneNumber) ? (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phoneCountryCode} {contact.phoneNumber}
                          </span>
                        ) : contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                        )}
                      </div>
                      {/* Update-003: Show per-contact communication preferences */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                        <span className="bg-muted px-2 py-0.5 rounded capitalize">
                          {contact.preferredChannel || 'email'}
                        </span>
                        {contact.receiveNotifications !== false && (
                          <span className="bg-muted px-2 py-0.5 rounded">Notifications on</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Billing Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Billing Info</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Billing Address</label>
                      <Textarea
                        value={editForm.billingAddress}
                        onChange={(e) => setEditForm({ ...editForm, billingAddress: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Payment Terms</label>
                        <Select
                          value={editForm.paymentTerms}
                          onValueChange={(value) => setEditForm({ ...editForm, paymentTerms: value as typeof editForm.paymentTerms })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_TERMS.map((term) => (
                              <SelectItem key={term.value} value={term.value}>
                                {term.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Default Currency</label>
                        <Select
                          value={editForm.defaultCurrency}
                          onValueChange={(value) => setEditForm({ ...editForm, defaultCurrency: value as typeof editForm.defaultCurrency })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="ILS">ILS</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tax Details</label>
                      <Input
                        value={editForm.taxDetails}
                        onChange={(e) => setEditForm({ ...editForm, taxDetails: e.target.value })}
                      />
                    </div>
                    {/* Update-001: Client Discount - Admin/PM only */}
                    {(isAdmin || isPM) && (
                      <div className="border-t pt-4 mt-4">
                        <p className="text-sm font-medium mb-3">Client Discount</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Discount (%)</label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.01}
                              value={editForm.discountPercent}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value)
                                if (!isNaN(val) && val >= 0 && val <= 100) {
                                  setEditForm({ ...editForm, discountPercent: val })
                                } else if (e.target.value === '') {
                                  setEditForm({ ...editForm, discountPercent: 0 })
                                }
                              }}
                              placeholder="0"
                            />
                            <p className="text-xs text-muted-foreground">0–100, applied to new quotes</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Discount Notes</label>
                            <Input
                              value={editForm.discountNotes}
                              onChange={(e) => setEditForm({ ...editForm, discountNotes: e.target.value })}
                              placeholder="e.g. Long-term partner — 10% standing discount"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {client.billingAddress && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm">{client.billingAddress}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">
                        {PAYMENT_TERMS.find((t) => t.value === client.paymentTerms)?.label || client.paymentTerms}
                        {' '}&middot;{' '}{client.defaultCurrency}
                      </p>
                    </div>
                    {client.taxDetails && (
                      <p className="text-sm text-muted-foreground">{client.taxDetails}</p>
                    )}
                    {/* Update-001: Client Discount display - Admin/PM/Finance only */}
                    {(isAdmin || isPM || isFinance) && (client.discountPercent ?? 0) > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-primary">
                            {client.discountPercent}% Discount
                          </span>
                        </div>
                        {client.discountNotes && (
                          <p className="text-xs text-muted-foreground mt-1">{client.discountNotes}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Communication Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Communication Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preferred Channel</label>
                    <Select
                      value={editForm.preferredChannel}
                      onValueChange={(value) => setEditForm({ ...editForm, preferredChannel: value as typeof editForm.preferredChannel })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-sm capitalize">{client.preferredChannel}</p>
                )}
              </CardContent>
            </Card>

            {/* Rate Card - visible to Admin/Finance only */}
            {canSeeRateCard && (
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Rate Card</CardTitle>
                  {isEditing && (
                    <Button variant="outline" size="sm" onClick={handleAddRateCard}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Rate
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2">
                  {isEditing ? (
                    <div className="space-y-3">
                      {editForm.rateCard.map((rate, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Select
                            value={rate.serviceType}
                            onValueChange={(value) => {
                              const newRateCard = [...editForm.rateCard]
                              newRateCard[index] = { ...rate, serviceType: value }
                              setEditForm({ ...editForm, rateCard: newRateCard })
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                            <SelectContent>
                              {SERVICES_LIST.map((service) => (
                                <SelectItem key={service} value={service}>
                                  {service}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            className="w-28"
                            placeholder="Rate"
                            value={rate.rate || ''}
                            onChange={(e) => {
                              const newRateCard = [...editForm.rateCard]
                              newRateCard[index] = { ...rate, rate: Number(e.target.value) }
                              setEditForm({ ...editForm, rateCard: newRateCard })
                            }}
                          />
                          <Select
                            value={rate.currency}
                            onValueChange={(value) => {
                              const newRateCard = [...editForm.rateCard]
                              newRateCard[index] = { ...rate, currency: value as typeof rate.currency }
                              setEditForm({ ...editForm, rateCard: newRateCard })
                            }}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="ILS">ILS</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveRateCard(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      {editForm.rateCard.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No rates configured. Add rates to pre-fill quotes.
                        </p>
                      )}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service Type</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {client.rateCard.map((rate, index) => (
                          <TableRow key={index}>
                            <TableCell>{rate.serviceType}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(rate.rate)} {rate.currency}
                            </TableCell>
                          </TableRow>
                        ))}
                        {client.rateCard.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                              No rates configured
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Internal Notes - visible to Admin/PM only */}
            {canSeeInternalNotes && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Internal Notes</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2">
                  {isEditing ? (
                    <Textarea
                      value={editForm.internalNotes}
                      onChange={(e) => setEditForm({ ...editForm, internalNotes: e.target.value })}
                      rows={4}
                      placeholder="Notes visible only to Admin and PM..."
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {client.internalNotes || 'No internal notes.'}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Team Members</CardTitle>
              {canManageTeam && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setImportCSVDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                  <Button size="sm" onClick={() => setAddMemberDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="px-4 py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                {/* Update-005: Team table with invited members showing as Pending */}
                <TableBody>
                  {/* Current user first, then newly invited (pending), then existing users */}
                  {clientUsers.slice(0, 1).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">
                          {CLIENT_ROLES.find((r) => r.value === user.clientRole)?.label || user.clientRole}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={user.status === 'pending_setup' ? 'pending' : user.status} />
                      </TableCell>
                      <TableCell>
                        {canManageTeam && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditRole(user)}>Edit Role</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === 'active' ? (
                                <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(user, 'deactivate')}>Deactivate</DropdownMenuItem>
                              ) : user.status === 'inactive' ? (
                                <DropdownMenuItem onClick={() => handleStatusChange(user, 'reactivate')}>Reactivate</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleStatusChange(user, 'resend')}>Resend Invite</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Update-005: Newly invited members appear as second row with Pending status */}
                  {invitedMembers.map((member) => (
                    <TableRow key={member.id} className="bg-muted/30">
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">—</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status="pending" />
                      </TableCell>
                      <TableCell>
                        {canManageTeam && (
                          <Button variant="ghost" size="sm" className="text-xs">
                            Resend
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Remaining existing users */}
                  {clientUsers.slice(1).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">
                          {CLIENT_ROLES.find((r) => r.value === user.clientRole)?.label || user.clientRole}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={user.status === 'pending_setup' ? 'pending' : user.status} />
                      </TableCell>
                      <TableCell>
                        {canManageTeam && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditRole(user)}>Edit Role</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === 'active' ? (
                                <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(user, 'deactivate')}>Deactivate</DropdownMenuItem>
                              ) : user.status === 'inactive' ? (
                                <DropdownMenuItem onClick={() => handleStatusChange(user, 'reactivate')}>Reactivate</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleStatusChange(user, 'resend')}>Resend Invite</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {clientUsers.length === 0 && (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No team members yet. Invite your first user.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Update-004: Shows Tab (renamed from Projects) with Scene column */}
        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardContent className="px-4 py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Show</TableHead>
                    <TableHead>Scene</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>PM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Update-004: Sample shows with scenes */}
                  {[
                    { id: 'show-1', name: 'The Night Shift', scene: 'Scene 12', status: 'in_progress', deadline: '2026-05-15', pm: 'Sarah Cohen' },
                    { id: 'show-2', name: 'Ocean Echo', scene: 'Scene 03', status: 'not_started', deadline: '2026-05-20', pm: 'David Levy' },
                    { id: 'show-3', name: 'Desert Wind', scene: 'Scene 27', status: 'blocked', deadline: '2026-05-10', pm: 'Sarah Cohen' },
                    { id: 'show-4', name: 'City Lights', scene: 'Scene 08', status: 'in_review', deadline: '2026-05-18', pm: 'Maya Ben-Ari' },
                    { id: 'show-5', name: 'Mountain Peak', scene: 'Scene 15', status: 'done', deadline: '2026-05-05', pm: 'David Levy' },
                  ].map((show) => (
                    <TableRow key={show.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/projects/${show.id}`}>
                      <TableCell className="font-medium">{show.name}</TableCell>
                      <TableCell className="text-muted-foreground">{show.scene}</TableCell>
                      <TableCell><StatusBadge status={show.status} /></TableCell>
                      <TableCell>{formatDate(show.deadline)}</TableCell>
                      <TableCell>{show.pm}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Update-004: Quotes Tab with Scene column */}
        <TabsContent value="quotes" className="mt-6">
          <Card>
            <CardContent className="px-4 py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote #</TableHead>
                    <TableHead>Show</TableHead>
                    <TableHead>Scene</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Update-004: Sample quotes with scenes */}
                  {[
                    { id: 'q-1', quoteNumber: 'Q-2026-001', showName: 'The Night Shift', scene: 'Scene 12', status: 'approved', price: 4500, currency: 'USD' },
                    { id: 'q-2', quoteNumber: 'Q-2026-002', showName: 'Ocean Echo', scene: 'Scene 03', status: 'pending', price: 3200, currency: 'USD' },
                    { id: 'q-3', quoteNumber: 'Q-2026-003', showName: 'Desert Wind', scene: 'Scene 27', status: 'draft', price: 2800, currency: 'USD' },
                    { id: 'q-4', quoteNumber: 'Q-2026-004', showName: 'City Lights', scene: 'Scene 08', status: 'sent', price: 5100, currency: 'USD' },
                  ].map((quote) => (
                    <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/quotes/${quote.id}`}>
                      <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                      <TableCell>{quote.showName}</TableCell>
                      <TableCell className="text-muted-foreground">{quote.scene}</TableCell>
                      <TableCell><StatusBadge status={quote.status} /></TableCell>
                      <TableCell className="text-right">{formatCurrency(quote.price)} {quote.currency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Update-004: Invoices Tab with sample data */}
        <TabsContent value="invoices" className="mt-6">
          <Card>
            <CardContent className="px-4 py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Show</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Update-004: Sample invoices */}
                  {[
                    { id: 'inv-1', invoiceNumber: 'INV-2026-001', showName: 'The Night Shift', status: 'paid', dueDate: '2026-04-15', amount: 4500, currency: 'USD' },
                    { id: 'inv-2', invoiceNumber: 'INV-2026-002', showName: 'Ocean Echo', status: 'sent', dueDate: '2026-05-01', amount: 3200, currency: 'USD' },
                    { id: 'inv-3', invoiceNumber: 'INV-2026-003', showName: 'Desert Wind', status: 'overdue', dueDate: '2026-04-01', amount: 2800, currency: 'USD' },
                    { id: 'inv-4', invoiceNumber: 'INV-2026-004', showName: 'City Lights', status: 'draft', dueDate: '2026-05-15', amount: 5100, currency: 'USD' },
                  ].map((invoice) => (
                    <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/billing/invoices/${invoice.id}`}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.showName}</TableCell>
                      <TableCell><StatusBadge status={invoice.status} /></TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.amount)} {invoice.currency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {clientInvoices.length === 0 && (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-sm text-muted-foreground">No invoices yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialog} onOpenChange={setAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Invite a new team member to {client.displayName}. They will receive an email with setup instructions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                placeholder="email@company.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={newMember.clientRole}
                onValueChange={(value) => setNewMember({ ...newMember, clientRole: value as typeof newMember.clientRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <p>{role.label}</p>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialog(false)}>Cancel</Button>
            <Button onClick={handleInviteMember} disabled={isInviting || !newMember.name || !newMember.email}>
              {isInviting ? 'Sending Invite...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialog} onOpenChange={setEditRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <p>{role.label}</p>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveRole}>Save Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={importCSVDialog} onOpenChange={setImportCSVDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Team Members</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import team members. The CSV should have columns: name, email, phone, role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
              <label className="cursor-pointer">
                <span className="text-sm text-primary hover:underline">Click to upload</span>
                <span className="text-sm text-muted-foreground"> or drag and drop</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportCSV}
                />
              </label>
              <p className="text-xs text-muted-foreground mt-2">CSV files only</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportCSVDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateDialog} onOpenChange={setDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Team Member</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to deactivate <span className="font-medium text-foreground">{userToDeactivate?.name}</span>?
              </p>
              <div className="rounded-lg bg-muted p-3 text-sm space-y-2">
                <p className="font-medium">This will:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Revoke their access to the client portal</li>
                  <li>End any active sessions immediately</li>
                  <li>Remove them from future task notifications</li>
                </ul>
                <p className="font-medium mt-3">This will NOT:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Delete their historical data or activity logs</li>
                  <li>Remove them from completed task records</li>
                  <li>Delete their user account (can be reactivated)</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              disabled={isDeactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeactivating ? 'Deactivating...' : 'Deactivate User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update-006: Archive Client Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Client</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Archive <strong>{client.displayName}</strong>? All associated user accounts will be deactivated. Historical data is preserved.
              </p>
              <div className="text-sm">
                <p className="font-medium mt-3">This will:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Set the client status to Archived</li>
                  <li>Deactivate all linked team member accounts</li>
                  <li>Hide the client from default views</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveClient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Archive Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update-006: Reactivate Users Prompt Dialog */}
      <Dialog open={reactivateUsersDialogOpen} onOpenChange={setReactivateUsersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Team Members?</DialogTitle>
            <DialogDescription>
              {client.displayName} has {clientUsers.filter(u => u.status === 'inactive').length} deactivated team member(s). Would you like to reactivate them now?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You can also reactivate team members later from the Team tab.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivateUsersDialogOpen(false)}>
              Skip for Now
            </Button>
            <Button onClick={handleBulkReactivateUsers}>
              Reactivate All ({clientUsers.filter(u => u.status === 'inactive').length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

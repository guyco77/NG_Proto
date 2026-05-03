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
  FolderKanban,
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
import { useRole } from '../../layout'
import { useToast } from '@/hooks/use-toast'
import type { ClientContact, ClientRateCard, ClientUser } from '@/lib/types'

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
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    legalName: client.legalName,
    displayName: client.displayName,
    companyId: client.companyId || '',
    timezone: client.timezone,
    contacts: [...client.contacts],
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

  const handleAddContact = () => {
    setEditForm({
      ...editForm,
      contacts: [
        ...editForm.contacts,
        { id: `cc-new-${Date.now()}`, name: '', email: '', isPrimary: false },
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
    await new Promise(resolve => setTimeout(resolve, 800))
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
          
          {canEdit && !isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-1.5">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
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
          <TabsTrigger value="projects" className="gap-1.5">
            <FolderKanban className="h-4 w-4" />
            Projects ({clientProjects.length})
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Timezone</label>
                      <Input
                        value={editForm.timezone}
                        onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                      />
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
                      <p className="text-sm">{client.timezone}</p>
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
                {isEditing ? (
                  editForm.contacts.map((contact, index) => (
                    <div key={contact.id} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Contact {index + 1}</span>
                        {editForm.contacts.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveContact(contact.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Name"
                        value={contact.name}
                        onChange={(e) => {
                          const newContacts = [...editForm.contacts]
                          newContacts[index] = { ...contact, name: e.target.value }
                          setEditForm({ ...editForm, contacts: newContacts })
                        }}
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={contact.email}
                        onChange={(e) => {
                          const newContacts = [...editForm.contacts]
                          newContacts[index] = { ...contact, email: e.target.value }
                          setEditForm({ ...editForm, contacts: newContacts })
                        }}
                      />
                      <Input
                        placeholder="Phone (optional)"
                        value={contact.phone || ''}
                        onChange={(e) => {
                          const newContacts = [...editForm.contacts]
                          newContacts[index] = { ...contact, phone: e.target.value }
                          setEditForm({ ...editForm, contacts: newContacts })
                        }}
                      />
                      <Input
                        placeholder="Role/Department (optional)"
                        value={contact.role || ''}
                        onChange={(e) => {
                          const newContacts = [...editForm.contacts]
                          newContacts[index] = { ...contact, role: e.target.value }
                          setEditForm({ ...editForm, contacts: newContacts })
                        }}
                      />
                    </div>
                  ))
                ) : (
                  client.contacts.map((contact) => (
                    <div key={contact.id} className="space-y-1">
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
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
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
                <TableBody>
                  {clientUsers.map((user) => (
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

        {/* Projects Tab */}
<TabsContent value="projects" className="mt-6">
            <Card>
              <CardContent className="px-4 py-2">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>PM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientProjects.map((project) => (
                    <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/projects/${project.id}`}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell><StatusBadge status={project.status} /></TableCell>
                      <TableCell>{formatDate(project.deadline)}</TableCell>
                      <TableCell>{project.pm}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {clientProjects.length === 0 && (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-sm text-muted-foreground">No projects yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotes Tab */}
<TabsContent value="quotes" className="mt-6">
            <Card>
              <CardContent className="px-4 py-2">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote #</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientQuotes.map((quote) => (
                    <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/quotes/${quote.id}`}>
                      <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                      <TableCell>{quote.projectName}</TableCell>
                      <TableCell><StatusBadge status={quote.status} /></TableCell>
                      {/* Update 01: totalAmount renamed to price */}
                      <TableCell className="text-right">{quote.price ? `${formatCurrency(quote.price)} ${quote.currency || ''}` : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {clientQuotes.length === 0 && (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-sm text-muted-foreground">No quotes yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
<TabsContent value="invoices" className="mt-6">
            <Card>
              <CardContent className="px-4 py-2">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/billing/invoices/${invoice.id}`}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.projectName}</TableCell>
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
    </div>
  )
}

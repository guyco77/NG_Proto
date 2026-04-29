'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Save,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PAYMENT_TERMS, SERVICES_LIST } from '@/lib/mock-data'
import { useRole } from '../../layout'
import { useToast } from '@/hooks/use-toast'
import type { ClientContact, ClientRateCard, BillingCurrency } from '@/lib/types'

export default function NewClientPage() {
  const router = useRouter()
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  const isAdmin = currentRole === 'admin'
  const isPM = currentRole === 'pm'
  const canCreateClient = isAdmin || isPM

  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    legalName: '',
    displayName: '',
    companyId: '',
    timezone: 'America/New_York',
    contacts: [
      { id: 'cc-1', name: '', email: '', phone: '', role: '', isPrimary: true },
    ] as ClientContact[],
    billingAddress: '',
    paymentTerms: 'net_30' as const,
    defaultCurrency: 'USD' as BillingCurrency,
    taxDetails: '',
    preferredChannel: 'email' as const,
    internalNotes: '',
    rateCard: [] as ClientRateCard[],
  })

  // Validation
  const isValid = form.legalName.trim() !== '' && 
    form.contacts.length > 0 && 
    form.contacts[0].name.trim() !== '' && 
    form.contacts[0].email.trim() !== ''

  const handleAddContact = () => {
    setForm({
      ...form,
      contacts: [
        ...form.contacts,
        { id: `cc-new-${Date.now()}`, name: '', email: '', phone: '', role: '', isPrimary: false },
      ],
    })
  }

  const handleRemoveContact = (contactId: string) => {
    if (form.contacts.length <= 1) return
    setForm({
      ...form,
      contacts: form.contacts.filter((c) => c.id !== contactId),
    })
  }

  const handleAddRateCard = () => {
    setForm({
      ...form,
      rateCard: [
        ...form.rateCard,
        { serviceType: '', rate: 0, currency: form.defaultCurrency },
      ],
    })
  }

  const handleRemoveRateCard = (index: number) => {
    setForm({
      ...form,
      rateCard: form.rateCard.filter((_, i) => i !== index),
    })
  }

  const handleSave = async () => {
    if (!isValid) return
    
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsSaving(false)
    
    toast({
      title: 'Client Created',
      description: `${form.displayName || form.legalName} has been created.`,
    })
    
    router.push('/clients')
  }

  if (!canCreateClient) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to create clients.</p>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">New Client</h1>
            <p className="text-sm text-muted-foreground">Create a new client profile</p>
          </div>
          
          <Button onClick={handleSave} disabled={isSaving || !isValid}>
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
      </div>

      {/* Form */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Legal Name *</label>
              <Input
                value={form.legalName}
                onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                placeholder="Company Legal Name, Inc."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="Short name (optional)"
              />
              <p className="text-xs text-muted-foreground">Used in the UI. Defaults to legal name if empty.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Company ID / VAT</label>
              <Input
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                placeholder="XX-1234567"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Timezone</label>
              <Input
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                placeholder="America/New_York"
              />
            </div>
          </CardContent>
        </Card>

        {/* Primary Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Contacts</CardTitle>
            <Button variant="outline" size="sm" onClick={handleAddContact}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.contacts.map((contact, index) => (
              <div key={contact.id} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {index === 0 ? 'Primary Contact *' : `Contact ${index + 1}`}
                  </span>
                  {form.contacts.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveContact(contact.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Name *"
                  value={contact.name}
                  onChange={(e) => {
                    const newContacts = [...form.contacts]
                    newContacts[index] = { ...contact, name: e.target.value }
                    setForm({ ...form, contacts: newContacts })
                  }}
                />
                <Input
                  placeholder="Email *"
                  type="email"
                  value={contact.email}
                  onChange={(e) => {
                    const newContacts = [...form.contacts]
                    newContacts[index] = { ...contact, email: e.target.value }
                    setForm({ ...form, contacts: newContacts })
                  }}
                />
                <Input
                  placeholder="Phone (optional)"
                  value={contact.phone || ''}
                  onChange={(e) => {
                    const newContacts = [...form.contacts]
                    newContacts[index] = { ...contact, phone: e.target.value }
                    setForm({ ...form, contacts: newContacts })
                  }}
                />
                <Input
                  placeholder="Role/Department (optional)"
                  value={contact.role || ''}
                  onChange={(e) => {
                    const newContacts = [...form.contacts]
                    newContacts[index] = { ...contact, role: e.target.value }
                    setForm({ ...form, contacts: newContacts })
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Billing Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Billing Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Billing Address</label>
              <Textarea
                value={form.billingAddress}
                onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                rows={2}
                placeholder="Street address, City, State, ZIP, Country"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Terms</label>
                <Select
                  value={form.paymentTerms}
                  onValueChange={(value) => setForm({ ...form, paymentTerms: value as typeof form.paymentTerms })}
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
                  value={form.defaultCurrency}
                  onValueChange={(value) => setForm({ ...form, defaultCurrency: value as typeof form.defaultCurrency })}
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
                value={form.taxDetails}
                onChange={(e) => setForm({ ...form, taxDetails: e.target.value })}
                placeholder="Tax exempt status, VAT info, etc."
              />
            </div>
          </CardContent>
        </Card>

        {/* Communication Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Communication Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred Channel</label>
              <Select
                value={form.preferredChannel}
                onValueChange={(value) => setForm({ ...form, preferredChannel: value as typeof form.preferredChannel })}
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
          </CardContent>
        </Card>

        {/* Rate Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Rate Card (Optional)</CardTitle>
            <Button variant="outline" size="sm" onClick={handleAddRateCard}>
              <Plus className="h-4 w-4 mr-1" />
              Add Rate
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <p className="text-sm text-muted-foreground mb-4">
              Set client-specific rates for services. These rates will pre-fill quotes for this client.
            </p>
            <div className="space-y-3">
              {form.rateCard.map((rate, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Select
                    value={rate.serviceType}
                    onValueChange={(value) => {
                      const newRateCard = [...form.rateCard]
                      newRateCard[index] = { ...rate, serviceType: value }
                      setForm({ ...form, rateCard: newRateCard })
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
                      const newRateCard = [...form.rateCard]
                      newRateCard[index] = { ...rate, rate: Number(e.target.value) }
                      setForm({ ...form, rateCard: newRateCard })
                    }}
                  />
                  <Select
                    value={rate.currency}
                    onValueChange={(value) => {
                      const newRateCard = [...form.rateCard]
                      newRateCard[index] = { ...rate, currency: value as typeof rate.currency }
                      setForm({ ...form, rateCard: newRateCard })
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
              {form.rateCard.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No rates configured yet. You can add them now or later.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Internal Notes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Internal Notes</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <Textarea
              value={form.internalNotes}
              onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
              rows={4}
              placeholder="Notes visible only to Admin and PM..."
            />
          </CardContent>
        </Card>
      </div>

      {/* Footer Save Button */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !isValid} size="lg">
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
    </div>
  )
}

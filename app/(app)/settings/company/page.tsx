'use client'

import { useState, useRef } from 'react'
import { Upload, Building2, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../../layout'

// SET-001: Company Settings
interface CompanySettings {
  legalName: string
  displayName: string
  logoUrl?: string
  address: string
  defaultCurrency: 'ILS' | 'USD' | 'EUR'
  vatNumber: string
  taxRate: number
  taxLabel: string
  defaultPaymentTerms: 'due_on_receipt' | 'net_15' | 'net_30' | 'net_45' | 'net_60'
}

const mockCompanySettings: CompanySettings = {
  legalName: 'NG Broadcast Ltd.',
  displayName: 'NG Broadcast',
  logoUrl: undefined,
  address: '123 Media Street\nTel Aviv, Israel 6120001',
  defaultCurrency: 'ILS',
  vatNumber: 'IL-516789012',
  taxRate: 17,
  taxLabel: 'VAT',
  defaultPaymentTerms: 'net_30',
}

const CURRENCIES = [
  { value: 'ILS', label: 'ILS - Israeli Shekel' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
]

const PAYMENT_TERMS = [
  { value: 'due_on_receipt', label: 'Due on Receipt' },
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_45', label: 'Net 45' },
  { value: 'net_60', label: 'Net 60' },
]

export default function CompanySettingsPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [settings, setSettings] = useState<CompanySettings>(mockCompanySettings)
  const [isSaving, setIsSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | undefined>(settings.logoUrl)

  const isAdmin = currentRole === 'admin'

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PNG, JPG, or SVG file.',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 2 MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Logo must be smaller than 2 MB.',
        variant: 'destructive',
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoPreview(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: 'Settings saved',
      description: 'Company settings have been updated successfully.',
    })
    setIsSaving(false)
  }

  if (!isAdmin) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access company settings.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Company Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Global settings applied across billing, emails, and PDFs
        </p>
      </div>

      <div className="space-y-6">
        {/* Company Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company Identity</CardTitle>
            <CardDescription>Legal name and branding used in documents</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-4 pt-2">
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Legal Name</FieldLabel>
                  <Input
                    value={settings.legalName}
                    onChange={(e) => setSettings({ ...settings, legalName: e.target.value })}
                    placeholder="Full legal company name"
                  />
                </Field>
                <Field>
                  <FieldLabel>Display Name</FieldLabel>
                  <Input
                    value={settings.displayName}
                    onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                    placeholder="Short display name"
                  />
                </Field>
              </div>

              {/* Logo Upload */}
              <Field>
                <FieldLabel>Company Logo</FieldLabel>
                <p className="text-xs text-muted-foreground mb-2">
                  Used in emails, invoices, and PDFs. PNG, SVG, or JPG up to 2 MB.
                </p>
                <div className="flex items-start gap-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Company logo"
                        className="max-h-20 max-w-20 object-contain"
                      />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload New
                    </Button>
                    {logoPreview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={handleRemoveLogo}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </Field>

              <Field>
                <FieldLabel>Company Address</FieldLabel>
                <Textarea
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="Full address for invoices and email footers"
                  rows={3}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Billing Defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Billing Defaults</CardTitle>
            <CardDescription>Pre-fill values for new quotes and invoices</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-4 pt-2">
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Default Currency</FieldLabel>
                  <Select
                    value={settings.defaultCurrency}
                    onValueChange={(value) => setSettings({ ...settings, defaultCurrency: value as 'ILS' | 'USD' | 'EUR' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Default Payment Terms</FieldLabel>
                  <Select
                    value={settings.defaultPaymentTerms}
                    onValueChange={(value) => setSettings({ ...settings, defaultPaymentTerms: value as CompanySettings['defaultPaymentTerms'] })}
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
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Tax Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tax Information</CardTitle>
            <CardDescription>VAT and tax settings for invoices</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-4 pt-2">
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel>VAT / Company ID</FieldLabel>
                  <Input
                    value={settings.vatNumber}
                    onChange={(e) => setSettings({ ...settings, vatNumber: e.target.value })}
                    placeholder="VAT registration number"
                  />
                </Field>
                <Field>
                  <FieldLabel>Tax Rate (%)</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.taxRate}
                    onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Tax Label</FieldLabel>
                  <Input
                    value={settings.taxLabel}
                    onChange={(e) => setSettings({ ...settings, taxLabel: e.target.value })}
                    placeholder='e.g. "VAT" or "מע"מ"'
                  />
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}

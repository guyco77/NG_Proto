'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Trash2,
  Send,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VENDOR_SERVICE_TYPES, LANGUAGE_PAIRS } from '@/lib/mock-data'
import { useRole } from '../../layout'
import { useToast } from '@/hooks/use-toast'

interface RateCardLine {
  id: string
  serviceType: string
  languagePair: string // "EN-ES" format
  rate: string
  unit: string
  currency: string
  minimum: string
  rushMultiplier: string
}

export default function NewVendorPage() {
  const router = useRouter()
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  const isAdmin = currentRole === 'admin'
  const isPM = currentRole === 'pm'
  const canCreate = isAdmin || isPM

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [timezone, setTimezone] = useState('')
  const [location, setLocation] = useState('')
  // UPDATE-003: Legal/Tax details
  const [taxId, setTaxId] = useState('')
  const [invoicingEntity, setInvoicingEntity] = useState('')
  const [taxCountry, setTaxCountry] = useState('')
  // Payment method details
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [paymentDetails, setPaymentDetails] = useState('')
  // Bank transfer specific fields
  const [bankName, setBankName] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [swiftBic, setSwiftBic] = useState('')
  const [bankBranch, setBankBranch] = useState('')
  const [accountCurrency, setAccountCurrency] = useState('USD')
  // Payoneer specific fields
  const [payoneerEmail, setPayoneerEmail] = useState('')
  // Other payment method
  const [otherPaymentMethod, setOtherPaymentMethod] = useState('')
  const [otherPaymentDetails, setOtherPaymentDetails] = useState('')
  // Internal notes
  const [internalNotes, setInternalNotes] = useState('')
  
  // Service types (multi-select via checkboxes)
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([])
  
  // Language pairs (multi-select)
  const [selectedLanguagePairs, setSelectedLanguagePairs] = useState<string[]>([])
  
  // Rate card
  const [rateCard, setRateCard] = useState<RateCardLine[]>([])
  
  // Invite dialog
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Validation
  const isValid = name.trim() && email.trim() && selectedServiceTypes.length > 0 && selectedLanguagePairs.length > 0

  const handleServiceTypeToggle = (type: string) => {
    setSelectedServiceTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleLanguagePairToggle = (pair: string) => {
    setSelectedLanguagePairs(prev => 
      prev.includes(pair) ? prev.filter(p => p !== pair) : [...prev, pair]
    )
  }

  const addRateCardLine = () => {
    setRateCard([...rateCard, {
      id: `rc-${Date.now()}`,
      serviceType: selectedServiceTypes[0] || '',
      languagePair: selectedLanguagePairs[0] || '',
      rate: '',
      unit: 'per_minute',
      currency: 'USD',
      minimum: '',
      rushMultiplier: '',
    }])
  }

  const updateRateCardLine = (id: string, field: keyof RateCardLine, value: string) => {
    setRateCard(rateCard.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ))
  }

  const removeRateCardLine = (id: string) => {
    setRateCard(rateCard.filter(line => line.id !== id))
  }

  const handleSaveVendor = async () => {
    if (!isValid) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in name, email, at least one service type and language pair.',
        variant: 'destructive',
      })
      return
    }
    
    setIsSaving(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsSaving(false)
    
    // Show invite dialog - this step cannot be skipped per PRD
    setShowInviteDialog(true)
  }

  const handleSendInvite = async () => {
    setIsSending(true)
    // Simulate sending invite via SendGrid
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSending(false)
    
    toast({
      title: 'Vendor created and invite sent',
      description: `${name} has been added as a vendor. An invite email has been sent to ${email}.`,
    })
    
    router.push('/vendors')
  }

  if (!canCreate) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">You do not have permission to create vendors.</p>
          <Link href="/vendors">
            <Button variant="outline" className="mt-4">View Vendors</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">New Vendor</h1>
        <p className="text-sm text-muted-foreground mt-1">Add a new vendor to your team</p>
      </div>

      <div className="space-y-6">
        {/* Contact & Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact & Identity</CardTitle>
            <CardDescription>Basic vendor information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter vendor name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendor@example.com"
                />
              </div>
            </div>
            {/* UPDATE-003: Separate Phone and WhatsApp fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 123 4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+1 555 123 4567"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="e.g. America/New_York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location / Address</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </div>
            </CardContent>
        </Card>

        {/* UPDATE-003: Legal / Tax Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Legal / Tax Details (Optional)</CardTitle>
            <CardDescription>Information needed to legally issue payment to the vendor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                <Input
                  id="taxId"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="e.g. 123-45-6789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoicingEntity">Invoicing Entity Name</Label>
                <Input
                  id="invoicingEntity"
                  value={invoicingEntity}
                  onChange={(e) => setInvoicingEntity(e.target.value)}
                  placeholder="Business or personal name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxCountry">Country of Tax Residence</Label>
              <Input
                id="taxCountry"
                value={taxCountry}
                onChange={(e) => setTaxCountry(e.target.value)}
                placeholder="e.g. United States"
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills & Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skills & Services</CardTitle>
            <CardDescription>Select at least one service type and language pair</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Service Types *</Label>
              <div className="flex flex-wrap gap-3">
                {VENDOR_SERVICE_TYPES.map(type => (
                  <div key={type} className="flex items-center gap-2">
                    <Checkbox
                      id={`service-${type}`}
                      checked={selectedServiceTypes.includes(type)}
                      onCheckedChange={() => handleServiceTypeToggle(type)}
                    />
                    <label htmlFor={`service-${type}`} className="text-sm cursor-pointer">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Language Pairs *</Label>
              <div className="flex flex-wrap gap-3">
                {LANGUAGE_PAIRS.map(lp => {
                  const value = `${lp.source}-${lp.target}`
                  return (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`lang-${value}`}
                        checked={selectedLanguagePairs.includes(value)}
                        onCheckedChange={() => handleLanguagePairToggle(value)}
                      />
                      <label htmlFor={`lang-${value}`} className="text-sm cursor-pointer">
                        {lp.label}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Rate Card (Optional)</CardTitle>
              <CardDescription>Vendor pay rates per service type and language pair</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addRateCardLine} disabled={selectedServiceTypes.length === 0 || selectedLanguagePairs.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add Rate
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            {rateCard.length > 0 ? (
              <div className="space-y-4">
                {rateCard.map((line, index) => (
                  <div key={line.id} className="grid gap-3 md:grid-cols-7 items-end border-b border-border pb-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Service Type</Label>
                      <Select value={line.serviceType} onValueChange={(v) => updateRateCardLine(line.id, 'serviceType', v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedServiceTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Language</Label>
                      <Select value={line.languagePair} onValueChange={(v) => updateRateCardLine(line.id, 'languagePair', v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedLanguagePairs.map(pair => {
                            const lp = LANGUAGE_PAIRS.find(l => `${l.source}-${l.target}` === pair)
                            return <SelectItem key={pair} value={pair}>{lp?.label || pair}</SelectItem>
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rate</Label>
                      <Input
                        type="number"
                        value={line.rate}
                        onChange={(e) => updateRateCardLine(line.id, 'rate', e.target.value)}
                        placeholder="0"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Unit</Label>
                      <Select value={line.unit} onValueChange={(v) => updateRateCardLine(line.id, 'unit', v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_minute">Per Minute</SelectItem>
                          <SelectItem value="per_subtitle">Per Subtitle</SelectItem>
                          <SelectItem value="per_file">Per File</SelectItem>
                          <SelectItem value="fixed_fee">Fixed Fee</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Currency</Label>
                      <Select value={line.currency} onValueChange={(v) => updateRateCardLine(line.id, 'currency', v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="ILS">ILS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rush (x)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={line.rushMultiplier}
                        onChange={(e) => updateRateCardLine(line.id, 'rushMultiplier', e.target.value)}
                        placeholder="1.5"
                        className="h-9"
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-destructive"
                      onClick={() => removeRateCardLine(line.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No rates configured. You can add rates now or the vendor can enter them after accepting the invite.
              </p>
            )}
          </CardContent>
        </Card>

        {/* UPDATE-003: Payment Method with detailed fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Method (Optional)</CardTitle>
            <CardDescription>How the vendor will receive payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="payoneer">Payoneer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Bank Transfer Fields */}
            {paymentMethod === 'bank_transfer' && (
              <div className="space-y-4 pt-2 border-t">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Chase Bank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Holder Name</Label>
                    <Input
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="Name on account"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Account Number / IBAN</Label>
                    <Input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Account number or IBAN"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SWIFT / BIC</Label>
                    <Input
                      value={swiftBic}
                      onChange={(e) => setSwiftBic(e.target.value)}
                      placeholder="e.g. CHASUS33"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Input
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      placeholder="Branch name or code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Currency</Label>
                    <Select value={accountCurrency} onValueChange={setAccountCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="ILS">ILS</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            
            {/* Payoneer Fields */}
            {paymentMethod === 'payoneer' && (
              <div className="space-y-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label>Payoneer Email / Account ID</Label>
                  <Input
                    value={payoneerEmail}
                    onChange={(e) => setPayoneerEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            )}
            
            {/* Other Payment Method */}
            {paymentMethod === 'other' && (
              <div className="space-y-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label>Payment Method Name</Label>
                  <Input
                    value={otherPaymentMethod}
                    onChange={(e) => setOtherPaymentMethod(e.target.value)}
                    placeholder="e.g. Wise, Paypal, Crypto"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Details</Label>
                  <Textarea
                    value={otherPaymentDetails}
                    onChange={(e) => setOtherPaymentDetails(e.target.value)}
                    placeholder="Enter payment details..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Internal Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Internal Notes (Optional)</CardTitle>
            <CardDescription>Visible only to Admin and PM</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add any internal notes about this vendor..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link href="/vendors">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSaveVendor} disabled={!isValid || isSaving}>
            {isSaving ? 'Saving...' : 'Save Vendor'}
          </Button>
        </div>
      </div>

      {/* Invite Dialog - Required step that cannot be skipped */}
      <Dialog open={showInviteDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite {name} as a user?
            </DialogTitle>
            <DialogDescription>
              This step is required. The vendor will receive an invite email to set up their account 
              and complete their profile before they can be assigned to tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">Invite will be sent to:</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSendInvite} disabled={isSending} className="w-full gap-1.5">
              <Send className="h-4 w-4" />
              {isSending ? 'Sending Invite...' : 'Send Invite Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

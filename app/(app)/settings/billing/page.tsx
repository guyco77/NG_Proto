'use client'

import { useState } from 'react'
import { Eye, EyeOff, CheckCircle2, XCircle, RefreshCw, Save, Shield, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../../layout'
import { cn } from '@/lib/utils'

// SET-006: Billing Settings
interface BillingConfig {
  iCountApiKey: string
  iCountCompanyId: string
  meckanoApiKey: string
  meckanoCompanyId: string
  defaultPaymentTerms: 'due_on_receipt' | 'net_15' | 'net_30' | 'net_45' | 'net_60'
  defaultTaxRate: number
}

const PAYMENT_TERMS = [
  { value: 'due_on_receipt', label: 'Due on Receipt' },
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_45', label: 'Net 45' },
  { value: 'net_60', label: 'Net 60' },
]

const mockBillingConfig: BillingConfig = {
  iCountApiKey: 'ik_live_xxxxxxxxxxxxxxxxxxxx',
  iCountCompanyId: 'IC-12345',
  meckanoApiKey: 'mk_live_xxxxxxxxxxxxxxxxxxxx',
  meckanoCompanyId: 'MK-67890',
  defaultPaymentTerms: 'net_30',
  defaultTaxRate: 17,
}

export default function BillingSettingsPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  const [config, setConfig] = useState<BillingConfig>(mockBillingConfig)
  const [showICountKey, setShowICountKey] = useState(false)
  const [showMeckanoKey, setShowMeckanoKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Connection test states
  const [testingICount, setTestingICount] = useState(false)
  const [testingMeckano, setTestingMeckano] = useState(false)
  const [iCountStatus, setICountStatus] = useState<'success' | 'failure' | null>(null)
  const [meckanoStatus, setMeckanoStatus] = useState<'success' | 'failure' | null>(null)

  const isAdmin = currentRole === 'admin'
  const isFinance = currentRole === 'finance'
  const canAccess = isAdmin || isFinance

  const handleTestICount = async () => {
    setTestingICount(true)
    setICountStatus(null)
    
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const success = Math.random() > 0.2 // 80% success rate for demo
    setICountStatus(success ? 'success' : 'failure')
    
    toast({
      title: success ? 'iCount connection successful' : 'iCount connection failed',
      description: success ? 'API credentials are valid.' : 'Please check your API key and Company ID.',
      variant: success ? 'default' : 'destructive',
    })
    
    setTestingICount(false)
  }

  const handleTestMeckano = async () => {
    setTestingMeckano(true)
    setMeckanoStatus(null)
    
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const success = Math.random() > 0.2 // 80% success rate for demo
    setMeckanoStatus(success ? 'success' : 'failure')
    
    toast({
      title: success ? 'Meckano connection successful' : 'Meckano connection failed',
      description: success ? 'API credentials are valid.' : 'Please check your API key and Company ID.',
      variant: success ? 'default' : 'destructive',
    })
    
    setTestingMeckano(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: 'Settings saved',
      description: 'Billing settings have been updated.',
    })
    setIsSaving(false)
  }

  if (!canAccess) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Only Admin and Finance users can access billing settings.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Billing Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure iCount, Meckano, and default billing options
        </p>
      </div>

      <div className="space-y-6">
        {/* iCount Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">iCount Integration</CardTitle>
                <CardDescription>Invoice generation and accounting sync</CardDescription>
              </div>
              {iCountStatus && (
                <div className={cn(
                  'flex items-center gap-1 text-sm',
                  iCountStatus === 'success' ? 'text-green-600' : 'text-red-600'
                )}>
                  {iCountStatus === 'success' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {iCountStatus === 'success' ? 'Connected' : 'Failed'}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-4 pt-2">
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>iCount API Key</FieldLabel>
                  <p className="text-xs text-muted-foreground mb-2">Stored encrypted at rest</p>
                  <div className="relative">
                    <Input
                      type={showICountKey ? 'text' : 'password'}
                      value={config.iCountApiKey}
                      onChange={(e) => setConfig({ ...config, iCountApiKey: e.target.value })}
                      placeholder="ik_live_..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowICountKey(!showICountKey)}
                    >
                      {showICountKey ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </Field>
                <Field>
                  <FieldLabel>iCount Company ID</FieldLabel>
                  <p className="text-xs text-muted-foreground mb-2">Your iCount company identifier</p>
                  <Input
                    value={config.iCountCompanyId}
                    onChange={(e) => setConfig({ ...config, iCountCompanyId: e.target.value })}
                    placeholder="IC-12345"
                  />
                </Field>
              </div>
            </FieldGroup>
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={handleTestICount}
                disabled={testingICount}
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', testingICount && 'animate-spin')} />
                {testingICount ? 'Testing...' : 'Test iCount Connection'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Meckano Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Meckano Integration</CardTitle>
                <CardDescription>Vendor hours and payments sync</CardDescription>
              </div>
              {meckanoStatus && (
                <div className={cn(
                  'flex items-center gap-1 text-sm',
                  meckanoStatus === 'success' ? 'text-green-600' : 'text-red-600'
                )}>
                  {meckanoStatus === 'success' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {meckanoStatus === 'success' ? 'Connected' : 'Failed'}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-4 pt-2">
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Meckano API Key</FieldLabel>
                  <p className="text-xs text-muted-foreground mb-2">Stored encrypted at rest</p>
                  <div className="relative">
                    <Input
                      type={showMeckanoKey ? 'text' : 'password'}
                      value={config.meckanoApiKey}
                      onChange={(e) => setConfig({ ...config, meckanoApiKey: e.target.value })}
                      placeholder="mk_live_..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowMeckanoKey(!showMeckanoKey)}
                    >
                      {showMeckanoKey ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </Field>
                <Field>
                  <FieldLabel>Meckano Company ID</FieldLabel>
                  <p className="text-xs text-muted-foreground mb-2">Your Meckano company identifier</p>
                  <Input
                    value={config.meckanoCompanyId}
                    onChange={(e) => setConfig({ ...config, meckanoCompanyId: e.target.value })}
                    placeholder="MK-67890"
                  />
                </Field>
              </div>
            </FieldGroup>
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={handleTestMeckano}
                disabled={testingMeckano}
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', testingMeckano && 'animate-spin')} />
                {testingMeckano ? 'Testing...' : 'Test Meckano Connection'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Default Billing Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default Billing Options</CardTitle>
            <CardDescription>Pre-fill values for new invoices</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-4 pt-2">
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Default Payment Terms</FieldLabel>
                  <Select
                    value={config.defaultPaymentTerms}
                    onValueChange={(value) => setConfig({ ...config, defaultPaymentTerms: value as BillingConfig['defaultPaymentTerms'] })}
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
                <Field>
                  <FieldLabel>Default Tax Rate (%)</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={config.defaultTaxRate}
                    onChange={(e) => setConfig({ ...config, defaultTaxRate: parseFloat(e.target.value) || 0 })}
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

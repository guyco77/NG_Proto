'use client'

import { useState } from 'react'
import { Server, Eye, EyeOff, CheckCircle2, XCircle, RefreshCw, Copy, Save, Shield } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../../layout'
import { cn } from '@/lib/utils'

// SET-003: Editor Integration Config
interface EditorConfig {
  apiUrl: string
  apiKey: string
  webhookSecret: string
  webhookUrl: string // read-only, auto-generated
  isConnected: boolean
  lastSuccessfulSync?: string
}

const mockEditorConfig: EditorConfig = {
  apiUrl: 'https://editor.example.com/api/v1',
  apiKey: 'sk-editor-xxxxxxxxxxxxxxxxxxxxx',
  webhookSecret: 'whsec_xxxxxxxxxxxxxxxxxxxxxxxx',
  webhookUrl: 'https://app.ngbroadcast.com/api/webhooks/editor',
  isConnected: true,
  lastSuccessfulSync: '2024-02-28T14:30:00Z',
}

export default function EditorIntegrationPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  const [config, setConfig] = useState<EditorConfig>(mockEditorConfig)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'failure' | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const [testTimestamp, setTestTimestamp] = useState<string | null>(null)

  const isAdmin = currentRole === 'admin'
  const isIT = currentRole === 'it'
  const canAccess = isAdmin || isIT

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    setTestError(null)

    // Simulate API health check (timeout after 10s per PRD)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Simulate success/failure
    const success = Math.random() > 0.3 // 70% success rate for demo
    
    if (success) {
      setTestResult('success')
      setTestTimestamp(new Date().toISOString())
      toast({
        title: 'Connection successful',
        description: 'Editor API is responding correctly.',
      })
    } else {
      setTestResult('failure')
      setTestError('Connection refused: Unable to reach Editor API endpoint. Check endpoint URL and credentials.')
      toast({
        title: 'Connection failed',
        description: 'Unable to connect to Editor API.',
        variant: 'destructive',
      })
    }
    
    setIsTesting(false)
  }

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(config.webhookUrl)
    toast({
      title: 'Copied',
      description: 'Webhook URL copied to clipboard.',
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: 'Settings saved',
      description: 'Editor integration settings have been updated.',
    })
    setIsSaving(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC', // Prevent hydration mismatch
    })
  }

  if (!canAccess) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Only Admin and IT users can access editor integration settings.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Editor Integration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          API credentials and webhook configuration for Editor
        </p>
      </div>

      <div className="space-y-6">
        {/* Connection Status Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full',
                  config.isConnected ? 'bg-green-100' : 'bg-red-100'
                )}>
                  {config.isConnected ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'inline-flex h-2 w-2 rounded-full',
                      config.isConnected ? 'bg-green-500' : 'bg-red-500'
                    )} />
                    <span className="font-medium">
                      {config.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  {config.lastSuccessfulSync && (
                    <p className="text-sm text-muted-foreground">
                      Last successful sync: {formatDate(config.lastSuccessfulSync)}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', isTesting && 'animate-spin')} />
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={cn(
                'mt-4 rounded-lg p-3',
                testResult === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              )}>
                <div className="flex items-start gap-2">
                  {testResult === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className={cn(
                      'font-medium',
                      testResult === 'success' ? 'text-green-800' : 'text-red-800'
                    )}>
                      {testResult === 'success' ? 'Connection successful' : 'Connection failed'}
                    </p>
                    <p className={cn(
                      'text-sm',
                      testResult === 'success' ? 'text-green-700' : 'text-red-700'
                    )}>
                      {testResult === 'success'
                        ? `Last tested: ${testTimestamp ? formatDate(testTimestamp) : 'Just now'}`
                        : testError}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">API Configuration</CardTitle>
            <CardDescription>Editor API endpoint and authentication credentials</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <FieldGroup>
              <Field>
                <FieldLabel>Editor API URL</FieldLabel>
                <Input
                  value={config.apiUrl}
                  onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                  placeholder="https://editor.example.com/api/v1"
                />
              </Field>

              <Field>
                <FieldLabel>API Key / Credentials</FieldLabel>
                <p className="text-xs text-muted-foreground mb-2">
                  Stored encrypted at rest. Used to authenticate with Editor API.
                </p>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="sk-editor-..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Webhook Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Webhook Configuration</CardTitle>
            <CardDescription>Receive real-time updates from Editor</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <FieldGroup>
              <Field>
                <FieldLabel>Webhook URL</FieldLabel>
                <p className="text-xs text-muted-foreground mb-2">
                  Auto-generated endpoint. Configure this URL in your Editor settings.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={config.webhookUrl}
                    readOnly
                    className="bg-muted/50 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyWebhookUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </Field>

              <Field>
                <FieldLabel>Webhook Secret</FieldLabel>
                <p className="text-xs text-muted-foreground mb-2">
                  Used to validate incoming webhook requests from Editor.
                </p>
                <div className="relative">
                  <Input
                    type={showWebhookSecret ? 'text' : 'password'}
                    value={config.webhookSecret}
                    onChange={(e) => setConfig({ ...config, webhookSecret: e.target.value })}
                    placeholder="whsec_..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  >
                    {showWebhookSecret ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </Field>
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

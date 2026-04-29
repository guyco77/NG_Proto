'use client'

import { useState } from 'react'
import { Mail, Eye, Save, RotateCcw, Shield, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../../layout'
import { cn } from '@/lib/utils'

// SET-004: Email Templates
interface EmailTemplate {
  id: string
  name: string
  description: string
  subject: string
  body: string
  ctaText: string
  isEnabled: boolean
  availableVariables: string[]
}

const mockEmailTemplates: EmailTemplate[] = [
  {
    id: 'invite',
    name: 'User Invite',
    description: 'Sent when a new user is invited to the platform',
    subject: 'You have been invited to join {company_name}',
    body: `Hi {first_name},

You have been invited to join {company_name} as a {role}.

Click the button below to set up your account and get started.

Best regards,
The {company_name} Team`,
    ctaText: 'Set Up Account',
    isEnabled: true,
    availableVariables: ['first_name', 'company_name', 'role', 'link'],
  },
  {
    id: 'password_reset',
    name: 'Password Reset',
    description: 'Sent when a user requests a password reset',
    subject: 'Reset your {company_name} password',
    body: `Hi {first_name},

We received a request to reset your password. Click the button below to create a new password.

If you didn't request this, you can safely ignore this email.

Best regards,
The {company_name} Team`,
    ctaText: 'Reset Password',
    isEnabled: true,
    availableVariables: ['first_name', 'company_name', 'link'],
  },
  {
    id: 'quote_sent',
    name: 'Quote Sent',
    description: 'Sent to client when a new quote is created',
    subject: 'New quote from {company_name}: {project_name}',
    body: `Hi {first_name},

A new quote has been prepared for your project "{project_name}".

**Quote Details:**
- Amount: {amount} {currency}

Please review and approve the quote at your earliest convenience.

Best regards,
The {company_name} Team`,
    ctaText: 'View Quote',
    isEnabled: true,
    availableVariables: ['first_name', 'company_name', 'project_name', 'amount', 'currency', 'link'],
  },
  {
    id: 'task_assigned',
    name: 'Task Assigned',
    description: 'Sent to vendor when a task is assigned to them',
    subject: 'New task assigned: {task_name}',
    body: `Hi {first_name},

You have been assigned a new task on the project "{project_name}".

**Task Details:**
- Task: {task_name}
- Due: {due_date}

Click the button below to view the task details and get started.

Best regards,
The {company_name} Team`,
    ctaText: 'View Task',
    isEnabled: true,
    availableVariables: ['first_name', 'company_name', 'project_name', 'task_name', 'due_date', 'link'],
  },
  {
    id: 'task_submitted',
    name: 'Task Submitted',
    description: 'Sent to PM when a vendor submits a task',
    subject: 'Task submitted: {task_name}',
    body: `Hi {first_name},

A task has been submitted for review on project "{project_name}".

**Task Details:**
- Task: {task_name}
- Submitted by: {vendor_name}

Click the button below to review the submission.

Best regards,
The {company_name} Team`,
    ctaText: 'Review Task',
    isEnabled: true,
    availableVariables: ['first_name', 'company_name', 'project_name', 'task_name', 'vendor_name', 'link'],
  },
  {
    id: 'invoice_sent',
    name: 'Invoice Sent',
    description: 'Sent to client when an invoice is issued',
    subject: 'Invoice from {company_name}: {invoice_number}',
    body: `Hi {first_name},

An invoice has been issued for your project.

**Invoice Details:**
- Invoice: {invoice_number}
- Amount: {amount} {currency}
- Due: {due_date}

Click the button below to view and pay the invoice.

Best regards,
The {company_name} Team`,
    ctaText: 'View Invoice',
    isEnabled: true,
    availableVariables: ['first_name', 'company_name', 'invoice_number', 'amount', 'currency', 'due_date', 'link'],
  },
  {
    id: 'payment_processed',
    name: 'Payment Processed',
    description: 'Sent to vendor when payment is processed',
    subject: 'Payment processed: {amount} {currency}',
    body: `Hi {first_name},

Your payment has been processed successfully.

**Payment Details:**
- Amount: {amount} {currency}
- Period: {period}

Thank you for your work!

Best regards,
The {company_name} Team`,
    ctaText: 'View Payment History',
    isEnabled: true,
    availableVariables: ['first_name', 'company_name', 'amount', 'currency', 'period', 'link'],
  },
]

export default function EmailTemplatesPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockEmailTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [editedTemplate, setEditedTemplate] = useState<EmailTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isAdmin = currentRole === 'admin'

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setEditedTemplate({ ...template })
  }

  const handleResetToDefault = () => {
    if (!selectedTemplate) return
    const original = mockEmailTemplates.find(t => t.id === selectedTemplate.id)
    if (original) {
      setEditedTemplate({ ...original })
      toast({
        title: 'Template reset',
        description: 'Template has been reset to default.',
      })
    }
  }

  const handleSave = async () => {
    if (!editedTemplate) return
    setIsSaving(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setTemplates(templates.map(t => t.id === editedTemplate.id ? editedTemplate : t))
    setSelectedTemplate(editedTemplate)
    
    toast({
      title: 'Template saved',
      description: 'Email template has been updated.',
    })
    setIsSaving(false)
  }

  const handleToggleEnabled = (templateId: string, enabled: boolean) => {
    setTemplates(templates.map(t => t.id === templateId ? { ...t, isEnabled: enabled } : t))
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate({ ...selectedTemplate, isEnabled: enabled })
      if (editedTemplate) {
        setEditedTemplate({ ...editedTemplate, isEnabled: enabled })
      }
    }
    toast({
      title: enabled ? 'Template enabled' : 'Template disabled',
      description: `${templates.find(t => t.id === templateId)?.name} notifications are now ${enabled ? 'enabled' : 'suppressed'}.`,
    })
  }

  const renderPreview = (template: EmailTemplate) => {
    const sampleData: Record<string, string> = {
      first_name: 'John',
      company_name: 'NG Broadcast',
      role: 'Project Manager',
      project_name: 'Netflix Q1 Localization',
      task_name: 'Episode 1 - Subtitling ES',
      vendor_name: 'Lisa Translator',
      amount: '5,000',
      currency: 'USD',
      due_date: 'March 15, 2024',
      invoice_number: 'INV-2024-001',
      period: 'February 2024',
      link: '#',
    }
    
    let subject = template.subject
    let body = template.body
    
    Object.entries(sampleData).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
      body = body.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
    })
    
    return { subject, body }
  }

  if (!isAdmin) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access email templates.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Email Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize transactional email notifications
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Template List */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-2">
            <div className="divide-y divide-border">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={cn(
                    'w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors',
                    selectedTemplate?.id === template.id && 'bg-muted'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{template.name}</span>
                    </div>
                    {template.isEnabled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Off</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template Editor */}
        {editedTemplate ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{editedTemplate.name}</CardTitle>
                    <CardDescription>{editedTemplate.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Enabled</span>
                    <Switch
                      checked={editedTemplate.isEnabled}
                      onCheckedChange={(checked) => handleToggleEnabled(editedTemplate.id, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Subject Line</FieldLabel>
                    <Input
                      value={editedTemplate.subject}
                      onChange={(e) => setEditedTemplate({ ...editedTemplate, subject: e.target.value })}
                      placeholder="Email subject..."
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Body (Markdown)</FieldLabel>
                    <Textarea
                      value={editedTemplate.body}
                      onChange={(e) => setEditedTemplate({ ...editedTemplate, body: e.target.value })}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>CTA Button Text</FieldLabel>
                    <Input
                      value={editedTemplate.ctaText}
                      onChange={(e) => setEditedTemplate({ ...editedTemplate, ctaText: e.target.value })}
                      placeholder="Button text..."
                    />
                  </Field>
                </FieldGroup>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowPreview(true)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    <Button variant="ghost" onClick={handleResetToDefault}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset to Default
                    </Button>
                  </div>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Template'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Available Variables */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Available Variables</CardTitle>
                <CardDescription>Click to copy. Use in subject or body.</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <div className="flex flex-wrap gap-2">
                  {editedTemplate.availableVariables.map((variable) => (
                    <button
                      key={variable}
                      onClick={() => {
                        navigator.clipboard.writeText(`{${variable}}`)
                        toast({ title: 'Copied', description: `{${variable}} copied to clipboard.` })
                      }}
                      className="rounded-md bg-muted px-2 py-1 text-xs font-mono hover:bg-muted/80 transition-colors"
                    >
                      {`{${variable}}`}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Select a Template</h3>
              <p className="text-muted-foreground">Choose a template from the list to edit its content.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview with sample data. Logo and footer are always included.
            </DialogDescription>
          </DialogHeader>
          {editedTemplate && (
            <div className="border rounded-lg overflow-hidden">
              {/* Email Header */}
              <div className="bg-muted p-4 border-b">
                <div className="text-sm text-muted-foreground">Subject:</div>
                <div className="font-medium">{renderPreview(editedTemplate).subject}</div>
              </div>
              {/* Email Body */}
              <div className="p-6 bg-background">
                <div className="mb-4">
                  <div className="h-8 w-32 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                    [Company Logo]
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-sm">
                  {renderPreview(editedTemplate).body}
                </div>
                <div className="mt-6">
                  <Button size="sm">{editedTemplate.ctaText}</Button>
                </div>
              </div>
              {/* Email Footer */}
              <div className="bg-muted p-4 border-t text-center text-xs text-muted-foreground">
                <p>NG Broadcast Ltd.</p>
                <p>123 Media Street, Tel Aviv, Israel</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import { Upload, User, Save, Key, Bell, Trash2, Pencil, Check, X, RefreshCw, AlertTriangle, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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

// SET-005 / Update-006: My Profile
interface UserProfile {
  name: string
  email: string
  phone: string
  avatar?: string
  role: string
  timezone: string
}

// Update-006: Email verification state
interface EmailVerificationState {
  pendingEmail: string | null
  isVerified: boolean
  sentAt: Date | null
}

const getRoleBadgeColor = (role: string) => {
  const colors: Record<string, string> = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    pm: 'bg-blue-100 text-blue-800 border-blue-200',
    finance: 'bg-green-100 text-green-800 border-green-200',
    it: 'bg-purple-100 text-purple-800 border-purple-200',
    client: 'bg-amber-100 text-amber-800 border-amber-200',
    vendor: 'bg-teal-100 text-teal-800 border-teal-200',
  }
  return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    admin: 'Administrator',
    pm: 'Project Manager',
    finance: 'Finance',
    it: 'IT Admin',
    client: 'Client',
    vendor: 'Vendor',
  }
  return labels[role] || role
}

// Update-006: Self-contained Email Field Component
function EmailField({
  currentEmail,
  verificationState,
  onSaveEmail,
  onResendVerification,
  onCancelPendingChange,
}: {
  currentEmail: string
  verificationState: EmailVerificationState
  onSaveEmail: (newEmail: string) => Promise<void>
  onResendVerification: () => Promise<void>
  onCancelPendingChange: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedEmail, setEditedEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleStartEdit = () => {
    setEditedEmail(currentEmail)
    setIsEditing(true)
    setValidationError(null)
    // Focus the input after render
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedEmail('')
    setValidationError(null)
  }

  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    if (email.toLowerCase() === currentEmail.toLowerCase()) return 'This is already your email'
    // In real app, would check if email is already in use
    return null
  }

  const handleSaveEmail = async () => {
    const error = validateEmail(editedEmail)
    if (error) {
      setValidationError(error)
      return
    }

    setIsSaving(true)
    try {
      await onSaveEmail(editedEmail)
      setIsEditing(false)
      setEditedEmail('')
    } catch (err) {
      setValidationError('Failed to save email. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      await onResendVerification()
    } finally {
      setIsResending(false)
    }
  }

  const hasPendingChange = !!verificationState.pendingEmail

  return (
    <div className="space-y-3">
      {/* Email field row */}
      <div className="space-y-2">
        <FieldLabel>Email</FieldLabel>
        
        {isEditing ? (
          // Update-006: Edit state - inline editor
          <div className="space-y-3">
            <Input
              ref={inputRef}
              type="email"
              value={editedEmail}
              onChange={(e) => {
                setEditedEmail(e.target.value)
                setValidationError(null)
              }}
              className={cn(validationError && 'border-destructive')}
              placeholder="Enter new email address"
            />
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleSaveEmail}
                disabled={isSaving || !editedEmail}
              >
                {isSaving ? 'Saving...' : 'Save email'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // Update-006: Read-only state with pen icon and badges
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{currentEmail}</span>
            
            {/* Verified / Pending badge */}
            {hasPendingChange ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Clock className="h-3 w-3 mr-1" />
                Pending verification — {verificationState.pendingEmail}
              </Badge>
            ) : verificationState.isVerified ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : null}
            
            {/* Edit button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleStartEdit}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit email</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Resend link for pending */}
            {hasPendingChange && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-primary"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? 'Resending...' : 'Resend'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Update-006: Pending verification banner */}
      {hasPendingChange && !isEditing && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <p className="mb-2">
              We&apos;ve sent a verification link to <strong>{verificationState.pendingEmail}</strong>. 
              Your email will be updated once you click the link. Until then, you&apos;ll continue to sign in with <strong>{currentEmail}</strong>.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleResend}
                disabled={isResending}
              >
                <RefreshCw className={cn("h-3 w-3 mr-1", isResending && "animate-spin")} />
                Resend email
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleStartEdit}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Change email
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={onCancelPendingChange}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel pending change
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default function MyProfilePage() {
  const { currentRole, userName } = useRole()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Auto-detect timezone from browser
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  
  const [profile, setProfile] = useState<UserProfile>({
    name: userName,
    email: `${currentRole}@guno.studio`,
    phone: '+972-50-123-4567',
    avatar: undefined,
    role: currentRole,
    timezone: detectedTimezone,
  })
  
  // Update-006: Email verification state (separate from profile)
  const [emailVerification, setEmailVerification] = useState<EmailVerificationState>({
    pendingEmail: null,
    isVerified: true,
    sentAt: null,
  })
  
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(profile.avatar)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  
  // Password change form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        description: 'Avatar must be smaller than 2 MB.',
        variant: 'destructive',
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Update-006: Save profile does NOT include email anymore
  const handleSaveProfile = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: 'Profile updated',
      description: 'Your name and phone have been saved successfully.',
    })
    setIsSaving(false)
  }

  // Update-006: Handle email save - sends verification
  const handleSaveEmail = async (newEmail: string) => {
    // Simulate sending verification email
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Set pending state
    setEmailVerification({
      pendingEmail: newEmail,
      isVerified: true, // current email is still verified
      sentAt: new Date(),
    })
    
    toast({
      title: 'Verification email sent',
      description: `We've sent a verification link to ${newEmail}. Check your inbox.`,
    })
  }

  // Update-006: Resend verification email
  const handleResendVerification = async () => {
    if (!emailVerification.pendingEmail) return
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setEmailVerification({
      ...emailVerification,
      sentAt: new Date(),
    })
    
    toast({
      title: 'Verification email resent',
      description: `We've sent another verification link to ${emailVerification.pendingEmail}.`,
    })
  }

  // Update-006: Cancel pending email change
  const handleCancelPendingChange = () => {
    setEmailVerification({
      pendingEmail: null,
      isVerified: true,
      sentAt: null,
    })
    
    toast({
      title: 'Email change cancelled',
      description: 'Your email will remain unchanged.',
    })
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'New password and confirmation must match.',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < 12) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 12 characters.',
        variant: 'destructive',
      })
      return
    }

    setIsChangingPassword(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: 'Password changed',
      description: 'Your password has been updated successfully.',
    })
    
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowPasswordModal(false)
    setIsChangingPassword(false)
  }

  return (
    <div className="p-6 max-w-3xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <Card className="pb-0">
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
            <CardDescription>Update your name, contact details, and avatar</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="flex items-start gap-6 mb-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/30 overflow-hidden">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground/50" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <div className="flex flex-col gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-3 w-3" />
                    Upload
                  </Button>
                  {avatarPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive text-xs"
                      onClick={handleRemoveAvatar}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              {/* Name and Role */}
              <div className="flex-1">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Role</FieldLabel>
                    <div className="flex items-center gap-2 h-9">
                      <Badge className={cn('border', getRoleBadgeColor(profile.role))}>
                        {getRoleLabel(profile.role)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">(Read-only)</span>
                    </div>
                  </Field>
                </FieldGroup>
              </div>
            </div>

            <FieldGroup>
              {/* Update-006: Email field is now a self-contained component */}
              <EmailField
                currentEmail={profile.email}
                verificationState={emailVerification}
                onSaveEmail={handleSaveEmail}
                onResendVerification={handleResendVerification}
                onCancelPendingChange={handleCancelPendingChange}
              />
              
              <Field>
                <FieldLabel>Phone</FieldLabel>
                <Input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </Field>
              
              <Field>
                <FieldLabel>Timezone</FieldLabel>
                <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-muted/50 text-sm text-muted-foreground">
                  {profile.timezone}
                  <span className="text-xs">(auto-detected from browser)</span>
                </div>
              </Field>
            </FieldGroup>

            {/* Update-006: Save Changes only saves Name/Phone/Avatar, NOT email */}
            <div className="flex justify-end mt-6">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="pt-5 pb-0">
          <CardHeader>
            <CardTitle className="text-base">Security</CardTitle>
            <CardDescription>Manage your password</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  Last changed: 30 days ago
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences Link */}
        <Card className="pb-0">
          <CardHeader>
            <CardTitle className="text-base">Notification Preferences</CardTitle>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <Link href="/settings/notifications">
              <Button variant="outline">
                <Bell className="mr-2 h-4 w-4" />
                Manage Notifications
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one. Password must be at least 12 characters with uppercase, numbers, and special characters.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Current Password</FieldLabel>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>New Password</FieldLabel>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Confirm New Password</FieldLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

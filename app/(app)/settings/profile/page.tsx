'use client'

import { useState, useRef } from 'react'
import { Upload, User, Save, Key, Bell, Trash2, Mail, Check } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

// SET-005: My Profile
interface UserProfile {
  name: string
  email: string
  phone: string
  avatar?: string
  role: string
  timezone: string
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
  
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(profile.avatar)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  
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

  const handleSaveProfile = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: 'Profile updated',
      description: 'Your profile has been saved successfully.',
    })
    setIsSaving(false)
  }

  const handleEmailChange = () => {
    if (!newEmail || newEmail === profile.email) return
    setShowEmailChangeModal(true)
  }

  const handleSendVerification = async () => {
    // Simulate sending verification email
    await new Promise(resolve => setTimeout(resolve, 1000))
    setEmailVerificationSent(true)
    toast({
      title: 'Verification email sent',
      description: `A verification link has been sent to ${newEmail}`,
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
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={newEmail || profile.email}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                    {newEmail && newEmail !== profile.email && (
                      <Button variant="outline" size="icon" onClick={handleEmailChange}>
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Email changes require verification
                  </p>
                </Field>
                <Field>
                  <FieldLabel>Phone</FieldLabel>
                  <Input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel>Timezone</FieldLabel>
                <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-muted/50 text-sm text-muted-foreground">
                  {profile.timezone}
                  <span className="text-xs">(auto-detected from browser)</span>
                </div>
              </Field>
            </FieldGroup>

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

      {/* Email Change Verification Modal */}
      <Dialog open={showEmailChangeModal} onOpenChange={setShowEmailChangeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify New Email</DialogTitle>
            <DialogDescription>
              We&apos;ll send a verification link to your new email address.
            </DialogDescription>
          </DialogHeader>
          {emailVerificationSent ? (
            <div className="py-6 text-center">
              <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="font-medium">Verification email sent!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click the link in the email sent to <strong>{newEmail}</strong> to confirm your new address.
              </p>
            </div>
          ) : (
            <>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  Current email: <strong>{profile.email}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  New email: <strong>{newEmail}</strong>
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowEmailChangeModal(false)
                  setEmailVerificationSent(false)
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSendVerification}>
                  Send Verification Email
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

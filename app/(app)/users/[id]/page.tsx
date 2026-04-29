'use client'

import { use, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  Building2,
  Edit2,
  Save,
  X,
  KeyRound,
  UserX,
  UserCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../../layout'
import { mockUsers, mockClients, mockVendors, mockAuditLog, USER_ROLES, USER_STATUSES, formatDate, formatDateTime } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types'

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  pm: 'bg-blue-100 text-blue-800 border-blue-200',
  client: 'bg-green-100 text-green-800 border-green-200',
  vendor: 'bg-orange-100 text-orange-800 border-orange-200',
  finance: 'bg-teal-100 text-teal-800 border-teal-200',
  it: 'bg-indigo-100 text-indigo-800 border-indigo-200',
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  pending_setup: 'bg-amber-100 text-amber-800 border-amber-200',
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  const user = mockUsers.find((u) => u.id === id) || mockUsers[0]
  const linkedEntity = user.entityType === 'client' 
    ? mockClients.find(c => c.id === user.linkedEntityId)
    : user.entityType === 'vendor'
    ? mockVendors.find(v => v.id === user.linkedEntityId)
    : null
  
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true')
  const [editForm, setEditForm] = useState({
    name: user.name,
    phone: user.phone || '',
    linkedEntityId: user.linkedEntityId || '',
  })
  const [isSaving, setIsSaving] = useState(false)
  
  // Role change modal
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [newRole, setNewRole] = useState<UserRole>(user.role)
  const [newLinkedEntityId, setNewLinkedEntityId] = useState('')
  const [isChangingRole, setIsChangingRole] = useState(false)
  
  // Deactivate/Reactivate dialogs
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [showReactivateDialog, setShowReactivateDialog] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  
  // Password reset dialog
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  
  // Resend invite dialog
  const [showResendInviteDialog, setShowResendInviteDialog] = useState(false)
  const [isResendingInvite, setIsResendingInvite] = useState(false)
  
  const isAdmin = currentRole === 'admin'
  const isIT = currentRole === 'it'
  const canManageUsers = isAdmin || isIT
  
  // Get active admin count
  const activeAdminCount = mockUsers.filter(u => u.role === 'admin' && u.status === 'active').length
  const isLastAdmin = user.role === 'admin' && user.status === 'active' && activeAdminCount === 1
  
  // Get user activity log
  const userAuditLog = useMemo(() => {
    return mockAuditLog.filter(entry => 
      entry.targetId === user.id || entry.actorId === user.id
    ).slice(0, 10)
  }, [user.id])

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    toast({ title: 'User Updated', description: 'User profile has been updated.' })
    setIsSaving(false)
    setIsEditing(false)
  }

  const handleRoleChange = async () => {
    // Validate last admin protection
    if (user.role === 'admin' && newRole !== 'admin' && isLastAdmin) {
      toast({ 
        title: 'Error', 
        description: 'Cannot remove the last Admin role. Assign another Admin first.',
        variant: 'destructive' 
      })
      return
    }
    
    // Validate entity association for client/vendor
    if ((newRole === 'client' || newRole === 'vendor') && !newLinkedEntityId) {
      toast({ 
        title: 'Error', 
        description: `Please select a ${newRole} to associate with this user.`,
        variant: 'destructive' 
      })
      return
    }
    
    setIsChangingRole(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({ title: 'Role Updated', description: `${user.name}'s role has been changed to ${USER_ROLES.find(r => r.value === newRole)?.label}. Email notification sent.` })
    setIsChangingRole(false)
    setShowRoleModal(false)
  }

  const handleDeactivate = async () => {
    // Validate self-deactivation
    if (user.id === '1' && currentRole === 'admin') { // Simplified check for mock
      toast({ 
        title: 'Error', 
        description: 'You cannot deactivate your own account.',
        variant: 'destructive' 
      })
      setShowDeactivateDialog(false)
      return
    }
    
    // Validate last admin
    if (isLastAdmin) {
      toast({ 
        title: 'Error', 
        description: 'Cannot deactivate the last Admin. Assign another Admin first.',
        variant: 'destructive' 
      })
      setShowDeactivateDialog(false)
      return
    }
    
    setIsDeactivating(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({ title: 'User Deactivated', description: `${user.name} has been deactivated. All active sessions terminated.` })
    setIsDeactivating(false)
    setShowDeactivateDialog(false)
  }

  const handleReactivate = async () => {
    setIsDeactivating(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    toast({ title: 'User Reactivated', description: `${user.name} has been reactivated.` })
    setIsDeactivating(false)
    setShowReactivateDialog(false)
  }

  const handleResetPassword = async () => {
    setIsResettingPassword(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({ title: 'Password Reset Sent', description: `Password reset email sent to ${user.email}.` })
    setIsResettingPassword(false)
    setShowResetPasswordDialog(false)
  }

  const handleResendInvite = async () => {
    setIsResendingInvite(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({ title: 'Invite Resent', description: `Invite email resent to ${user.email}.` })
    setIsResendingInvite(false)
    setShowResendInviteDialog(false)
  }

  // Only Admin/IT can access
  if (!canManageUsers) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
          <p className="mt-1 text-sm text-muted-foreground">You do not have permission to view user profiles.</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {user.name.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-foreground">{user.name}</h1>
                  <span className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    roleColors[user.role]
                  )}>
                    {USER_ROLES.find(r => r.value === user.role)?.label}
                  </span>
                  <span className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    statusColors[user.status]
                  )}>
                    {USER_STATUSES.find(s => s.value === user.status)?.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          placeholder="+1-555-0100"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user.email} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                    </div>
                    {(user.entityType === 'client' || user.entityType === 'vendor') && (
                      <div className="space-y-2">
                        <Label>Associated {user.entityType === 'client' ? 'Client' : 'Vendor'}</Label>
                        <Select 
                          value={editForm.linkedEntityId} 
                          onValueChange={(v) => setEditForm({ ...editForm, linkedEntityId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {user.entityType === 'client' ? (
                              mockClients.filter(c => c.status === 'active').map((client) => (
                                <SelectItem key={client.id} value={client.id}>{client.displayName}</SelectItem>
                              ))
                            ) : (
                              mockVendors.filter(v => v.status === 'active').map((vendor) => (
                                <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{user.phone || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <p className="font-medium">{USER_ROLES.find(r => r.value === user.role)?.label}</p>
                      </div>
                    </div>
                    {user.linkedEntityName && (
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {user.entityType === 'client' ? 'Client' : 'Vendor'}
                          </p>
                          <Link 
                            href={`/${user.entityType === 'client' ? 'clients' : 'vendors'}/${user.linkedEntityId}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {user.linkedEntityName}
                          </Link>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="font-medium">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Last Login</p>
                        <p className="font-medium">
                          {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                {userAuditLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity recorded.</p>
                ) : (
                  <div className="space-y-4">
                    {userAuditLog.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0">
                        <div className="mt-0.5 h-2 w-2 rounded-full bg-primary/50" />
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{entry.actorName}</span>
                            {' '}{entry.action.replace(/_/g, ' ')}{' '}
                            {entry.targetName && (
                              <span className="text-primary">{entry.targetName}</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(entry.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Change Role */}
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => { setNewRole(user.role); setNewLinkedEntityId(user.linkedEntityId || ''); setShowRoleModal(true) }}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Change Role
                </Button>
                
                {/* Reset Password - hidden for SSO-only users */}
                {user.isSSOOnly ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button variant="outline" className="w-full justify-start" disabled>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Reset Password
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This user authenticates via SSO and has no password login.</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowResetPasswordDialog(true)}
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    Reset Password
                  </Button>
                )}
                
                {/* Resend Invite - only for pending users */}
                {user.status === 'pending_setup' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowResendInviteDialog(true)}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Invite
                  </Button>
                )}
                
                {/* Deactivate / Reactivate */}
                {user.status === 'inactive' ? (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-green-600 hover:text-green-700"
                    onClick={() => setShowReactivateDialog(true)}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Reactivate User
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={() => setShowDeactivateDialog(true)}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate User
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Last Admin Warning */}
            {isLastAdmin && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Last Active Admin</p>
                      <p className="text-xs text-amber-700 mt-1">
                        This user cannot be deactivated or have their role changed until another Admin is assigned.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Change Role Modal */}
        <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Role</DialogTitle>
              <DialogDescription>
                Change {user.name}&apos;s role. This will take effect on their next page load.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Current Role</Label>
                <p className="text-sm font-medium">{USER_ROLES.find(r => r.value === user.role)?.label}</p>
              </div>
              <div className="space-y-2">
                <Label>New Role</Label>
                <Select value={newRole} onValueChange={(v) => { setNewRole(v as UserRole); setNewLinkedEntityId('') }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newRole === 'client' && (
                <div className="space-y-2">
                  <Label>Associated Client</Label>
                  <Select value={newLinkedEntityId} onValueChange={setNewLinkedEntityId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockClients.filter(c => c.status === 'active').map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {newRole === 'vendor' && (
                <div className="space-y-2">
                  <Label>Associated Vendor</Label>
                  <Select value={newLinkedEntityId} onValueChange={setNewLinkedEntityId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockVendors.filter(v => v.status === 'active').map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Warning when changing from Client/Vendor to internal role */}
              {(user.entityType === 'client' || user.entityType === 'vendor') && 
               !['client', 'vendor'].includes(newRole) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-800">
                    This will remove the entity association for {user.name}.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRoleModal(false)}>Cancel</Button>
              <Button onClick={handleRoleChange} disabled={isChangingRole || newRole === user.role}>
                {isChangingRole ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm Change
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deactivate Dialog */}
        <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate {user.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                All active sessions will be terminated immediately. The user will not be able to log in until reactivated.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeactivate}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeactivating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                Deactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reactivate Dialog */}
        <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reactivate {user.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will restore the user&apos;s access to GUNO Studio. They will be able to log in again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReactivate}>
                {isDeactivating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                Reactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset Password Dialog */}
        <AlertDialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Password</AlertDialogTitle>
              <AlertDialogDescription>
                Send a password reset email to {user.email}? The link will expire in 1 hour.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetPassword}>
                {isResettingPassword ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Email
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Resend Invite Dialog */}
        <AlertDialog open={showResendInviteDialog} onOpenChange={setShowResendInviteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resend Invite</AlertDialogTitle>
              <AlertDialogDescription>
                Resend the invite email to {user.email}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResendInvite}>
                {isResendingInvite ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                Resend Invite
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}

'use client'

import { useState, useMemo } from 'react'
import {
  UserPlus,
  Upload,
  MoreHorizontal,
  Users,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { Input } from '@/components/ui/input'
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
import { mockClientUsers, CLIENT_ROLES } from '@/lib/mock-data'
import { useRole } from '../layout'
import { useToast } from '@/hooks/use-toast'
import type { ClientUser, ClientRole } from '@/lib/types'

// CLIENT-002: Client Admin self-service team management page
// This page is only visible to Client role users
// Client Admin can invite, edit roles, and deactivate their own team members

export default function MyTeamPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  
  // For demo, simulate being a Client Admin for client c1 (Netflix)
  const currentClientId = 'c1'
  const isClientAdmin = true // In reality, check if current user's clientRole === 'client_admin'
  
  // Get team members for this client
  const teamMembers = useMemo(() => {
    return mockClientUsers.filter((u) => u.clientId === currentClientId)
  }, [])
  
  // Dialog states
  const [inviteDialog, setInviteDialog] = useState(false)
  const [editRoleDialog, setEditRoleDialog] = useState(false)
  const [deactivateDialog, setDeactivateDialog] = useState(false)
  const [importCSVDialog, setImportCSVDialog] = useState(false)
  
  // Form states
  const [newMember, setNewMember] = useState({ name: '', email: '', clientRole: 'viewer' as ClientRole })
  const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null)
  const [newRole, setNewRole] = useState<ClientRole>('viewer')
  const [isInviting, setIsInviting] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  
  // Access control: Only Client role can see this page
  if (currentRole !== 'client') {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            This page is only accessible to client users.
          </p>
        </div>
      </div>
    )
  }

  const handleInviteMember = async () => {
    if (!newMember.name || !newMember.email) return
    
    setIsInviting(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsInviting(false)
    setInviteDialog(false)
    setNewMember({ name: '', email: '', clientRole: 'viewer' })
    toast({
      title: 'Invite Sent',
      description: `Invite sent to ${newMember.email}. They will receive an email to set up their account.`,
    })
  }

  const handleEditRole = (user: ClientUser) => {
    // Client Admin cannot change their own role
    if (user.clientRole === 'client_admin') {
      toast({
        title: 'Cannot Edit',
        description: 'You cannot change your own role.',
        variant: 'destructive',
      })
      return
    }
    setSelectedUser(user)
    setNewRole(user.clientRole)
    setEditRoleDialog(true)
  }

  const handleSaveRole = async () => {
    if (!selectedUser) return
    await new Promise(resolve => setTimeout(resolve, 500))
    setEditRoleDialog(false)
    toast({
      title: 'Role Updated',
      description: `${selectedUser.name}'s role has been updated to ${CLIENT_ROLES.find(r => r.value === newRole)?.label}.`,
    })
    setSelectedUser(null)
  }

  const handleDeactivateUser = (user: ClientUser) => {
    // Client Admin cannot deactivate themselves
    if (user.clientRole === 'client_admin') {
      toast({
        title: 'Cannot Deactivate',
        description: 'You cannot deactivate yourself.',
        variant: 'destructive',
      })
      return
    }
    setSelectedUser(user)
    setDeactivateDialog(true)
  }

  const handleConfirmDeactivate = async () => {
    if (!selectedUser) return
    
    setIsDeactivating(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsDeactivating(false)
    setDeactivateDialog(false)
    toast({
      title: 'User Deactivated',
      description: `${selectedUser.name} has been deactivated and can no longer access the portal.`,
    })
    setSelectedUser(null)
  }

  const handleReactivateUser = async (user: ClientUser) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    toast({
      title: 'User Reactivated',
      description: `${user.name} has been reactivated and can now access the portal again.`,
    })
  }

  const handleResendInvite = async (user: ClientUser) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    toast({
      title: 'Invite Resent',
      description: `Invitation resent to ${user.email}.`,
    })
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Team</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organization&apos;s team members and their access levels
          </p>
        </div>
        {isClientAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setImportCSVDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={() => setInviteDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        )}
      </div>

      {/* Team Members Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({teamMembers.length})
          </CardTitle>
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
              {teamMembers.map((user) => {
                const roleInfo = CLIENT_ROLES.find((r) => r.value === user.clientRole)
                const isCurrentUser = user.clientRole === 'client_admin' // For demo, assume current user is the client_admin
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name}</span>
                        {isCurrentUser && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">You</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div>
                        <span className="text-sm font-medium">{roleInfo?.label || user.clientRole}</span>
                        {roleInfo?.description && (
                          <p className="text-xs text-muted-foreground">{roleInfo.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status === 'pending_setup' ? 'pending' : user.status} />
                    </TableCell>
                    <TableCell>
                      {isClientAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleEditRole(user)}
                              disabled={isCurrentUser}
                            >
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'active' ? (
                              <DropdownMenuItem 
                                className="text-destructive" 
                                onClick={() => handleDeactivateUser(user)}
                                disabled={isCurrentUser}
                              >
                                Deactivate
                              </DropdownMenuItem>
                            ) : user.status === 'inactive' ? (
                              <DropdownMenuItem onClick={() => handleReactivateUser(user)}>
                                Reactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleResendInvite(user)}>
                                Resend Invite
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {teamMembers.length === 0 && (
            <div className="flex h-32 items-center justify-center">
              <div className="text-center">
                <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No team members yet. Invite your first user.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to a new team member. They will receive an email to set up their account.
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
              <label className="text-sm font-medium">Role</label>
              <Select
                value={newMember.clientRole}
                onValueChange={(value) => setNewMember({ ...newMember, clientRole: value as ClientRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_ROLES.filter(r => r.value !== 'client_admin').map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <span>{role.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">- {role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Note: Only existing Client Admins can invite new Client Admins. Contact your account manager if needed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialog(false)} disabled={isInviting}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={isInviting || !newMember.name || !newMember.email}>
              {isInviting ? 'Sending...' : 'Send Invite'}
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
              Change {selectedUser?.name}&apos;s role. Changes take effect on their next page load.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Role</label>
            <Select value={newRole} onValueChange={(value) => setNewRole(value as ClientRole)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_ROLES.filter(r => r.value !== 'client_admin').map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div>
                      <span>{role.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">- {role.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveRole}>Save Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateDialog} onOpenChange={setDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {selectedUser?.name}? They will immediately lose access to the portal. You can reactivate them later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeactivate} disabled={isDeactivating} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeactivating ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import CSV Dialog */}
      <Dialog open={importCSVDialog} onOpenChange={setImportCSVDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Team Members</DialogTitle>
            <DialogDescription>
              Upload a CSV file with team member information. The file should have columns: name, email, client_role (task_owner, reviewer, or viewer).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Drag and drop a CSV file here, or click to browse
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="mt-4">
                Browse Files
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Example CSV format:<br />
              <code className="bg-muted px-1 py-0.5 rounded">name,email,client_role</code><br />
              <code className="bg-muted px-1 py-0.5 rounded">John Doe,john@company.com,reviewer</code>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportCSVDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  MoreHorizontal,
  Upload,
  Download,
  FileText,
  Users,
  Clock,
  Filter,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../layout'
import { mockUsers, mockClients, mockVendors, mockAuditLog, USER_ROLES, USER_STATUSES, formatDate, formatDateTime } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { UserRole, UserStatus, UserEntityType } from '@/lib/types'

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

const moduleIcons: Record<string, string> = {
  auth: 'text-blue-600',
  users: 'text-purple-600',
  projects: 'text-green-600',
  tasks: 'text-orange-600',
  billing: 'text-teal-600',
  clients: 'text-pink-600',
  vendors: 'text-amber-600',
}

export default function UsersPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('users')
  
  // User list state
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all')
  
  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'pm' as UserRole, linkedEntityId: '' })
  const [isInviting, setIsInviting] = useState(false)
  
  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  
  // Audit log state
  const [auditModuleFilter, setAuditModuleFilter] = useState<string>('all')
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all')
  const [auditSearch, setAuditSearch] = useState('')
  const [auditDateFrom, setAuditDateFrom] = useState<string>('')
  const [auditDateTo, setAuditDateTo] = useState<string>('')
  const [auditPage, setAuditPage] = useState(1)
  const AUDIT_PAGE_SIZE = 50
  
  const isAdmin = currentRole === 'admin'
  const isIT = currentRole === 'it'
  const canManageUsers = isAdmin || isIT

  // Filter users
  const filteredUsers = useMemo(() => {
    return mockUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      const matchesEntityType = entityTypeFilter === 'all' || user.entityType === entityTypeFilter
      return matchesSearch && matchesRole && matchesStatus && matchesEntityType
    })
  }, [searchQuery, roleFilter, statusFilter, entityTypeFilter])
  
  // Filter audit log
  const filteredAuditLog = useMemo(() => {
    const filtered = mockAuditLog.filter((entry) => {
      const matchesModule = auditModuleFilter === 'all' || entry.module === auditModuleFilter
      const matchesAction = auditActionFilter === 'all' || entry.action.includes(auditActionFilter)
      const matchesSearch = auditSearch === '' || 
        entry.actorName.toLowerCase().includes(auditSearch.toLowerCase()) ||
        entry.targetName?.toLowerCase().includes(auditSearch.toLowerCase()) ||
        entry.action.toLowerCase().includes(auditSearch.toLowerCase())
      
      // Date range filter
      let matchesDate = true
      if (auditDateFrom || auditDateTo) {
        const entryDate = new Date(entry.timestamp)
        if (auditDateFrom && entryDate < new Date(auditDateFrom)) matchesDate = false
        if (auditDateTo && entryDate > new Date(auditDateTo + 'T23:59:59')) matchesDate = false
      }
      
      return matchesModule && matchesAction && matchesSearch && matchesDate
    })
    return filtered
  }, [auditModuleFilter, auditActionFilter, auditSearch, auditDateFrom, auditDateTo])
  
  // Paginated audit log
  const totalAuditPages = Math.ceil(filteredAuditLog.length / AUDIT_PAGE_SIZE)
  const paginatedAuditLog = useMemo(() => {
    const start = (auditPage - 1) * AUDIT_PAGE_SIZE
    return filteredAuditLog.slice(start, start + AUDIT_PAGE_SIZE)
  }, [filteredAuditLog, auditPage])

  const handleInviteUser = async () => {
    if (!inviteForm.name || !inviteForm.email) {
      toast({ title: 'Error', description: 'Name and email are required.', variant: 'destructive' })
      return
    }
    
    // Check if email already exists
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === inviteForm.email.toLowerCase())
    if (existingUser) {
      toast({ title: 'Error', description: 'A user with this email already exists.', variant: 'destructive' })
      return
    }
    
    // Check if Client/Vendor role needs linked entity
    if ((inviteForm.role === 'client' || inviteForm.role === 'vendor') && !inviteForm.linkedEntityId) {
      toast({ title: 'Error', description: `Please select a ${inviteForm.role} to associate with this user.`, variant: 'destructive' })
      return
    }
    
    setIsInviting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({ title: 'Invite Sent', description: `Invite sent to ${inviteForm.email}.` })
    setShowInviteModal(false)
    setInviteForm({ name: '', email: '', role: 'pm', linkedEntityId: '' })
    setIsInviting(false)
  }
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.name.endsWith('.csv')) {
      toast({ title: 'Error', description: 'Invalid file format. Please upload a .csv file.', variant: 'destructive' })
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'File size exceeds 5MB limit.', variant: 'destructive' })
      return
    }
    
    setImportFile(file)
    // Simulate parsing
    setImportPreview([
      { name: 'John Doe', email: 'john@example.com', role: 'PM', status: 'valid' },
      { name: 'Jane Smith', email: 'jane@example.com', role: 'Client', client_or_vendor: 'Netflix Inc.', status: 'valid' },
      { name: 'Invalid User', email: 'invalid', role: 'PM', status: 'error', error: 'Invalid email format' },
    ])
  }
  
  const handleImportUsers = async () => {
    const validRows = importPreview.filter(r => r.status === 'valid')
    if (validRows.length === 0) {
      toast({ title: 'Error', description: 'No valid rows to import.', variant: 'destructive' })
      return
    }
    
    setIsImporting(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    toast({ title: 'Import Complete', description: `${validRows.length} users imported. Invite emails sent.` })
    setShowImportModal(false)
    setImportFile(null)
    setImportPreview([])
    setIsImporting(false)
  }

  const downloadTemplate = () => {
    const csvContent = 'name,email,role,client_or_vendor,phone\nJohn Doe,john@example.com,PM,,+1-555-0100\nJane Client,jane@client.com,Client,Netflix Inc.,+1-555-0101'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'user_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatLastActive = (dateStr?: string) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateStr)
  }

  // Only Admin/IT can access this page
  if (!canManageUsers) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
          <p className="mt-1 text-sm text-muted-foreground">You do not have permission to access User Management.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{mockUsers.length} total users</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Users
          </Button>
          <Button onClick={() => setShowInviteModal(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Tabs: Users List | Audit Log */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="audit-log" className="gap-2">
            <FileText className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Users List Tab */}
        <TabsContent value="users">
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {USER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="px-4 py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Linked Entity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No users found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <Link href={`/users/${user.id}`} className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {user.name.split(' ').map((n) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <span className={cn(
                            'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            roleColors[user.role]
                          )}>
                            {USER_ROLES.find(r => r.value === user.role)?.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.linkedEntityName || '—'}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            statusColors[user.status]
                          )}>
                            {USER_STATUSES.find(s => s.value === user.status)?.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatLastActive(user.lastLoginAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/users/${user.id}`}>View Profile</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/users/${user.id}?edit=true`}>Edit User</Link>
                              </DropdownMenuItem>
                              {!user.isSSOOnly && (
                                <DropdownMenuItem>Reset Password</DropdownMenuItem>
                              )}
                              {user.status === 'pending_setup' && (
                                <DropdownMenuItem>Resend Invite</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {user.status === 'inactive' ? (
                                <DropdownMenuItem>Reactivate User</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-destructive">Deactivate User</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit-log">
          {/* Audit Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search audit log..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Select value={auditModuleFilter} onValueChange={setAuditModuleFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="clients">Clients</SelectItem>
                <SelectItem value="vendors">Vendors</SelectItem>
              </SelectContent>
            </Select>
            <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="invited">User Invited</SelectItem>
                <SelectItem value="deactivated">Deactivated</SelectItem>
                <SelectItem value="role_changed">Role Changed</SelectItem>
                <SelectItem value="password_reset">Password Reset</SelectItem>
                <SelectItem value="status_changed">Status Changed</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Date Range
                  {(auditDateFrom || auditDateTo) && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">1</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="start">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">From</label>
                      <input
                        type="date"
                        value={auditDateFrom}
                        onChange={(e) => { setAuditDateFrom(e.target.value); setAuditPage(1) }}
                        className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">To</label>
                      <input
                        type="date"
                        value={auditDateTo}
                        onChange={(e) => { setAuditDateTo(e.target.value); setAuditPage(1) }}
                        className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                      />
                    </div>
                  </div>
                  {(auditDateFrom || auditDateTo) && (
                    <Button variant="ghost" size="sm" onClick={() => { setAuditDateFrom(''); setAuditDateTo(''); setAuditPage(1) }} className="w-full text-xs">
                      Clear dates
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Audit Log Table */}
          <Card>
            <CardContent className="px-4 py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-44">Timestamp</TableHead>
                    <TableHead className="w-24">Module</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAuditLog.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No audit log entries found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAuditLog.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateTime(entry.timestamp)}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium capitalize',
                            moduleIcons[entry.module]
                          )}>
                            {entry.module}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{entry.actorName}</span>
                            <span className="text-xs text-muted-foreground">{entry.actorRole}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium capitalize">
                          {entry.action.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell>
                          {entry.targetName ? (
                            <Link 
                              href={`/${entry.targetType === 'user' ? 'users' : entry.targetType === 'project' ? 'projects' : entry.targetType === 'task' ? 'tasks' : entry.targetType === 'invoice' ? 'billing' : entry.targetType === 'client' ? 'clients' : 'vendors'}/${entry.targetId}`}
                              className="text-primary hover:underline"
                            >
                              {entry.targetName}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {entry.details || '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Pagination */}
          {totalAuditPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((auditPage - 1) * AUDIT_PAGE_SIZE) + 1} - {Math.min(auditPage * AUDIT_PAGE_SIZE, filteredAuditLog.length)} of {filteredAuditLog.length} entries
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                  disabled={auditPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {auditPage} of {totalAuditPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAuditPage(p => Math.min(totalAuditPages, p + 1))}
                  disabled={auditPage === totalAuditPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Invite User Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invite email to add a new user to GUNO Studio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Name</Label>
              <Input
                id="invite-name"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v as UserRole, linkedEntityId: '' })}>
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
            {inviteForm.role === 'client' && (
              <div className="space-y-2">
                <Label htmlFor="invite-client">Associated Client</Label>
                <Select value={inviteForm.linkedEntityId} onValueChange={(v) => setInviteForm({ ...inviteForm, linkedEntityId: v })}>
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
            {inviteForm.role === 'vendor' && (
              <div className="space-y-2">
                <Label htmlFor="invite-vendor">Associated Vendor</Label>
                <Select value={inviteForm.linkedEntityId} onValueChange={(v) => setInviteForm({ ...inviteForm, linkedEntityId: v })}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button onClick={handleInviteUser} disabled={isInviting}>
              {isInviting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invite'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Users Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Users from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import users. Maximum 500 rows.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Download Template */}
            <Button variant="link" className="px-0" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
            
            {/* File Upload */}
            {!importFile ? (
              <div className="rounded-lg border-2 border-dashed border-border p-8">
                <div className="text-center">
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drag and drop a CSV file, or
                  </p>
                  <label className="mt-2 inline-block cursor-pointer">
                    <span className="text-sm font-medium text-primary hover:underline">Browse</span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{importFile.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setImportFile(null); setImportPreview([]) }}>
                    Remove
                  </Button>
                </div>
                
                {/* Preview Table */}
                {importPreview.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm">
                      <span className="font-medium text-green-600">{importPreview.filter(r => r.status === 'valid').length} valid</span>
                      {' · '}
                      <span className="font-medium text-red-600">{importPreview.filter(r => r.status === 'error').length} errors</span>
                    </p>
                    <div className="max-h-60 overflow-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Client/Vendor</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importPreview.map((row, i) => (
                            <TableRow key={i} className={row.status === 'error' ? 'bg-red-50' : ''}>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>{row.email}</TableCell>
                              <TableCell>{row.role}</TableCell>
                              <TableCell>{row.client_or_vendor || '—'}</TableCell>
                              <TableCell>
                                {row.status === 'valid' ? (
                                  <span className="text-green-600">Valid</span>
                                ) : (
                                  <span className="text-red-600" title={row.error}>{row.error}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImportModal(false); setImportFile(null); setImportPreview([]) }}>
              Cancel
            </Button>
            <Button 
              onClick={handleImportUsers} 
              disabled={isImporting || importPreview.filter(r => r.status === 'valid').length === 0}
            >
              {isImporting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${importPreview.filter(r => r.status === 'valid').length} Users`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

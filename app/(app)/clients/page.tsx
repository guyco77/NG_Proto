'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  MoreHorizontal,
  Building2,
  ChevronRight,
  Archive,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockClients, mockProjects, mockClientUsers } from '@/lib/mock-data'
import { useRole } from '../layout'
import { useToast } from '@/hooks/use-toast'
import type { Client } from '@/lib/types'

export default function ClientsPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [archiveDialog, setArchiveDialog] = useState<{ open: boolean; client: Client | null; action: 'archive' | 'reactivate' }>({ open: false, client: null, action: 'archive' })
  const [reactivateUsersDialog, setReactivateUsersDialog] = useState<{ open: boolean; client: Client | null; users: string[] }>({ open: false, client: null, users: [] })
  
  const isAdmin = currentRole === 'admin'
  const isPM = currentRole === 'pm'
  const canManageClients = isAdmin || isPM

  // Get active project counts for each client
  const clientProjectCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    mockProjects.forEach((project) => {
      if (!['closed', 'cancelled'].includes(project.status)) {
        counts[project.clientId] = (counts[project.clientId] || 0) + 1
      }
    })
    return counts
  }, [])

  // Filter clients
  const filteredClients = useMemo(() => {
    let clients = [...mockClients]
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      clients = clients.filter(
        (client) =>
          client.displayName.toLowerCase().includes(query) ||
          client.legalName.toLowerCase().includes(query) ||
          client.contacts.some(c => c.name.toLowerCase().includes(query))
      )
    }
    
    // Filter by archived status
    if (!includeArchived) {
      clients = clients.filter((client) => client.status === 'active')
    }
    
    return clients
  }, [searchQuery, includeArchived])

  // Get primary contact for a client
  const getPrimaryContact = (client: Client) => {
    return client.contacts.find((c) => c.isPrimary) || client.contacts[0]
  }

  // Handle archive/reactivate
  const handleArchiveAction = () => {
    if (!archiveDialog.client) return
    
    const action = archiveDialog.action
    const clientName = archiveDialog.client.displayName
    
    if (action === 'archive') {
      // Check for active projects
      const activeProjects = clientProjectCounts[archiveDialog.client.id] || 0
      if (activeProjects > 0) {
        toast({
          title: 'Cannot Archive',
          description: `Close all ${activeProjects} active project(s) before archiving.`,
          variant: 'destructive',
        })
        setArchiveDialog({ open: false, client: null, action: 'archive' })
        return
      }
      
      toast({
        title: 'Client Archived',
        description: `${clientName} has been archived. All team members have been deactivated.`,
      })
    } else {
      // Reactivation - show user reactivation prompt
      const deactivatedUsers = mockClientUsers.filter(
        (u) => u.clientId === archiveDialog.client?.id && u.status === 'inactive'
      )
      
      toast({
        title: 'Client Reactivated',
        description: `${clientName} has been reactivated.`,
      })
      
      if (deactivatedUsers.length > 0) {
        setReactivateUsersDialog({
          open: true,
          client: archiveDialog.client,
          users: deactivatedUsers.map((u) => u.id),
        })
      }
    }
    
    setArchiveDialog({ open: false, client: null, action: 'archive' })
  }

  const handleReactivateUsers = () => {
    const count = reactivateUsersDialog.users.length
    toast({
      title: 'Users Reactivated',
      description: `${count} team member(s) have been reactivated.`,
    })
    setReactivateUsersDialog({ open: false, client: null, users: [] })
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground">
            {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
            {includeArchived && ` (including archived)`}
          </p>
        </div>
        {canManageClients && (
          <Link href="/clients/new" prefetch={true}>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Client
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by client or company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-80 rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="include-archived"
            checked={includeArchived}
            onCheckedChange={(checked) => setIncludeArchived(checked === true)}
          />
          <label htmlFor="include-archived" className="text-sm text-muted-foreground cursor-pointer">
            Include archived
          </label>
        </div>
      </div>

      {/* Clients Table */}
      <Card>
        <CardContent className="px-4 py-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Primary Contact</TableHead>
                <TableHead className="text-center">Active Projects</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => {
                const primaryContact = getPrimaryContact(client)
                const activeProjects = clientProjectCounts[client.id] || 0
                const hasActiveProjects = activeProjects > 0
                
                return (
                  <TableRow 
                    key={client.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => window.location.href = `/clients/${client.id}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{client.displayName}</p>
                          {client.legalName !== client.displayName && (
                            <p className="text-xs text-muted-foreground">{client.legalName}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {primaryContact ? (
                        <div>
                          <p className="text-sm text-foreground">{primaryContact.name}</p>
                          <p className="text-xs text-muted-foreground">{primaryContact.email}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No contact</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium">{activeProjects}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={client.status} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/clients/${client.id}`} className="flex items-center gap-2">
                              View Profile
                              <ChevronRight className="h-4 w-4 ml-auto" />
                            </Link>
                          </DropdownMenuItem>
                          {canManageClients && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/clients/${client.id}?edit=true`}>
                                  Edit Client
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {client.status === 'active' ? (
                                <DropdownMenuItem
                                  disabled={hasActiveProjects}
                                  onClick={() => setArchiveDialog({ open: true, client, action: 'archive' })}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  {hasActiveProjects ? 'Close projects first' : 'Archive Client'}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => setArchiveDialog({ open: true, client, action: 'reactivate' })}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Reactivate Client
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredClients.length === 0 && (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  {searchQuery
                    ? 'No clients match your search.'
                    : 'No clients yet. Add your first client to get started.'}
                </p>
                {canManageClients && !searchQuery && (
                  <Link href="/clients/new" prefetch={true}>
                    <Button className="mt-4 gap-1.5">
                      <Plus className="h-4 w-4" />
                      Add Client
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive/Reactivate Confirmation Dialog */}
      <Dialog open={archiveDialog.open} onOpenChange={(open) => !open && setArchiveDialog({ open: false, client: null, action: 'archive' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {archiveDialog.action === 'archive' ? 'Archive Client' : 'Reactivate Client'}
            </DialogTitle>
            <DialogDescription>
              {archiveDialog.action === 'archive'
                ? `Archive ${archiveDialog.client?.displayName}? All associated user accounts will be deactivated. Historical data is preserved.`
                : `Reactivate ${archiveDialog.client?.displayName}? The client will be set to Active status. User accounts will remain deactivated until manually reactivated.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialog({ open: false, client: null, action: 'archive' })}>
              Cancel
            </Button>
            <Button
              variant={archiveDialog.action === 'archive' ? 'destructive' : 'default'}
              onClick={handleArchiveAction}
            >
              {archiveDialog.action === 'archive' ? 'Archive Client' : 'Reactivate Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Users Prompt Dialog */}
      <Dialog open={reactivateUsersDialog.open} onOpenChange={(open) => !open && setReactivateUsersDialog({ open: false, client: null, users: [] })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Team Members?</DialogTitle>
            <DialogDescription>
              {reactivateUsersDialog.client?.displayName} has {reactivateUsersDialog.users.length} deactivated team member(s). Would you like to reactivate them now?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You can also reactivate team members later from the client&apos;s Team tab.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivateUsersDialog({ open: false, client: null, users: [] })}>
              Skip for Now
            </Button>
            <Button onClick={handleReactivateUsers}>
              Reactivate All ({reactivateUsersDialog.users.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

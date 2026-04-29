'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  FolderKanban,
  CheckSquare,
  Users,
  Briefcase,
  FileText,
  User,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { mockProjects, mockTasks, mockClients, mockVendors, mockUsers } from '@/lib/mock-data'
import type { UserRole } from '@/lib/types'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRole: UserRole
}

// NAV-004: Role-based visibility for search results
const SEARCH_VISIBILITY: Record<string, UserRole[]> = {
  projects: ['admin', 'pm', 'client', 'finance'],
  tasks: ['admin', 'pm', 'vendor'],
  clients: ['admin', 'pm'],
  vendors: ['admin', 'pm', 'finance'],
  users: ['admin', 'it'],
}

function canSeeEntity(entity: string, role: UserRole): boolean {
  const allowedRoles = SEARCH_VISIBILITY[entity]
  return allowedRoles ? allowedRoles.includes(role) : false
}

export function CommandPalette({ open, onOpenChange, currentRole }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  
  // NAV-004: Debounced search with min 2 characters
  const [debouncedQuery, setDebouncedQuery] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])
  
  // Reset query when closed
  useEffect(() => {
    if (!open) {
      setQuery('')
      setDebouncedQuery('')
    }
  }, [open])
  
  const navigate = useCallback((href: string) => {
    onOpenChange(false)
    router.push(href)
  }, [onOpenChange, router])
  
  // Filter results based on query (min 2 chars) and role
  const showResults = debouncedQuery.length >= 2
  const lowerQuery = debouncedQuery.toLowerCase()
  
  const filteredProjects = showResults && canSeeEntity('projects', currentRole)
    ? mockProjects
        .filter(p => 
          p.name?.toLowerCase().includes(lowerQuery) ||
          p.clientName?.toLowerCase().includes(lowerQuery) ||
          p.client?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
    : []
    
  const filteredTasks = showResults && canSeeEntity('tasks', currentRole)
    ? mockTasks
        .filter(t => 
          t.name?.toLowerCase().includes(lowerQuery) ||
          t.projectName?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
    : []
    
  const filteredClients = showResults && canSeeEntity('clients', currentRole)
    ? mockClients
        .filter(c => 
          c.displayName?.toLowerCase().includes(lowerQuery) ||
          c.legalName?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
    : []
    
  const filteredVendors = showResults && canSeeEntity('vendors', currentRole)
    ? mockVendors
        .filter(v => 
          v.name?.toLowerCase().includes(lowerQuery) ||
          v.email?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
    : []
    
  const filteredUsers = showResults && canSeeEntity('users', currentRole)
    ? mockUsers
        .filter(u => 
          u.name?.toLowerCase().includes(lowerQuery) ||
          u.email?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
    : []
  
  const hasResults = 
    filteredProjects.length > 0 ||
    filteredTasks.length > 0 ||
    filteredClients.length > 0 ||
    filteredVendors.length > 0 ||
    filteredUsers.length > 0

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Search projects, tasks, clients..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!showResults && (
          <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
        )}
        
        {showResults && !hasResults && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        
        {/* Projects */}
        {filteredProjects.length > 0 && (
          <CommandGroup heading="Projects">
            {filteredProjects.map((project) => (
              <CommandItem
                key={project.id}
                value={`project-${project.id}`}
                onSelect={() => navigate(`/projects/${project.id}`)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{project.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{project.clientName || project.client}</span>
                </div>
              </CommandItem>
            ))}
            {filteredProjects.length === 5 && (
              <CommandItem
                value="view-all-projects"
                onSelect={() => navigate(`/projects?search=${encodeURIComponent(debouncedQuery)}`)}
                className="text-primary cursor-pointer"
              >
                View all project results...
              </CommandItem>
            )}
          </CommandGroup>
        )}
        
        {filteredProjects.length > 0 && filteredTasks.length > 0 && <CommandSeparator />}
        
        {/* Tasks */}
        {filteredTasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {filteredTasks.map((task) => (
              <CommandItem
                key={task.id}
                value={`task-${task.id}`}
                onSelect={() => navigate(`/tasks/${task.id}`)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{task.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{task.projectName}</span>
                </div>
              </CommandItem>
            ))}
            {filteredTasks.length === 5 && (
              <CommandItem
                value="view-all-tasks"
                onSelect={() => navigate(`/tasks?search=${encodeURIComponent(debouncedQuery)}`)}
                className="text-primary cursor-pointer"
              >
                View all task results...
              </CommandItem>
            )}
          </CommandGroup>
        )}
        
        {(filteredProjects.length > 0 || filteredTasks.length > 0) && filteredClients.length > 0 && <CommandSeparator />}
        
        {/* Clients */}
        {filteredClients.length > 0 && (
          <CommandGroup heading="Clients">
            {filteredClients.map((client) => (
              <CommandItem
                key={client.id}
                value={`client-${client.id}`}
                onSelect={() => navigate(`/clients/${client.id}`)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{client.displayName}</span>
                  <span className="text-xs text-muted-foreground truncate">{client.contacts[0]?.email || ''}</span>
                </div>
              </CommandItem>
            ))}
            {filteredClients.length === 5 && (
              <CommandItem
                value="view-all-clients"
                onSelect={() => navigate(`/clients?search=${encodeURIComponent(debouncedQuery)}`)}
                className="text-primary cursor-pointer"
              >
                View all client results...
              </CommandItem>
            )}
          </CommandGroup>
        )}
        
        {(filteredProjects.length > 0 || filteredTasks.length > 0 || filteredClients.length > 0) && filteredVendors.length > 0 && <CommandSeparator />}
        
        {/* Vendors */}
        {filteredVendors.length > 0 && (
          <CommandGroup heading="Vendors">
            {filteredVendors.map((vendor) => (
              <CommandItem
                key={vendor.id}
                value={`vendor-${vendor.id}`}
                onSelect={() => navigate(`/vendors/${vendor.id}`)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{vendor.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{vendor.email}</span>
                </div>
              </CommandItem>
            ))}
            {filteredVendors.length === 5 && (
              <CommandItem
                value="view-all-vendors"
                onSelect={() => navigate(`/vendors?search=${encodeURIComponent(debouncedQuery)}`)}
                className="text-primary cursor-pointer"
              >
                View all vendor results...
              </CommandItem>
            )}
          </CommandGroup>
        )}
        
        {(filteredProjects.length > 0 || filteredTasks.length > 0 || filteredClients.length > 0 || filteredVendors.length > 0) && filteredUsers.length > 0 && <CommandSeparator />}
        
        {/* Users */}
        {filteredUsers.length > 0 && (
          <CommandGroup heading="Users">
            {filteredUsers.map((user) => (
              <CommandItem
                key={user.id}
                value={`user-${user.id}`}
                onSelect={() => navigate(`/users/${user.id}`)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{user.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                </div>
              </CommandItem>
            ))}
            {filteredUsers.length === 5 && (
              <CommandItem
                value="view-all-users"
                onSelect={() => navigate(`/users?search=${encodeURIComponent(debouncedQuery)}`)}
                className="text-primary cursor-pointer"
              >
                View all user results...
              </CommandItem>
            )}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}

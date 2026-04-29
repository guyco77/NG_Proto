'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, LogOut, User, Menu, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/notification-bell'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserRole } from '@/lib/types'

interface AppHeaderProps {
  userName: string
  userRole: UserRole
  onOpenSearch: () => void
  onOpenMobileMenu?: () => void
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  pm: 'Project Manager',
  client: 'Client',
  vendor: 'Vendor',
  finance: 'Finance',
  it: 'IT Admin',
}

// Route segment labels for breadcrumbs
const segmentLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  tasks: 'Tasks',
  'task-offers': 'Task Offers',
  quotes: 'Quotes',
  billing: 'Billing',
  finance: 'Finance',
  clients: 'Clients',
  vendors: 'Vendors',
  users: 'Users',
  settings: 'Settings',
  company: 'System',
  sessions: 'Sessions',
  'editor-integration': 'Editor Integration',
  profile: 'Profile',
  notifications: 'Notifications',
  'email-templates': 'Email Templates',
  invoices: 'Invoices',
  'vendor-payments': 'Vendor Payments',
  reports: 'Reports',
  new: 'New',
  edit: 'Edit',
}

function generateBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: { label: string; href: string }[] = []
  
  let currentPath = ''
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += `/${segment}`
    
    // Check if this is an ID (UUID-like or simple ID)
    const isId = /^[a-z0-9-]{2,}$/i.test(segment) && !segmentLabels[segment]
    
    if (isId) {
      // For IDs, we'll label them contextually based on parent
      const parent = segments[i - 1]
      let label = 'Details'
      if (parent === 'projects') label = 'Project'
      else if (parent === 'tasks') label = 'Task'
      else if (parent === 'quotes') label = 'Quote'
      else if (parent === 'clients') label = 'Client'
      else if (parent === 'vendors') label = 'Vendor'
      else if (parent === 'users') label = 'User'
      else if (parent === 'invoices') label = 'Invoice'
      
      breadcrumbs.push({ label, href: currentPath })
    } else {
      const label = segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      breadcrumbs.push({ label, href: currentPath })
    }
  }
  
  return breadcrumbs
}

export function AppHeader({ userName = 'User', userRole, onOpenSearch, onOpenMobileMenu }: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const initials = (userName || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleLogout = () => {
    router.push('/login')
  }
  
  const breadcrumbs = generateBreadcrumbs(pathname)

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Hamburger icon for narrow viewports */}
        {onOpenMobileMenu && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={onOpenMobileMenu}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        {/* NAV-002: Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.href} className="flex items-center gap-1 min-w-0">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-foreground truncate max-w-[200px]">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px]"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {/* NAV-004: Global Search trigger */}
        <Button
          variant="outline"
          className="hidden sm:flex items-center gap-2 text-muted-foreground h-9 w-56 justify-start"
          onClick={onOpenSearch}
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search...</span>
          <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            <span className="text-xs">Cmd</span>K
          </kbd>
        </Button>
        
        {/* Mobile search button */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={onOpenSearch}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <NotificationBell />

        {/* NAV-002: User menu with name + role */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{userName}</span>
                <span className="text-xs text-muted-foreground">{roleLabels[userRole]}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

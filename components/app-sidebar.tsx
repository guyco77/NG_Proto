'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  CheckSquare,
  Receipt,
  
  Users,
  Briefcase,
  Settings,
  User,
  Plug,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Bell,
  Building2,
  CreditCard,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface AppSidebarProps {
  currentRole: UserRole
  onRoleChange: (role: UserRole) => void
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  pm: 'Project Manager',
  client: 'Client',
  vendor: 'Vendor',
  finance: 'Finance',
  it: 'IT Admin',
}

// NAV-003: Visibility Matrix - which roles can see which nav items
const NAV_VISIBILITY: Record<string, UserRole[]> = {
  '/dashboard': ['admin', 'pm', 'client', 'vendor', 'finance', 'it'],
  '/projects': ['admin', 'pm', 'client', 'finance'],
  '/tasks': ['admin', 'pm', 'vendor'],
  '/task-offers': ['vendor'],
  '/quotes': ['admin', 'pm', 'client', 'finance'],
  '/billing': ['admin', 'finance', 'client', 'vendor'],
  '/clients': ['admin', 'pm'],
  '/vendors': ['admin', 'pm', 'finance'],
  '/users': ['admin', 'it'],
  '/my-team': ['client'], // CLIENT-002: Client Admin self-service team management
  '/monitoring': ['admin', 'it'],
  // Settings sub-items (per SET-001 through SET-007)
  '/settings/profile': ['admin', 'pm', 'client', 'vendor', 'finance', 'it'], // SET-005: All roles
  '/settings/notifications': ['admin', 'pm', 'client', 'vendor', 'finance', 'it'], // SET-007: All roles
  '/settings/company': ['admin'], // SET-001: Admin only
  '/settings/services': ['admin', 'pm'], // SET-002/SERV-001: Admin, PM
  '/settings/billing': ['admin', 'finance'], // SET-006: Admin, Finance
  '/settings/editor-integration': ['admin', 'it'], // SET-003: Admin, IT
  '/settings/email-templates': ['admin'], // SET-004: Admin only
  '/settings/audit-log': ['admin'], // SET-001: Admin only - Settings change history
}

// Check if user can see a nav item
function canSee(path: string, role: UserRole): boolean {
  const allowedRoles = NAV_VISIBILITY[path]
  return allowedRoles ? allowedRoles.includes(role) : false
}

// Check if user can see any settings sub-item
function canSeeSettings(role: UserRole): boolean {
  return (
    canSee('/settings/profile', role) ||
    canSee('/settings/notifications', role) ||
    canSee('/settings/company', role) ||
    canSee('/settings/services', role) ||
    canSee('/settings/billing', role) ||
    canSee('/settings/editor-integration', role) ||
    canSee('/settings/email-templates', role) ||
    canSee('/settings/audit-log', role)
  )
}

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/task-offers', label: 'Task Offers', icon: Mail, badge: 3 }, // TASK-009: Badge count for open offers
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/billing', label: 'Finance', icon: Receipt },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/vendors', label: 'Vendors', icon: Briefcase },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/my-team', label: 'My Team', icon: Users }, // CLIENT-002: Client Admin team self-service
]

const settingsNavItems = [
  { href: '/settings/profile', label: 'My Profile', icon: User },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings/company', label: 'Company', icon: Building2 },
  { href: '/settings/services', label: 'Services', icon: FileText },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings/editor-integration', label: 'Editor', icon: Plug },
  { href: '/settings/email-templates', label: 'Email Templates', icon: Mail },
  { href: '/settings/audit-log', label: 'Audit Log', icon: History },
]

export function AppSidebar({ currentRole, onRoleChange }: AppSidebarProps) {
  const pathname = usePathname()
  
  // NAV-001: Sidebar collapse state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setIsCollapsed(saved === 'true')
    }
  }, [])
  
  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }
  
  // NAV-001: Auto-expand Settings when on a /settings/* route
  useEffect(() => {
    if (pathname.startsWith('/settings')) {
      setSettingsOpen(true)
    }
  }, [pathname])
  
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }
  
  const isSettingsActive = pathname.startsWith('/settings')

  // Filter nav items by role visibility
  const visibleMainItems = mainNavItems.filter(item => canSee(item.href, currentRole))
  const visibleSettingsItems = settingsNavItems.filter(item => canSee(item.href, currentRole))
  const showSettings = canSeeSettings(currentRole)

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-border bg-card transition-all duration-200',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Workspace Logo & Collapse Toggle */}
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {/* Placeholder for workspace image - falls back to initials */}
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-sm shrink-0">
            GN
          </div>
          {!isCollapsed && (
            <span className="text-base font-semibold text-foreground truncate">GUNO Studio</span>
          )}
        </Link>
        <button
          onClick={toggleCollapsed}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-1">
          {visibleMainItems.map((item) => {
            const active = isActive(item.href)
            
            if (isCollapsed) {
              return (
                <li key={item.href}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'relative flex h-10 w-10 items-center justify-center rounded-md transition-colors mx-auto',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.badge && item.badge > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                        <span className="sr-only">{item.label}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label} {item.badge && item.badge > 0 && `(${item.badge})`}
                    </TooltipContent>
                  </Tooltip>
                </li>
              )
            }
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
                      active 
                        ? "bg-primary-foreground/20 text-primary-foreground" 
                        : "bg-primary text-primary-foreground"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
          
          {/* Settings Group */}
          {showSettings && (
            <li>
              {isCollapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href="/settings/profile"
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-md transition-colors mx-auto',
                        isSettingsActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <Settings className="h-5 w-5" />
                      <span className="sr-only">Settings</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    Settings
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <CollapsibleTrigger
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                      isSettingsActive
                        ? 'bg-primary/10 text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 shrink-0" />
                      <span>Settings</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        settingsOpen && 'rotate-180'
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="mt-1 ml-4 space-y-1 border-l border-border pl-3">
                      {visibleSettingsItems.map((item) => {
                        const active = isActive(item.href)
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={cn(
                                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                                active
                                  ? 'bg-primary text-primary-foreground font-medium'
                                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                              )}
                            >
                              <item.icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </li>
          )}
        </ul>
      </nav>

      {/* Role Switcher (for demo purposes) */}
      <div className={cn('border-t border-border p-3', isCollapsed && 'px-2')}>
        {!isCollapsed && (
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Viewing as
          </p>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'flex items-center justify-between rounded-md border border-border bg-card text-sm hover:bg-secondary transition-colors',
              isCollapsed ? 'w-10 h-10 p-0 justify-center mx-auto' : 'w-full px-3 py-2'
            )}
          >
            {isCollapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <span className="font-medium text-foreground text-xs">
                    {currentRole.charAt(0).toUpperCase()}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {roleLabels[currentRole]}
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                <span className="font-medium text-foreground truncate">{roleLabels[currentRole]}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCollapsed ? 'center' : 'start'} side={isCollapsed ? 'right' : 'top'} className="w-44">
            {(Object.keys(roleLabels) as UserRole[]).map((role) => (
              <DropdownMenuItem
                key={role}
                onClick={() => onRoleChange(role)}
                className={cn(currentRole === role && 'bg-secondary')}
              >
                {roleLabels[role]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </aside>
  )
}

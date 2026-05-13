'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { CommandPalette } from '@/components/command-palette'
import { ScrollToTop } from '@/components/scroll-to-top'
import { SkipToContent } from '@/components/skip-to-content'
import { OfflineIndicator } from '@/components/offline-indicator'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { UserRole } from '@/lib/types'

interface RoleContextType {
  currentRole: UserRole
  setCurrentRole: (role: UserRole) => void
  userName: string
}

const RoleContext = createContext<RoleContextType | null>(null)

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within RoleProvider')
  }
  return context
}

const userNames: Record<UserRole, string> = {
  admin: 'Sarah Admin',
  pm: 'Noa Manager',
  client: 'John Client',
  vendor: 'Lisa Translator',
  finance: 'David Finance',
  it: 'Tom Tech',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('pm')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // NAV-004: Cmd+K / Ctrl+K keyboard shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setSearchOpen((prev) => !prev)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const contextValue: RoleContextType = {
    currentRole,
    setCurrentRole,
    userName: userNames[currentRole],
  }

  return (
    <RoleContext.Provider value={contextValue}>
      <SkipToContent />
      <div className="flex h-screen bg-background">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <AppSidebar
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
          />
        </div>
        
        {/* Mobile sidebar drawer */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-60">
            <AppSidebar
              currentRole={currentRole}
              onRoleChange={(role) => {
                setCurrentRole(role)
                setMobileMenuOpen(false)
              }}
            />
          </SheetContent>
        </Sheet>
        
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader
            userName={userNames[currentRole]}
            userRole={currentRole}
            onOpenSearch={() => setSearchOpen(true)}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />
          <main id="main-content" className="flex-1 overflow-y-auto bg-background">
            <ScrollToTop />
            {children}
          </main>
        </div>
        
        {/* NAV-004: Command Palette */}
        <CommandPalette
          open={searchOpen}
          onOpenChange={setSearchOpen}
          currentRole={currentRole}
        />
        
        {/* Offline Indicator */}
        <OfflineIndicator />
      </div>
    </RoleContext.Provider>
  )
}

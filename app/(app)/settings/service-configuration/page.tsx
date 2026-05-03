'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { AlertCircle, Settings2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRole } from '../../layout'

// Import the sub-tab components
import { ServicesTab } from './services-tab'
import { TaskTypesTab } from './task-types-tab'
import { PricingTab } from './pricing-tab'

/**
 * Update-001: Service Configuration Umbrella Page
 * 
 * Groups Services, Task Types, and Pricing into a single settings page.
 * Permissions: Admin + PM only.
 * Deep-links support: /settings/service-configuration?tab=services|task-types|pricing
 */
export default function ServiceConfigurationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentRole } = useRole()
  const canEdit = currentRole === 'admin' || currentRole === 'pm'

  // Get initial tab from URL or default to 'services'
  const initialTab = searchParams.get('tab') || 'services'
  const [activeTab, setActiveTab] = useState(initialTab)

  // Update URL when tab changes (for deep-linking)
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', activeTab)
    router.replace(url.pathname + url.search, { scroll: false })
  }, [activeTab, router])

  // Redirect non-admin/pm users
  if (!canEdit) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">Only Admin and PM can access Service Configuration.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Service Configuration</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage services, task types, and pricing for your production catalog
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="task-types">Task Types</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        {/* Services Tab - Update-002 */}
        <TabsContent value="services" className="mt-6">
          <ServicesTab />
        </TabsContent>

        {/* Task Types Tab - Update-003 */}
        <TabsContent value="task-types" className="mt-6">
          <TaskTypesTab />
        </TabsContent>

        {/* Pricing Tab - Update-004 */}
        <TabsContent value="pricing" className="mt-6">
          <PricingTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

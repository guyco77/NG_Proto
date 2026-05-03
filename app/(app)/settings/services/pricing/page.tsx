'use client'

import Link from 'next/link'
import { AlertCircle, DollarSign, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRole } from '../../../layout'
import { PricingContent } from './pricing-content'

/**
 * SERV-002: Pricing Configuration (Rate Cards)
 * 
 * Separate page for managing Video Minute Rates and Translation Rate Card.
 * Accessible via /settings/services/pricing
 * Permissions: Admin + PM only.
 */
export default function PricingPage() {
  const { currentRole } = useRole()
  const canEdit = currentRole === 'admin' || currentRole === 'pm'

  if (!canEdit) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">Only Admin and PM can access Pricing Configuration.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Back link and Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings/services">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Services
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Pricing Configuration</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage video minute rates and translation rate cards
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Content */}
      <PricingContent />
    </div>
  )
}

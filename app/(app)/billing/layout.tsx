'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const billingTabs = [
  { name: 'Client Payments', href: '/billing' },
  { name: 'Vendor Payables', href: '/billing/vendor-payments' },
  { name: 'Reports', href: '/billing/reports' },
  { name: 'Audit Trail', href: '/billing/audit' }, // BILL-009
]

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Check if we're on a detail page (e.g., /billing/invoices/123)
  const isDetailPage = pathname.match(/\/billing\/invoices\/[^/]+$/)

  if (isDetailPage) {
    return <>{children}</>
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
          <p className="text-sm text-muted-foreground">
            Manage client payments, vendor payables, and financial reports
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6">
          {billingTabs.map((tab) => {
            const isActive = 
              tab.href === '/billing' 
                ? pathname === '/billing' 
                : pathname.startsWith(tab.href)
            
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'border-b-2 pb-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
                )}
              >
                {tab.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Page Content */}
      {children}
    </div>
  )
}

'use client'

import { useRole } from '../layout'
import { AdminDashboard } from '@/components/dashboards/admin-dashboard'
import { PMDashboard } from '@/components/dashboards/pm-dashboard'
import { ClientDashboard } from '@/components/dashboards/client-dashboard'
import { VendorDashboard } from '@/components/dashboards/vendor-dashboard'
import { FinanceDashboard } from '@/components/dashboards/finance-dashboard'
import { ITDashboard } from '@/components/dashboards/it-dashboard'

export default function DashboardPage() {
  const { currentRole, userName } = useRole()

  return (
    <>
      {currentRole === 'admin' && <AdminDashboard />}
      {currentRole === 'pm' && <PMDashboard userName={userName} />}
      {currentRole === 'client' && <ClientDashboard />}
      {currentRole === 'vendor' && <VendorDashboard />}
      {currentRole === 'finance' && <FinanceDashboard />}
      {currentRole === 'it' && <ITDashboard />}
    </>
  )
}

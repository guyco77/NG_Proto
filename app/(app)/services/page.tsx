import { redirect } from 'next/navigation'

// SET-002: Redirect /services to /settings/service-configuration per PRD
export default function ServicesRedirectPage() {
  redirect('/settings/service-configuration')
}

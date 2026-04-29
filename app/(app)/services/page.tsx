import { redirect } from 'next/navigation'

// SET-002: Redirect /services to /settings/services per PRD
export default function ServicesRedirectPage() {
  redirect('/settings/services')
}

import { redirect } from 'next/navigation'

// Redirect old /settings/services to new /settings/service-configuration
// This maintains backwards compatibility with any existing bookmarks or links
export default function OldServicesRedirectPage() {
  redirect('/settings/service-configuration')
}

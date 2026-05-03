import { redirect } from 'next/navigation'

// Redirect old /settings/service-configuration to new /settings/services
// Per Update-003: Settings now has three separate pages (Services, Task Types, Templates)
export default function ServiceConfigurationRedirectPage() {
  redirect('/settings/services')
}

import { redirect } from 'next/navigation'

// Update-005: Redirect old path to new /settings/templates
export default function ProjectTemplatesRedirectPage() {
  redirect('/settings/templates')
}

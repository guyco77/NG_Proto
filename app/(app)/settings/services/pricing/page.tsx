import { redirect } from 'next/navigation'

// Redirect old /settings/services/pricing to new /settings/service-configuration?tab=pricing
// This maintains backwards compatibility with any existing bookmarks or links
export default function OldPricingRedirectPage() {
  redirect('/settings/service-configuration?tab=pricing')
}

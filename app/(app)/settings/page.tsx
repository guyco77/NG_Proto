'use client'

import { Building2, Server, Mail, User, CreditCard, Bell, ChevronRight, FileText } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { useRole } from '../layout'

// Settings navigation structure based on PRD
interface SettingsLink {
  href: string
  icon: React.ElementType
  title: string
  description: string
  roles: string[] // roles that can see this link
}

const settingsLinks: SettingsLink[] = [
  {
    href: '/settings/profile',
    icon: User,
    title: 'My Profile',
    description: 'Update your name, email, phone, and avatar',
    roles: ['admin', 'pm', 'finance', 'it', 'client', 'vendor'],
  },
  {
    href: '/settings/notifications',
    icon: Bell,
    title: 'Notification Preferences',
    description: 'Configure how you receive notifications',
    roles: ['admin', 'pm', 'finance', 'it', 'client', 'vendor'],
  },
  {
    href: '/settings/company',
    icon: Building2,
    title: 'Company Settings',
    description: 'Legal name, logo, address, currency, and tax settings',
    roles: ['admin'],
  },
  {
    href: '/settings/services',
    icon: FileText,
    title: 'Services Catalog',
    description: 'Manage service definitions, workflows, and pricing',
    roles: ['admin', 'pm'],
  },
  {
    href: '/settings/billing',
    icon: CreditCard,
    title: 'Billing Settings',
    description: 'iCount and Mekano API credentials, payment terms',
    roles: ['admin', 'finance'],
  },
  {
    href: '/settings/editor-integration',
    icon: Server,
    title: 'Editor Integration',
    description: 'API credentials, webhook configuration, connection status',
    roles: ['admin', 'it'],
  },
  {
    href: '/settings/email-templates',
    icon: Mail,
    title: 'Email Templates',
    description: 'Customize transactional email notifications',
    roles: ['admin'],
  },
]

export default function SettingsPage() {
  const { currentRole } = useRole()

  // Filter links based on user's role
  const visibleLinks = settingsLinks.filter(link => link.roles.includes(currentRole))

  // Group links: personal settings first, then admin settings
  const personalLinks = visibleLinks.filter(link => 
    link.href === '/settings/profile' || link.href === '/settings/notifications'
  )
  const adminLinks = visibleLinks.filter(link => 
    link.href !== '/settings/profile' && link.href !== '/settings/notifications'
  )

  return (
    <div className="p-6 lg:p-8 max-w-4xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and application settings
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Personal Settings */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Personal</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {personalLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <link.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">{link.title}</h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {link.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Admin Settings */}
        {adminLinks.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Administration</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {adminLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <link.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm">{link.title}</h3>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {link.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

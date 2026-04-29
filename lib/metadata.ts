import type { Metadata } from 'next'

const siteConfig = {
  name: 'GUNO Studio',
  description: 'Project Management & Billing Platform for Media Services',
  url: 'https://guno.studio',
}

export function createMetadata({
  title,
  description,
  noIndex = false,
}: {
  title: string
  description?: string
  noIndex?: boolean
}): Metadata {
  const fullTitle = `${title} | ${siteConfig.name}`
  
  return {
    title: fullTitle,
    description: description || siteConfig.description,
    openGraph: {
      title: fullTitle,
      description: description || siteConfig.description,
      siteName: siteConfig.name,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: fullTitle,
      description: description || siteConfig.description,
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  }
}

// Pre-defined page metadata
export const pageMetadata = {
  dashboard: createMetadata({ title: 'Dashboard', description: 'Overview of your projects and tasks' }),
  projects: createMetadata({ title: 'Projects', description: 'Manage your media projects' }),
  tasks: createMetadata({ title: 'Tasks', description: 'View and manage translation and subtitling tasks' }),
  clients: createMetadata({ title: 'Clients', description: 'Manage client accounts and contacts' }),
  vendors: createMetadata({ title: 'Vendors', description: 'Manage vendor profiles and assignments' }),
  quotes: createMetadata({ title: 'Quotes', description: 'Create and manage project quotes' }),
  billing: createMetadata({ title: 'Billing', description: 'Invoices and payment management' }),
  users: createMetadata({ title: 'Users', description: 'User management and permissions' }),
  settings: createMetadata({ title: 'Settings', description: 'Configure your workspace' }),
  notifications: createMetadata({ title: 'Notifications', description: 'View your notifications' }),
}

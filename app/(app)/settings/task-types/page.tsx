'use client'

import { AlertCircle, ListChecks } from 'lucide-react'
import { useRole } from '../../layout'
import { TaskTypesContent } from './task-types-content'

/**
 * Update-003: Task Types Dedicated Page
 * 
 * Separate settings page for managing Admin/PM and Client task types.
 * Permissions: Admin + PM only.
 * Route: /settings/task-types
 */
export default function TaskTypesPage() {
  const { currentRole } = useRole()
  const canEdit = currentRole === 'admin' || currentRole === 'pm'

  if (!canEdit) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">Only Admin and PM can access Task Types.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <ListChecks className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Task Types</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage task type definitions for workflows
          </p>
        </div>
      </div>

      {/* Task Types Content */}
      <TaskTypesContent />
    </div>
  )
}

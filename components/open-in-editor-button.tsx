'use client'

import { useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import type { TaskStatus } from '@/lib/types'

interface OpenInEditorButtonProps {
  taskId: string
  projectId: string
  taskName: string
  sourceLanguage?: string
  targetLanguage?: string
  serviceType: string
  vendorId?: string
  taskStatus: TaskStatus
  isAssignedVendor: boolean
  canView: boolean // Admin/PM can view but not work
  variant?: 'default' | 'outline' | 'sm'
  className?: string
}

// EDIT-001: Mock editor configuration (from SET-003)
const editorConfig = {
  apiUrl: 'https://editor.example.com',
  isReachable: true, // Would be checked via SET-003 health check
}

/**
 * EDIT-001: "Open in Editor" Button
 * 
 * Launches the external Editor application with the task pre-loaded.
 * Visible when:
 * - A vendor is assigned to the task
 * - Task status is "assigned" or "in_progress"
 * - Hidden from Client view entirely
 * 
 * States:
 * - Visible + Active: Vendor assigned, task status is assigned/in_progress
 * - Hidden: No vendor assigned, or task status is unassigned/open_for_offers/submitted/complete
 * - Disabled (Editor unreachable): Editor API is down, tooltip shows message
 * - Loading: Constructing deep-link URL
 * - Error: Shows inline error message
 */
export function OpenInEditorButton({
  taskId,
  projectId,
  taskName,
  sourceLanguage,
  targetLanguage,
  serviceType,
  vendorId,
  taskStatus,
  isAssignedVendor,
  canView,
  variant = 'default',
  className,
}: OpenInEditorButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // EDIT-001: Button visibility logic
  const isEditorUnreachable = !editorConfig.isReachable
  const isValidStatus = taskStatus === 'assigned' || taskStatus === 'in_progress'
  const hasVendor = !!vendorId
  const canOpen = (isAssignedVendor || canView) && isValidStatus && hasVendor

  // Don't render if not visible
  if (!canOpen) {
    return null
  }

  const handleOpenEditor = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate constructing deep-link URL (EDIT-001)
      // In production, this would:
      // 1. Call API to generate vendor-scoped, time-limited auth token
      // 2. Construct Editor deep-link URL with task context
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Check if editor is reachable
      if (isEditorUnreachable) {
        setError('Editor is currently unreachable. Please try again later.')
        // Would trigger NOTIF-004 alert to PM/IT
        return
      }

      // Construct deep-link URL (format TBD per Editor team spec)
      const editorUrl = new URL(`${editorConfig.apiUrl}/task`)
      editorUrl.searchParams.set('taskId', taskId)
      editorUrl.searchParams.set('projectRef', projectId)
      if (sourceLanguage && targetLanguage) {
        editorUrl.searchParams.set('sourceLang', sourceLanguage)
        editorUrl.searchParams.set('targetLang', targetLanguage)
      }
      editorUrl.searchParams.set('serviceType', serviceType)
      // In production: editorUrl.searchParams.set('token', vendorAuthToken)

      // Open Editor in new tab
      window.open(editorUrl.toString(), '_blank', 'noopener,noreferrer')
      
      // No toast needed on success per PRD
    } catch (err) {
      setError('Failed to open Editor. Please try again or contact your PM.')
      toast({
        title: 'Editor Error',
        description: 'Failed to open Editor. Please try again or contact your PM.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const buttonContent = (
    <>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ExternalLink className="h-4 w-4" />
      )}
      <span>{isLoading ? 'Opening Editor...' : 'Open in Editor'}</span>
    </>
  )

  // EDIT-001: Disabled state when Editor unreachable
  if (isEditorUnreachable) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant={variant === 'sm' ? 'outline' : variant}
                size={variant === 'sm' ? 'sm' : 'default'}
                disabled
                className={className}
              >
                {buttonContent}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Editor is currently unreachable. Please try again later.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="flex flex-col">
      <Button
        variant={variant === 'sm' ? 'outline' : variant}
        size={variant === 'sm' ? 'sm' : 'default'}
        onClick={handleOpenEditor}
        disabled={isLoading}
        className={className}
      >
        {buttonContent}
      </Button>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

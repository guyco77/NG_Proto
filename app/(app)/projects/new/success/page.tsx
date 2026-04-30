'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Plus, Eye, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ProjectSuccessPage() {
  const searchParams = useSearchParams()
  const sceneName = searchParams.get('name') || 'New Scene'
  const projectId = searchParams.get('id') || 'new'
  const isClientCreated = searchParams.get('client') === 'true'
  // Update PROJ-001: Multi-scene creation support
  const sceneCount = parseInt(searchParams.get('scenes') || '1', 10)
  const isMultiScene = sceneCount > 1

  // Update PROJ-001: Dynamic messaging for single vs multi-scene
  const getTitle = () => {
    if (isMultiScene) return `${sceneCount} Scenes created.`
    return 'Scene created.'
  }

  const getDescription = () => {
    if (isClientCreated) {
      return 'Your project is ready. Assign your team members to tasks, or hand off to NG.'
    }
    if (isMultiScene) {
      return `${sceneCount} scenes have been created under the selected Show. Tasks and quotes generated per scene. All tasks are Unassigned — assign vendors to begin work.`
    }
    return `"${sceneName}" has been created successfully with status Draft. All tasks are Unassigned — assign vendors to begin work.`
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
              {isMultiScene ? (
                <Film className="h-8 w-8 text-emerald-600" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              )}
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">{getTitle()}</h1>
            <p className="text-muted-foreground mb-6">
              {getDescription()}
            </p>
            
            <div className="w-full space-y-3">
              <Link href={`/projects/${projectId}`} className="block">
                <Button className="w-full gap-1.5">
                  <Eye className="h-4 w-4" />
                  {isMultiScene ? 'View Scenes' : 'View Scene'}
                </Button>
              </Link>
              
              <Link href="/projects/new" className="block">
                <Button variant="outline" className="w-full gap-1.5">
                  <Plus className="h-4 w-4" />
                  Create Another Scene
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

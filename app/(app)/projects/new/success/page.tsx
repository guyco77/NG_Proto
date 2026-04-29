'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, FileText, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ProjectSuccessPage() {
  const searchParams = useSearchParams()
  const projectName = searchParams.get('name') || 'New Project'

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Project Created</h1>
            <p className="text-muted-foreground mb-6">
              {projectName} has been created successfully. An unsent quote has been generated.
            </p>
            
            <div className="w-full space-y-3">
              <Link href="/quotes/new?project=new" className="block">
                <Button className="w-full gap-1.5">
                  <FileText className="h-4 w-4" />
                  Go to Quote
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              
              <Link href="/projects/new" className="block">
                <Button variant="outline" className="w-full gap-1.5">
                  <Plus className="h-4 w-4" />
                  Create Another Project
                </Button>
              </Link>
              
              <Link href="/projects" className="block">
                <Button variant="ghost" className="w-full">
                  View All Projects
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

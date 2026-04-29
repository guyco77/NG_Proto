'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InvoicesPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/billing')
  }, [router])

  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-sm text-muted-foreground">Redirecting to Billing...</p>
      </div>
    </div>
  )
}

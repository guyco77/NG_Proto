import { Skeleton } from '@/components/ui/skeleton'

export default function ServiceConfigurationLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <Skeleton className="h-10 w-80" />

        {/* Content area */}
        <div className="flex h-[calc(100vh-16rem)]">
          {/* Left sidebar */}
          <div className="w-80 shrink-0 border-r border-border bg-muted/30 rounded-l-lg p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-9 w-full" />
            <div className="space-y-2 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32 mt-1" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

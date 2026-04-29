import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function AuditLoading() {
  return (
    <div className="space-y-6">
      {/* Info Banner Skeleton */}
      <Skeleton className="h-20 w-full rounded-lg" />

      {/* Filters Skeleton */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[120px] ml-auto" />
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="px-4 py-2">
          <div className="space-y-4 py-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-[140px]" />
                <Skeleton className="h-6 w-[120px]" />
                <Skeleton className="h-6 w-[100px]" />
                <Skeleton className="h-6 w-[120px]" />
                <Skeleton className="h-6 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

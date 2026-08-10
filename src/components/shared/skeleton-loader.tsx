import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-shimmer-skeleton rounded-lg bg-muted", className)} />
  )
}

export function PackageCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-3/5" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
        <div className="pt-3 border-t border-slate-100">
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
    </div>
  )
}

export function PackageGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PackageCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

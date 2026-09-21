import { cx as cn } from "@/lib/utils"

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md bg-white/[0.06] animate-pulse", className)} />
}

export function HeroSkeleton() {
  return (
    <div className="relative w-full h-[70vh] min-h-[500px]">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute bottom-0 left-0 right-0 p-6 lg:px-16 pb-24 space-y-4">
        <Skeleton className="w-64 h-10" />
        <Skeleton className="w-96 h-4" />
        <Skeleton className="w-40 h-10 rounded-full" />
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden pb-24">
      <div className="relative w-full h-[70vh] min-h-[500px]">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:px-16 pb-24 space-y-4">
          <Skeleton className="w-80 h-12" />
          <Skeleton className="w-64 h-4" />
          <div className="flex gap-3">
            <Skeleton className="w-32 h-10 rounded-full" />
            <Skeleton className="w-32 h-10 rounded-full" />
          </div>
        </div>
      </div>
      <div className="px-6 lg:px-16 mt-10 space-y-10">
        <div className="flex gap-6 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-none">
              <Skeleton className="w-24 h-5" />
              <Skeleton className="w-32 h-3 mt-2" />
            </div>
          ))}
        </div>
        <CastSkeletons />
        <div className="space-y-4">
          <Skeleton className="w-48 h-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video rounded-xl" />
            ))}
          </div>
        </div>
        <RowSkeletons count={6} />
      </div>
    </div>
  )
}

export function PersonSkeleton() {
  return (
    <div className="relative min-h-screen w-full px-6 lg:px-16 py-12 space-y-10">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <Skeleton className="w-48 h-72 rounded-xl flex-none" />
        <div className="flex-1 space-y-4">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-40 h-4" />
          <Skeleton className="w-full h-20" />
          <Skeleton className="w-full h-16" />
        </div>
      </div>
      <RowSkeletons count={6} />
      <RowSkeletons count={6} />
    </div>
  )
}

export function WatchSkeleton() {
  return (
    <div className="relative min-h-screen w-full bg-black">
      <div className="w-full aspect-video bg-neutral-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    </div>
  )
}

export function RowSkeletons({ count = 8, poster = true }: { count?: number; poster?: boolean }) {
  return (
    <div className="flex gap-4 overflow-hidden px-6 lg:px-16 py-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-none">
          <Skeleton className={poster ? "w-40 h-60 rounded-xl" : "w-72 h-40 rounded-xl"} />
          <Skeleton className="mt-3 w-28 h-3" />
        </div>
      ))}
    </div>
  )
}

export function GridSkeletons({ count = 18 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12 px-6 lg:px-16">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[2/3] rounded-xl" />
          <Skeleton className="mt-3 w-3/4 h-3" />
        </div>
      ))}
    </div>
  )
}

export function CastSkeletons({ count = 10 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden px-2 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-3 flex-none w-32">
          <Skeleton className="w-24 h-24 md:w-28 md:h-28 rounded-full" />
          <Skeleton className="w-24 h-3" />
        </div>
      ))}
    </div>
  )
}

import { GridSkeletons, Skeleton } from "@/components/skeleton"

export default function ProviderLoading() {
  return (
    <div className="min-h-screen pt-32 px-6 lg:px-16">
      <div className="flex items-center gap-6 mb-10">
        <Skeleton className="w-16 h-16 rounded-xl" />
        <Skeleton className="w-48 h-8" />
      </div>
      <GridSkeletons count={18} />
    </div>
  )
}

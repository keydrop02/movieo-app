import { GridSkeletons, Skeleton } from "@/components/skeleton"

export default function ListsLoading() {
  return (
    <div className="min-h-screen pt-32 px-6 lg:px-16">
      <Skeleton className="w-48 h-10 mb-6" />
      <div className="flex gap-3 mb-8">
        <Skeleton className="w-32 h-9 rounded-full" />
        <Skeleton className="w-32 h-9 rounded-full" />
      </div>
      <GridSkeletons count={12} />
    </div>
  )
}

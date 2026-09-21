import { GridSkeletons, Skeleton } from "@/components/skeleton"

export default function ListDetailLoading() {
  return (
    <div className="min-h-screen pt-32 px-6 lg:px-16">
      <Skeleton className="w-10 h-10 rounded-full mb-6" />
      <Skeleton className="w-64 h-10 mb-2" />
      <Skeleton className="w-40 h-4 mb-8" />
      <GridSkeletons count={12} />
    </div>
  )
}

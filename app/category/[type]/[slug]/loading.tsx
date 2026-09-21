import { GridSkeletons, Skeleton } from "@/components/skeleton"

export default function CategoryLoading() {
  return (
    <div className="min-h-screen pt-32 px-6 lg:px-16">
      <Skeleton className="w-64 h-10 mb-8" />
      <GridSkeletons count={18} />
    </div>
  )
}

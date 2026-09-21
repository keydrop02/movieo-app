import { HeroSkeleton, RowSkeletons } from "@/components/skeleton"

export default function HomeLoading() {
  return (
    <div className="relative">
      <HeroSkeleton />
      <div className="relative z-10 pb-24 pt-4 lg:pt-12 min-h-[500px]">
        <div className="space-y-8 lg:space-y-12">
          <RowSkeletons count={8} />
          <RowSkeletons count={8} />
          <RowSkeletons count={8} />
          <RowSkeletons count={8} />
          <RowSkeletons count={8} />
        </div>
      </div>
    </div>
  )
}

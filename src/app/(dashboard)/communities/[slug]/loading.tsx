
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityOverviewLoading() {
  return (
    <div className="flex-1">
      {/* Skeleton for CommunityHeader */}
      <div className="relative">
        <Skeleton className="h-48 w-full" />
        <div className="relative px-8 -mt-16">
          <div className="flex items-end gap-6">
            <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
            <div className="flex-grow pb-2 space-y-2">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <Skeleton className="mt-8 h-px w-full" />
      </div>

      {/* Skeleton for Stats Cards */}
      <div className="p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    </div>
  );
}

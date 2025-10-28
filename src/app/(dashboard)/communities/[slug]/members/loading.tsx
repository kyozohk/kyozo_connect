
import { Skeleton } from "@/components/ui/skeleton";

export default function MembersLoading() {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold tracking-tight mb-4">Members</h2>
      <div>
        <div className="flex items-center justify-between mb-4 gap-4">
          <Skeleton className="h-10 flex-grow" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="grid gap-4 mt-4 grid-cols-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

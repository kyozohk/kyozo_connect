import { CommunityCardSkeleton } from '@/components/communities/community-card-skeleton';

export function CommunitiesLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex-grow">
          <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-10 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <CommunityCardSkeleton key={i} viewMode="grid" />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Communities</h2>
      </div>
      <CommunitiesLoading />
    </div>
  );
}

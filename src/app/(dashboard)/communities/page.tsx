import { Suspense } from 'react';
import { getPaginatedFirestoreCommunities } from '@/app/fire/actions';
import { CommunityListClient } from '@/components/communities/community-list-client';
import { CommunityCardSkeleton } from '@/components/communities/community-card-skeleton';

// Loading component for Suspense fallback
function CommunitiesLoading() {
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

// Reduced page size for faster initial loading
const PAGE_SIZE = 10;

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

// This is a Server Component that fetches data on the server
export default async function CommunitiesDashboardPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // Properly await searchParams before accessing its properties
  const resolvedParams = await Promise.resolve(searchParams);
  
  // Extract search term from URL params
  const searchTerm = typeof resolvedParams?.q === 'string' ? resolvedParams.q : '';
  
  // Fetch initial communities data on the server
  const initialData = await getPaginatedFirestoreCommunities(PAGE_SIZE, null, searchTerm);
  
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Communities</h2>
      </div>
      
      <Suspense fallback={<CommunitiesLoading />}>
        {/* Pass the server-fetched data to the client component */}
        <CommunityListClient 
          initialCommunities={initialData.communities}
          initialHasMore={initialData.hasMore}
          pageSize={PAGE_SIZE}
          initialSearchTerm={searchTerm}
        />
      </Suspense>
    </div>
  );
}

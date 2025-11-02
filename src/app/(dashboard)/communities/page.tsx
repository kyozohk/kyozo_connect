'use client';

import React, { Suspense } from 'react';
import { getPaginatedFirestoreCommunities } from '@/app/fire/actions';
import { CommunityListClient } from '@/components/communities/community-list-client';
import { CommunityCardSkeleton } from '@/components/communities/community-card-skeleton';

// Loading component
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

const PAGE_SIZE = 30;

export const dynamic = 'force-dynamic';

export default function CommunitiesDashboardPage({
  searchParams,
}: {
  searchParams: any;
}) {
  // Create a client component wrapper to handle the data fetching
  return (
    <CommunitiesPageContent searchParams={searchParams} />
  );
}

// Client component wrapper
function CommunitiesPageContent({ searchParams }: { searchParams: any }) {
  // Use React.use to properly handle the searchParams promise
  const resolvedParams = React.use(searchParams) as { q?: string | string[] };
  const searchTerm = resolvedParams?.q ? String(resolvedParams.q) : '';
  // Use state to store the communities data
  const [data, setData] = React.useState<{ communities: any[], hasMore: boolean }>({ communities: [], hasMore: false });
  const [loading, setLoading] = React.useState(true);
  
  // Fetch the communities data
  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getPaginatedFirestoreCommunities(PAGE_SIZE, null, searchTerm);
      setData(result);
      setLoading(false);
    }
    fetchData();
  }, [searchTerm]);
  
  // Show loading state while fetching data
  if (loading) {
    return <CommunitiesLoading />;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Communities</h2>
      </div>
      <Suspense fallback={<CommunitiesLoading />}>
        <CommunityListClient 
            initialCommunities={data.communities}
            initialHasMore={data.hasMore}
            pageSize={PAGE_SIZE}
            initialSearchTerm={searchTerm}
        />
      </Suspense>
    </div>
  );
}



import { getPaginatedFirestoreCommunities } from '@/app/fire/actions';
import { CommunityListClient } from '@/components/communities/community-list-client';
import { Suspense } from 'react';

const PAGE_SIZE = 30;

export default async function CommunitiesDashboardPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {

  const searchTerm = typeof searchParams?.q === 'string' ? searchParams.q : '';
  const { communities, hasMore } = await getPaginatedFirestoreCommunities(PAGE_SIZE, null, searchTerm);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Communities</h2>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <CommunityListClient 
            initialCommunities={communities}
            initialHasMore={hasMore}
            pageSize={PAGE_SIZE}
            initialSearchTerm={searchTerm}
        />
      </Suspense>
    </div>
  );
}

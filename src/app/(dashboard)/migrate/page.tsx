
import { getCommunities } from '@/app/actions';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { Community } from '@/types';

export const dynamic = 'force-dynamic';

export default async function MigratePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const communities: Community[] = await getCommunities();
  
  // Create a safe copy of search params to avoid direct access issues
  const safeSearchParams = {
    communityId: typeof searchParams?.communityId === 'string' ? searchParams.communityId : undefined,
    memberId: typeof searchParams?.memberId === 'string' ? searchParams.memberId : undefined
  };

  return (
    <DashboardClient
      communities={communities}
      searchParams={safeSearchParams}
      dataSource="mongodb"
    />
  );
}

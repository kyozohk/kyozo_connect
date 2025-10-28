
import { getCommunities } from '@/app/actions';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { Community } from '@/types';

export const dynamic = 'force-dynamic';

export default async function InboxPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const communities: Community[] = await getCommunities();

  return (
    <DashboardClient
      communities={communities}
      searchParams={searchParams}
      dataSource="mongodb"
    />
  );
}

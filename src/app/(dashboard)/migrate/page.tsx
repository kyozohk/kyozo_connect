
import { getCommunities } from '@/app/actions';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { Community } from '@/types';

export const dynamic = 'force-dynamic';

export default async function MigratePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // Properly await searchParams before passing it to client components
  const resolvedParams = await Promise.resolve(searchParams);
  
  const communities: Community[] = await getCommunities();

  return (
    <DashboardClient
      communities={communities}
      searchParams={resolvedParams}
      dataSource="mongodb"
    />
  );
}

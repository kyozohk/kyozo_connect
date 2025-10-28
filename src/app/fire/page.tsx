
import { getFirestoreCommunities } from '@/app/fire/actions';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { Community } from '@/types';

export const dynamic = 'force-dynamic';

export default async function FirePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const communities: Community[] = await getFirestoreCommunities();
  
  return (
    <DashboardClient
      communities={communities}
      searchParams={searchParams}
      dataSource="firestore"
    />
  );
}

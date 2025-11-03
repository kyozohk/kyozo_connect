
import { getFirestoreCommunities } from '@/app/fire/actions';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { Community } from '@/types';

export const dynamic = 'force-dynamic';

export default async function FirebaseDataPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // Properly await searchParams before passing it to client components
  const resolvedParams = await Promise.resolve(searchParams);
  
  const communities: Community[] = await getFirestoreCommunities();
  
  return (
    <DashboardClient
      communities={communities}
      searchParams={resolvedParams}
      dataSource="firestore"
    />
  );
}

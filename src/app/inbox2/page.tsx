
import { getCommunitiesWithMembers, CommunityWithMembers } from '@/app/inbox2/actions';
import { DashboardClient2 } from '@/components/dashboard/dashboard-client-2';

export const dynamic = 'force-dynamic';

export default async function Inbox2Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // Properly await searchParams before passing it to client components
  const resolvedParams = await Promise.resolve(searchParams);
  
  const communities: CommunityWithMembers[] = await getCommunitiesWithMembers();

  return (
    <DashboardClient2
      communities={communities}
      searchParams={resolvedParams}
      dataSource="mongodb"
    />
  );
}


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
  const communityId = searchParams?.communityId as string || undefined;
  const memberId = searchParams?.memberId as string || undefined;

  return (
    <DashboardClient
      communities={communities}
      initialCommunityId={communityId}
      initialMemberId={memberId}
      dataSource="mongodb"
    />
  );
}

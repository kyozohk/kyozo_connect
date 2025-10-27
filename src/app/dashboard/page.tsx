
import { getCommunities } from '@/app/actions';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { Community } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { communityId?: string; memberId?: string };
}) {
  const communities: Community[] = await getCommunities();
  
  const isValidCommunityId = communities.some(c => c.id === searchParams.communityId);
  
  const initialSelectedCommunityId =
    searchParams.communityId && isValidCommunityId
      ? searchParams.communityId
      : communities[0]?.id ?? '';

  const initialSelectedMemberId = searchParams.memberId;

  return (
    <DashboardClient
      communities={communities}
      initialSelectedCommunityId={initialSelectedCommunityId}
      initialSelectedMemberId={initialSelectedMemberId}
    />
  );
}

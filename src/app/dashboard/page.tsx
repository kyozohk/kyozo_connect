
import { getCommunities } from '@/app/actions';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { Community } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const communities: Community[] = await getCommunities();
  
  const communityId = typeof searchParams.communityId === 'string' ? searchParams.communityId : '';
  const memberId = typeof searchParams.memberId === 'string' ? searchParams.memberId : '';

  const isValidCommunityId = communities.some(c => c.id === communityId);
  
  const initialSelectedCommunityId =
    communityId && isValidCommunityId
      ? communityId
      : ''; // Default to empty string if no valid community is selected

  return (
    <DashboardClient
      communities={communities}
      initialSelectedCommunityId={initialSelectedCommunityId}
      initialSelectedMemberId={memberId}
    />
  );
}

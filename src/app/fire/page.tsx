import { getFirestoreCommunities } from '@/app/fire/actions';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { Community } from '@/types';

export const dynamic = 'force-dynamic';

export default async function FirePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const communities: Community[] = await getFirestoreCommunities();
  
  const communityId = typeof searchParams.communityId === 'string' ? searchParams.communityId : '';
  const memberId = typeof searchParams.memberId === 'string' ? searchParams.memberId : '';

  const isValidCommunityId = communities.some(c => c.id === communityId);
  
  const initialSelectedCommunityId =
    communityId && isValidCommunityId
      ? communityId
      : '';

  return (
    <DashboardClient
      communities={communities}
      initialSelectedCommunityId={initialSelectedCommunityId}
      initialSelectedMemberId={memberId}
      dataSource="firestore"
    />
  );
}

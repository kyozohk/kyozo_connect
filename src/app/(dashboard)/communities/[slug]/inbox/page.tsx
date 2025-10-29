
import { getFirestoreCommunities, getFirestoreMembers } from '@/app/fire/actions';
import { notFound } from 'next/navigation';
import { CommunityInboxClient } from './inbox-client';

export default async function CommunityInboxPage({ 
    params,
    searchParams 
}: { 
    params: { slug: string };
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { slug } = params;
  
  const communities = await getFirestoreCommunities();
  const community = communities.find(c => (c.data?.slug || c.id) === slug);
  
  if (!community) {
    notFound();
  }

  const members = await getFirestoreMembers(community.id);

  return (
    <CommunityInboxClient 
        community={community}
        initialMembers={members}
        searchParams={searchParams}
    />
  );
}

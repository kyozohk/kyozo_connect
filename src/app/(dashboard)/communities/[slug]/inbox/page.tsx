'use client';

import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { CommunityInboxClient } from './inbox-client';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { Community, Member } from '@/types';
import { InboxSkeleton } from '@/components/skeletons/community-skeleton';

export default function CommunityInboxPage({ 
    params,
    searchParams 
}: { 
    params: { slug: string };
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // In Next.js 15, params properties should be unwrapped with React.use
  const resolvedParams = React.use(params as unknown as Promise<{ slug: string }>);
  const { slug } = resolvedParams;
  
  return (
    <Suspense fallback={<InboxSkeleton />}>
      <InboxContent slug={slug} searchParams={searchParams} />
    </Suspense>
  );
}

function InboxContent({ 
  slug, 
  searchParams 
}: { 
  slug: string;
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const firestore = useFirestore();
  
  // Query communities by slug
  const communitiesQuery = firestore ? query(
    collection(firestore, 'communities'),
    where('data.slug', '==', slug)
  ) : null;
  
  // Use real-time collection hook for communities
  const { data: communities, loading: communitiesLoading } = useCollection<Community>(communitiesQuery);
  
  // Find the current community
  const community = communities?.find(c => ((c.data?.slug || c.id) === slug)) || null;
  
  // If we have a community, query its members
  const membersQuery = community && firestore ? 
    query(collection(firestore, 'memberships'), where('communityId', '==', community.id)) : 
    null;
  
  // Use real-time collection hook for members
  const { data: members, loading: membersLoading } = useCollection<Member>(membersQuery);
  
  // Redirect to 404 if community not found and not loading
  if (!communitiesLoading && !community) {
    notFound();
    return null;
  }
  
  if (communitiesLoading || membersLoading || !members || !community) {
    return <InboxSkeleton />;
  }
  
  return (
    <CommunityInboxClient 
      community={community}
      initialMembers={members}
      searchParams={searchParams}
    />
  );
}

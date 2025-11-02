
'use client';

import React, { Suspense } from 'react';
import { MemberListClient } from '@/components/members/member-list-client';
import { notFound } from 'next/navigation';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { Community, Member } from '@/types';
import { MemberListSkeleton } from '@/components/skeletons/community-skeleton';

export default function MembersPage({ params }: { params: { slug: string } }) {
  // In Next.js 15, params properties should be unwrapped with React.use
  const resolvedParams = React.use(params as unknown as Promise<{ slug: string }>);
  const { slug } = resolvedParams;
  
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold tracking-tight mb-4">Members</h2>
      <Suspense fallback={<MemberListSkeleton />}>
        <MembersContent slug={slug} />
      </Suspense>
    </div>
  );
}

function MembersContent({ slug }: { slug: string }) {
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
  
  if (communitiesLoading || membersLoading || !members) {
    return <MemberListSkeleton />;
  }
  
  return <MemberListClient initialMembers={members} />;
}

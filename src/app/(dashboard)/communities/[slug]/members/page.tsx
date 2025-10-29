

import React from 'react';
import { MemberListClient } from '@/components/members/member-list-client';
import { getFirestoreMembers, getFirestoreCommunities } from '@/app/fire/actions';
import { notFound } from 'next/navigation';

export default async function MembersPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = React.use(paramsPromise);
  const { slug } = params;
  
  const communities = await getFirestoreCommunities();
  const community = communities.find(c => (c.data?.slug || c.id) === slug);
  
  if (!community) {
    notFound();
  }

  const members = await getFirestoreMembers(community.id);
  
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold tracking-tight mb-4">Members</h2>
      <MemberListClient initialMembers={members} />
    </div>
  );
}

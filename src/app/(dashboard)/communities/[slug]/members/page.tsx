import { Suspense } from 'react';
import { getCommunityBySlug } from '@/app/actions/community-actions';
import { notFound } from 'next/navigation';
import { MemberListSkeleton } from '@/components/skeletons/community-skeleton';

// Use the MemberListClient directly instead of the missing MemberList component
import { MemberListClient } from '@/components/members/member-list-client';

// Loading component for Suspense fallback
function MembersLoading() {
  return <MemberListSkeleton />;
}

export default async function MembersPage({ params }: { params: { slug: string } }) {
  // Properly handle params as an async API
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;
  
  // Fetch community data on the server
  const { community, members } = await getCommunityBySlug(slug);
  
  // Redirect to 404 if community not found
  if (!community) {
    notFound();
  }
  
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold tracking-tight mb-4">Members</h2>
      <div className="text-muted-foreground mb-6">
        Manage members for {community.name}
      </div>
      
      <Suspense fallback={<MembersLoading />}>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Total Members: {members.length}</h3>
              <p className="text-sm text-muted-foreground">
                Manage members for {community.name}
              </p>
            </div>
          </div>
        </div>
        
        <MemberListClient 
          initialMembers={members} 
          selectionMode="multiple"
        />
      </Suspense>
    </div>
  );
}

import { Suspense } from 'react';
import { getCommunityBySlug } from '@/app/actions/community-actions';
import { notFound } from 'next/navigation';
import { CommunityInboxClient } from './inbox-client';
import { InboxSkeleton } from '@/components/skeletons/community-skeleton';

// Loading component for Suspense fallback
function InboxLoading() {
  return <InboxSkeleton />;
}

export default async function CommunityInboxPage({ 
    params,
    searchParams 
}: { 
    params: { slug: string };
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
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
    <div className="h-full">
      <Suspense fallback={<InboxLoading />}>
        <CommunityInboxClient 
          community={community}
          initialMembers={members}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}

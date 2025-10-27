'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Community } from '@/types';
import { UserNav } from './user-nav';
import { CommunityList } from './community-list';
import { MemberList } from './member-list';
import { MessageList } from './message-list';
import { Card } from '@/components/ui/card';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export function DashboardClient({
  communities,
  initialSelectedCommunityId,
}: {
  communities: Community[];
  initialSelectedCommunityId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCommunityId, setSelectedCommunityId] = useState(initialSelectedCommunityId);

  const handleSelectCommunity = (communityId: string) => {
    setSelectedCommunityId(communityId);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('communityId', communityId);
    router.push(`/dashboard?${newSearchParams.toString()}`);
  };

  const selectedCommunity = communities.find(c => c.id === selectedCommunityId);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b px-4 lg:px-6">
        <h1 className="text-xl font-bold tracking-tight text-primary">
          KyozoConnect
        </h1>
        <UserNav />
      </header>
      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
            <CommunityList
              communities={communities}
              selectedCommunityId={selectedCommunityId}
              onSelectCommunity={handleSelectCommunity}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={55} minSize={30}>
             <MessageList key={selectedCommunityId} communityId={selectedCommunityId} communityName={selectedCommunity?.name} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={15} maxSize={30}>
            <MemberList key={selectedCommunityId} communityId={selectedCommunityId} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}

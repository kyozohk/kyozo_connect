
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Community, Member } from '@/types';
import { UserNav } from './user-nav';
import { CommunityList } from './community-list';
import { MemberList } from './member-list';
import { MessageList } from './message-list';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export function DashboardClient({
  communities,
  initialSelectedCommunityId,
  initialSelectedMemberId,
}: {
  communities: Community[];
  initialSelectedCommunityId: string;
  initialSelectedMemberId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCommunityId, setSelectedCommunityId] = useState(initialSelectedCommunityId);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const handleSelectCommunity = (communityId: string) => {
    setSelectedCommunityId(communityId);
    setSelectedMember(null); // Reset member selection
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('communityId', communityId);
    router.push(`/dashboard?${newSearchParams.toString()}`);
  };

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('communityId', selectedCommunityId);
    if(member?.id) {
        newSearchParams.set('memberId', member.id);
    } else {
        newSearchParams.delete('memberId');
    }
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
          <ResizablePanel defaultSize={25} minSize={15} maxSize={30}>
            <MemberList 
              key={selectedCommunityId} 
              communityId={selectedCommunityId}
              onSelectMember={handleSelectMember}
              selectedMemberId={initialSelectedMemberId}
              />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={55} minSize={30}>
             <MessageList 
                key={`${selectedCommunityId}-${selectedMember?.id}`}
                communityId={selectedCommunityId} 
                communityName={selectedCommunity?.name}
                member={selectedMember}
              />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}

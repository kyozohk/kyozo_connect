'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedCommunityId, setSelectedCommunityId] = useState(initialSelectedCommunityId);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const updateUrlTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to update URL with debounce
  const debouncedUpdateUrl = useCallback((newParams: URLSearchParams) => {
    if (updateUrlTimeoutRef.current) {
      clearTimeout(updateUrlTimeoutRef.current);
    }
    
    updateUrlTimeoutRef.current = setTimeout(() => {
      router.replace(`${pathname}?${newParams.toString()}`);
    }, 300); // 300ms debounce
  }, [router, pathname]);

  const handleSelectCommunity = (communityId: string) => {
    setSelectedCommunityId(communityId);
    setSelectedMember(null); 
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('communityId', communityId);
    // Use debounced URL update
    debouncedUpdateUrl(newSearchParams);
  };

  const handleSelectMember = useCallback((member: Member | null) => {
    setSelectedMember(member);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (selectedCommunityId) {
      newSearchParams.set('communityId', selectedCommunityId);
    } else {
       newSearchParams.delete('communityId');
    }

    if(member?.id) {
        newSearchParams.set('memberId', member.id);
    } else {
        newSearchParams.delete('memberId');
    }
    
    // Use debounced URL update to prevent excessive refreshes
    debouncedUpdateUrl(newSearchParams);
  }, [searchParams, selectedCommunityId, debouncedUpdateUrl]);

  // Clean up the timeout when component unmounts
  useEffect(() => {
    return () => {
      if (updateUrlTimeoutRef.current) {
        clearTimeout(updateUrlTimeoutRef.current);
      }
    };
  }, []);

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
          <ResizablePanel defaultSize={35} minSize={20} maxSize={45}>
            <CommunityList
              communities={communities}
              selectedCommunityId={selectedCommunityId}
              onSelectCommunity={handleSelectCommunity}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <MemberList 
              key={selectedCommunityId} 
              communityId={selectedCommunityId}
              onSelectMember={handleSelectMember}
              initialSelectedMemberId={initialSelectedMemberId}
              />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={45} minSize={30}>
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


'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Community, Member } from '@/types';
import { CommunityList } from './community-list';
import { MemberList } from './member-list';
import { MessageList } from './message-list';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export type DataSource = 'mongodb' | 'firestore';

export function DashboardClient({
  communities,
  searchParams,
  dataSource,
}: {
  communities: Community[];
  searchParams?: { [key: string]: string | string[] | undefined };
  dataSource: DataSource;
}) {
  // Safely parse search params to avoid direct access issues
  const parsedSearchParams = useMemo(() => {
    if (!searchParams) return {};
    return {
      communityId: typeof searchParams.communityId === 'string' ? searchParams.communityId : undefined,
      memberId: typeof searchParams.memberId === 'string' ? searchParams.memberId : undefined
    };
  }, [searchParams]);
  const router = useRouter();
  const pathname = usePathname();
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);

  const getInitialCommunityId = () => {
    const communityIdFromParams = parsedSearchParams.communityId;
    if (communityIdFromParams && communities.some(c => c.id === communityIdFromParams)) {
      return communityIdFromParams;
    }
    return '';
  };
  
  const getInitialMemberId = () => {
    return parsedSearchParams.memberId;
  };


  const [selectedCommunityId, setSelectedCommunityId] = useState(getInitialCommunityId());
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);


  const debouncedUpdateUrl = useCallback((newSearchParams: URLSearchParams) => {
    if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
    }
    updateTimeout.current = setTimeout(() => {
        router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    }, 300);
  }, [pathname, router]);

  const handleSelectCommunity = (communityId: string | null) => {
    const newId = communityId === selectedCommunityId ? null : communityId;
    setSelectedCommunityId(newId || '');
    setSelectedMember(null); 
    const newSearchParams = new URLSearchParams();
    if (newId) {
      newSearchParams.set('communityId', newId);
    }
    debouncedUpdateUrl(newSearchParams);
  };

  const handleSelectMember = useCallback((member: Member | null) => {
    setSelectedMember(member);
    const newSearchParams = new URLSearchParams();
     if (selectedCommunityId) {
      newSearchParams.set('communityId', selectedCommunityId);
    }
    if(member?.id) {
        newSearchParams.set('memberId', member.id);
    }
    debouncedUpdateUrl(newSearchParams);
  }, [selectedCommunityId, debouncedUpdateUrl]);

  useEffect(() => {
    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
    };
  }, []);

  const selectedCommunity = communities.find(c => c.id === selectedCommunityId);

  return (
    <div className="flex h-full flex-col bg-background">
      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <CommunityList
              communities={communities}
              selectedCommunityId={selectedCommunityId}
              onSelectCommunity={handleSelectCommunity}
              showExport={dataSource === 'mongodb'}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <MemberList 
              key={`${dataSource}-${selectedCommunityId}`}
              communityId={selectedCommunityId}
              onSelectMember={handleSelectMember}
              initialSelectedMemberId={getInitialMemberId()}
              dataSource={dataSource}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={30}>
             <MessageList 
                key={`${dataSource}-${selectedCommunityId}-${selectedMember?.id}`}
                communityId={selectedCommunityId} 
                communityName={selectedCommunity?.name}
                member={selectedMember}
                dataSource={dataSource}
              />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}

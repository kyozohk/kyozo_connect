
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Community, Member } from '@/types';
import { CommunityList } from '@/components/dashboard/community-list';
import { MemberList } from '@/components/dashboard/member-list';
import { MessageList } from '@/components/dashboard/message-list';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { getCommunities, getMembers } from '@/app/actions';

export default function InboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  const getInitialCommunityId = useCallback(() => {
    const communityIdFromParams = searchParams.get('communityId');
    if (typeof communityIdFromParams === 'string' && communities.some(c => c.id === communityIdFromParams)) {
      return communityIdFromParams;
    }
    return '';
  }, [searchParams, communities]);
  
  const getInitialMemberId = useCallback(() => {
    const memberIdFromParams = searchParams.get('memberId');
    return typeof memberIdFromParams === 'string' ? memberIdFromParams : undefined;
  }, [searchParams]);

  const [selectedCommunityId, setSelectedCommunityId] = useState(getInitialCommunityId());
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    getCommunities().then(data => {
        setCommunities(data);
        setLoading(false);
    });
  }, []);

  useEffect(() => {
    setSelectedCommunityId(getInitialCommunityId());
  }, [communities, getInitialCommunityId]);


  const debouncedUpdateUrl = useCallback((newSearchParams: URLSearchParams) => {
    if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
    }
    updateTimeout.current = setTimeout(() => {
        router.replace(`/inbox?${newSearchParams.toString()}`, { scroll: false });
    }, 300);
  }, [router]);

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
  const dataSource = 'mongodb';

  return (
    <div className="flex h-full flex-col bg-background">
      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel defaultSize={35} minSize={20} maxSize={45}>
            <CommunityList
              communities={communities}
              selectedCommunityId={selectedCommunityId}
              onSelectCommunity={handleSelectCommunity}
              showExport={false}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <MemberList 
              key={`${dataSource}-${selectedCommunityId}`}
              communityId={selectedCommunityId}
              onSelectMember={handleSelectMember}
              initialSelectedMemberId={getInitialMemberId()}
              dataSource={dataSource}
              />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={45} minSize={30}>
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

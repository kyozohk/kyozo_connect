
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Member, Community } from '@/types';
import { MemberList } from '@/components/dashboard/member-list';
import { MessageListClient } from '@/components/dashboard/message-list-client';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export function CommunityInboxClient({ 
    community,
    initialMembers,
    searchParams
}: { 
    community: Community,
    initialMembers: Member[],
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);

  const getInitialMemberId = () => {
    const memberIdFromParams = searchParams?.memberId;
    return typeof memberIdFromParams === 'string' ? memberIdFromParams : undefined;
  };

  const [selectedMember, setSelectedMember] = useState<Member | null>(() => {
      const memberId = getInitialMemberId();
      return memberId ? initialMembers.find(m => m.id === memberId) || null : null;
  });

  const debouncedUpdateUrl = useCallback((newSearchParams: URLSearchParams) => {
    if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
    }
    updateTimeout.current = setTimeout(() => {
        router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    }, 300);
  }, [pathname, router]);


  const handleSelectMember = useCallback((member: Member | null) => {
    setSelectedMember(member);
    const newSearchParams = new URLSearchParams(currentSearchParams.toString());
    if(member?.id) {
        newSearchParams.set('memberId', member.id);
    } else {
        newSearchParams.delete('memberId');
    }
    debouncedUpdateUrl(newSearchParams);
  }, [currentSearchParams, debouncedUpdateUrl]);

   useEffect(() => {
    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
    };
  }, []);

  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <MemberList
            communityId={community?.id || ''}
            initialMembers={initialMembers}
            onSelectMember={handleSelectMember}
            initialSelectedMemberId={getInitialMemberId()}
            dataSource="firestore"
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70} minSize={30}>
          <MessageListClient
            key={`firestore-${community?.id}-${selectedMember?.id}`}
            communityId={community?.id || ''}
            communityName={community?.name}
            member={selectedMember}
            dataSource="firestore"
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

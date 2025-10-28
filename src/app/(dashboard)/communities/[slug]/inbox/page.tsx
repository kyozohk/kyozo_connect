'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Member, Community } from '@/types';
import { MemberList } from '@/components/dashboard/member-list';
import { MessageList } from '@/components/dashboard/message-list';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { getFirestoreCommunities } from '@/app/fire/actions';

export default function CommunityInboxPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);

  const [community, setCommunity] = useState<Community | null>(null);

  useEffect(() => {
    getFirestoreCommunities().then(communities => {
      const currentCommunity = communities.find(c => (c.data?.slug || c.id) === slug);
      setCommunity(currentCommunity || null);
    });
  }, [slug]);

  const getInitialMemberId = () => {
    const memberIdFromParams = searchParams.get('memberId');
    return typeof memberIdFromParams === 'string' ? memberIdFromParams : undefined;
  };

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

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
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if(member?.id) {
        newSearchParams.set('memberId', member.id);
    } else {
        newSearchParams.delete('memberId');
    }
    debouncedUpdateUrl(newSearchParams);
  }, [searchParams, debouncedUpdateUrl]);

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
            key={`firestore-${community?.id}`}
            communityId={community?.id || ''}
            onSelectMember={handleSelectMember}
            initialSelectedMemberId={getInitialMemberId()}
            dataSource="firestore"
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70} minSize={30}>
          <MessageList
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

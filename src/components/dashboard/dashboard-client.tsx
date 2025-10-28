
'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Community, Member } from '@/types';
import { UserNav } from './user-nav';
import { CommunityList } from './community-list';
import { MemberList } from './member-list';
import { MessageList } from './message-list';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export type DataSource = 'mongodb' | 'firestore';

export function DashboardClient({
  communities,
  initialSelectedCommunityId,
  initialSelectedMemberId,
  dataSource,
}: {
  communities: Community[];
  initialSelectedCommunityId: string;
  initialSelectedMemberId?: string;
  dataSource: DataSource;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedCommunityId, setSelectedCommunityId] = useState(initialSelectedCommunityId);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const handleSelectCommunity = (communityId: string | null) => {
    const newId = communityId === selectedCommunityId ? null : communityId;
    setSelectedCommunityId(newId || '');
    setSelectedMember(null); 
    const newSearchParams = new URLSearchParams();
    if (newId) {
      newSearchParams.set('communityId', newId);
    }
    router.push(`${pathname}?${newSearchParams.toString()}`);
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
    
    router.replace(`${pathname}?${newSearchParams.toString()}`);
  }, [router, searchParams, selectedCommunityId, pathname]);

  const selectedCommunity = communities.find(c => c.id === selectedCommunityId);

  const isFire = dataSource === 'firestore';

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b px-4 lg:px-6">
         <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-primary">
            KyozoConnect <span className="text-sm font-normal text-muted-foreground">{isFire ? '🔥' : '🧊'}</span>
            </h1>
         </div>
        <div className="flex items-center gap-4">
            {isFire ? (
                <Link href="/inbox">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Source Mongo
                    </Button>
                </Link>
            ) : (
                <Link href="/fire">
                    <Button>
                        Go to Destination Firestore
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            )}
            <UserNav />
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel defaultSize={35} minSize={20} maxSize={45}>
            <CommunityList
              communities={communities}
              selectedCommunityId={selectedCommunityId}
              onSelectCommunity={handleSelectCommunity}
              showExport={dataSource === 'mongodb'}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <MemberList 
              key={`${dataSource}-${selectedCommunityId}`}
              communityId={selectedCommunityId}
              onSelectMember={handleSelectMember}
              initialSelectedMemberId={initialSelectedMemberId}
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

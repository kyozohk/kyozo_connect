
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Community, Member } from '@/types';
import { UserNav } from './user-nav';
import { CommunityList } from './community-list';
import { MemberList } from './member-list';
import { MessageList } from './message-list';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import packageJson from '../../../package.json';

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
  const router = useRouter();
  const pathname = usePathname();
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);

  const getInitialCommunityId = () => {
    const communityIdFromParams = searchParams?.communityId;
    if (typeof communityIdFromParams === 'string' && communities.some(c => c.id === communityIdFromParams)) {
      return communityIdFromParams;
    }
    return '';
  };
  
  const getInitialMemberId = () => {
    const memberIdFromParams = searchParams?.memberId;
    return typeof memberIdFromParams === 'string' ? memberIdFromParams : undefined;
  };


  const [selectedCommunityId, setSelectedCommunityId] = useState(getInitialCommunityId());
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const appVersion = packageJson.version;


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

  const isFire = dataSource === 'firestore';

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b px-4 lg:px-6">
         <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-primary">
              KyozoConnect 
              <span className="ml-2 text-xs font-mono text-muted-foreground align-middle">v{appVersion}</span>
              <span className="text-sm font-normal text-muted-foreground">{isFire ? '🔥' : '🧊'}</span>
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
                 <Link href="/inbox2">
                    <Button>
                        Go to Fast Inbox
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


'use client';

import { useEffect, useState } from 'react';
import { getMembers } from '@/app/actions';
import { Member } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MemberList({ communityId }: { communityId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!communityId) {
      setLoading(false);
      setMembers([]);
      return;
    };
    setLoading(true);
    getMembers(communityId)
      .then(setMembers)
      .finally(() => setLoading(false));
  }, [communityId]);

  const handleCopy = (member: Member) => {
    navigator.clipboard.writeText(JSON.stringify(member.data, null, 2));
    toast({
      title: 'Copied to clipboard',
      description: `Member data for "${member.displayName}" has been copied.`,
    });
  };

  return (
    <div className="flex h-full flex-col border-l">
      <h2 className="p-4 text-lg font-semibold tracking-tight">Members</h2>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="w-[150px] space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))
          ) : members.length > 0 ? (
            members.map((member) => (
              <div key={member.id} className="group flex items-center justify-between space-x-3 rounded-md p-2 hover:bg-muted">
                <div className="flex items-center space-x-3 overflow-hidden">
                    <Avatar>
                      <AvatarImage src={member.photoURL} alt={member.displayName} />
                      <AvatarFallback>{member.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="w-[150px] flex-shrink-0">
                      <p className="text-sm font-medium leading-none truncate">{member.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 flex-shrink-0"
                    onClick={() => handleCopy(member)}
                >
                    <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-muted-foreground">No members in this community.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

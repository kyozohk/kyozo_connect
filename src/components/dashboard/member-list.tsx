'use client';

import { useEffect, useState } from 'react';
import { getMembers } from '@/app/actions';
import { Member } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export function MemberList({ communityId }: { communityId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!communityId) {
      setLoading(false);
      return;
    };
    setLoading(true);
    getMembers(communityId)
      .then(setMembers)
      .finally(() => setLoading(false));
  }, [communityId]);

  return (
    <div className="flex h-full flex-col border-l">
      <h2 className="p-4 text-lg font-semibold tracking-tight">Members</h2>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))
          ) : members.length > 0 ? (
            members.map((member) => (
              <div key={member.id} className="flex items-center space-x-3 rounded-md p-2 hover:bg-muted">
                <Avatar>
                  <AvatarImage src={member.photoURL} alt={member.displayName} />
                  <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{member.displayName}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No members in this community.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

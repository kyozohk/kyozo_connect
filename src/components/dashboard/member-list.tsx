'use client';

import { useEffect, useState, useMemo } from 'react';
import { getMembers } from '@/app/actions';
import { Member } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export function MemberList({ 
    communityId, 
    onSelectMember,
    initialSelectedMemberId
}: { 
    communityId: string;
    onSelectMember: (member: Member | null) => void;
    initialSelectedMemberId?: string;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(initialSelectedMemberId);
  const { toast } = useToast();

  useEffect(() => {
    if (!communityId) {
      setMembers([]);
      onSelectMember(null);
      return;
    };

    setLoading(true);
    getMembers(communityId)
      .then((fetchedMembers) => {
        setMembers(fetchedMembers);
        if (initialSelectedMemberId) {
            const memberToSelect = fetchedMembers.find(m => m.id === initialSelectedMemberId);
            onSelectMember(memberToSelect || null);
            setSelectedMemberId(initialSelectedMemberId);
        } else {
            onSelectMember(null);
            setSelectedMemberId(undefined);
        }
      })
      .finally(() => setLoading(false));
  }, [communityId, initialSelectedMemberId, onSelectMember]);

  const handleSelectMember = (member: Member) => {
    setSelectedMemberId(member.id);
    onSelectMember(member);
  }

  const handleCopy = (member: Member) => {
    navigator.clipboard.writeText(JSON.stringify(member.data, null, 2));
    toast({
      title: 'Copied to clipboard',
      description: `Member data for "${member.displayName}" has been copied.`,
    });
  };

  const filteredMembers = useMemo(() => members.filter((member) =>
    (member.displayName && member.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [members, searchQuery]);


  return (
    <div className="flex h-full flex-col border-l">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold tracking-tight mb-2">Members</h2>
        <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
            disabled={!communityId}
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {!communityId ? (
             <div className="flex flex-col h-full items-center justify-center text-center p-8 mt-10">
                <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">Select a community</h3>
                <p className="text-muted-foreground">Choose a community from the list to view its members.</p>
            </div>
          ) : loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="w-[150px] space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))
          ) : filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
                <div key={member.id} className="group flex items-center justify-between rounded-md pr-2 hover:bg-muted"
                     onClick={() => handleSelectMember(member)}>
                    <div className={cn(
                        "flex items-center space-x-3 overflow-hidden p-2 flex-grow cursor-pointer rounded-md",
                        selectedMemberId === member.id && "bg-secondary"
                        )}>
                        <Avatar>
                          <AvatarImage src={member.photoURL} alt={member.displayName} />
                          <AvatarFallback>{member.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium leading-none truncate">{member.displayName}</p>
                            {member.role !== 'member' && (
                                <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="capitalize text-xs h-5">
                                    {member.role}
                                </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{member.phoneNumber || member.email}</p>
                          {member.joinedAt && (
                             <p className="text-xs text-muted-foreground truncate">
                                Joined: {format(parseISO(member.joinedAt), "MMM d, yyyy")}
                             </p>
                          )}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleCopy(member); }}
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

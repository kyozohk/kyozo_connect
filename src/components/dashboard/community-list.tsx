'use client';

import { Community } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';

interface CommunityListProps {
  communities: Community[];
  selectedCommunityId: string;
  onSelectCommunity: (id: string) => void;
}

export function CommunityList({
  communities,
  selectedCommunityId,
  onSelectCommunity,
}: CommunityListProps) {
  return (
    <div className="flex h-full flex-col">
        <h2 className="p-4 text-lg font-semibold tracking-tight">Communities</h2>
        <ScrollArea className="flex-1 px-2">
            <div className="space-y-1 p-2">
            {communities.length > 0 ? (
                communities.map((community) => (
                <Button
                    key={community.id}
                    variant={selectedCommunityId === community.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => onSelectCommunity(community.id)}
                >
                    <Users className="mr-2 h-4 w-4" />
                    {community.name}
                </Button>
                ))
            ) : (
                <p className="p-4 text-sm text-muted-foreground">No communities found.</p>
            )}
            </div>
        </ScrollArea>
    </div>
  );
}

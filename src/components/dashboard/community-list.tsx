'use client';

import { Community } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const handleCopy = (community: Community) => {
    navigator.clipboard.writeText(JSON.stringify(community.data, null, 2));
    toast({
      title: 'Copied to clipboard',
      description: `Community data for "${community.name}" has been copied.`,
    });
  };

  return (
    <div className="flex h-full flex-col">
        <h2 className="p-4 text-lg font-semibold tracking-tight">Communities</h2>
        <ScrollArea className="flex-1 px-2">
            <div className="space-y-1 p-2">
            {communities.length > 0 ? (
                communities.map((community) => (
                <div key={community.id} className="group flex items-center">
                    <Button
                        variant={selectedCommunityId === community.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start flex-grow"
                        onClick={() => onSelectCommunity(community.id)}
                    >
                        <Users className="mr-2 h-4 w-4" />
                        <span className="truncate">{community.name}</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={() => handleCopy(community)}
                    >
                        <ClipboardCopy className="h-4 w-4" />
                    </Button>
                </div>
                ))
            ) : (
                <p className="p-4 text-sm text-muted-foreground">No communities found.</p>
            )}
            </div>
        </ScrollArea>
    </div>
  );
}

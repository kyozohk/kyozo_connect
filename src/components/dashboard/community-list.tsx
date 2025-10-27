
'use client';

import { Community } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopy = (community: Community) => {
    navigator.clipboard.writeText(JSON.stringify(community.data, null, 2));
    toast({
      title: 'Copied to clipboard',
      description: `Community data for "${community.name}" has been copied.`,
    });
  };

  const filteredCommunities = communities.filter((community) =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
        <div className="p-4 border-b">
            <h2 className="text-lg font-semibold tracking-tight mb-2">Communities</h2>
            <Input
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
            />
        </div>
        <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
            {filteredCommunities.length > 0 ? (
                filteredCommunities.map((community) => (
                <div key={community.id} className="group flex items-center">
                    <Button
                        variant={selectedCommunityId === community.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start flex-grow h-auto py-2"
                        onClick={() => onSelectCommunity(community.id)}
                    >
                        <Avatar className="mr-3 h-8 w-8">
                            <AvatarImage src={community.communityProfileImage} alt={community.name} />
                            <AvatarFallback>
                                <Users className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm">{community.name}</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleCopy(community); }}
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

'use client';

import { Community } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { ClipboardCopy, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isCommunityExported, migrateCommunityToFirestore } from '@/app/actions';

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
  const [exportedStatus, setExportedStatus] = useState<Record<string, boolean>>({});
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    const checkExportStatus = async () => {
      const statusMap: Record<string, boolean> = {};
      for (const community of communities) {
        statusMap[community.id] = await isCommunityExported(community.id);
      }
      setExportedStatus(statusMap);
    };
    if(communities.length > 0){
        checkExportStatus();
    }
  }, [communities]);


  const handleCopy = (community: Community) => {
    navigator.clipboard.writeText(JSON.stringify(community.data, null, 2));
    toast({
      title: 'Copied to clipboard',
      description: `Community data for "${community.name}" has been copied.`,
    });
  };

  const handleExport = async (communityId: string) => {
    setExportingId(communityId);
    try {
      const result = await migrateCommunityToFirestore(communityId);
       if (result.success) {
        toast({
          title: 'Migration Successful',
          description: result.message,
        });
        setExportedStatus(prev => ({...prev, [communityId]: true}));
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Migration Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
        setExportingId(null);
    }
  };


  const filteredCommunities = communities.filter((community) =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col bg-card">
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
                <div key={community.id} className="group flex items-center rounded-md pr-2 hover:bg-muted"
                  onClick={() => onSelectCommunity(community.id)}>
                    <div
                        className={`w-full justify-start flex-grow h-auto py-2 px-2 flex items-center cursor-pointer rounded-md ${selectedCommunityId === community.id ? 'bg-secondary' : ''}`}
                    >
                        <Avatar className="mr-3 h-8 w-8">
                            <AvatarImage src={community.communityProfileImage} alt={community.name} />
                            <AvatarFallback>
                                <Users className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex justify-between items-center">
                          <span className="truncate text-sm">{community.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{community.memberCount}</Badge>
                             <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                onClick={(e) => { e.stopPropagation(); handleCopy(community); }}
                            >
                                <ClipboardCopy className="h-4 w-4" />
                            </Button>
                             <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                disabled={exportedStatus[community.id] || exportingId === community.id}
                                onClick={(e) => { e.stopPropagation(); handleExport(community.id); }}
                            >
                                {exportingId === community.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <UploadCloud className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                    </div>
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

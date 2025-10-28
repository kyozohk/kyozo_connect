
'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LayoutGrid } from 'lucide-react';
import { Community } from '@/types';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';

interface CommunityNavProps {
  communities: Community[];
  currentCommunityId: string | null;
}

export function CommunityNav({ communities, currentCommunityId }: CommunityNavProps) {
  const router = useRouter();
  const currentCommunity = communities.find((c) => c.id === currentCommunityId);

  const handleCommunityChange = (communityId: string) => {
    if (communityId !== currentCommunityId) {
      router.push(`/communities/${communityId}`);
    }
  };

  if (!communities.length) {
    return (
        <div className="flex h-16 items-center border-b px-4">
            <Skeleton className="h-8 w-8 rounded-full mr-2" />
            <Skeleton className="h-6 w-36" />
        </div>
    )
  }

  return (
    <div className="flex h-16 items-center border-b px-2">
      <Select value={currentCommunityId || ''} onValueChange={handleCommunityChange}>
        <SelectTrigger className="w-full h-full border-0 shadow-none focus:ring-0">
          <SelectValue asChild>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentCommunity?.communityProfileImage} alt={currentCommunity?.name} />
                <AvatarFallback><LayoutGrid className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <span className="font-semibold truncate">{currentCommunity?.name || 'Select Community'}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {communities.map((community) => (
              <SelectItem key={community.id} value={community.id}>
                 <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={community.communityProfileImage} alt={community.name} />
                        <AvatarFallback><LayoutGrid className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">{community.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

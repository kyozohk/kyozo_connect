
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, MessagesSquare, CalendarIcon, LayoutGrid, Edit, Tag } from 'lucide-react';
import { Community } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ViewMode = 'grid' | 'list';

type PaginatedCommunity = Community & {
  createdAt?: string;
  messageCount?: number;
};

interface CommunityCardProps {
  community: PaginatedCommunity;
  viewMode: ViewMode;
}

export function CommunityCard({ community, viewMode }: CommunityCardProps) {

  const createdAt = community.createdAt ? new Date(community.createdAt) : null;
  const data = community.data as any;
  const slug = data.slug || community.id;
  const tags = data.tags && Array.isArray(data.tags) ? data.tags : [];
  const visibleTags = tags.slice(0, 2);
  const hiddenTags = tags.slice(2);

  if (viewMode === 'list') {
    return (
     <Link href={`/communities/${slug}`} className="block h-full">
        <Card className="hover:shadow-md transition-shadow h-full">
        <div className="flex items-center p-4">
            <Avatar className="h-10 w-10 mr-4">
            <AvatarImage src={community.communityProfileImage} alt={community.name} />
            <AvatarFallback>
                <LayoutGrid className="h-5 w-5" />
            </AvatarFallback>
            </Avatar>
            <div className="flex-grow">
            <p className="font-semibold">{community.name}</p>
            <div className="flex flex-wrap items-center gap-1 mt-1">
                {tags.slice(0, 4).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
                ))}
                {tags.length > 4 && (
                    <Badge variant="outline" className="text-xs">+{tags.length - 4} more</Badge>
                )}
            </div>
            </div>
            <div className="flex items-center text-sm text-muted-foreground mr-4">
                <Users className="h-4 w-4 mr-1" />
                {community.memberCount}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit className="h-4 w-4" />
            </Button>
        </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/communities/${slug}`} className="block h-full">
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <Avatar className="h-12 w-12">
                <AvatarImage src={community.communityProfileImage} alt={community.name} />
                <AvatarFallback><LayoutGrid className="h-6 w-6" /></AvatarFallback>
            </Avatar>
            <div className="flex-grow">
            <CardTitle>{community.name}</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
            <div className="flex space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    {community.memberCount} members
                </div>
                <div className="flex items-center">
                    <MessagesSquare className="mr-1 h-4 w-4" />
                    {community.messageCount || 0} messages
                </div>
            </div>
            
            {tags.length > 0 && (
                <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Tags</p>
                    <div className="flex items-center flex-wrap gap-1">
                        {visibleTags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                        ))}
                        {hiddenTags.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="link" size="sm" className="p-0 h-auto text-xs text-muted-foreground">
                                        +{hiddenTags.length} more
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {hiddenTags.map((tag: string, index: number) => (
                                        <DropdownMenuItem key={index}>{tag}</DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            )}


            {data.colorPalette && Array.isArray(data.colorPalette) && data.colorPalette.length > 0 && (
                <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Color Palette</p>
                    <div className="flex items-center gap-2">
                        {data.colorPalette.map((color: any, index: number) => (
                            <div key={index} className="h-5 w-5 rounded-full border" style={{ backgroundColor: color.hexCode }} title={color.hexCode} />
                        ))}
                    </div>
                </div>
            )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
            <div className="flex items-center">
                {createdAt && (
                    <>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>Created on {format(createdAt, "MMM d, yyyy")}</span>
                    </>
                )}
            </div>
        </CardFooter>
        </Card>
    </Link>
  );
}

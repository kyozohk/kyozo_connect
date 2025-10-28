
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, MessagesSquare, CalendarIcon, LayoutGrid } from 'lucide-react';
import { Community } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';

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

  const CardLink = ({children}: {children: React.ReactNode}) => (
    <Link href={`/communities/${community.id}`} className="block h-full">
        {children}
    </Link>
  )

  if (viewMode === 'list') {
    return (
     <CardLink>
        <Card className="flex items-center p-4 hover:shadow-md transition-shadow h-full">
            <Avatar className="h-10 w-10 mr-4">
            <AvatarImage src={community.communityProfileImage} alt={community.name} />
            <AvatarFallback>
                <LayoutGrid className="h-5 w-5" />
            </AvatarFallback>
            </Avatar>
            <div className="flex-grow">
            <p className="font-semibold">{community.name}</p>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            {community.memberCount}
            </div>
        </Card>
      </CardLink>
    );
  }

  return (
    <CardLink>
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
    </CardLink>
  );
}

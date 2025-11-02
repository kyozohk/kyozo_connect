'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Users, LayoutGrid, TrendingUp, MessagesSquare } from 'lucide-react';

export function CommunityHeaderSkeleton() {
  return (
    <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-1 h-4 w-24" />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}

export function CommunityStatsSkeleton() {
  const stats = [
    { icon: Users },
    { icon: LayoutGrid },
    { icon: TrendingUp },
    { icon: MessagesSquare },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CommunityOverviewSkeleton() {
  return (
    <div className="flex-1">
      <CommunityHeaderSkeleton />
      <div className="p-8">
        <CommunityStatsSkeleton />
      </div>
    </div>
  );
}

export function MemberListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 rounded-md border p-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function InboxSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center border-b px-4 py-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="ml-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-1 h-4 w-24" />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`mb-4 flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[70%] rounded-lg p-3 ${i % 2 === 0 ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="mt-2 h-4 w-[150px]" />
              <div className="mt-1 text-xs opacity-70">
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

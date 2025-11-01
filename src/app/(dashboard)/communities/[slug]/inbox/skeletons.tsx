'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MemberListSkeleton() {
  return (
    <div className="flex h-full flex-col bg-card">
      <div className="p-4 border-b">
        <Skeleton className="h-9 w-full" />
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="flex h-full flex-col bg-card">
      <header className="flex items-center justify-between border-b p-4">
        <Skeleton className="h-6 w-40" />
      </header>
      <div className="p-4 border-b">
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-64" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

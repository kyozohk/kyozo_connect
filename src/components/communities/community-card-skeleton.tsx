
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

type ViewMode = 'grid' | 'list';

interface CommunityCardSkeletonProps {
  viewMode: ViewMode;
}

export function CommunityCardSkeleton({ viewMode }: CommunityCardSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <Card>
        <div className="flex items-center p-4">
          <Skeleton className="h-10 w-10 rounded-full mr-4" />
          <div className="flex-grow space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex items-center text-sm text-muted-foreground mr-4">
              <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-grow space-y-2">
          <Skeleton className="h-6 w-3/4" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex space-x-4 text-sm">
           <Skeleton className="h-4 w-24" />
           <Skeleton className="h-4 w-24" />
        </div>
        <div>
            <Skeleton className="h-3 w-12 mb-2" />
            <div className="flex items-center flex-wrap gap-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
            </div>
        </div>
        <div>
            <Skeleton className="h-3 w-20 mb-2" />
            <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-5 rounded-full" />
            </div>
        </div>
      </CardContent>
      <CardFooter>
          <Skeleton className="h-4 w-32" />
      </CardFooter>
    </Card>
  );
}

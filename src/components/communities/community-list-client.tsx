
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useInView } from 'react-intersection-observer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Loader2 } from 'lucide-react';
import { Community } from '@/types';
import { fetchMoreCommunities } from '@/app/actions/community-actions';
import { CommunityCard } from './community-card';
import { useDebounce } from '@/hooks/use-debounce';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { CommunityCardSkeleton } from './community-card-skeleton';

type ViewMode = 'grid' | 'list';

type PaginatedCommunity = Community & {
  createdAt?: string;
  messageCount?: number;
};

interface CommunityListClientProps {
    initialCommunities: PaginatedCommunity[];
    initialHasMore: boolean;
    pageSize: number;
    initialSearchTerm: string;
}

export function CommunityListClient({ initialCommunities, initialHasMore, pageSize, initialSearchTerm }: CommunityListClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [communities, setCommunities] = useState<PaginatedCommunity[]>(initialCommunities);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const { ref, inView } = useInView();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  
  const loadMoreCommunities = useCallback(async () => {
    if (!hasMore || isLoading || isPending) return;
    setIsLoading(true);

    const lastId = communities.length > 0 ? communities[communities.length - 1].id : null;
    
    try {
      // Use server action for fetching more communities
      const result = await fetchMoreCommunities(pageSize, lastId, debouncedSearchTerm);
      
      startTransition(() => {
        setCommunities((prev) => [...prev, ...result.communities]);
        setHasMore(result.hasMore);
      });
    } catch (error) {
      console.error('Error loading more communities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, isPending, communities, pageSize, debouncedSearchTerm, startTransition]);

  useEffect(() => {
    if (inView && !isLoading) {
      loadMoreCommunities();
    }
  }, [inView, loadMoreCommunities, isLoading]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearchTerm) {
      params.set('q', debouncedSearchTerm);
    } else {
      params.delete('q');
    }
    router.replace(`${pathname}?${params.toString()}`);
    
    // Reset and fetch for new search term
    setIsLoading(true);
    setCommunities([]);
    setHasMore(true); // Assume there is more until fetch proves otherwise
    
    // Use server action for search
    fetchMoreCommunities(pageSize, null, debouncedSearchTerm).then((result) => {
      startTransition(() => {
        setCommunities(result.communities);
        setHasMore(result.hasMore);
      });
      setIsLoading(false);
    }).catch(error => {
      console.error('Error searching communities:', error);
      setIsLoading(false);
    });

  }, [debouncedSearchTerm, pageSize, router, pathname, searchParams, startTransition]);


  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex-grow">
          <Input
            placeholder="Search communities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(isLoading && communities.length === 0) ? (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {Array.from({ length: 4 }).map((_, i) => (
                <CommunityCardSkeleton key={i} viewMode={viewMode} />
            ))}
        </div>
      ) : communities.length > 0 ? (
         <div className={`grid gap-4 ${viewMode === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {communities.map((community) => (
                <CommunityCard key={community.id} community={community} viewMode={viewMode} />
            ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-16">
            <p>No communities found.</p>
        </div>
      )}

      {isLoading && communities.length > 0 && (
        <div className={`grid gap-4 mt-4 ${viewMode === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
           {Array.from({ length: 2 }).map((_, i) => (
                <CommunityCardSkeleton key={i} viewMode={viewMode} />
            ))}
        </div>
      )}
      
      {!isLoading && communities.length === 0 && !hasMore && (
        <div className="text-center text-muted-foreground py-16">
            <p>No communities found for your search.</p>
        </div>
      )}

      <div ref={ref} className="h-1" />

    </div>
  );
}

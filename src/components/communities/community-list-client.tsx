
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Loader2 } from 'lucide-react';
import { Community } from '@/types';
import { getPaginatedFirestoreCommunities } from '@/app/fire/actions';
import { CommunityCard } from './community-card';
import { useDebounce } from '@/hooks/use-debounce';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

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

  const loadMoreCommunities = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);

    const lastId = communities.length > 0 ? communities[communities.length - 1].id : null;
    const { communities: newCommunities, hasMore: newHasMore } = await getPaginatedFirestoreCommunities(pageSize, lastId, debouncedSearchTerm);
    
    setCommunities((prev) => [...prev, ...newCommunities]);
    setHasMore(newHasMore);
    setIsLoading(false);
  }, [hasMore, isLoading, communities, pageSize, debouncedSearchTerm]);

  useEffect(() => {
    if (inView) {
      loadMoreCommunities();
    }
  }, [inView, loadMoreCommunities]);

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
    getPaginatedFirestoreCommunities(pageSize, null, debouncedSearchTerm).then(({ communities: newCommunities, hasMore: newHasMore }) => {
        setCommunities(newCommunities);
        setHasMore(newHasMore);
        setIsLoading(false);
    });

  }, [debouncedSearchTerm, pageSize, router, pathname, searchParams]);


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

      {communities.length > 0 && (
         <div className={`grid gap-4 ${viewMode === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {communities.map((community) => (
                <CommunityCard key={community.id} community={community} viewMode={viewMode} />
            ))}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {!isLoading && communities.length === 0 && (
        <div className="text-center text-muted-foreground py-16">
            <p>No communities found.</p>
        </div>
      )}

      <div ref={ref} className="h-1" />

    </div>
  );
}

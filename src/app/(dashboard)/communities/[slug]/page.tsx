import { Suspense } from 'react';
import { getCommunityBySlug } from '@/app/actions/community-actions';
import { CommunityHeader } from '@/components/communities/community-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, LayoutGrid, TrendingUp, MessagesSquare } from 'lucide-react';
import { notFound } from 'next/navigation';
import { CommunityDetailClient } from './community-detail-client';

// Loading component
function CommunityDetailLoading() {
  return (
    <div className="flex h-[80vh] w-full items-center justify-center bg-background">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default async function CommunityOverviewPage({ params }: { params: { slug: string } }) {
  // Properly handle params as an async API
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;
  
  // Fetch community data on the server
  const { community, members } = await getCommunityBySlug(slug);
  
  // Redirect to 404 if community not found
  if (!community) {
    notFound();
  }
  
  // Prepare stats for the community
  const stats = [
    { title: 'Total Members', value: members.length, icon: Users },
    { title: 'Communities', value: 1, icon: LayoutGrid },
    { title: 'Monthly Growth', value: "+0", icon: TrendingUp }, // Placeholder
    { title: 'Total Messages', value: community.messageCount || 0, icon: MessagesSquare },
  ];
  
  return (
    <div className="flex-1">
      <CommunityHeader community={community} />
      
      <div className="p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <Suspense fallback={<CommunityDetailLoading />}>
        <CommunityDetailClient community={community} members={members} />
      </Suspense>
    </div>
  );
}

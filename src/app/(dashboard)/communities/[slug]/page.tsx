

import { getFirestoreCommunities, getFirestoreMembers } from '@/app/fire/actions';
import { CommunityHeader } from '@/components/communities/community-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, LayoutGrid, TrendingUp, MessagesSquare } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function CommunityOverviewPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const communities = await getFirestoreCommunities();
  // Find community by slug from data, fallback to ID
  const community = communities.find(c => (c.data?.slug || c.id) === slug);

  if (!community) {
    notFound();
  }
  
  const members = await getFirestoreMembers(community.id);
  const messageCount = (community as any).messageCount || 0;

  const stats = [
    { title: 'Total Members', value: members.length, icon: Users },
    { title: 'Communities', value: 0, icon: LayoutGrid }, // Placeholder
    { title: 'Monthly Growth', value: "+0", icon: TrendingUp }, // Placeholder
    { title: 'Daily Messages', value: 0, icon: MessagesSquare }, // Placeholder
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
    </div>
  );
}

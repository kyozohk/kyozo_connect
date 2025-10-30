
import { getAdminDb } from '@/lib/firebase-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessagesSquare, LayoutGrid } from 'lucide-react';

async function getAnalyticsData() {
  try {
    const adminDb = await getAdminDb();

    // Use efficient count aggregations instead of fetching all documents
    const communitiesCountPromise = adminDb.collection('communities').count().get();
    const membersCountPromise = adminDb.collection('memberships').count().get();
    const messagesCountPromise = adminDb.collectionGroup('messages').count().get();

    const [
        communitiesCountSnapshot,
        membersCountSnapshot,
        messagesCountSnapshot
    ] = await Promise.all([
        communitiesCountPromise,
        membersCountPromise,
        messagesCountPromise
    ]);

    return {
      totalCommunities: communitiesCountSnapshot.data().count,
      totalMembers: membersCountSnapshot.data().count,
      totalMessages: messagesCountSnapshot.data().count,
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    // If there's an error (e.g., missing index for collectionGroup), fallback gracefully
    return {
      totalCommunities: 0,
      totalMembers: 0,
      totalMessages: 0,
    };
  }
}


export default async function AnalyticsPage() {
  const { totalCommunities, totalMembers, totalMessages } = await getAnalyticsData();

  const stats = [
    {
      title: 'Total Communities',
      value: totalCommunities,
      icon: LayoutGrid,
    },
    {
      title: 'Total Members',
      value: totalMembers,
      icon: Users,
    },
    {
      title: 'Total Messages',
      value: totalMessages,
      icon: MessagesSquare,
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
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
  );
}

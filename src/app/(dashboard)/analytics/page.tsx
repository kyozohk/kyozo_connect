
import { getAdminDb } from '@/lib/firebase-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessagesSquare, LayoutGrid } from 'lucide-react';

async function getAnalyticsData() {
  try {
    const adminDb = await getAdminDb();

    const communitiesSnapshot = await adminDb.collection('communities').get();
    const membersSnapshot = await adminDb.collection('memberships').get();
    
    // To get total messages, we need to iterate through communities
    let totalMessages = 0;
    for (const communityDoc of communitiesSnapshot.docs) {
      const messagesSnapshot = await communityDoc.ref.collection('messages').get();
      totalMessages += messagesSnapshot.size;
    }

    return {
      totalCommunities: communitiesSnapshot.size,
      totalMembers: membersSnapshot.size,
      totalMessages: totalMessages,
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
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
  );
}

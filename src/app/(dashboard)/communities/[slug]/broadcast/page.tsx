

import { MemberListClient } from '@/components/members/member-list-client';
import { getFirestoreMembers, getFirestoreCommunities } from '@/app/fire/actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { notFound } from 'next/navigation';


export default async function BroadcastPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  
  const communities = await getFirestoreCommunities();
  const community = communities.find(c => (c.data?.slug || c.id) === slug);
  
  if (!community) {
    notFound();
  }

  const members = await getFirestoreMembers(community.id);
  
  return (
     <div className="p-8">
      <h2 className="text-3xl font-bold tracking-tight mb-4">Broadcast</h2>
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-6 w-6" />
            Send a Broadcast
          </CardTitle>
          <CardDescription>
            Select members from the list to send a message to. This is a placeholder and the broadcast functionality is not yet implemented.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <MemberListClient initialMembers={members} selectionMode="multiple" />
        </CardContent>
      </Card>
    </div>
  );
}

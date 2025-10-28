
import { MemberListClient } from '@/components/members/member-list-client';
import { getFirestoreMembers } from '@/app/fire/actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Send } from 'lucide-react';


export default async function BroadcastPage({ params }: { params: { slug: string } }) {
  const members = await getFirestoreMembers(params.slug);
  
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

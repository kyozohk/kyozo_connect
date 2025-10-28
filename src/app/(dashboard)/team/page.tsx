
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function TeamPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Team</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Manage Team Members
          </CardTitle>
          <CardDescription>
            This is a placeholder page for inviting and managing your team members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>A list of team members and invitation options will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

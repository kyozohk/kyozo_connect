
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function SubscriptionPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Subscription</h2>
      </div>
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Manage Subscription
          </CardTitle>
          <CardDescription>
            This is a placeholder page for managing your subscription and billing information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Credit card information and plan details will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

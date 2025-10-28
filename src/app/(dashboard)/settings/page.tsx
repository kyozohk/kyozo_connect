
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Application Settings
          </CardTitle>
          <CardDescription>
            This is a placeholder page for managing application settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Settings for timezone, notifications, and other preferences will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

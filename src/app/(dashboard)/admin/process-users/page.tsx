'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { processPlaceholderUsers, getPlaceholderUsers } from '@/app/actions/user-actions';
import { Loader2 } from 'lucide-react';

export default function ProcessUsersPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [placeholderUsers, setPlaceholderUsers] = useState<any>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const handleProcessUsers = async () => {
    setLoading(true);
    try {
      const result = await processPlaceholderUsers();
      setResult(result);
    } catch (error) {
      console.error('Error processing users:', error);
      setResult({ error: 'Failed to process users' });
    } finally {
      setLoading(false);
    }
  };

  const handleGetPlaceholderUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await getPlaceholderUsers();
      setPlaceholderUsers(users);
    } catch (error) {
      console.error('Error getting placeholder users:', error);
      setPlaceholderUsers({ error: 'Failed to get placeholder users' });
    } finally {
      setLoadingUsers(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Process Placeholder Users</h1>
      <p className="text-muted-foreground mb-8">
        This utility converts placeholder users to real Firebase Auth users. Use this after migrating communities from MongoDB to Firestore.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Check Placeholder Users</CardTitle>
            <CardDescription>View all placeholder users that need to be processed</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleGetPlaceholderUsers} 
              disabled={loadingUsers}
              variant="outline"
            >
              {loadingUsers && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check Placeholder Users
            </Button>

            {placeholderUsers && (
              <div className="mt-4">
                <h3 className="font-medium">Found {placeholderUsers.count} placeholder users</h3>
                {placeholderUsers.count > 0 && (
                  <div className="mt-2 max-h-60 overflow-y-auto border rounded-md p-2">
                    <pre className="text-xs">{JSON.stringify(placeholderUsers.users, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Process Users</CardTitle>
            <CardDescription>Convert placeholder users to real Firebase Auth users</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleProcessUsers} 
              disabled={loading}
              variant="default"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Process Placeholder Users
            </Button>

            {result && (
              <div className="mt-4">
                {result.error ? (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{result.error}</AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertTitle>Result</AlertTitle>
                    <AlertDescription>
                      <p>{result.message}</p>
                      {result.errors && result.errors.length > 0 && (
                        <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-2">
                          <ul className="text-xs">
                            {result.errors.map((error: string, i: number) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            This action will create Firebase Auth users for all placeholder users.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

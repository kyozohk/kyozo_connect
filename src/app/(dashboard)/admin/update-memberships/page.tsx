'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { updateMembershipsWithUserData, getMembershipsNeedingUserData } from '@/app/actions/membership-actions';
import { Loader2 } from 'lucide-react';

export default function UpdateMembershipsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [memberships, setMemberships] = useState<any>(null);
  const [loadingMemberships, setLoadingMemberships] = useState(false);

  const handleUpdateMemberships = async () => {
    setLoading(true);
    try {
      const result = await updateMembershipsWithUserData();
      setResult(result);
    } catch (error) {
      console.error('Error updating memberships:', error);
      setResult({ error: 'Failed to update memberships' });
    } finally {
      setLoading(false);
    }
  };

  const handleGetMemberships = async () => {
    setLoadingMemberships(true);
    try {
      const memberships = await getMembershipsNeedingUserData();
      setMemberships(memberships);
    } catch (error) {
      console.error('Error getting memberships:', error);
      setMemberships({ error: 'Failed to get memberships' });
    } finally {
      setLoadingMemberships(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Update Memberships with User Data</h1>
      <p className="text-muted-foreground mb-8">
        This utility updates existing memberships with user data from MongoDB. Use this to fix placeholder users and ensure proper display of user information.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Check Memberships</CardTitle>
            <CardDescription>View all memberships that need user data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleGetMemberships} 
              disabled={loadingMemberships}
              variant="outline"
            >
              {loadingMemberships && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check Memberships
            </Button>

            {memberships && (
              <div className="mt-4">
                <h3 className="font-medium">Found {memberships.count} memberships</h3>
                {memberships.count > 0 && (
                  <div className="mt-2 max-h-60 overflow-y-auto border rounded-md p-2">
                    <pre className="text-xs">{JSON.stringify(memberships.memberships.slice(0, 5), null, 2)}</pre>
                    {memberships.memberships.length > 5 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        ... and {memberships.memberships.length - 5} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Memberships</CardTitle>
            <CardDescription>Update memberships with user data from MongoDB</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleUpdateMemberships} 
              disabled={loading}
              variant="default"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Memberships
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
            This action will update all memberships with user data from MongoDB.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

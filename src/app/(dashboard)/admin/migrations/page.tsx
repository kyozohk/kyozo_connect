'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminMigrationsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    details?: any;
  } | null>(null);

  const runMigration = async (migrationName: string) => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`/api/admin/${migrationName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      setResult({
        success: response.ok,
        message: data.message || (response.ok ? 'Migration completed successfully' : 'Migration failed'),
        details: data.results || data,
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: `Error: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Migrations</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Update Community Counts</CardTitle>
            <CardDescription>
              This migration updates all community documents with denormalized member and message counts.
              This improves performance by avoiding multiple queries when loading the communities page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Running this migration will:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Count members for each community</li>
              <li>Count messages for each community</li>
              <li>Store these counts directly in the community document</li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Last run: <span className="font-medium">Never</span>
            </div>
            <Button 
              onClick={() => runMigration('update-community-counts')} 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Running...' : 'Run Migration'}
            </Button>
          </CardFooter>
        </Card>
        
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>
              {result.message}
              
              {result.details && (
                <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

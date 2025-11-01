'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export default function TestMigrationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const testMigration = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/test-migration');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error testing migration:', error);
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Firebase Migration Test</h1>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test Firebase Migration</CardTitle>
          <CardDescription>
            Verify that your Firebase Firestore can be written to without using Auth
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
              <div className="flex items-center gap-2">
                {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
              </div>
              <AlertDescription>{result.message}</AlertDescription>
              
              {result.details && (
                <div className="mt-2 text-xs">
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              )}
            </Alert>
          )}
          
          <p className="text-sm text-muted-foreground mb-4">
            This test will create a placeholder user in Firestore (not in Firebase Auth) and a membership record.
            If this test succeeds, it means our migration strategy using placeholder UIDs will work.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={testMigration} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Migration Strategy'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

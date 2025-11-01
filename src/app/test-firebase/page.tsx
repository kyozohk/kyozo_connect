'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
}

export default function TestFirebasePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const testFirebaseAdmin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/test-firebase-admin');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error testing Firebase Admin:', error);
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
      <h1 className="text-2xl font-bold mb-6">Firebase Admin SDK Test</h1>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test Firebase Service Account</CardTitle>
          <CardDescription>
            Verify that your Firebase service account is properly configured
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
            </Alert>
          )}
          
          <p className="text-sm text-muted-foreground mb-4">
            This test will verify that your Firebase Admin SDK can initialize properly using the service account credentials from your environment variables.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={testFirebaseAdmin} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Firebase Admin SDK'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

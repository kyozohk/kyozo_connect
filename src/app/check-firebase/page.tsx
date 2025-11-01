'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface CheckResult {
  success: boolean;
  message: string;
  results: {
    auth: { success: boolean; error: string | null };
    firestore: { success: boolean; error: string | null };
    serviceAccount: { success: boolean; error: string | null };
  };
}

export default function CheckFirebasePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  const checkPermissions = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/check-firebase-permissions');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error checking Firebase permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Firebase Permissions Check</h1>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Check Firebase Permissions</CardTitle>
          <CardDescription>
            Verify that your Firebase service account has the necessary permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <div className="space-y-4">
              <Alert variant={result.success ? "default" : "destructive"}>
                <div className="flex items-center gap-2">
                  {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertTitle>{result.success ? 'All Checks Passed' : 'Some Checks Failed'}</AlertTitle>
                </div>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {result.results.serviceAccount.success ? 
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                    <AlertCircle className="h-4 w-4 text-red-500" />}
                  <span>Firebase Service Account</span>
                </div>
                {result.results.serviceAccount.error && (
                  <div className="text-xs text-red-500 ml-6">
                    {result.results.serviceAccount.error}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  {result.results.auth.success ? 
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                    <AlertCircle className="h-4 w-4 text-red-500" />}
                  <span>Firebase Authentication Permissions</span>
                </div>
                {result.results.auth.error && (
                  <div className="text-xs text-red-500 ml-6">
                    {result.results.auth.error}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  {result.results.firestore.success ? 
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                    <AlertCircle className="h-4 w-4 text-red-500" />}
                  <span>Firestore Permissions</span>
                </div>
                {result.results.firestore.error && (
                  <div className="text-xs text-red-500 ml-6">
                    {result.results.firestore.error}
                  </div>
                )}
              </div>
              
              {!result.success && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                  <h4 className="text-sm font-medium mb-2">How to fix these issues:</h4>
                  <ol className="text-xs space-y-1 list-decimal list-inside">
                    {!result.results.serviceAccount.success && (
                      <li>Check your .env.local file for FIREBASE_SERVICE_ACCOUNT_KEY_DEV</li>
                    )}
                    {!result.results.auth.success && result.results.serviceAccount.success && (
                      <li>Go to Firebase Console → Project Settings → Service accounts → Firebase Admin SDK and generate a new private key</li>
                    )}
                    {!result.results.firestore.success && result.results.serviceAccount.success && (
                      <li>Go to Google Cloud Console → IAM & Admin → IAM and ensure your service account has the "Cloud Datastore User" role</li>
                    )}
                  </ol>
                </div>
              )}
            </div>
          )}
          
          {!result && !loading && (
            <p className="text-sm text-muted-foreground mb-4">
              Click the button below to check if your Firebase service account has the necessary permissions for migration.
            </p>
          )}
          
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={checkPermissions} disabled={loading}>
            {loading ? 'Checking...' : 'Check Permissions'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { checkMigrationReadiness, type MigrationCheckResult } from '@/app/actions/migration-check';

// MigrationCheckResult is now imported from the server action

export function MigrationCheck({ onCheckComplete }: { onCheckComplete: (result: MigrationCheckResult) => void }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<MigrationCheckResult | null>(null);

  const runChecks = async () => {
    setChecking(true);
    setResult(null);
    
    try {
      // Call the server action to perform the checks
      const checkResult = await checkMigrationReadiness();
      
      setResult(checkResult);
      onCheckComplete(checkResult);
    } catch (error) {
      console.error('Migration check failed:', error);
      const errorResult: MigrationCheckResult = {
        success: false,
        message: `Migration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          authPermissions: false,
          firestorePermissions: false,
          serviceAccount: false,
          emailAuthEnabled: false
        }
      };
      setResult(errorResult);
      onCheckComplete(errorResult);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Migration Readiness Check</CardTitle>
        <CardDescription>
          Check if your Firebase project is properly configured for migration
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <div className="space-y-4">
            <Alert variant={result.success ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{result.success ? 'Ready for Migration' : 'Migration Issues Detected'}</AlertTitle>
              </div>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2">
                {result.details.serviceAccount ? 
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                  <AlertCircle className="h-4 w-4 text-red-500" />}
                <span>Firebase Service Account</span>
                {!result.details.serviceAccount && (
                  <div className="text-xs text-red-500 mt-1 ml-6">
                    Check your .env.local file for FIREBASE_SERVICE_ACCOUNT_KEY_DEV
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {result.details.authPermissions ? 
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                  <AlertCircle className="h-4 w-4 text-red-500" />}
                <span>Firebase Authentication Permissions</span>
                {!result.details.authPermissions && result.details.serviceAccount && (
                  <div className="text-xs text-red-500 mt-1 ml-6">
                    Your service account needs the "Firebase Authentication Admin" role
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {result.details.firestorePermissions ? 
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                  <AlertCircle className="h-4 w-4 text-red-500" />}
                <span>Firestore Permissions</span>
                {!result.details.firestorePermissions && result.details.serviceAccount && (
                  <div className="text-xs text-red-500 mt-1 ml-6">
                    Your service account needs the "Cloud Datastore User" role
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {result.details.emailAuthEnabled ? 
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                  <AlertCircle className="h-4 w-4 text-red-500" />}
                <span>Email/Password Authentication Enabled</span>
                {!result.details.emailAuthEnabled && (
                  <div className="text-xs text-red-500 mt-1 ml-6">
                    Enable Email/Password sign-in in Firebase Console → Authentication → Sign-in methods
                  </div>
                )}
              </div>
            </div>
            
            {!result.success && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                <h4 className="text-sm font-medium mb-2">How to fix these issues:</h4>
                <ol className="text-xs space-y-1 list-decimal list-inside">
                  {!result.details.serviceAccount && (
                    <li>Add the Firebase service account JSON to your .env.local file as FIREBASE_SERVICE_ACCOUNT_KEY_DEV</li>
                  )}
                  {!result.details.authPermissions && result.details.serviceAccount && (
                    <li>Go to Firebase Console → Project Settings → Service accounts → Firebase Admin SDK and generate a new private key</li>
                  )}
                  {!result.details.firestorePermissions && result.details.serviceAccount && (
                    <li>Go to Google Cloud Console → IAM & Admin → IAM and ensure your service account has the "Cloud Datastore User" role</li>
                  )}
                </ol>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runChecks} disabled={checking}>
          {checking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            'Run Migration Checks'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

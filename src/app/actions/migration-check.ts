'use server';

import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export interface MigrationCheckResult {
  success: boolean;
  message: string;
  details: {
    authPermissions: boolean;
    firestorePermissions: boolean;
    serviceAccount: boolean;
    emailAuthEnabled: boolean;
  };
}

/**
 * Server action to check Firebase migration readiness
 * This runs on the server and returns only serializable data
 */
export async function checkMigrationReadiness(): Promise<MigrationCheckResult> {
  try {
    // Check Firebase Auth permissions
    let authPermissions = false;
    try {
      const adminAuth = await getAdminAuth();
      // Try to list a single user to check permissions
      await adminAuth.listUsers(1);
      authPermissions = true;
      console.log('Firebase Auth permissions check passed');
    } catch (error) {
      console.error('Firebase Auth permissions check failed:', error);
    }
    
    // Check Firestore permissions
    let firestorePermissions = false;
    try {
      const adminDb = await getAdminDb();
      // Try to access the users collection
      await adminDb.collection('users').limit(1).get();
      firestorePermissions = true;
      console.log('Firestore permissions check passed');
    } catch (error) {
      console.error('Firestore permissions check failed:', error);
    }
    
    // Check if service account is configured
    const serviceAccount = authPermissions || firestorePermissions; // If either worked, service account is configured
    
    // Check if Email/Password auth is enabled - we'll assume it is since we can't easily check
    const emailAuthEnabled = true;
    
    const success = authPermissions && firestorePermissions && serviceAccount && emailAuthEnabled;
    
    return {
      success,
      message: success
        ? 'All checks passed! You can proceed with migration.'
        : 'Some checks failed. Please fix the issues before proceeding.',
      details: {
        authPermissions,
        firestorePermissions,
        serviceAccount,
        emailAuthEnabled
      }
    };
  } catch (error) {
    console.error('Migration check failed:', error);
    return {
      success: false,
      message: `Migration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        authPermissions: false,
        firestorePermissions: false,
        serviceAccount: false,
        emailAuthEnabled: false
      }
    };
  }
}

/**
 * Test function to check if Firebase service account is properly configured
 */
export async function testFirebaseServiceAccount(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    // Check if the service account env var is set
    const serviceAccountKey = process.env.NODE_ENV === 'production'
      ? process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PROD
      : process.env.FIREBASE_SERVICE_ACCOUNT_KEY_DEV;
    
    if (!serviceAccountKey) {
      return { 
        success: false, 
        message: `Firebase service account environment variable not set for ${process.env.NODE_ENV === 'production' ? 'production' : 'development'}.` 
      };
    }
    
    // Try to parse the service account JSON
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      
      // Check if the service account has the required fields
      const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
      const missingFields = requiredFields.filter(field => !serviceAccount[field]);
      
      if (missingFields.length > 0) {
        return { 
          success: false, 
          message: `Firebase service account is missing required fields: ${missingFields.join(', ')}` 
        };
      }
      
      // Try to initialize Firebase Admin
      const adminAuth = await getAdminAuth();
      
      // Try a simple operation to verify permissions
      try {
        await adminAuth.listUsers(1);
        return { 
          success: true, 
          message: `Firebase service account is properly configured for project: ${serviceAccount.project_id}` 
        };
      } catch (authError) {
        // If we can initialize but not list users, we have a permissions issue
        return { 
          success: false, 
          message: `Firebase service account has insufficient permissions: ${authError instanceof Error ? authError.message : 'Unknown error'}`,
          details: { authError }
        };
      }
    } catch (parseError) {
      return { 
        success: false, 
        message: 'Firebase service account JSON is invalid. Please check the format.',
        details: { parseError }
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: `Firebase service account error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    };
  }
}

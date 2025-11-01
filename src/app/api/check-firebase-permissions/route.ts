import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const results = {
      auth: { success: false, error: null as string | null },
      firestore: { success: false, error: null as string | null },
      serviceAccount: { success: false, error: null as string | null }
    };
    
    // Check if service account is properly configured
    try {
      // Check if the service account env var is set
      const serviceAccountKey = process.env.NODE_ENV === 'production'
        ? process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PROD
        : process.env.FIREBASE_SERVICE_ACCOUNT_KEY_DEV;
      
      if (!serviceAccountKey) {
        results.serviceAccount.error = `Firebase service account environment variable not set for ${process.env.NODE_ENV === 'production' ? 'production' : 'development'}.`;
      } else {
        try {
          const serviceAccount = JSON.parse(serviceAccountKey);
          
          // Check if the service account has the required fields
          const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
          const missingFields = requiredFields.filter(field => !serviceAccount[field]);
          
          if (missingFields.length > 0) {
            results.serviceAccount.error = `Firebase service account is missing required fields: ${missingFields.join(', ')}`;
          } else {
            results.serviceAccount.success = true;
          }
        } catch (parseError) {
          results.serviceAccount.error = 'Firebase service account JSON is invalid. Please check the format.';
        }
      }
    } catch (error) {
      results.serviceAccount.error = `Error checking service account: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    
    // Check Firebase Auth permissions
    try {
      const adminAuth = await getAdminAuth();
      await adminAuth.listUsers(1);
      results.auth.success = true;
    } catch (error) {
      results.auth.error = `Firebase Auth error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    
    // Check Firestore permissions
    try {
      const adminDb = await getAdminDb();
      
      // Try to read from Firestore
      try {
        await adminDb.collection('users').limit(1).get();
        results.firestore.success = true;
      } catch (readError) {
        results.firestore.error = `Firestore read error: ${readError instanceof Error ? readError.message : 'Unknown error'}`;
        
        // If read fails, try to check if we can at least initialize Firestore
        try {
          await adminDb.collection('_test_').doc('_test_').set({ test: true });
          await adminDb.collection('_test_').doc('_test_').delete();
          results.firestore.success = true;
          results.firestore.error = null;
        } catch (writeError) {
          results.firestore.error = `Firestore write error: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`;
        }
      }
    } catch (error) {
      results.firestore.error = `Firestore initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    
    return NextResponse.json({
      success: results.auth.success && results.firestore.success && results.serviceAccount.success,
      message: results.auth.success && results.firestore.success && results.serviceAccount.success
        ? 'All Firebase permissions checks passed'
        : 'Some Firebase permissions checks failed',
      results
    });
  } catch (error) {
    console.error('Error checking Firebase permissions:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error checking Firebase permissions: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

'use server';

import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { serializeFirestoreData } from '@/lib/firebase-utils';

/**
 * Processes placeholder users and creates real Firebase Auth accounts for them
 */
export async function processPlaceholderUsers() {
  const adminDb = await getAdminDb();
  const adminAuth = await getAdminAuth();
  const results = {
    processed: 0,
    created: 0,
    failed: 0,
    errors: [] as string[]
  };

  try {
    // Find all memberships with placeholder users
    const placeholderMemberships = await adminDb
      .collection('memberships')
      .where('isPlaceholder', '==', true)
      .get();

    if (placeholderMemberships.empty) {
      return { ...results, message: 'No placeholder users found' };
    }

    results.processed = placeholderMemberships.size;
    
    // Process each placeholder membership
    for (const doc of placeholderMemberships.docs) {
      const membership = doc.data();
      const originalMongoId = membership.originalMongoId;
      const userId = membership.userId;
      
      // Skip if no email is available
      if (!membership.originalUserEmail && !membership.email) {
        results.errors.push(`No email found for user ${userId}`);
        results.failed++;
        continue;
      }
      
      const email = membership.originalUserEmail || membership.email;
      const displayName = membership.originalUserName || membership.displayName || email.split('@')[0];
      const phoneNumber = membership.phoneNumber || null;
      
      try {
        // Check if user already exists by email
        let firebaseUser;
        try {
          firebaseUser = await adminAuth.getUserByEmail(email);
          console.log(`User already exists with email ${email}, updating membership`);
        } catch (e: any) {
          if (e.code === 'auth/user-not-found') {
            // Generate a random password
            const randomPassword = Math.random().toString(36).slice(-12) + 
                                  Math.random().toString(36).toUpperCase().slice(-4) + 
                                  '!1';
            
            // Create a new user in Firebase Auth
            firebaseUser = await adminAuth.createUser({
              email: email,
              emailVerified: true,
              displayName: displayName,
              phoneNumber: phoneNumber,
              password: randomPassword,
            });
            
            // Create user profile in Firestore
            const userRef = adminDb.collection('users').doc(firebaseUser.uid);
            await userRef.set({
              displayName: displayName,
              email: email,
              photoURL: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
              phoneNumber: phoneNumber,
              originalMongoId: originalMongoId,
              createdAt: new Date(),
              passwordInitialized: false
            });
            
            results.created++;
            console.log(`Created new Firebase user for ${email} with ID ${firebaseUser.uid}`);
          } else {
            throw e; // Re-throw other errors
          }
        }
        
        // Update the membership with the real Firebase UID
        if (firebaseUser) {
          await adminDb.collection('memberships').doc(doc.id).update({
            userId: firebaseUser.uid,
            isPlaceholder: false,
            needsUserCreation: false,
            updatedAt: new Date()
          });
        }
        
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to process user ${email}: ${error.message || error}`);
        console.error(`Failed to process placeholder user ${email}:`, error);
      }
    }
    
    return {
      ...results,
      message: `Processed ${results.processed} placeholder users. Created ${results.created} new users. Failed: ${results.failed}.`
    };
    
  } catch (error: any) {
    console.error('Error processing placeholder users:', error);
    return {
      ...results,
      message: `Error processing placeholder users: ${error.message || error}`,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Gets all placeholder users from Firestore
 */
export async function getPlaceholderUsers() {
  const adminDb = await getAdminDb();
  
  try {
    const placeholderMemberships = await adminDb
      .collection('memberships')
      .where('isPlaceholder', '==', true)
      .get();
      
    if (placeholderMemberships.empty) {
      return { count: 0, users: [] };
    }
    
    const users = placeholderMemberships.docs.map(doc => {
      const data = doc.data();
      return serializeFirestoreData({
        id: doc.id,
        ...data
      });
    });
    
    return {
      count: users.length,
      users
    };
  } catch (error: any) {
    console.error('Error getting placeholder users:', error);
    return {
      count: 0,
      users: [],
      error: error.message || 'Unknown error'
    };
  }
}

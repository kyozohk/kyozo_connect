'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { serializeFirestoreData } from '@/lib/firebase-utils';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

/**
 * Updates existing memberships with user data from MongoDB
 */
export async function updateMembershipsWithUserData() {
  const adminDb = await getAdminDb();
  const mongoDb = await getDb();
  const results = {
    processed: 0,
    updated: 0,
    failed: 0,
    errors: [] as string[]
  };

  try {
    // Find all memberships
    const membershipsSnapshot = await adminDb
      .collection('memberships')
      .get();

    if (membershipsSnapshot.empty) {
      return { ...results, message: 'No memberships found' };
    }

    results.processed = membershipsSnapshot.size;
    
    // Process each membership
    for (const doc of membershipsSnapshot.docs) {
      const membership = doc.data();
      const originalMongoId = membership.originalMongoId;
      
      if (!originalMongoId) {
        results.errors.push(`No originalMongoId found for membership ${doc.id}`);
        results.failed++;
        continue;
      }
      
      try {
        // Find the original MongoDB user
        const mongoUser = await mongoDb.collection('users').findOne({ _id: new ObjectId(originalMongoId) });
        
        if (!mongoUser) {
          results.errors.push(`MongoDB user not found for ID ${originalMongoId}`);
          results.failed++;
          continue;
        }
        
        // Update the membership with user data
        const updateData = {
          displayName: mongoUser.fullName || mongoUser.displayName || membership.displayName || 'Unknown User',
          email: mongoUser.email || membership.email || '',
          photoURL: mongoUser.profileImage || mongoUser.photoURL || membership.photoURL || '',
          phoneNumber: mongoUser.phoneNumber || membership.phoneNumber || '',
          originalUserName: mongoUser.fullName || mongoUser.displayName || 'Unknown User',
          originalUserEmail: mongoUser.email || '',
        };
        
        await adminDb.collection('memberships').doc(doc.id).update(updateData);
        results.updated++;
        
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to update membership ${doc.id}: ${error.message || error}`);
        console.error(`Failed to update membership ${doc.id}:`, error);
      }
    }
    
    return {
      ...results,
      message: `Processed ${results.processed} memberships. Updated ${results.updated}. Failed: ${results.failed}.`
    };
    
  } catch (error: any) {
    console.error('Error updating memberships with user data:', error);
    return {
      ...results,
      message: `Error updating memberships: ${error.message || error}`,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Gets all memberships that need user data
 */
export async function getMembershipsNeedingUserData() {
  const adminDb = await getAdminDb();
  
  try {
    const membershipsSnapshot = await adminDb
      .collection('memberships')
      .get();
      
    if (membershipsSnapshot.empty) {
      return { count: 0, memberships: [] };
    }
    
    const memberships = membershipsSnapshot.docs.map(doc => {
      const data = doc.data();
      return serializeFirestoreData({
        id: doc.id,
        ...data
      });
    });
    
    return {
      count: memberships.length,
      memberships
    };
  } catch (error: any) {
    console.error('Error getting memberships:', error);
    return {
      count: 0,
      memberships: [],
      error: error.message || 'Unknown error'
    };
  }
}

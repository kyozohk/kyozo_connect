'use server';

import { getAdminDb } from '@/lib/firebase-admin';

/**
 * Migration script to update community documents with denormalized member and message counts
 * This helps improve performance by avoiding multiple queries when fetching communities
 */
export async function updateCommunityCounts() {
  const adminDb = await getAdminDb();
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Get all communities
    const communitiesSnapshot = await adminDb.collection('communities').get();
    
    if (communitiesSnapshot.empty) {
      return { message: 'No communities found to update', results };
    }

    // Process each community
    for (const communityDoc of communitiesSnapshot.docs) {
      try {
        // Get member count
        const membersSnapshot = await adminDb
          .collection('memberships')
          .where('communityId', '==', communityDoc.id)
          .get();
        
        // Get message count
        const messagesSnapshot = await communityDoc.ref
          .collection('messages')
          .get();
        
        // Update the community document with the counts
        await communityDoc.ref.update({
          memberCount: membersSnapshot.size,
          messageCount: messagesSnapshot.size,
          lastUpdated: new Date(),
        });
        
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to update community ${communityDoc.id}: ${error.message}`);
      }
    }

    return {
      message: `Updated ${results.success} communities with denormalized counts. Failed: ${results.failed}`,
      results,
    };
  } catch (error: any) {
    return {
      message: `Migration failed: ${error.message}`,
      results,
    };
  }
}

/**
 * Setup triggers to keep counts updated
 * This function should be called once to set up the necessary Firestore triggers
 * Note: This is a placeholder - actual implementation would depend on your backend setup
 */
export async function setupCountUpdateTriggers() {
  // In a real implementation, you would set up Firestore triggers or Cloud Functions
  // to update the counts whenever members are added/removed or messages are created
  
  // Example pseudo-code for what would be implemented in a Cloud Function:
  /*
  exports.onMembershipChange = functions.firestore
    .document('memberships/{membershipId}')
    .onWrite(async (change, context) => {
      // Get the community ID
      const communityId = change.after.exists 
        ? change.after.data().communityId 
        : change.before.data().communityId;
      
      // Get the current count
      const membersSnapshot = await admin.firestore()
        .collection('memberships')
        .where('communityId', '==', communityId)
        .get();
      
      // Update the community document
      await admin.firestore()
        .collection('communities')
        .doc(communityId)
        .update({
          memberCount: membersSnapshot.size,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
    });
  */
  
  return { message: 'This is a placeholder. Actual trigger setup would be done in Firebase Cloud Functions.' };
}

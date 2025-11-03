'use server';

import { getPaginatedFirestoreCommunities, getFirestoreCommunities } from '@/app/fire/actions';
import { Community, Member } from '@/types';
import { getAdminDb } from '@/lib/firebase-admin';
import { serializeFirestoreData } from '@/lib/firebase-utils';

/**
 * Server action to fetch more communities for pagination
 * This allows us to keep data fetching on the server even for pagination
 */
export async function fetchMoreCommunities(
  pageSize: number,
  lastId: string | null,
  searchTerm: string
): Promise<{
  communities: Community[];
  hasMore: boolean;
}> {
  try {
    const result = await getPaginatedFirestoreCommunities(pageSize, lastId, searchTerm);
    return result;
  } catch (error) {
    console.error('Error fetching more communities:', error);
    return { communities: [], hasMore: false };
  }
}

/**
 * Server action to fetch a community by slug or ID
 */
export async function getCommunityBySlug(slug: string): Promise<{
  community: Community | null;
  members: Member[];
}> {
  try {
    const adminDb = await getAdminDb();
    
    // First try to find by slug
    const slugQuery = adminDb.collection('communities').where('slug', '==', slug);
    let communitySnapshot = await slugQuery.get();
    
    // If not found by slug, try by ID
    if (communitySnapshot.empty) {
      console.log(`Community not found by slug: ${slug}, trying by ID...`);
      
      const idQuery = adminDb.collection('communities').doc(slug);
      const docSnapshot = await idQuery.get();
      
      if (!docSnapshot.exists) {
        console.log(`Community not found by ID: ${slug}`);
        return { community: null, members: [] };
      }
      
      // Create an array with the document snapshot
      // We need to handle it differently since it's not a QueryDocumentSnapshot
      const communityDoc = docSnapshot;
      const communityData = communityDoc.data() || {};
      
      // Get members
      const membersSnapshot = await adminDb
        .collection('memberships')
        .where('communityId', '==', communityDoc.id)
        .get();
      
      // Get messages
      const messagesSnapshot = await adminDb
        .collection('communities')
        .doc(communityDoc.id)
        .collection('messages')
        .get();
      
      // Update the community with correct counts
      const memberCount = membersSnapshot.size;
      const messageCount = messagesSnapshot.size;
      
      if (communityData.memberCount !== memberCount || communityData.messageCount !== messageCount) {
        await adminDb.collection('communities').doc(communityDoc.id).update({
          memberCount,
          messageCount
        });
        
        // Update the local data as well
        communityData.memberCount = memberCount;
        communityData.messageCount = messageCount;
      }
      
      const members = membersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.userId,
          displayName: data.displayName || 'Unknown User',
          photoURL: data.photoURL || '',
          email: data.email || '',
          role: data.role || 'member',
          joinedAt: data.joinedAt ? 
            (typeof data.joinedAt.toDate === 'function' ? data.joinedAt.toDate().toISOString() : new Date(data.joinedAt).toISOString()) : 
            '',
          data: serializeFirestoreData(data),
        } as Member;
      });
      
      const community: Community = {
        id: communityDoc.id,
        name: communityData.name || 'Unnamed Community',
        communityProfileImage: communityData.communityProfileImage || '',
        memberCount,
        messageCount,
        data: serializeFirestoreData(communityData),
      };
      
      return { community, members };
    }
    
    // Get the community data
    const communityDoc = communitySnapshot.docs[0];
    const communityData = communityDoc.data();
    
    // Get members
    const membersSnapshot = await adminDb
      .collection('memberships')
      .where('communityId', '==', communityDoc.id)
      .get();
    
    // Get messages
    const messagesSnapshot = await adminDb
      .collection('communities')
      .doc(communityDoc.id)
      .collection('messages')
      .get();
    
    // Update the community with correct counts
    const memberCount = membersSnapshot.size;
    const messageCount = messagesSnapshot.size;
    
    if (communityData.memberCount !== memberCount || communityData.messageCount !== messageCount) {
      await adminDb.collection('communities').doc(communityDoc.id).update({
        memberCount,
        messageCount
      });
      
      // Update the local data as well
      communityData.memberCount = memberCount;
      communityData.messageCount = messageCount;
    }
    
    const members = membersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: data.userId,
        displayName: data.displayName || 'Unknown User',
        photoURL: data.photoURL || '',
        email: data.email || '',
        role: data.role || 'member',
        joinedAt: data.joinedAt ? 
          (typeof data.joinedAt.toDate === 'function' ? data.joinedAt.toDate().toISOString() : new Date(data.joinedAt).toISOString()) : 
          '',
        data: serializeFirestoreData(data),
      } as Member;
    });
    
    const community: Community = {
      id: communityDoc.id,
      name: communityData.name || 'Unnamed Community',
      communityProfileImage: communityData.communityProfileImage || '',
      memberCount,
      messageCount,
      data: serializeFirestoreData(communityData),
    };
    
    return { community, members };
  } catch (error) {
    console.error('Error fetching community by slug:', error);
    return { community: null, members: [] };
  }
}

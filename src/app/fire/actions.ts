
'use server';

import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { Community, Member, Message } from '@/types';
import { UserRecord } from 'firebase-admin/auth';
import { format, parseISO } from 'date-fns';
import { DocumentData, Query, Timestamp } from 'firebase-admin/firestore';

export async function getFirestoreCommunities(): Promise<Community[]> {
  const adminDb = await getAdminDb();
  try {
    const communitiesSnapshot = await adminDb.collection('communities').orderBy('name').get();
    
    if (communitiesSnapshot.empty) {
      return [];
    }

    const communityPromises = communitiesSnapshot.docs.map(async (doc) => {
      const communityData = doc.data();
      const membersSnapshot = await adminDb.collection('memberships').where('communityId', '==', doc.id).get();
      
      return {
        id: doc.id,
        name: communityData.name,
        communityProfileImage: communityData.communityProfileImage,
        memberCount: membersSnapshot.size,
        data: JSON.parse(JSON.stringify(communityData)),
      };
    });

    return Promise.all(communityPromises);
  } catch (error) {
    console.error('Failed to get communities from Firestore:', error);
    return [];
  }
}

type PaginatedCommunity = Community & {
  createdAt?: string;
  messageCount?: number;
};

export async function getPaginatedFirestoreCommunities(
    pageSize: number,
    startAfter: any | null = null,
    searchTerm: string = ''
): Promise<{ communities: PaginatedCommunity[], hasMore: boolean }> {
  const adminDb = await getAdminDb();
  try {
    let query: Query<DocumentData> = adminDb.collection('communities');

    if (searchTerm) {
      query = query
        .where('name', '>=', searchTerm)
        .where('name', '<=', searchTerm + '\uf8ff');
    }
    
    query = query.orderBy('name').limit(pageSize + 1);

    if (startAfter) {
      const startAfterDoc = await adminDb.collection('communities').doc(startAfter).get();
      if(startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }
    
    const snapshot = await query.get();

    const communities: PaginatedCommunity[] = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();

      // Fetch member count
      const membersSnapshot = await adminDb.collection('memberships').where('communityId', '==', doc.id).get();
      
      // Fetch message count
      const messagesSnapshot = await doc.ref.collection('messages').get();

      let createdAt: string | undefined = undefined;
      if (data.createdAt && data.createdAt instanceof Timestamp) {
        createdAt = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
        createdAt = data.createdAt;
      }

      return {
        id: doc.id,
        name: data.name || 'Unnamed Community',
        communityProfileImage: data.communityProfileImage || '',
        memberCount: membersSnapshot.size,
        messageCount: messagesSnapshot.size,
        createdAt,
        data: JSON.parse(JSON.stringify(data)),
      };
    }));

    let hasMore = false;
    if (communities.length > pageSize) {
      hasMore = true;
      communities.pop(); // Remove the extra item
    }

    return { communities, hasMore };

  } catch (error) {
    console.error('Failed to get paginated communities from Firestore:', error);
    return { communities: [], hasMore: false };
  }
}


export async function getFirestoreMembers(communityId: string): Promise<Member[]> {
  if (!communityId) return [];
  const adminDb = await getAdminDb();
  const adminAuth = await getAdminAuth();
  try {
    const membersSnapshot = await adminDb.collection('memberships').where('communityId', '==', communityId).get();

    if (membersSnapshot.empty) {
      return [];
    }

    const memberPromises = membersSnapshot.docs.map(async (doc) => {
      const membership = doc.data();
      try {
        const userRecord: UserRecord = await adminAuth.getUser(membership.userId);
        const joinedAt = membership.joinedAt?.toDate ? membership.joinedAt.toDate().toISOString() : new Date().toISOString();

        return {
          id: userRecord.uid, 
          uid: userRecord.uid,
          displayName: userRecord.displayName || userRecord.email || 'Unknown User',
          photoURL: userRecord.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(userRecord.displayName || 'U')}`,
          email: userRecord.email || '',
          phoneNumber: userRecord.phoneNumber || '',
          role: membership.role,
          joinedAt: joinedAt,
          passwordInitialized: membership.passwordInitialized,
          data: JSON.parse(JSON.stringify({ ...userRecord.toJSON(), role: membership.role, joinedAt: joinedAt })),
        };
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          console.warn(`User with UID ${membership.userId} not found in Auth for membership ${doc.id}`);
          return null; // This member will be filtered out
        }
        throw error; // Re-throw other errors
      }
    });

    const members = (await Promise.all(memberPromises)).filter((m): m is Member => m !== null);
    
    // Sort members: owner, then admins, then members, then by displayName
    members.sort((a, b) => {
        const roleOrder = { owner: 0, admin: 1, member: 2 };
        if (a.role !== b.role) {
            return (roleOrder[a.role] || 2) - (roleOrder[b.role] || 2);
        }
        return a.displayName.localeCompare(b.displayName);
    });

    return members;
  } catch (error) {
    console.error(`Failed to get members for community ${communityId} from Firestore:`, error);
    return [];
  }
}

export async function getFirestoreMessagesForMember(communityId: string, memberId: string): Promise<Message[]> {
    if (!communityId || !memberId) return [];
    const adminDb = await getAdminDb();
    const adminAuth = await getAdminAuth();
    try {
        const messagesSnapshot = await adminDb.collection('communities').doc(communityId).collection('messages').orderBy('createdAt', 'desc').limit(100).get();

        if (messagesSnapshot.empty) {
            return [];
        }

        // Create a map to cache user data
        const userCache = new Map<string, Partial<Member>>();

        const messagePromises = messagesSnapshot.docs.map(async (doc) => {
            const messageData = doc.data();
            const senderId = messageData.userId;
            
            let sender: Partial<Member>;

            if (userCache.has(senderId)) {
                sender = userCache.get(senderId)!;
            } else {
                 try {
                    const userRecord: UserRecord = await adminAuth.getUser(senderId);
                    sender = {
                        id: userRecord.uid,
                        uid: userRecord.uid,
                        displayName: userRecord.displayName || userRecord.email || 'Unknown',
                        photoURL: userRecord.photoURL || '',
                        email: userRecord.email || '',
                        data: JSON.parse(JSON.stringify(userRecord.toJSON())),
                    };
                    userCache.set(senderId, sender);
                } catch (error) {
                     console.warn(`Could not fetch sender info for UID ${senderId}`);
                     sender = {
                        id: senderId,
                        uid: senderId,
                        displayName: 'Unknown User',
                        photoURL: '',
                     }
                }
            }

            return {
                id: doc.id,
                text: messageData.text,
                createdAt: messageData.createdAt.toDate().toISOString(),
                sender,
                data: JSON.parse(JSON.stringify(messageData)),
            };
        });

        const messages = await Promise.all(messagePromises);

        // This is a bit of a hack since we are fetching all messages for a community, not just for a member.
        // We will just return all community messages for now, as there is no direct chat concept in the new schema.
        // We'll filter them by the selected member `memberId` just to show something relevant, but the new structure
        // is more of a group chat than DMs.
        const relevantMessages = messages.filter(m => m.sender.id === memberId || m.sender.id === 'system');

        // If we want to show all messages, we can just return `messages`. For now, let's return all.
        return messages.reverse();

    } catch (error) {
        console.error(`Failed to get messages for community ${communityId} from Firestore:`, error);
        return [];
    }
}

async function deleteCollection(collectionRef: FirebaseFirestore.CollectionReference, batchSize: number) {
    const query = collectionRef.limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });

    async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value: unknown) => void) {
        const snapshot = await query.get();

        if (snapshot.size === 0) {
            return resolve(0);
        }

        const batch = collectionRef.firestore.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        process.nextTick(() => {
            deleteQueryBatch(query, resolve);
        });
    }
}

export async function deleteCommunityFromFirestore(communityId: string) {
    const adminDb = await getAdminDb();
    try {
        const communityRef = adminDb.collection('communities').doc(communityId);
        
        // 1. Delete messages subcollection
        const messagesRef = communityRef.collection('messages');
        await deleteCollection(messagesRef, 50);

        // 2. Delete memberships
        const membershipsQuery = adminDb.collection('memberships').where('communityId', '==', communityId);
        const membershipsSnapshot = await membershipsQuery.get();
        const membershipBatch = adminDb.batch();
        membershipsSnapshot.docs.forEach(doc => {
            membershipBatch.delete(doc.ref);
        });
        await membershipBatch.commit();
        
        // 3. Delete the community document itself
        await communityRef.delete();

        return { success: true, message: `Community with ID ${communityId} deleted successfully.` };

    } catch (error: any) {
        console.error(`Failed to delete community ${communityId} from Firestore:`, error);
        return { success: false, message: error.message || 'An unknown error occurred during deletion.' };
    }
}

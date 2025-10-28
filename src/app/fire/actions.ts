'use server';

import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { Community, Member, Message } from '@/types';
import { UserRecord } from 'firebase-admin/auth';
import { format, parseISO } from 'date-fns';

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
          role: membership.role,
          joinedAt: joinedAt,
          data: JSON.parse(JSON.stringify({ ...userRecord, role: membership.role, joinedAt: joinedAt })),
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
        if (roleOrder[a.role] !== roleOrder[b.role]) {
            return roleOrder[a.role] - roleOrder[b.role];
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
                        data: JSON.parse(JSON.stringify(userRecord)),
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

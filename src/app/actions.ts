
'use server';

import { getDb } from '@/lib/mongodb';
import { Community, Member, Message, RawMessage } from '@/types';
import { summarizeCommunityMessages, SummarizeCommunityMessagesInput } from '@/ai/flows/summarize-community-messages';
import { ObjectId } from 'mongodb';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { UserRecord } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

type UserData = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
};

export async function upsertUser(userData: UserData) {
  const db = await getDb();
  await db.collection('users').updateOne(
    { uid: userData.uid },
    {
      $set: {
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
      },
      $setOnInsert: {
        uid: userData.uid,
        communityIds: [], // Default to no communities
      },
    },
    { upsert: true }
  );
}

export async function getCommunities(): Promise<Community[]> {
  try {
    const db = await getDb();
    const communities = await db
      .collection('communities')
      .find({})
      .sort({ name: 1 })
      .toArray();

    return communities.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      communityProfileImage: c.communityProfileImage,
      memberCount: c.usersList?.length || 0,
      data: JSON.parse(JSON.stringify(c)),
    }));
  } catch (error) {
    console.error('Failed to get communities:', error);
    return [];
  }
}

export async function getMembers(communityId: string): Promise<Member[]> {
  if (!communityId) return [];
  try {
    const db = await getDb();
    
    const community = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });

    if (!community || !community.usersList) {
      return [];
    }
    
    const userOids = community.usersList.map((user: any) => user.userId);
    const userJoinDates: {[key: string]: string} = {};
    community.usersList.forEach((user: any) => {
        if(user.userId && user.joinedAt) {
            userJoinDates[user.userId.toString()] = user.joinedAt?.toISOString();
        }
    });

    const communityOwnerId = community.owner?.toString();
    const adminIds = (community.communityHandles || [])
        .filter((handle: any) => handle.role === 'cl' || handle.role === 'admin')
        .map((handle: any) => handle.userId.toString());


    const users = await db
      .collection('users')
      .find({ _id: { $in: userOids } })
      .project({ _id: 1, uid: 1, displayName: 1, photoURL: 1, email: 1, fullName: 1, profileImage: 1, phoneNumber: 1, firebaseUid: 1 })
      .limit(50)
      .toArray();

    return users.map((u: any) => {
        const userIdString = u._id.toString();
        let role: 'owner' | 'admin' | 'member' = 'member';
        if (userIdString === communityOwnerId) {
            role = 'owner';
        } else if (adminIds.includes(userIdString)) {
            role = 'admin';
        }

        return {
            id: userIdString,
            uid: u.uid || u.firebaseUid,
            displayName: u.displayName || u.fullName,
            photoURL: u.photoURL || u.profileImage,
            email: u.email,
            phoneNumber: u.phoneNumber,
            joinedAt: userJoinDates[userIdString],
            role,
            data: JSON.parse(JSON.stringify(u)),
        }
    });
  } catch (error) {
    console.error(`Failed to get members for community ${communityId}:`, error);
    return [];
  }
}

export async function getMessagesForMember(communityId: string, memberId: string): Promise<Message[]> {
  if (!communityId || !memberId) return [];
  try {
    const db = await getDb();
    const memberObjectId = new ObjectId(memberId);
    const communityObjectId = new ObjectId(communityId);

    const channel = await db.collection('channels').findOne({
      user: memberObjectId,
      community: communityObjectId,
    });

    if (!channel) {
      return [];
    }

    const messagesFromDb: any[] = await db.collection('messages').aggregate([
      { $match: { channel: channel._id } },
      { $sort: { createdAt: -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: 'users',
          localField: 'user', // user on message is the sender
          foreignField: '_id',
          as: 'senderInfo'
        }
      },
      { $unwind: { path: '$senderInfo', preserveNullAndEmptyArrays: true } }
    ]).toArray();

    return messagesFromDb.map((m: any) => ({
      id: m._id.toString(),
      text: m.text,
      createdAt: m.createdAt.toISOString(),
      sender: m.senderInfo ? {
        id: m.senderInfo._id.toString(),
        uid: m.senderInfo.uid,
        displayName: m.senderInfo.displayName || m.senderInfo.fullName,
        photoURL: m.senderInfo.photoURL || m.senderInfo.profileImage,
        email: m.senderInfo.email,
        data: JSON.parse(JSON.stringify(m.senderInfo)),
      } : { // Handle case where sender might not be in users collection or is system message
        id: m.user?.toString() || 'unknown',
        uid: 'unknown',
        displayName: 'Unknown Sender',
        photoURL: '',
        email: '',
        data: {},
      },
      data: JSON.parse(JSON.stringify(m)),
    }));
  } catch (error) {
    console.error(`Failed to get messages for member ${memberId} in community ${communityId}:`, error);
    return [];
  }
}


export async function summarizeMessages(input: SummarizeCommunityMessagesInput) {
    return await summarizeCommunityMessages(input);
}


export async function isCommunityExported(communityId: string): Promise<boolean> {
  const adminDb = await getAdminDb();
  try {
    const docRef = adminDb.collection('communities').doc(communityId);
    const doc = await docRef.get();
    return doc.exists;
  } catch (error) {
    console.error('Error checking if community is exported:', error);
    return false; // Assume not exported if there's an error
  }
}

export interface CommunityExportDataResult {
    success: boolean;
    message: string;
    exportData: string;
}

export async function getCommunityExportData(communityId: string, onStep: (step: 'community' | 'members' | 'messages') => void): Promise<CommunityExportDataResult> {
  let exportPreviewData: any = { community: {}, memberships: [], messages: [] };
  const PREVIEW_LIMIT = 100;

  try {
    const db = await getDb();

    // Fetch community
    onStep('community');
    const rawMongoCommunity = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });
    if (!rawMongoCommunity) {
      throw new Error('Community not found in MongoDB');
    }
    const finalCommunityData = JSON.parse(JSON.stringify({
        ...rawMongoCommunity,
        migratedAt: new Date(), 
    }));
    delete finalCommunityData._id;
    delete finalCommunityData.usersList;
    delete finalCommunityData.communityHandles;
    exportPreviewData.community = finalCommunityData;

    // Fetch members (with limit)
    onStep('members');
    const memberMongoOids = (rawMongoCommunity.usersList && Array.isArray(rawMongoCommunity.usersList))
      ? rawMongoCommunity.usersList.map((u: any) => u.userId).filter(Boolean)
      : [];
    const usersToMigrate = memberMongoOids.length > 0
      ? await db.collection('users').find({ _id: { $in: memberMongoOids } }).limit(PREVIEW_LIMIT).toArray()
      : [];

    const ownerMongoId = rawMongoCommunity.owner?.toString();
    const adminMongoIds = new Set((rawMongoCommunity.communityHandles || [])
      .filter((h: any) => h.role === 'cl' || h.role === 'admin')
      .map((h: any) => h.userId.toString()));
    const userJoinDateMap = new Map((rawMongoCommunity.usersList || []).map((u: any) => [u.userId.toString(), u.joinedAt]));

    exportPreviewData.memberships = usersToMigrate.map(user => {
        const memberMongoId = user._id.toString();
        let role: 'owner' | 'admin' | 'member' = 'member';
        if (memberMongoId === ownerMongoId) {
          role = 'owner';
        } else if (adminMongoIds.has(memberMongoId)) {
          role = 'admin';
        }
        const joinedAt = userJoinDateMap.get(memberMongoId);

        const { _id, __v, firebaseUid, ...restOfUser } = JSON.parse(JSON.stringify(user));

        return {
          communityId: communityId,
          userId: `firebase-uid-placeholder-${user.email}`,
          role: role,
          joinedAt: joinedAt ? new Date(joinedAt) : new Date(),
          phoneNumber: user.phoneNumber, // Make sure phoneNumber is included
          ...restOfUser,
        };
    });

    // Fetch messages (with limit, using efficient channel ID retrieval)
    onStep('messages');
    const mongoChannelIds = await db.collection('channels')
        .find({ community: new ObjectId(communityId) })
        .project({ _id: 1 })
        .map(doc => doc._id)
        .toArray();

    const mongoMessages = mongoChannelIds.length > 0
        ? await db.collection('messages').find({ channel: { $in: mongoChannelIds } }).sort({ createdAt: -1 }).limit(PREVIEW_LIMIT).toArray()
        : [];

    const userEmailMap = new Map(usersToMigrate.map(u => [u._id.toString(), u.email]));

    exportPreviewData.messages = mongoMessages.map(message => {
        const senderMongoId = (message.user || message.senderId)?.toString();
        const senderEmail = userEmailMap.get(senderMongoId) || 'unknown-email';
        return {
            text: message.text,
            createdAt: message.createdAt,
            userId: `firebase-uid-placeholder-${senderEmail}`,
        };
    }).reverse();

    return {
        success: true,
        message: `Preview generated for 1 community, ${exportPreviewData.memberships.length} members, and ${exportPreviewData.messages.length} messages (newest ${PREVIEW_LIMIT} each).`,
        exportData: JSON.stringify(exportPreviewData, null, 2),
    };

  } catch (error: any) {
    return {
        success: false,
        message: error.message || 'An unknown error occurred during data fetch.',
        exportData: JSON.stringify({ error: error.stack || error.message }, null, 2),
    };
  }
}

export async function migrateCommunityToFirestore(communityId: string) {
  const adminAuth = await getAdminAuth();
  const adminDb = await getAdminDb();
  let exportedData: any = {};

  try {
    const db = await getDb();
    const batch = adminDb.batch();
    
    // ** Step 1: Fetch the raw community document from MongoDB.
    const rawMongoCommunity = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });
    if (!rawMongoCommunity) {
      throw new Error('Community not found in MongoDB');
    }

    // ** Step 2: Get member ObjectIDs from the raw document.
    const memberMongoOids = (rawMongoCommunity.usersList && Array.isArray(rawMongoCommunity.usersList))
      ? rawMongoCommunity.usersList.map((u: any) => u.userId).filter(Boolean)
      : [];
    
    // ** Step 3: Fetch users from MongoDB using the array of ObjectIDs.
    const usersToMigrate = memberMongoOids.length > 0 
      ? await db.collection('users').find({ _id: { $in: memberMongoOids } }).toArray()
      : [];
    
    // ** Step 4: Register/Update users in Firebase Auth and prepare user profile data for Firestore.
    const userMigrationPromises = usersToMigrate.map(async (user) => {
      if (!user.email) {
        console.warn(`[MIGRATION_WARN] Skipping user with Mongo ID ${user._id} due to missing email.`);
        return null;
      }
      try {
        let firebaseUser: UserRecord;
        let isNewUser = false;
        
        try {
          // Find existing user by email
          firebaseUser = await adminAuth.getUserByEmail(user.email);
          // Update existing user's info
          await adminAuth.updateUser(firebaseUser.uid, {
              displayName: user.fullName || user.displayName || user.email,
              photoURL: user.profileImage || user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user.fullName || user.displayName || user.email)}`,
              phoneNumber: user.phoneNumber, // Ensure phone number is updated in Auth
           });
        } catch (e: any) {
          if (e.code === 'auth/user-not-found') {
            isNewUser = true;
            firebaseUser = await adminAuth.createUser({
              email: user.email,
              emailVerified: true,
              displayName: user.fullName || user.displayName || user.email,
              photoURL: user.profileImage || user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user.fullName || user.displayName || user.email)}`,
              phoneNumber: user.phoneNumber, // Ensure phone number is created in Auth
            });
          } else {
             throw e; // Re-throw other auth errors
          }
        }
        
        const sanitizedUser = JSON.parse(JSON.stringify(user));
        const { _id, __v, firebaseUid, ...restOfUser } = sanitizedUser;

        const firestoreUserProfile = {
          ...restOfUser,
          migratedAt: FieldValue.serverTimestamp(),
        };

        const userRef = adminDb.collection('users').doc(firebaseUser.uid);
        batch.set(userRef, firestoreUserProfile, { merge: true });

        return { mongoId: user._id.toString(), firebaseUid: firebaseUser.uid, isNewUser, phoneNumber: user.phoneNumber };

      } catch (e) {
        console.error(`[MIGRATION_ERROR] Failed to migrate user ${user.email} (MongoID: ${user._id}):`, e);
        return null;
      }
    });

    const migratedUsersResults = (await Promise.all(userMigrationPromises)).filter((res): res is { mongoId: string; firebaseUid: string; isNewUser: boolean; phoneNumber: string; } => res !== null);
    const uidMap = new Map(migratedUsersResults.map(u => [u.mongoId, u]));

    // ** Step 5: Migrate Community
    const firestoreCommunityRef = adminDb.collection('communities').doc(communityId);
    
    const sanitizedCommunity = JSON.parse(JSON.stringify(rawMongoCommunity));
    const { 
        _id, 
        usersList, 
        communityHandles, 
        ...restOfCommunityData 
    } = sanitizedCommunity;

    const finalCommunityData = {
        ...restOfCommunityData,
        migratedAt: FieldValue.serverTimestamp(),
    };
    
    batch.set(firestoreCommunityRef, finalCommunityData);
    exportedData = { community: finalCommunityData, memberships: [], messages: [] };

    // ** Step 6: Migrate Memberships
    const ownerMongoId = rawMongoCommunity.owner?.toString();
    const adminMongoIds = new Set((rawMongoCommunity.communityHandles || [])
      .filter((h: any) => h.role === 'cl' || h.role === 'admin')
      .map((h: any) => h.userId.toString()));

    if (rawMongoCommunity.usersList && Array.isArray(rawMongoCommunity.usersList)) {
        for (const userListItem of rawMongoCommunity.usersList) {
            const memberMongoId = userListItem.userId?.toString();
            if (!memberMongoId) continue;

            const migratedUser = uidMap.get(memberMongoId);
            if (migratedUser) {
                let role: 'owner' | 'admin' | 'member' = 'member';
                if (memberMongoId === ownerMongoId) {
                  role = 'owner';
                } else if (adminMongoIds.has(memberMongoId)) {
                  role = 'admin';
                }

                const joinedAt = userListItem.joinedAt;
                
                const membershipData: any = {
                  communityId: communityId,
                  userId: migratedUser.firebaseUid,
                  role: role,
                  joinedAt: joinedAt ? new Date(joinedAt) : FieldValue.serverTimestamp(),
                  phoneNumber: migratedUser.phoneNumber // Add phoneNumber to the membership document
                };

                if (migratedUser.isNewUser) {
                  membershipData.passwordInitialized = false;
                }
                
                // Use a sanitized version for the exported JSON
                exportedData.memberships.push(JSON.parse(JSON.stringify(membershipData)));
                const membershipRef = adminDb.collection('memberships').doc();
                batch.set(membershipRef, membershipData);
            } else {
                console.warn(`[MIGRATION_WARN] Could not find migrated user for MongoID ${memberMongoId}. Skipping membership.`);
            }
        }
    }
    
    // ** Step 7: Migrate Messages
    const mongoChannels = await db.collection('channels').find({ community: rawMongoCommunity._id }).toArray();
    const mongoChannelIds = mongoChannels.map(c => c._id);
    const mongoMessages = mongoChannelIds.length > 0
        ? await db.collection('messages').find({ channel: { $in: mongoChannelIds } }).toArray()
        : [];

    for (const message of mongoMessages) {
        const senderMongoId = (message.user || message.senderId)?.toString();
        if (!senderMongoId) {
            console.warn(`[MIGRATION_WARN] Skipping message ID ${message._id} due to missing sender ID.`);
            continue;
        }

        const migratedUser = uidMap.get(senderMongoId);
        if (migratedUser) {
            const messageData = {
                text: message.text,
                createdAt: message.createdAt,
                userId: migratedUser.firebaseUid,
            };
            
            exportedData.messages.push(JSON.parse(JSON.stringify(messageData)));
            const messageRef = firestoreCommunityRef.collection('messages').doc();
            batch.set(messageRef, messageData);
        } else {
             console.warn(`[MIGRATION_WARN] Skipping message ID ${message._id} because sender ${senderMongoId} was not found in the migrated user map.`);
        }
    }
    
    // ** Step 8: Commit all changes
    await batch.commit();

    const summaryMessage = `Migrated 1 community, ${exportedData.memberships.length} members (with profiles), and ${exportedData.messages.length} messages.`;
    console.log(`[MIGRATION_SUCCESS] Batch commit successful. ${summaryMessage}`);

    return { 
        success: true, 
        message: summaryMessage,
        exportedData: JSON.stringify(exportedData, null, 2),
    };

  } catch (error: any) {
    console.error('[MIGRATION_FAILED] An error occurred during migration:', error);
    const errorData = {
      ...exportedData,
      error: error.stack || error.message,
    }
    return { 
        success: false, 
        message: error.message || 'An unknown error occurred during migration.',
        exportedData: JSON.stringify(errorData, null, 2),
    };
  }
}

    
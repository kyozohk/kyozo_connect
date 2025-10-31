
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
  firstName?: string;
  lastName?: string;
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
        firstName: userData.firstName,
        lastName: userData.lastName,
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
  const adminDb = getAdminDb();
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
    const memberList = rawMongoCommunity.usersList || rawMongoCommunity.userReviewList || [];
    const memberMongoOids = Array.isArray(memberList)
      ? memberList.map((u: any) => u.userId).filter(Boolean)
      : [];
      
    const usersToMigrate = memberMongoOids.length > 0
      ? await db.collection('users').find({ _id: { $in: memberMongoOids } }).limit(PREVIEW_LIMIT).toArray()
      : [];

    const ownerMongoId = rawMongoCommunity.owner?.toString();
    const adminMongoIds = new Set((rawMongoCommunity.communityHandles || [])
      .filter((h: any) => ['cl', 'admin', 'commu_leader'].includes(h.role))
      .map((h: any) => h.userId.toString()));
    const userJoinDateMap = new Map((memberList || []).map((u: any) => [u.userId.toString(), u.joinedAt]));

    exportPreviewData.memberships = usersToMigrate.map(user => {
        const memberMongoId = user._id.toString();
        let role: 'owner' | 'admin' | 'member' = 'member';
        if (memberMongoId === ownerMongoId) {
          role = 'admin'; // Demote original owner to admin
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

export async function migrateCommunityToFirestore(communityId: string, ownerFirebaseUid: string) {
  console.log(`[MIGRATION_START] For Community ID: ${communityId} by Owner: ${ownerFirebaseUid}`);

  try {
    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();
    const db = await getDb(); // This is the mongo db
    
    const firestore = adminDb; // The getAdminDb() returns the firestore instance
    const batch = firestore.batch();
    
    console.log('[MIGRATION_INFO] Firebase Admin SDK initialized and batch created.');

    // 1. Fetch all necessary data from MongoDB
    const rawMongoCommunity = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });
    if (!rawMongoCommunity) throw new Error('Community not found in MongoDB');
    console.log(`[MIGRATION_INFO] Fetched raw community: ${rawMongoCommunity.name}`);
    
    // Handle inconsistent member list fields
    const memberList = rawMongoCommunity.usersList || rawMongoCommunity.userReviewList || [];
    const memberMongoOids = memberList.map((u: any) => u.userId).filter(Boolean);
    console.log(`[MIGRATION_INFO] Found ${memberMongoOids.length} potential member ObjectIDs.`);
    
    if (memberMongoOids.length === 0) {
      console.warn('[MIGRATION_WARN] No members found in usersList or userReviewList. Migration will continue for community doc only.');
    }

    const usersToMigrate = memberMongoOids.length > 0 
      ? await db.collection('users').find({ _id: { $in: memberMongoOids } }).toArray()
      : [];
    console.log(`[MIGRATION_INFO] Fetched ${usersToMigrate.length} user documents from MongoDB.`);

    // 2. Create/Update users in Firebase Auth and build a UID map
    const uidMap = new Map<string, { firebaseUid: string, isNewUser: boolean }>();
    const userMongoIdToAuthUid = new Map<string, string>();

    for (const user of usersToMigrate) {
        if (!user.email) {
            console.warn(`[MIGRATION_WARN] Skipping user with Mongo ID ${user._id} due to missing email.`);
            continue;
        }

        try {
            let firebaseUser: UserRecord;
            let isNewUser = false;
            
            const displayName = user.fullName || user.displayName || user.email;
            const photoURL = user.profileImage || user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

            try {
                firebaseUser = await adminAuth.getUserByEmail(user.email);
                console.log(`[MIGRATION_INFO] Found existing Firebase user for ${user.email} (UID: ${firebaseUser.uid})`);
            } catch (e: any) {
                if (e.code === 'auth/user-not-found') {
                    isNewUser = true;
                    firebaseUser = await adminAuth.createUser({
                        email: user.email,
                        emailVerified: true,
                        displayName,
                        photoURL,
                        password: Math.random().toString(36).slice(-8),
                    });
                    console.log(`[MIGRATION_INFO] Created new Firebase user for ${user.email} (UID: ${firebaseUser.uid})`);
                } else {
                    throw e; // Rethrow other auth errors
                }
            }
            
            const mongoIdString = user._id.toString();
            uidMap.set(mongoIdString, { firebaseUid: firebaseUser.uid, isNewUser });
            userMongoIdToAuthUid.set(mongoIdString, firebaseUser.uid);

            const userRef = firestore.collection('users').doc(firebaseUser.uid);
            // Clean user data for Firestore
            const { _id, __v, ...restOfUser } = user;
            const firestoreUserData = { 
                ...restOfUser, 
                displayName, 
                photoURL, 
                migratedAt: FieldValue.serverTimestamp() 
            };
            console.log(`[MIGRATION_BATCH] Adding user profile to batch for ${firebaseUser.uid}:`, JSON.stringify(firestoreUserData, null, 2));
            batch.set(userRef, firestoreUserData, { merge: true });
        } catch (e) {
            console.error(`[MIGRATION_ERROR] Failed to process user ${user.email} (MongoID: ${user._id}):`, e);
        }
    }
    console.log(`[MIGRATION_INFO] Processed ${uidMap.size} users for Auth and Firestore profiles.`);

    // 3. Prepare Community doc
    const firestoreCommunityRef = firestore.collection('communities').doc(communityId);
    const { _id, usersList, userReviewList, communityHandles, owner, ...restOfCommunityData } = rawMongoCommunity;
    const finalCommunityData = {
        ...restOfCommunityData,
        ownerId: ownerFirebaseUid, // Set the new owner
        migratedAt: FieldValue.serverTimestamp(),
    };
    console.log(`[MIGRATION_BATCH] Adding community doc to batch: ${communityId} with data:`, JSON.stringify(finalCommunityData, null, 2));
    batch.set(firestoreCommunityRef, finalCommunityData);

    // 4. Prepare Memberships
    const originalOwnerMongoId = rawMongoCommunity.owner?.toString();
    const adminMongoIds = new Set((rawMongoCommunity.communityHandles || [])
      .filter((h: any) => ['cl', 'admin', 'commu_leader'].includes(h.role))
      .map((h: any) => h.userId.toString()));


    for (const userListItem of memberList) {
        const memberMongoId = userListItem.userId?.toString();
        if (!memberMongoId || !uidMap.has(memberMongoId)) continue;

        const { firebaseUid, isNewUser } = uidMap.get(memberMongoId)!;
        let role: 'owner' | 'admin' | 'member' = 'member';
        
        if (firebaseUid === ownerFirebaseUid) {
            role = 'owner';
        } else if (memberMongoId === originalOwnerMongoId) {
             role = 'admin'; // Demote original owner to admin
        } else if(adminMongoIds.has(memberMongoId)) {
             role = 'admin';
        }
        
        const membershipRef = firestore.collection('memberships').doc();
        const membershipData = {
            communityId: communityId,
            userId: firebaseUid,
            role: role,
            joinedAt: userListItem.joinedAt ? new Date(userListItem.joinedAt) : FieldValue.serverTimestamp(),
            passwordInitialized: !isNewUser,
        };
        console.log(`[MIGRATION_BATCH] Adding membership to batch for user ${firebaseUid} with role ${role}.`);
        batch.set(membershipRef, membershipData);
    }

    // 5. Prepare Messages
    const mongoChannelIds = await db.collection('channels').find({ community: rawMongoCommunity._id }).project({ _id: 1 }).map(c => c._id).toArray();
    if (mongoChannelIds.length > 0) {
        const mongoMessages = await db.collection('messages').find({ channel: { $in: mongoChannelIds } }).toArray();
        console.log(`[MIGRATION_INFO] Fetched ${mongoMessages.length} messages to migrate.`);
        for (const message of mongoMessages) {
            const senderMongoId = (message.user || message.senderId)?.toString();
            if (!senderMongoId || !userMongoIdToAuthUid.has(senderMongoId)) {
                console.warn(`[MIGRATION_WARN] Skipping message ${message._id}. Could not find sender UID for Mongo ID ${senderMongoId}.`);
                continue;
            }
            const firebaseUid = userMongoIdToAuthUid.get(senderMongoId)!;
            const messageRef = firestoreCommunityRef.collection('messages').doc();
            const messageData = {
                text: message.text,
                createdAt: message.createdAt,
                userId: firebaseUid,
            };
            console.log(`[MIGRATION_BATCH] Adding message to batch from user ${firebaseUid}`);
            batch.set(messageRef, messageData);
        }
    }

    // 6. Commit the batch
    console.log(`[MIGRATION_INFO] Committing batch of ${uidMap.size} users, ${memberList.length} memberships, and associated messages to Firestore...`);
    await batch.commit();
    
    const summaryMessage = `Successfully migrated 1 community, ${uidMap.size} members, and the associated messages.`;
    console.log(`[MIGRATION_SUCCESS] ${summaryMessage}`);
    
    return {
        success: true,
        message: summaryMessage,
        exportedData: "See server logs for detailed migration data.",
    };

  } catch (error: any) {
    console.error('[MIGRATION_FAILED] An error occurred during migration:', error.stack || error);
    return { 
        success: false, 
        message: error.message || 'An unknown error occurred during migration.',
        exportedData: JSON.stringify({ error: error.stack || error.message }, null, 2),
    };
  }
}

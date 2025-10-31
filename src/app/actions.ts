
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
  console.log(`[MIGRATION_START] Starting migration for community ID: ${communityId}`);
  const adminAuth = await getAdminAuth();
  const adminDb = await getAdminDb();
  let exportedData: any = {};

  try {
    const db = await getDb();
    const batch = adminDb.batch();
    
    // ** Step 1: Fetch the raw community document from MongoDB.
    console.log(`[MIGRATION_STEP_1] Fetching community document from MongoDB for ID: ${communityId}`);
    const rawMongoCommunity = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });
    if (!rawMongoCommunity) {
      console.error(`[MIGRATION_ERROR] Community with ID ${communityId} not found in MongoDB`);
      throw new Error('Community not found in MongoDB');
    }
    console.log(`[MIGRATION_STEP_1_SUCCESS] Found community: ${rawMongoCommunity.name || 'Unnamed'}`);

    // ** Step 2: Get member ObjectIDs from the raw document.
    console.log(`[MIGRATION_STEP_2] Extracting member ObjectIDs from community document`);
    const memberMongoOids = (rawMongoCommunity.usersList && Array.isArray(rawMongoCommunity.usersList))
      ? rawMongoCommunity.usersList.map((u: any) => u.userId).filter(Boolean)
      : [];
    console.log(`[MIGRATION_STEP_2_SUCCESS] Found ${memberMongoOids.length} member ObjectIDs`);
    
    // ** Step 3: Fetch users from MongoDB using the array of ObjectIDs.
    console.log(`[MIGRATION_STEP_3] Fetching user documents from MongoDB using ${memberMongoOids.length} ObjectIDs`);
    const usersToMigrate = memberMongoOids.length > 0 
      ? await db.collection('users').find({ _id: { $in: memberMongoOids } }).toArray()
      : [];
    console.log(`[MIGRATION_STEP_3_SUCCESS] Retrieved ${usersToMigrate.length} user documents out of ${memberMongoOids.length} ObjectIDs`);
    
    // Log if there are missing users
    if (usersToMigrate.length < memberMongoOids.length) {
      const foundIds = new Set(usersToMigrate.map(u => u._id.toString()));
      const missingIds = memberMongoOids.filter(id => !foundIds.has(id.toString()));
      console.warn(`[MIGRATION_WARN] ${missingIds.length} user IDs could not be found in the users collection:`, missingIds);
    }
    
    // ** Step 4: Register/Update users in Firebase Auth and prepare user profile data for Firestore.
    console.log(`[MIGRATION_STEP_4] Starting user migration to Firebase Auth for ${usersToMigrate.length} users`);
    let userMigrationStats = { total: usersToMigrate.length, skipped: 0, updated: 0, created: 0, failed: 0 };
    
    const userMigrationPromises = usersToMigrate.map(async (user) => {
      if (!user.email) {
        console.warn(`[MIGRATION_WARN] Skipping user with Mongo ID ${user._id} due to missing email.`);
        userMigrationStats.skipped++;
        return null;
      }
      try {
        let firebaseUser: UserRecord;
        let isNewUser = false;
        
        const displayName = user.fullName || user.displayName || user.email;
        const photoURL = user.profileImage || user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
        const phoneNumber = user.phoneNumber || null; // Ensure it's null if not present

        try {
          // Find existing user by email
          console.log(`[MIGRATION_USER] Looking up Firebase user by email: ${user.email}`);
          firebaseUser = await adminAuth.getUserByEmail(user.email);
          // Update existing user's info
          console.log(`[MIGRATION_USER] Updating existing Firebase user: ${firebaseUser.uid}`);
          await adminAuth.updateUser(firebaseUser.uid, {
              displayName,
              photoURL,
              phoneNumber,
           });
           userMigrationStats.updated++;
        } catch (e: any) {
          if (e.code === 'auth/user-not-found') {
            isNewUser = true;
            console.log(`[MIGRATION_USER] Creating new Firebase user for email: ${user.email}`);
            firebaseUser = await adminAuth.createUser({
              email: user.email,
              emailVerified: true,
              displayName,
              photoURL,
              phoneNumber,
            });
            userMigrationStats.created++;
          } else {
             console.error(`[MIGRATION_ERROR] Firebase Auth error for user ${user.email}:`, e);
             throw e; // Re-throw other auth errors
          }
        }
        
        // Explicitly map fields for the Firestore user profile
        const firestoreUserProfile: { [key: string]: any } = {
          displayName: displayName,
          email: user.email,
          photoURL: photoURL,
          fullName: user.fullName,
          migratedAt: FieldValue.serverTimestamp(),
          // Add other fields from the mongo user doc as needed
          // For example:
          // someOtherField: user.someOtherField
        };
        if (phoneNumber) {
            firestoreUserProfile.phoneNumber = phoneNumber;
        }

        console.log(`[MIGRATION_USER] Adding user ${firebaseUser.uid} to Firestore batch`);
        const userRef = adminDb.collection('users').doc(firebaseUser.uid);
        batch.set(userRef, firestoreUserProfile, { merge: true });

        return { mongoId: user._id.toString(), firebaseUid: firebaseUser.uid, isNewUser, phoneNumber: phoneNumber };

      } catch (e) {
        console.error(`[MIGRATION_ERROR] Failed to migrate user ${user.email} (MongoID: ${user._id}):`, e);
        userMigrationStats.failed++;
        return null;
      }
    });

    const migratedUsersResults = (await Promise.all(userMigrationPromises)).filter((res): res is { mongoId: string; firebaseUid: string; isNewUser: boolean; phoneNumber: string | null; } => res !== null);
    const uidMap = new Map(migratedUsersResults.map(u => [u.mongoId, u]));
    
    console.log(`[MIGRATION_STEP_4_SUCCESS] User migration stats: ${JSON.stringify(userMigrationStats)}`);
    console.log(`[MIGRATION_STEP_4_SUCCESS] Successfully migrated ${migratedUsersResults.length} users out of ${usersToMigrate.length}`);

    // ** Step 5: Migrate Community
    console.log(`[MIGRATION_STEP_5] Migrating community document to Firestore`);
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
    
    console.log(`[MIGRATION_STEP_5_DETAIL] Adding community document to Firestore batch`);
    batch.set(firestoreCommunityRef, finalCommunityData);
    exportedData = { community: finalCommunityData, memberships: [], messages: [] };
    console.log(`[MIGRATION_STEP_5_SUCCESS] Community document prepared for Firestore`);

    // ** Step 6: Migrate Memberships
    console.log(`[MIGRATION_STEP_6] Migrating memberships to Firestore`);
    const ownerMongoId = rawMongoCommunity.owner?.toString();
    const adminMongoIds = new Set((rawMongoCommunity.communityHandles || [])
      .filter((h: any) => h.role === 'cl' || h.role === 'admin')
      .map((h: any) => h.userId.toString()));

    let membershipStats = { total: 0, migrated: 0, skipped: 0 };

    if (rawMongoCommunity.usersList && Array.isArray(rawMongoCommunity.usersList)) {
        membershipStats.total = rawMongoCommunity.usersList.length;
        console.log(`[MIGRATION_STEP_6_DETAIL] Processing ${rawMongoCommunity.usersList.length} membership records`);
        
        for (const userListItem of rawMongoCommunity.usersList) {
            const memberMongoId = userListItem.userId?.toString();
            if (!memberMongoId) {
                console.warn(`[MIGRATION_WARN] Skipping membership with missing userId`);
                membershipStats.skipped++;
                continue;
            }

            const migratedUser = uidMap.get(memberMongoId);
            if (migratedUser) {
                let role: 'owner' | 'admin' | 'member' = 'member';
                if (memberMongoId === ownerMongoId) {
                  role = 'owner';
                  console.log(`[MIGRATION_STEP_6_DETAIL] User ${migratedUser.firebaseUid} is the community owner`);
                } else if (adminMongoIds.has(memberMongoId)) {
                  role = 'admin';
                  console.log(`[MIGRATION_STEP_6_DETAIL] User ${migratedUser.firebaseUid} is a community admin`);
                }

                const joinedAt = userListItem.joinedAt;
                
                const membershipData: { [key: string]: any } = {
                  communityId: communityId,
                  userId: migratedUser.firebaseUid,
                  role: role,
                  joinedAt: joinedAt ? new Date(joinedAt) : FieldValue.serverTimestamp(),
                };

                // Add phoneNumber to the membership document if it exists
                if (migratedUser.phoneNumber) {
                    membershipData.phoneNumber = migratedUser.phoneNumber;
                }

                if (migratedUser.isNewUser) {
                  membershipData.passwordInitialized = false;
                }
                
                // Use a sanitized version for the exported JSON
                exportedData.memberships.push(JSON.parse(JSON.stringify(membershipData)));
                const membershipRef = adminDb.collection('memberships').doc();
                batch.set(membershipRef, membershipData);
                membershipStats.migrated++;
                console.log(`[MIGRATION_STEP_6_DETAIL] Added membership for user ${migratedUser.firebaseUid} with role ${role}`);
            } else {
                console.warn(`[MIGRATION_WARN] Could not find migrated user for MongoID ${memberMongoId}. Skipping membership.`);
                membershipStats.skipped++;
            }
        }
    } else {
        console.warn(`[MIGRATION_WARN] No usersList found in community or it's not an array`);
    }
    
    console.log(`[MIGRATION_STEP_6_SUCCESS] Membership migration stats: ${JSON.stringify(membershipStats)}`);
    
    // ** Step 7: Migrate Messages
    console.log(`[MIGRATION_STEP_7] Migrating messages to Firestore`);
    const mongoChannels = await db.collection('channels').find({ community: rawMongoCommunity._id }).toArray();
    const mongoChannelIds = mongoChannels.map(c => c._id);
    const channelUserMap = new Map(mongoChannels.map(c => [c._id.toString(), c.user.toString()]));

    console.log(`[MIGRATION_STEP_7_DETAIL] Found ${mongoChannels.length} channels for the community`);

    const mongoMessages = mongoChannelIds.length > 0
        ? await db.collection('messages').find({ channel: { $in: mongoChannelIds } }).toArray()
        : [];

    console.log(`[MIGRATION_STEP_7_DETAIL] Found ${mongoMessages.length} messages across all channels`);
    
    let messageStats = { total: mongoMessages.length, migrated: 0, skipped: 0 };

    for (const message of mongoMessages) {
        // Determine the sender. The sender could be in `message.user` (direct from message) or via the channel for system messages.
        const senderMongoId = (message.user || message.senderId)?.toString();

        if (!senderMongoId) {
             console.warn(`[MIGRATION_WARN] Skipping message ID ${message._id} due to missing sender ID.`);
             messageStats.skipped++;
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
            messageStats.migrated++;
        } else {
             console.warn(`[MIGRATION_WARN] Skipping message ID ${message._id} because sender ${senderMongoId} was not found in the migrated user map.`);
             messageStats.skipped++;
        }
    }
    
    console.log(`[MIGRATION_STEP_7_SUCCESS] Message migration stats: ${JSON.stringify(messageStats)}`);
    
    // ** Step 8: Commit all changes
    console.log(`[MIGRATION_STEP_8] Committing all changes to Firestore`);
    console.log(`[MIGRATION_STEP_8_DETAIL] Batch contains: 1 community, ${exportedData.memberships.length} memberships, ${exportedData.messages.length} messages`);
    
    try {
      await batch.commit();
      const summaryMessage = `Migrated 1 community, ${exportedData.memberships.length} members (with profiles), and ${exportedData.messages.length} messages.`;
      console.log(`[MIGRATION_SUCCESS] Batch commit successful. ${summaryMessage}`);

      return { 
          success: true, 
          message: summaryMessage,
          exportedData: JSON.stringify(exportedData, null, 2),
      };
    } catch (commitError: any) {
      console.error(`[MIGRATION_ERROR] Failed to commit batch to Firestore:`, commitError);
      console.error(`[MIGRATION_ERROR] Error details:`, commitError.code, commitError.message);
      throw commitError; // Re-throw to be caught by the outer try-catch
    }

  } catch (error: any) {
    console.error('[MIGRATION_FAILED] An error occurred during migration:', error);
    console.error('[MIGRATION_FAILED] Error stack:', error.stack);
    
    // Log additional details based on error type
    if (error.code) {
      console.error(`[MIGRATION_FAILED] Error code: ${error.code}`);
    }
    
    if (error.details) {
      console.error(`[MIGRATION_FAILED] Error details:`, error.details);
    }
    
    // For Firebase errors
    if (error.errorInfo) {
      console.error(`[MIGRATION_FAILED] Firebase error info:`, error.errorInfo);
    }
    
    // For MongoDB errors
    if (error.driver || error.name === 'MongoError') {
      console.error(`[MIGRATION_FAILED] MongoDB error:`, {
        name: error.name,
        code: error.code,
        codeName: error.codeName,
        keyValue: error.keyValue
      });
    }
    
    const errorData = {
      ...exportedData,
      error: error.stack || error.message,
      errorCode: error.code,
      errorDetails: error.details || error.errorInfo
    }
    
    return { 
        success: false, 
        message: error.message || 'An unknown error occurred during migration.',
        exportedData: JSON.stringify(errorData, null, 2),
    };
  }
}

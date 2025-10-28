

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

export async function migrateCommunityToFirestore(communityId: string) {
  console.log(`[MIGRATION_START] Starting migration for communityId: ${communityId}`);
  const adminAuth = await getAdminAuth();
  const adminDb = await getAdminDb();
  try {
    const db = await getDb();
    
    const rawMongoCommunity = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });
    if (!rawMongoCommunity) {
      console.error(`[MIGRATION_ERROR] Community with ID ${communityId} not found in MongoDB.`);
      throw new Error('Community not found in MongoDB');
    }
    console.log(`[MIGRATION_LOG] Found community "${rawMongoCommunity.name}" in MongoDB.`);

    // ** SANITIZE THE DATA **
    const mongoCommunity = JSON.parse(JSON.stringify(rawMongoCommunity));
    console.log(`[MIGRATION_LOG] Community data sanitized.`);

    // 1. Get member IDs from the community
    const memberMongoIds = (mongoCommunity.usersList || []).map((u: any) => u.userId.toString());
    console.log(`[MIGRATION_LOG] Found 'usersList' with ${memberMongoIds.length} members.`);
    if (memberMongoIds.length === 0) {
        console.warn(`[MIGRATION_WARN] The 'usersList' for community "${mongoCommunity.name}" is empty. No members or messages will be migrated.`);
    }

    // 2. Get all users from MongoDB to create a comprehensive map
    const allMongoUsers = await db.collection('users').find({}).toArray();
    const mongoUserMap = new Map(allMongoUsers.map(u => [u._id.toString(), u]));
    console.log(`[MIGRATION_LOG] Fetched ${mongoUserMap.size} total users from MongoDB for mapping.`);

    const usersToMigrate = memberMongoIds.map(id => mongoUserMap.get(id)).filter(Boolean);
    console.log(`[MIGRATION_LOG] Matched ${usersToMigrate.length} users to migrate from the community's member list.`);

    // 3. Register users in Firebase Auth and create mapping
    const userMigrationPromises = usersToMigrate.map(async (user) => {
      if (!user.email) {
        console.warn(`[MIGRATION_WARN] Skipping user with Mongo ID ${user._id} due to missing email.`);
        return null;
      }
      try {
        let firebaseUser: UserRecord;
        let isNewUser = false;
        try {
          firebaseUser = await adminAuth.getUserByEmail(user.email);
          await adminAuth.updateUser(firebaseUser.uid, {
              displayName: user.fullName || user.displayName || '',
              photoURL: user.profileImage || user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user.fullName || user.displayName || 'U')}`,
              phoneNumber: user.phoneNumber,
           });
           firebaseUser = await adminAuth.getUser(firebaseUser.uid); 
        } catch (e: any) {
          if (e.code === 'auth/user-not-found') {
            isNewUser = true;
            firebaseUser = await adminAuth.createUser({
              email: user.email,
              emailVerified: true,
              displayName: user.fullName || user.displayName || '',
              photoURL: user.profileImage || user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user.fullName || user.displayName || 'U')}`,
              phoneNumber: user.phoneNumber,
            });
          } else {
             throw e;
          }
        }
        return { mongoId: user._id.toString(), firebaseUid: firebaseUser.uid, isNewUser };
      } catch (e) {
        console.error(`[MIGRATION_ERROR] Failed to migrate user ${user.email} (MongoID: ${user._id}):`, e);
        return null;
      }
    });

    const migratedUsers = (await Promise.all(userMigrationPromises)).filter(u => u !== null);
    const uidMap = new Map(migratedUsers.map(u => [u!.mongoId, u!]));
    console.log(`[MIGRATION_LOG] Successfully migrated/updated ${uidMap.size} users in Firebase Auth.`);

    // 4. Migrate Community
    const firestoreCommunityRef = adminDb.collection('communities').doc(communityId);
    
    // Explicitly remove fields that are being replaced by the new structure
    const { 
        _id, 
        usersList, 
        communityHandles, 
        owner, 
        createdBy,
        updatedBy,
        ...restOfCommunityData 
    } = mongoCommunity;

    await firestoreCommunityRef.set({
      ...restOfCommunityData,
      migratedAt: FieldValue.serverTimestamp(),
    });
    console.log(`[MIGRATION_LOG] Community document "${mongoCommunity.name}" written to Firestore.`);

    // 5. Migrate Memberships
    const batch = adminDb.batch();
    const userJoinDateMap = new Map((mongoCommunity.usersList || []).map((u: any) => [u.userId.toString(), u.joinedAt]));

    const ownerMongoId = mongoCommunity.owner?.toString();
    const adminMongoIds = new Set((mongoCommunity.communityHandles || [])
      .filter((h: any) => h.role === 'cl' || h.role === 'admin')
      .map((h: any) => h.userId.toString()));

    for (const memberMongoId of memberMongoIds) {
      const migratedUser = uidMap.get(memberMongoId);
      if (migratedUser) {
        let role: 'owner' | 'admin' | 'member' = 'member';
        if (memberMongoId === ownerMongoId) {
          role = 'owner';
        } else if (adminMongoIds.has(memberMongoId)) {
          role = 'admin';
        }

        const joinedAt = userJoinDateMap.get(memberMongoId);
        
        const membershipData: any = {
          communityId: communityId,
          userId: migratedUser.firebaseUid,
          role: role,
          joinedAt: joinedAt ? new Date(joinedAt) : FieldValue.serverTimestamp(),
        };

        if (migratedUser.isNewUser) {
          membershipData.passwordInitialized = false;
        }

        const membershipRef = adminDb.collection('memberships').doc();
        batch.set(membershipRef, membershipData);
      }
    }
    console.log(`[MIGRATION_LOG] Prepared ${memberMongoIds.length} membership documents for batch write.`);
    
    // 6. Migrate Messages
    const mongoChannels = await db.collection('channels').find({ community: new ObjectId(communityId) }).toArray();
    const mongoChannelIds = mongoChannels.map(c => c._id);
    const mongoMessages = await db.collection('messages').find({ channel: { $in: mongoChannelIds } }).toArray();
    console.log(`[MIGRATION_LOG] Found ${mongoMessages.length} messages to migrate.`);

    for (const message of mongoMessages) {
        const senderMongoId = message.user?.toString();
        const migratedUser = uidMap.get(senderMongoId);
        if (migratedUser) {
            const messageRef = firestoreCommunityRef.collection('messages').doc();
            batch.set(messageRef, {
                text: message.text,
                createdAt: message.createdAt,
                userId: migratedUser.firebaseUid,
            });
        } else {
             console.warn(`[MIGRATION_WARN] Skipping message ID ${message._id} because sender ${senderMongoId} was not migrated.`);
        }
    }
    console.log(`[MIGRATION_LOG] Prepared ${mongoMessages.length} message documents for batch write.`);
    
    await batch.commit();
    console.log(`[MIGRATION_SUCCESS] Batch commit successful. Migration for "${mongoCommunity.name}" complete.`);

    return { success: true, message: `Community '${mongoCommunity.name}' migrated successfully.` };

  } catch (error: any) {
    console.error('[MIGRATION_FAILED] An error occurred during migration:', error);
    return { success: false, message: error.message || 'An unknown error occurred during migration.' };
  }
}

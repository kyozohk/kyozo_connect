
'use server';

import { getDb } from '@/lib/mongodb';
import { Community, Member, Message, RawMessage } from '@/types';
import { summarizeCommunityMessages, SummarizeCommunityMessagesInput } from '@/ai/flows/summarize-community-messages';
import { ObjectId } from 'mongodb';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
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
  try {
    const db = await getDb();

    // 1. Get all users from MongoDB
    const allMongoUsers = await db.collection('users').find({}).toArray();
    const mongoUserMap = new Map(allMongoUsers.map(u => [u._id.toString(), u]));

    // 2. Register users in Firebase Auth and create mapping
    const userMigrationPromises = allMongoUsers.map(async (user) => {
      if (!user.email) return null;
      try {
        let firebaseUser = await adminAuth.getUserByEmail(user.email).catch(() => null);
        if (!firebaseUser) {
          firebaseUser = await adminAuth.createUser({
            email: user.email,
            emailVerified: true,
            displayName: user.fullName || user.displayName,
            photoURL: user.profileImage || user.photoURL,
            // A random password is required, user will reset it
            password: Math.random().toString(36).slice(-8), 
          });
        }
        return { mongoId: user._id.toString(), firebaseUid: firebaseUser.uid };
      } catch (e) {
        console.error(`Failed to migrate user ${user.email}:`, e);
        return null;
      }
    });

    const migratedUsers = (await Promise.all(userMigrationPromises)).filter(u => u !== null);
    const uidMap = new Map(migratedUsers.map(u => [u!.mongoId, u!.firebaseUid]));

    // 3. Migrate Community
    const mongoCommunity = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });
    if (!mongoCommunity) throw new Error('Community not found in MongoDB');

    const firestoreCommunityRef = adminDb.collection('communities').doc(communityId);
    await firestoreCommunityRef.set({
      name: mongoCommunity.name,
      tagline: mongoCommunity.tagline,
      communityProfileImage: mongoCommunity.communityProfileImage,
      createdAt: mongoCommunity.createdAt,
    });

    // 4. Migrate Memberships
    const batch = adminDb.batch();

    // Owner
    const ownerMongoId = mongoCommunity.owner?.toString();
    const ownerFirebaseUid = uidMap.get(ownerMongoId);
    if(ownerFirebaseUid){
        const ownerMembershipRef = adminDb.collection('memberships').doc();
        batch.set(ownerMembershipRef, {
            communityId: communityId,
            userId: ownerFirebaseUid,
            role: 'owner',
            joinedAt: FieldValue.serverTimestamp(),
        });
    }

    // Admins
    const adminMongoIds = (mongoCommunity.communityHandles || [])
        .filter((h: any) => h.role === 'cl' || h.role === 'admin')
        .map((h: any) => h.userId.toString());
    
    for (const adminMongoId of adminMongoIds) {
        const adminFirebaseUid = uidMap.get(adminMongoId);
        if(adminFirebaseUid && adminFirebaseUid !== ownerFirebaseUid) {
            const adminMembershipRef = adminDb.collection('memberships').doc();
            batch.set(adminMembershipRef, {
                communityId: communityId,
                userId: adminFirebaseUid,
                role: 'admin',
                joinedAt: FieldValue.serverTimestamp(),
            });
        }
    }

    // Regular members
    const memberMongoIds = (mongoCommunity.usersList || []).map((u: any) => u.userId.toString());
     for (const memberMongoId of memberMongoIds) {
        const memberFirebaseUid = uidMap.get(memberMongoId);
        if(memberFirebaseUid && memberFirebaseUid !== ownerFirebaseUid && !adminMongoIds.includes(memberMongoId)) {
            const memberMembershipRef = adminDb.collection('memberships').doc();
            batch.set(memberMembershipRef, {
                communityId: communityId,
                userId: memberFirebaseUid,
                role: 'member',
                joinedAt: FieldValue.serverTimestamp(), // or use mongoCommunity.usersList.find(...)
            });
        }
    }

    // 5. Migrate Messages
    const mongoChannels = await db.collection('channels').find({ community: new ObjectId(communityId) }).toArray();
    const mongoChannelIds = mongoChannels.map(c => c._id);
    const mongoMessages = await db.collection('messages').find({ channel: { $in: mongoChannelIds } }).toArray();

    for (const message of mongoMessages) {
        const senderMongoId = message.user?.toString();
        const senderFirebaseUid = uidMap.get(senderMongoId);
        if (senderFirebaseUid) {
            const messageRef = firestoreCommunityRef.collection('messages').doc();
            batch.set(messageRef, {
                text: message.text,
                createdAt: message.createdAt,
                userId: senderFirebaseUid,
            });
        }
    }
    
    await batch.commit();

    return { success: true, message: `Community '${mongoCommunity.name}' migrated successfully.` };

  } catch (error: any) {
    console.error('Migration failed:', error);
    return { success: false, message: error.message || 'An unknown error occurred during migration.' };
  }
}

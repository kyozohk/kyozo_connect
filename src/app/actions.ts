
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
    // Create a proper date object for migratedAt
    const migratedAtDate = new Date();
    
    const finalCommunityData = JSON.parse(JSON.stringify({
        ...rawMongoCommunity,
        migratedAt: migratedAtDate.toISOString(), // Use ISO string format for serialization
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
        
        // Make sure joinedAt is a valid date or use current date
        let joinedAtDate;
        if (joinedAt) {
          if (typeof joinedAt === 'string' || typeof joinedAt === 'number') {
            joinedAtDate = new Date(joinedAt);
          } else if (joinedAt instanceof Date) {
            joinedAtDate = joinedAt;
          } else {
            joinedAtDate = new Date(); // Fallback to current date
          }
        } else {
          joinedAtDate = new Date(); // Fallback to current date
        }

        return {
          communityId: communityId,
          userId: `firebase-uid-placeholder-${user.email}`,
          role: role,
          joinedAt: joinedAtDate,
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
        
        const displayName = user.fullName || user.displayName || user.email;
        const photoURL = user.profileImage || user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
        const phoneNumber = user.phoneNumber || null; // Ensure it's null if not present

        try {
          // Find existing user by email
          firebaseUser = await adminAuth.getUserByEmail(user.email);
          // Update existing user's info
          await adminAuth.updateUser(firebaseUser.uid, {
              displayName,
              photoURL,
              phoneNumber,
           });
        } catch (e: any) {
          if (e.code === 'auth/user-not-found') {
            // Always try to create a new Firebase Auth user
            isNewUser = true;
            
            // Generate a random password for the new user
            const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).toUpperCase().slice(-4) + '!1';
            
            try {
              // Create a new user in Firebase Auth with email and password
              firebaseUser = await adminAuth.createUser({
                email: user.email,
                emailVerified: true,
                displayName,
                photoURL,
                phoneNumber,
                password: randomPassword, // Set a random secure password
              });
              
              console.log(`[MIGRATION_SUCCESS] Created new Firebase user for ${user.email} with ID ${firebaseUser.uid}`);
            } catch (createError: any) {
              console.error(`[MIGRATION_ERROR] Failed to create Firebase user for ${user.email}:`, createError);
              
              // Try a different approach - create a user with a custom UID based on the MongoDB ID
              try {
                const customUid = `mongo-${user._id.toString().substring(0, 20)}`; // Firebase UIDs are limited to 36 chars
                
                firebaseUser = await adminAuth.createUser({
                  uid: customUid,
                  email: user.email,
                  emailVerified: true,
                  displayName,
                  photoURL,
                  phoneNumber,
                  password: randomPassword,
                });
                
                console.log(`[MIGRATION_SUCCESS] Created Firebase user with custom UID for ${user.email}`);
              } catch (customUidError) {
                // If all attempts fail, use a placeholder ID but log the error
                console.error(`[MIGRATION_ERROR] All attempts to create Firebase user failed for ${user.email}:`, customUidError);
                
                // Create a placeholder object that mimics UserRecord
                firebaseUser = {
                  uid: `placeholder-${user._id.toString()}`,
                  email: user.email,
                  displayName,
                  photoURL,
                  phoneNumber,
                  toJSON: () => ({
                    uid: `placeholder-${user._id.toString()}`,
                    email: user.email,
                    displayName,
                    photoURL,
                    phoneNumber,
                    emailVerified: true,
                    disabled: false,
                    metadata: { creationTime: new Date().toISOString() },
                    providerData: [{ providerId: 'password', email: user.email }]
                  })
                } as unknown as UserRecord;
              }
            }
          } else {
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
          originalMongoId: user._id.toString(), // Store the original MongoDB ID for reference
          // Add other fields from the mongo user doc as needed
        };
        if (phoneNumber) {
            firestoreUserProfile.phoneNumber = phoneNumber;
        }

        const userRef = adminDb.collection('users').doc(firebaseUser.uid);
        batch.set(userRef, firestoreUserProfile, { merge: true });

        return { mongoId: user._id.toString(), firebaseUid: firebaseUser.uid, isNewUser, phoneNumber: phoneNumber };

      } catch (e) {
        console.error(`[MIGRATION_ERROR] Failed to migrate user ${user.email} (MongoID: ${user._id}):`, e);
        
        // Even if there's an error, return a placeholder so we can still create the membership
        // This ensures the community has all its members even if some user migrations fail
        return { 
          mongoId: user._id.toString(), 
          firebaseUid: `placeholder-${user._id.toString()}`, 
          isNewUser: true, 
          phoneNumber: user.phoneNumber || null,
          isPlaceholder: true
        };
      }
    });

    const migratedUsersResults = (await Promise.all(userMigrationPromises)).filter((res): res is { mongoId: string; firebaseUid: string; isNewUser: boolean; phoneNumber: string | null; isPlaceholder?: boolean; } => res !== null);
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

    // Create a proper date object for migratedAt
    const migratedAtDate = new Date();
    
    // For Firestore, use serverTimestamp
    const firestoreCommunityData = {
        ...restOfCommunityData,
        migratedAt: FieldValue.serverTimestamp(),
        migratedAtISO: migratedAtDate.toISOString(), // Add ISO string version for serialization
    };
    
    // For the exported data that will be passed to client components, use ISO string
    const exportCommunityData = {
        ...restOfCommunityData,
        migratedAt: migratedAtDate.toISOString(),
    };
    
    batch.set(firestoreCommunityRef, firestoreCommunityData);
    exportedData = { community: exportCommunityData, memberships: [], messages: [] };

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
                
                // Make sure joinedAt is a valid date or use current date
                const joinedAtDate = joinedAt && typeof joinedAt !== 'object' 
                  ? new Date(joinedAt) 
                  : (joinedAt && joinedAt instanceof Date ? joinedAt : new Date());
                
                // Find the original MongoDB user to get more details
                const mongoUser = await db.collection('users').findOne({ _id: new ObjectId(memberMongoId) });
                
                const membershipData: { [key: string]: any } = {
                  communityId: communityId,
                  userId: migratedUser.firebaseUid,
                  role: role,
                  joinedAt: joinedAtDate,
                  originalMongoId: memberMongoId, // Store original MongoDB ID
                  // Store user details directly in the membership for better display
                  displayName: mongoUser?.fullName || mongoUser?.displayName || 'Unknown User',
                  email: mongoUser?.email || '',
                  photoURL: mongoUser?.profileImage || mongoUser?.photoURL || '',
                };

                // Add phoneNumber to the membership document if it exists
                if (migratedUser.phoneNumber || mongoUser?.phoneNumber) {
                    membershipData.phoneNumber = migratedUser.phoneNumber || mongoUser?.phoneNumber;
                }

                // If this is a new user or a placeholder, mark it
                if (migratedUser.isNewUser) {
                  membershipData.passwordInitialized = false;
                }
                
                if (migratedUser.isPlaceholder) {
                  membershipData.isPlaceholder = true;
                  membershipData.needsUserCreation = true;
                  // Store original user details for placeholder users
                  membershipData.originalUserName = mongoUser?.fullName || mongoUser?.displayName || 'Unknown User';
                  membershipData.originalUserEmail = mongoUser?.email || '';
                }
                
                // Use a sanitized version for the exported JSON
                exportedData.memberships.push(JSON.parse(JSON.stringify(membershipData)));
                const membershipRef = adminDb.collection('memberships').doc();
                batch.set(membershipRef, membershipData);
            } else {
                // Create a placeholder membership if we couldn't find the user
                console.warn(`[MIGRATION_WARN] Could not find migrated user for MongoID ${memberMongoId}. Creating placeholder membership.`);
                
                let role: 'owner' | 'admin' | 'member' = 'member';
                if (memberMongoId === ownerMongoId) {
                  role = 'owner';
                } else if (adminMongoIds.has(memberMongoId)) {
                  role = 'admin';
                }
                
                // Try to find the user in MongoDB to get more info
                try {
                  const mongoUser = await db.collection('users').findOne({ _id: new ObjectId(memberMongoId) });
                  
                  // Create a placeholder user ID based on the MongoDB ID
                  const placeholderUserId = `placeholder-${memberMongoId}`;
                  
                  const membershipData: { [key: string]: any } = {
                    communityId: communityId,
                    userId: placeholderUserId,
                    role: role,
                    joinedAt: new Date(),
                    isPlaceholder: true,
                    originalMongoId: memberMongoId,
                    needsUserCreation: true,
                    // Store user details directly in the membership for better display
                    displayName: mongoUser?.fullName || mongoUser?.displayName || 'Unknown User',
                    email: mongoUser?.email || '',
                    photoURL: mongoUser?.profileImage || mongoUser?.photoURL || '',
                    phoneNumber: mongoUser?.phoneNumber || '',
                    // Store original user details for placeholder users
                    originalUserEmail: mongoUser?.email || '',
                    originalUserName: mongoUser?.fullName || mongoUser?.displayName || 'Unknown User',
                  };
                  
                  // Use a sanitized version for the exported JSON
                  exportedData.memberships.push(JSON.parse(JSON.stringify(membershipData)));
                  const membershipRef = adminDb.collection('memberships').doc();
                  batch.set(membershipRef, membershipData);
                } catch (error) {
                  console.error(`[MIGRATION_ERROR] Failed to create placeholder membership for ${memberMongoId}:`, error);
                }
            }
        }
    }
    
    // ** Step 7: Migrate Messages
    const mongoChannels = await db.collection('channels').find({ community: rawMongoCommunity._id }).toArray();
    const mongoChannelIds = mongoChannels.map(c => c._id);
    const channelUserMap = new Map(mongoChannels.map(c => [c._id.toString(), c.user.toString()]));

    const mongoMessages = mongoChannelIds.length > 0
        ? await db.collection('messages').find({ channel: { $in: mongoChannelIds } }).toArray()
        : [];

    for (const message of mongoMessages) {
        // Determine the sender. The sender could be in `message.user` (direct from message) or via the channel for system messages.
        const senderMongoId = (message.user || message.senderId)?.toString();

        if (!senderMongoId) {
            // For messages without a sender, use a system user
            const systemMessageData = {
                text: message.text || 'System message',
                createdAt: message.createdAt || new Date(),
                userId: 'system',
                isSystemMessage: true,
                originalMongoId: message._id.toString(),
            };
            
            exportedData.messages.push(JSON.parse(JSON.stringify(systemMessageData)));
            const messageRef = firestoreCommunityRef.collection('messages').doc();
            batch.set(messageRef, systemMessageData);
            continue;
        }

        const migratedUser = uidMap.get(senderMongoId);
        if (migratedUser) {
            // Ensure message text is not undefined
            const messageText = message.text || ''; // Default to empty string if undefined
            
            // Skip messages with empty text
            if (!messageText) {
                console.log(`[MIGRATION_WARN] Skipping message ${message._id} due to empty text`);
                continue;
            }
            
            // Try to find the original user in MongoDB to get display info
            let userName = 'Unknown User';
            let userPhotoURL = '';
            
            try {
                const mongoUser = await db.collection('users').findOne({ _id: new ObjectId(senderMongoId) });
                if (mongoUser) {
                    userName = mongoUser.fullName || mongoUser.displayName || 'Unknown User';
                    userPhotoURL = mongoUser.profileImage || mongoUser.photoURL || '';
                }
            } catch (error) {
                console.warn(`[MIGRATION_WARN] Could not find user info for ${senderMongoId}:`, error);
            }
            
            // Create message data for Firestore
            const messageData: { [key: string]: any } = {
                text: messageText, // Use the safe text value
                createdAt: message.createdAt instanceof Date ? message.createdAt : new Date(),
                userId: migratedUser.firebaseUid,
                userName: userName,
                userPhotoURL: userPhotoURL,
                originalMongoId: message._id.toString(),
            };
            
            // If the user is a placeholder, mark the message accordingly
            if (migratedUser.isPlaceholder) {
                messageData.senderIsPlaceholder = true;
            }
            
            exportedData.messages.push(JSON.parse(JSON.stringify(messageData)));
            const messageRef = firestoreCommunityRef.collection('messages').doc();
            batch.set(messageRef, messageData);
        } else {
            // Try to find the user in MongoDB to get more info
            try {
                const mongoUser = await db.collection('users').findOne({ _id: new ObjectId(senderMongoId) });
                
                // Use a system user ID instead of trying to fetch admin user
                // This avoids the admin user lookup error
                const systemUserId = 'system-migration-user';
                
                // Ensure message text is not undefined
                const messageText = message.text || ''; // Default to empty string if undefined
                
                const messageData = {
                    text: messageText, // Use the safe text value
                    createdAt: message.createdAt instanceof Date ? message.createdAt : new Date(),
                    userId: systemUserId,
                    userName: 'System Migration',
                    userPhotoURL: '',
                    isPlaceholder: true,
                    originalMongoId: message._id.toString(),
                    originalSenderId: senderMongoId,
                    originalSenderEmail: mongoUser?.email || 'unknown',
                    originalSenderName: mongoUser?.fullName || mongoUser?.displayName || 'Unknown User',
                };
                
                // Only add the message if we have valid text
                if (messageText) {
                    exportedData.messages.push(JSON.parse(JSON.stringify(messageData)));
                    const messageRef = firestoreCommunityRef.collection('messages').doc();
                    batch.set(messageRef, messageData);
                } else {
                    console.log(`[MIGRATION_WARN] Skipping message ${message._id} due to empty text`);
                }
            } catch (error) {
                console.error(`[MIGRATION_ERROR] Failed to create placeholder message for ${message._id}:`, error);
            }
        }
    }
    
    // ** Step 8: Commit all changes
    await batch.commit();

    // Count how many placeholder users we have
    const placeholderUsers = migratedUsersResults.filter(u => u.isPlaceholder).length;
    
    const summaryMessage = `Migrated 1 community, ${exportedData.memberships.length} members (with profiles), and ${exportedData.messages.length} messages. ${placeholderUsers} placeholder users need processing.`;
    console.log(`[MIGRATION_SUCCESS] Batch commit successful. ${summaryMessage}`);

    // If we have placeholder users, try to process them immediately
    if (placeholderUsers > 0) {
      try {
        // Import the processPlaceholderUsers function dynamically to avoid circular dependencies
        const { processPlaceholderUsers } = await import('./actions/user-actions');
        const processResult = await processPlaceholderUsers();
        console.log(`[PLACEHOLDER_PROCESSING] ${processResult.message}`);
      } catch (error) {
        console.error('[PLACEHOLDER_PROCESSING_ERROR]', error);
      }
    }

    return { 
      success: true, 
      message: summaryMessage,
      exportedData,
      placeholderUsers
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

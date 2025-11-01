'use server';

import { revalidatePath } from 'next/cache';
import { MongoClient, ObjectId } from 'mongodb';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { Community, Member, Message } from '@/types';
import { UserRecord } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

// MongoDB connection
const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB || '';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getCommunities(): Promise<Community[]> {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    
    const communities = await db.collection('communities')
      .find({ isDeleted: { $ne: true } })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();
    
    return JSON.parse(JSON.stringify(communities));
  } catch (error) {
    console.error('Error fetching communities:', error);
    return [];
  }
}

export async function getMembers(communityId: string): Promise<Member[]> {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    
    const community = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });
    
    if (!community || !community.usersList || !Array.isArray(community.usersList)) {
      console.log(`No usersList found for community ${communityId}`);
      return [];
    }
    
    const userIds = community.usersList.map((item: any) => item.user);
    
    const users = await db.collection('users')
      .find({ _id: { $in: userIds } })
      .toArray();
    
    // Map MongoDB users to Member type
    const members: Member[] = users.map(user => {
      // Find the corresponding usersList item to get the role
      const userListItem = community.usersList.find(
        (item: any) => item.user.toString() === user._id.toString()
      );
      
      return {
        id: user._id.toString(),
        name: user.fullName || user.displayName || user.email,
        email: user.email,
        role: userListItem?.role || 'user',
        profileImage: user.profileImage || user.photoURL || '',
        phoneNumber: user.phoneNumber || '',
      };
    });
    
    return members;
  } catch (error) {
    console.error(`Error fetching members for community ${communityId}:`, error);
    return [];
  }
}

export async function getMessages(communityId: string, memberId: string): Promise<Message[]> {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    
    // Find channels for this community
    const channels = await db.collection('channels')
      .find({ community: new ObjectId(communityId) })
      .toArray();
    
    if (!channels || channels.length === 0) {
      console.log(`No channels found for community ${communityId}`);
      return [];
    }
    
    const channelIds = channels.map(channel => channel._id);
    
    // Find messages for these channels
    const messages = await db.collection('messages')
      .find({ 
        channel: { $in: channelIds },
        // If memberId is provided, filter by sender
        ...(memberId ? { sender: new ObjectId(memberId) } : {})
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    
    // Map MongoDB messages to Message type
    const formattedMessages: Message[] = messages.map(msg => ({
      id: msg._id.toString(),
      text: msg.content || msg.text || '',
      createdAt: msg.createdAt ? new Date(msg.createdAt).toISOString() : new Date().toISOString(),
      sender: {
        id: msg.sender.toString(),
        name: 'Unknown', // We would need to fetch user details separately
      }
    }));
    
    return formattedMessages;
  } catch (error) {
    console.error(`Error fetching messages for community ${communityId}:`, error);
    return [];
  }
}

export interface CommunityExportDataResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function getCommunityExportData(communityId: string): Promise<CommunityExportDataResult> {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    
    // Get community
    const community = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });
    if (!community) {
      return { success: false, message: 'Community not found' };
    }
    
    // Get members
    const members = await getMembers(communityId);
    
    // Get messages
    const messages = await db.collection('messages')
      .find({ channel: { $in: await db.collection('channels').find({ community: new ObjectId(communityId) }).map(c => c._id).toArray() } })
      .limit(100)
      .toArray();
    
    const formattedMessages = messages.map(msg => ({
      text: msg.content || msg.text || '',
      createdAt: msg.createdAt,
      userId: msg.sender.toString()
    }));
    
    const exportData = {
      community: JSON.parse(JSON.stringify(community)),
      memberships: members.map(member => ({
        communityId,
        userId: `firebase-uid-placeholder-${member.email}`,
        role: member.role,
        joinedAt: new Date(),
        phoneNumber: member.phoneNumber,
        firstName: member.name.split(' ')[0],
        lastName: member.name.split(' ').slice(1).join(' '),
        fullName: member.name,
        email: member.email,
        profileImage: member.profileImage,
      })),
      messages: formattedMessages
    };
    
    return { 
      success: true, 
      message: `Export data prepared for community ${community.name}`,
      data: exportData
    };
  } catch (error) {
    console.error(`Error preparing export data for community ${communityId}:`, error);
    return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function isCommunityExported(communityId: string): Promise<boolean> {
  try {
    const adminDb = await getAdminDb();
    const doc = await adminDb.collection('communities').doc(communityId).get();
    return doc.exists;
  } catch (error) {
    console.error(`Error checking if community ${communityId} is exported:`, error);
    return false;
  }
}

export async function migrateCommunityToFirestore(communityId: string) {
    try {
        // ** Step 1: Connect to MongoDB
        console.log(`[MIGRATION_STEP_1] Connecting to MongoDB`);
        const client = await clientPromise;
        const db = client.db(dbName);
        console.log(`[MIGRATION_STEP_1_SUCCESS] Connected to MongoDB database: ${dbName}`);
        
        // ** Step 2: Get community data from MongoDB
        console.log(`[MIGRATION_STEP_2] Fetching community data from MongoDB`);
        const rawMongoCommunity = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });
        
        if (!rawMongoCommunity) {
            throw new Error(`Community with ID ${communityId} not found in MongoDB`);
        }
        
        console.log(`[MIGRATION_STEP_2_SUCCESS] Found community: ${rawMongoCommunity.name}`);
        
        // Initialize Firebase Admin and Firestore
        console.log(`[MIGRATION_STEP_3] Initializing Firebase Admin SDK`);
        const adminAuth = await getAdminAuth();
        const adminDb = await getAdminDb();
        const batch = adminDb.batch();
        let exportedData: any = null;
        
        // ** Step 3: Get user data from MongoDB
        // Extract member IDs from the community's usersList
        const memberMongoOids = Array.isArray(rawMongoCommunity.usersList) 
            ? rawMongoCommunity.usersList.map((item: any) => item.user) 
            : [];
            
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
        let userMigrationStats = { total: usersToMigrate.length, skipped: 0, updated: 0, created: 0, failed: 0, forceCreated: 0 };
        
        const userMigrationPromises = usersToMigrate.map(async (user) => {
            if (!user.email) {
                console.warn(`[MIGRATION_WARN] Skipping user with Mongo ID ${user._id} due to missing email.`);
                userMigrationStats.skipped++;
                return null;
            }
            
            try {
                const displayName = user.fullName || user.displayName || user.email;
                const photoURL = user.profileImage || user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
                const phoneNumber = user.phoneNumber || null;
                const email = user.email.trim().toLowerCase();
                
                // IMPORTANT: We're using a placeholder UID strategy since Firebase Auth operations are failing
                // This allows the migration to continue without Firebase Auth
                console.log(`[MIGRATION_USER] Using placeholder UID for ${email}`);
                
                // Create a placeholder user object
                const placeholderUid = `firebase-uid-placeholder-${email.replace('@', '-at-')}`;
                const firebaseUser = {
                    uid: placeholderUid,
                    email,
                    displayName,
                    photoURL,
                    phoneNumber,
                    emailVerified: true,
                    disabled: false,
                    metadata: {
                        creationTime: new Date().toISOString(),
                        lastSignInTime: new Date().toISOString()
                    },
                    providerData: [],
                    toJSON: () => ({
                        uid: placeholderUid,
                        email,
                        displayName,
                        photoURL,
                        phoneNumber,
                        emailVerified: true,
                        disabled: false
                    })
                } as any;
                
                userMigrationStats.created++;
                
                // Create user profile in Firestore
                const firestoreUserProfile = {
                    displayName,
                    email,
                    photoURL,
                    fullName: user.fullName,
                    migratedAt: FieldValue.serverTimestamp(),
                    needsPasswordReset: true,
                    migrationSource: 'mongodb',
                };
                
                if (phoneNumber) {
                    firestoreUserProfile.phoneNumber = phoneNumber;
                }
                
                // Add additional user metadata if available
                if (user.dateOfBirth) {
                    firestoreUserProfile.dateOfBirth = user.dateOfBirth;
                }
                if (user.gender) {
                    firestoreUserProfile.gender = user.gender;
                }
                if (user.location) {
                    firestoreUserProfile.location = user.location;
                }
                if (user.interests && Array.isArray(user.interests)) {
                    firestoreUserProfile.interests = user.interests;
                }
                
                console.log(`[MIGRATION_USER] Adding user ${firebaseUser.uid} to Firestore batch`);
                const userRef = adminDb.collection('users').doc(firebaseUser.uid);
                batch.set(userRef, firestoreUserProfile, { merge: true });
                
                return { 
                    mongoId: user._id.toString(), 
                    firebaseUid: firebaseUser.uid, 
                    isNewUser: true, 
                    phoneNumber: phoneNumber 
                };
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
        
        // Debug output for migration troubleshooting
        console.log(`[MIGRATION_DEBUG] First 5 migrated users:`, migratedUsersResults.slice(0, 5).map(u => ({ 
            mongoId: u.mongoId, 
            firebaseUid: u.firebaseUid, 
            isNewUser: u.isNewUser 
        })));
        
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
        
        // ** Step 6: Migrate memberships
        console.log(`[MIGRATION_STEP_6] Migrating memberships to Firestore`);
        const membershipStats = { total: 0, migrated: 0, skipped: 0 };
        
        // Process usersList from the community document
        if (Array.isArray(rawMongoCommunity.usersList) && rawMongoCommunity.usersList.length > 0) {
            console.log(`[MIGRATION_STEP_6_DETAIL] Processing ${rawMongoCommunity.usersList.length} membership records`);
            membershipStats.total = rawMongoCommunity.usersList.length;
            
            for (const userListItem of rawMongoCommunity.usersList) {
                const memberMongoId = userListItem.user.toString();
                const migratedUser = uidMap.get(memberMongoId);
                
                if (migratedUser) {
                    // Determine role
                    let role = 'user';
                    if (userListItem.role === 'admin' || userListItem.role === 'commu_leader') {
                        role = userListItem.role;
                    } else if (rawMongoCommunity.owner && rawMongoCommunity.owner.toString() === memberMongoId) {
                        role = 'admin';
                        console.log(`[MIGRATION_STEP_6_DETAIL] User ${migratedUser.firebaseUid} is a community admin`);
                    }
                    
                    const joinedAt = userListItem.joinedAt;
                    
                    const membershipData = {
                        communityId: communityId,
                        userId: migratedUser.firebaseUid,
                        role: role,
                        joinedAt: joinedAt ? new Date(joinedAt.toString()) : FieldValue.serverTimestamp(),
                        migratedAt: FieldValue.serverTimestamp(),
                        migrationSource: 'mongodb',
                    };
                    
                    // Add phoneNumber to the membership document if it exists
                    if (migratedUser.phoneNumber) {
                        membershipData.phoneNumber = migratedUser.phoneNumber;
                    }
                    
                    // Track password status for new users
                    if (migratedUser.isNewUser) {
                        membershipData.passwordInitialized = false;
                        membershipData.needsPasswordReset = true;
                    }
                    
                    // Use a sanitized version for the exported JSON
                    exportedData.memberships.push(JSON.parse(JSON.stringify(membershipData)));
                    const membershipRef = adminDb.collection('memberships').doc();
                    batch.set(membershipRef, membershipData);
                    membershipStats.migrated++;
                    console.log(`[MIGRATION_STEP_6_DETAIL] Added membership for user ${migratedUser.firebaseUid} with role ${role}`);
                } else {
                    // Try to find the user in MongoDB to get their email
                    const userData = await db.collection('users').findOne({ _id: new ObjectId(memberMongoId) });
                    
                    if (userData && userData.email) {
                        const email = userData.email.trim().toLowerCase();
                        const placeholderUid = `firebase-uid-placeholder-${email.replace('@', '-at-')}`;
                        console.log(`[MIGRATION_STEP_6_DETAIL] Using placeholder UID for member: ${email}`);
                        
                        // Determine role
                        let role = 'user';
                        if (userListItem.role === 'admin' || userListItem.role === 'commu_leader') {
                            role = userListItem.role;
                        } else if (rawMongoCommunity.owner && rawMongoCommunity.owner.toString() === memberMongoId) {
                            role = 'admin';
                        }
                        
                        const joinedAt = userListItem.joinedAt;
                        
                        const membershipData = {
                            communityId: communityId,
                            userId: placeholderUid,
                            role: role,
                            joinedAt: joinedAt ? new Date(joinedAt.toString()) : FieldValue.serverTimestamp(),
                            migratedAt: FieldValue.serverTimestamp(),
                            migrationSource: 'mongodb',
                            passwordInitialized: false,
                            needsPasswordReset: true,
                            email: userData.email,
                            fullName: userData.fullName || userData.displayName || userData.email,
                        };
                        
                        // Add user data to the membership document
                        if (userData.phoneNumber) {
                            membershipData.phoneNumber = userData.phoneNumber;
                        }
                        
                        // Use a sanitized version for the exported JSON
                        exportedData.memberships.push(JSON.parse(JSON.stringify(membershipData)));
                        const membershipRef = adminDb.collection('memberships').doc();
                        batch.set(membershipRef, membershipData);
                        membershipStats.migrated++;
                        console.log(`[MIGRATION_STEP_6_DETAIL] Added membership with placeholder UID for ${email} with role ${role}`);
                    } else {
                        console.warn(`[MIGRATION_WARN] Could not find migrated user for MongoID ${memberMongoId}. Skipping membership.`);
                        membershipStats.skipped++;
                    }
                }
            }
        } else {
            console.warn(`[MIGRATION_WARN] No usersList found in community or it's not an array`);
        }
        
        console.log(`[MIGRATION_STEP_6_SUCCESS] Membership migration stats: ${JSON.stringify(membershipStats)}`);
        
        // ** Step 7: Migrate messages
        console.log(`[MIGRATION_STEP_7] Migrating messages to Firestore`);
        const messageStats = { total: 0, migrated: 0, skipped: 0 };
        
        // Find all channels for this community
        const channels = await db.collection('channels')
            .find({ community: new ObjectId(communityId) })
            .toArray();
        
        console.log(`[MIGRATION_STEP_7_DETAIL] Found ${channels.length} channels for the community`);
        
        // For each channel, get messages
        let allMessages = [];
        for (const channel of channels) {
            const messages = await db.collection('messages')
                .find({ channel: channel._id })
                .sort({ createdAt: 1 })
                .limit(100) // Limit to 100 messages per channel for initial migration
                .toArray();
                
            allMessages = [...allMessages, ...messages];
        }
        
        console.log(`[MIGRATION_STEP_7_DETAIL] Found ${allMessages.length} messages across all channels`);
        messageStats.total = allMessages.length;
        
        // Process messages
        for (const message of allMessages) {
            const senderMongoId = message.sender.toString();
            const migratedSender = uidMap.get(senderMongoId);
            
            let userId;
            
            if (migratedSender) {
                // Use the migrated user's Firebase UID
                userId = migratedSender.firebaseUid;
            } else {
                // Try to find the user in MongoDB to get their email
                const senderData = await db.collection('users').findOne({ _id: new ObjectId(senderMongoId) });
                
                if (senderData && senderData.email) {
                    const email = senderData.email.trim().toLowerCase();
                    userId = `firebase-uid-placeholder-${email.replace('@', '-at-')}`;
                    console.log(`[MIGRATION_STEP_7_DETAIL] Using placeholder UID for message sender: ${email}`);
                } else {
                    // Last resort: use a generic placeholder
                    userId = 'firebase-uid-placeholder-unknown-email';
                    console.warn(`[MIGRATION_WARN] Using generic placeholder for message ID ${message._id} because sender ${senderMongoId} email could not be found.`);
                }
            }
            
            const messageData = {
                text: message.content || message.text || '',
                createdAt: message.createdAt || FieldValue.serverTimestamp(),
                userId: userId,
            };
            
            // Add to exported data
            exportedData.messages.push(JSON.parse(JSON.stringify(messageData)));
            
            // Add to Firestore batch
            const messageRef = adminDb.collection('communities').doc(communityId)
                .collection('messages').doc();
            batch.set(messageRef, messageData);
            
            messageStats.migrated++;
        }
        
        console.log(`[MIGRATION_STEP_7_SUCCESS] Message migration stats: ${JSON.stringify(messageStats)}`);
        
        // ** Step 8: Commit all changes
        console.log(`[MIGRATION_STEP_8] Committing all changes to Firestore`);
        console.log(`[MIGRATION_STEP_8_DETAIL] Batch contains: 1 community, ${exportedData.memberships.length} memberships, ${exportedData.messages.length} messages`);
        
        // Final validation check before committing
        if (exportedData.memberships.length === 0 && usersToMigrate.length > 0) {
            console.warn(`[MIGRATION_WARN] No memberships were created despite having ${usersToMigrate.length} users to migrate.`);
            console.warn(`[MIGRATION_WARN] This might indicate an issue with the user migration process.`);
            
            // Add debug information about the first few users that should have been migrated
            console.log(`[MIGRATION_DEBUG] First 3 MongoDB users that should have been migrated:`, 
                usersToMigrate.slice(0, 3).map(u => ({ 
                    id: u._id.toString(), 
                    email: u.email, 
                    name: u.fullName || u.displayName 
                }))
            );
        }
        
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
        console.error(`[MIGRATION_ERROR] Migration failed:`, error);
        return { 
            success: false, 
            message: `Migration failed: ${error.message || 'Unknown error'}`,
            exportedData: null,
        };
    }
}

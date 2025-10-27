'use server';

import { getDb } from '@/lib/mongodb';
import { Community, Member, Message, RawMessage } from '@/types';
import { summarizeCommunityMessages, SummarizeCommunityMessagesInput } from '@/ai/flows/summarize-community-messages';
import { ObjectId } from 'mongodb';

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
      .find({}, { projection: { name: 1, _id: 1 } })
      .sort({ name: 1 })
      .toArray();

    return communities.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      data: c,
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
    
    // First, find the community to get the list of user IDs
    const community = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });

    if (!community || !community.usersList) {
      console.log(`Community with id ${communityId} not found or has no usersList.`);
      return [];
    }

    // Extract user OIDs from the usersList
    const userOids = community.usersList.map((user: any) => user.userId);
    
    const users = await db
      .collection('users')
      .find({ _id: { $in: userOids } })
      .project({ _id: 1, uid: 1, displayName: 1, photoURL: 1, email: 1 })
      .limit(50) // To avoid large payloads
      .toArray();

    return users.map((u: any) => ({
      id: u._id.toString(),
      uid: u.uid || u.firebaseUid,
      displayName: u.displayName || u.fullName,
      photoURL: u.photoURL || u.profileImage,
      email: u.email,
      data: u,
    }));
  } catch (error) {
    console.error(`Failed to get members for community ${communityId}:`, error);
    return [];
  }
}


export async function getMessages(communityId: string): Promise<Message[]> {
  if (!communityId) return [];
  try {
    const db = await getDb();
    
    const messages: RawMessage[] = await db.collection('messages').aggregate([
      { $match: { communityId: new ObjectId(communityId) } },
      { $sort: { createdAt: 1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
          foreignField: '_id',
          as: 'senderInfo'
        }
      },
      { $unwind: '$senderInfo' }
    ]).toArray() as RawMessage[];

    return messages.map((m: any) => ({
      id: m._id.toString(),
      text: m.text,
      createdAt: m.createdAt.toISOString(),
      sender: {
        id: m.senderInfo._id.toString(),
        uid: m.senderInfo.uid,
        displayName: m.senderInfo.displayName,
        photoURL: m.senderInfo.photoURL,
        email: m.senderInfo.email,
      }
    }));
  } catch (error) {
    console.error(`Failed to get messages for community ${communityId}:`, error);
    return [];
  }
}

export async function summarizeMessages(input: SummarizeCommunityMessagesInput) {
    return await summarizeCommunityMessages(input);
}

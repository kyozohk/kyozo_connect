'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function createCommunity(communityData: any) {
  try {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
        return { error: 'Unauthorized. You must be logged in to create a community.' };
    }
    const decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const { name, slug, tagline, lore, mantras, communityPrivacy, communityType, tags, status, visibility, isDeleted } = communityData;
    
    const adminDb = await getAdminDb();
    const communityRef = adminDb.collection('communities').doc();
    const communityId = communityRef.id;
    const now = new Date();

    // Ensure the owner is explicitly set to the authenticated user's ID
    await communityRef.set({
      communityId,
      name,
      slug,
      tagline,
      lore,
      mantras,
      communityPrivacy,
      communityType,
      tags,
      status,
      visibility,
      isDeleted,
      owner: userId, // Explicitly set owner
      createdBy: userId,
      updatedBy: userId,
      memberCount: 1, 
      eventCount: 0,
      totalRevenue: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Create the initial membership for the owner
    const membershipRef = adminDb.collection('memberships').doc();
    await membershipRef.set({
        communityId: communityId,
        userId: userId,
        role: 'owner',
        joinedAt: now,
    });


    revalidatePath('/communities'); // Revalidate the communities page to show the new community

    return { success: true, communityId };
  } catch (error: any) {
    console.error('Error creating community:', error);
    return { error: error.message || 'Something went wrong while creating the community.' };
  }
}

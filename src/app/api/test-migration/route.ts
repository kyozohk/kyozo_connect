import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Test Firebase Admin SDK initialization
    const adminAuth = await getAdminAuth();
    const adminDb = await getAdminDb();
    
    // Create a placeholder user in Firestore (not in Auth)
    const email = 'test@example.com';
    const placeholderUid = `firebase-uid-placeholder-${email.replace('@', '-at-')}`;
    
    const userRef = adminDb.collection('users').doc(placeholderUid);
    await userRef.set({
      displayName: 'Test User',
      email: email,
      photoURL: 'https://api.dicebear.com/8.x/initials/svg?seed=Test+User',
      fullName: 'Test User',
      migratedAt: new Date().toISOString(),
      needsPasswordReset: true,
      migrationSource: 'test',
    });
    
    // Create a test membership
    const membershipRef = adminDb.collection('memberships').doc();
    await membershipRef.set({
      communityId: 'test-community',
      userId: placeholderUid,
      role: 'user',
      joinedAt: new Date().toISOString(),
      migratedAt: new Date().toISOString(),
      migrationSource: 'test',
      passwordInitialized: false,
      needsPasswordReset: true,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Successfully created test user and membership in Firestore',
      details: {
        userId: placeholderUid,
        membershipId: membershipRef.id
      }
    });
  } catch (error) {
    console.error('Error testing migration:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error testing migration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error instanceof Error ? { name: error.name, stack: error.stack } : undefined
      },
      { status: 500 }
    );
  }
}

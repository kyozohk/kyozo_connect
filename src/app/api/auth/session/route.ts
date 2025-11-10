
import { getAdminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const reqBody = (await request.json()) as {
    idToken: string;
  };
  const idToken = reqBody.idToken;

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });

    const isProduction = process.env.NODE_ENV === 'production';

    cookies().set('__session', sessionCookie, { 
      maxAge: expiresIn, 
      httpOnly: true, 
      secure: isProduction, // Only set secure in production
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Failed to create session cookie:', error);
    return NextResponse.json({ status: 'error' }, { status: 401 });
  }
}

'use server';

import admin from 'firebase-admin';

let app;

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
    );
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
} else {
  app = admin.app();
}

export const adminAuth = admin.auth(app);
export const adminDb = admin.firestore(app);

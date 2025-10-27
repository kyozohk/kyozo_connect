'use server';

import admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

function initializeAdminApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set.');
    }
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
    );
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    throw new Error('Could not initialize Firebase Admin SDK.');
  }
}

function getAdminApp() {
    if (!adminApp) {
        adminApp = initializeAdminApp();
    }
    return adminApp;
}

export function getAdminAuth() {
    return getAdminApp().auth();
}

export function getAdminDb() {
    return getAdminApp().firestore();
}

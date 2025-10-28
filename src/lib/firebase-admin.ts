'use server';

import admin from 'firebase-admin';

// This is a map of initialized Firebase admin apps
const adminApps = new Map<string, admin.app.App>();

function initializeAdminApp(env: 'dev' | 'prod') {
  const existingApp = adminApps.get(env);
  if (existingApp) {
    return existingApp;
  }

  const serviceAccountKey =
    env === 'dev'
      ? process.env.FIREBASE_SERVICE_ACCOUNT_KEY_DEV
      : process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PROD;

  if (!serviceAccountKey) {
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT_KEY_${env.toUpperCase()} environment variable not set.`
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    const appName = `firebase-admin-app-${env}-${Date.now()}`; // Unique name
    
    // Check if an app with this name already exists
     const existingAppByName = admin.apps.find(app => app?.name === appName);
    if (existingAppByName) {
      adminApps.set(env, existingAppByName);
      return existingAppByName;
    }


    const newApp = admin.initializeApp(
      {
        credential: admin.credential.cert(serviceAccount),
      },
      appName
    );

    adminApps.set(env, newApp);
    return newApp;
  } catch (error) {
    console.error(`Firebase admin initialization error for ${env}:`, error);
    throw new Error(`Could not initialize Firebase Admin SDK for ${env}.`);
  }
}

function getAdminApp() {
    const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    // Ensure the app for the current environment is initialized
    return initializeAdminApp(env);
}

export async function getAdminAuth() {
  return getAdminApp().auth();
}

export async function getAdminDb() {
  return getAdminApp().firestore();
}

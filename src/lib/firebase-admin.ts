

import admin from 'firebase-admin';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// This is a map of initialized Firebase admin apps
const adminApps = new Map<string, App>();

function initializeAdminApp(env: 'dev' | 'prod'): App {
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
    const appName = `firebase-admin-app-${env}-${Math.random().toString(36).substring(7)}`;

    // Use getApps() to check if the app is already initialized
    const existingAppByName = getApps().find(app => app.name === appName);
    if (existingAppByName) {
      adminApps.set(env, existingAppByName);
      return existingAppByName;
    }

    // Initialize a new app if one doesn't exist
    const newApp = initializeApp(
      {
        credential: cert(serviceAccount),
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

function getAdminApp(): App {
    const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    return initializeAdminApp(env);
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

#!/usr/bin/env node

/**
 * Firebase Permissions Check Script (Using Environment Variables)
 * 
 * This script checks if the Firebase project has all the necessary permissions
 * for the migration process, using the service account from environment variables.
 * 
 * Usage:
 * node scripts/check-firebase-permissions-env.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Check if service account is properly configured in environment variables
function checkServiceAccountEnv() {
  console.log(`\n${colors.cyan}🔍 Checking Firebase service account in environment variables...${colors.reset}`);
  
  const serviceAccountKey = process.env.NODE_ENV === 'production'
    ? process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PROD
    : process.env.FIREBASE_SERVICE_ACCOUNT_KEY_DEV;
  
  if (!serviceAccountKey) {
    console.error(`${colors.red}❌ Firebase service account environment variable not found${colors.reset}`);
    console.log(`   Expected environment variable: ${process.env.NODE_ENV === 'production' ? 'FIREBASE_SERVICE_ACCOUNT_KEY_PROD' : 'FIREBASE_SERVICE_ACCOUNT_KEY_DEV'}`);
    console.log(`   Please add it to your .env.local file.`);
    return false;
  }
  
  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'];
    
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
    
    if (missingFields.length > 0) {
      console.error(`${colors.red}❌ Service account is missing required fields: ${missingFields.join(', ')}${colors.reset}`);
      return false;
    }
    
    console.log(`${colors.green}✅ Service account found for project: ${serviceAccount.project_id}${colors.reset}`);
    return { valid: true, serviceAccount };
  } catch (error) {
    console.error(`${colors.red}❌ Error parsing service account JSON:${colors.reset}`, error.message);
    return false;
  }
}

// Initialize Firebase Admin SDK
function initializeFirebase(serviceAccount) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Failed to initialize Firebase Admin SDK:${colors.reset}`, error.message);
    return false;
  }
}

// Check Firebase Auth permissions
async function checkAuthPermissions() {
  console.log(`\n${colors.cyan}🔍 Checking Firebase Auth permissions...${colors.reset}`);
  
  try {
    // Try to list users (limited to 1) to check permissions
    await admin.auth().listUsers(1);
    console.log(`${colors.green}✅ Firebase Auth permissions: OK (Can list users)${colors.reset}`);
    
    // Try to get a non-existent user to check error handling
    try {
      await admin.auth().getUser('non-existent-user-id');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`${colors.green}✅ Firebase Auth error handling: OK${colors.reset}`);
      } else {
        console.warn(`${colors.yellow}⚠️ Unexpected error when testing non-existent user:${colors.reset}`, error.code);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Firebase Auth permissions issue:${colors.reset}`, error.message);
    if (error.code === 'auth/insufficient-permission') {
      console.log(`${colors.yellow}   The service account does not have permission to access Firebase Auth.${colors.reset}`);
      console.log(`${colors.yellow}   Make sure the service account has the "Firebase Authentication Admin" role.${colors.reset}`);
      printAuthPermissionsGuide();
    }
    return false;
  }
}

// Check Firestore permissions
async function checkFirestorePermissions() {
  console.log(`\n${colors.cyan}🔍 Checking Firestore permissions...${colors.reset}`);
  
  try {
    const db = admin.firestore();
    
    // Check if we can access the 'users' collection
    const usersRef = db.collection('users');
    await usersRef.limit(1).get();
    console.log(`${colors.green}✅ Firestore permissions: OK (Can access users collection)${colors.reset}`);
    
    // Check if we can access the 'communities' collection
    const communitiesRef = db.collection('communities');
    await communitiesRef.limit(1).get();
    console.log(`${colors.green}✅ Firestore permissions: OK (Can access communities collection)${colors.reset}`);
    
    // Check if we can access the 'memberships' collection
    const membershipsRef = db.collection('memberships');
    await membershipsRef.limit(1).get();
    console.log(`${colors.green}✅ Firestore permissions: OK (Can access memberships collection)${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Firestore permissions issue:${colors.reset}`, error.message);
    if (error.code === 'permission-denied') {
      console.log(`${colors.yellow}   The service account does not have permission to access Firestore.${colors.reset}`);
      console.log(`${colors.yellow}   Make sure the service account has the "Cloud Datastore User" role.${colors.reset}`);
      printFirestorePermissionsGuide();
    }
    return false;
  }
}

// Check if we can write to Firestore
async function checkFirestoreWrite() {
  console.log(`\n${colors.cyan}🔍 Testing Firestore write permissions...${colors.reset}`);
  
  try {
    const db = admin.firestore();
    const testDocRef = db.collection('_test_permissions').doc('test_doc');
    
    // Try to write a test document
    await testDocRef.set({
      test: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`${colors.green}✅ Firestore write permissions: OK${colors.reset}`);
    
    // Clean up the test document
    await testDocRef.delete();
    console.log(`${colors.green}✅ Firestore delete permissions: OK${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Firestore write permissions issue:${colors.reset}`, error.message);
    if (error.code === 'permission-denied') {
      console.log(`${colors.yellow}   The service account does not have write permission to Firestore.${colors.reset}`);
      console.log(`${colors.yellow}   Make sure the service account has the "Cloud Datastore User" role.${colors.reset}`);
      printFirestorePermissionsGuide();
    }
    return false;
  }
}

// Check if we can create users in Firebase Auth
async function checkUserCreation() {
  console.log(`\n${colors.cyan}🔍 Testing Firebase Auth user creation...${colors.reset}`);
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Test123!';
  let createdUserId = null;
  
  try {
    // Try to create a test user
    const userRecord = await admin.auth().createUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Test User',
      emailVerified: true
    });
    
    createdUserId = userRecord.uid;
    console.log(`${colors.green}✅ Firebase Auth user creation: OK${colors.reset}`);
    
    // Check if we can update the user
    await admin.auth().updateUser(createdUserId, {
      displayName: 'Updated Test User'
    });
    console.log(`${colors.green}✅ Firebase Auth user update: OK${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Firebase Auth user creation issue:${colors.reset}`, error.message);
    if (error.code === 'auth/insufficient-permission') {
      console.log(`${colors.yellow}   The service account does not have permission to create users.${colors.reset}`);
      console.log(`${colors.yellow}   Make sure the service account has the "Firebase Authentication Admin" role.${colors.reset}`);
      printAuthPermissionsGuide();
    }
    return false;
  } finally {
    // Clean up the test user
    if (createdUserId) {
      try {
        await admin.auth().deleteUser(createdUserId);
        console.log(`${colors.green}✅ Firebase Auth user deletion: OK${colors.reset}`);
      } catch (error) {
        console.warn(`${colors.yellow}⚠️ Could not delete test user:${colors.reset}`, error.message);
      }
    }
  }
}

// Print guide on how to add Firebase Auth permissions
function printAuthPermissionsGuide() {
  console.log(`\n${colors.bright}${colors.cyan}📋 How to add Firebase Authentication Admin permissions:${colors.reset}`);
  console.log(`${colors.white}1. Go to the Google Cloud Console: ${colors.blue}https://console.cloud.google.com/${colors.reset}`);
  console.log(`${colors.white}2. Select your project${colors.reset}`);
  console.log(`${colors.white}3. Go to "IAM & Admin" > "IAM" in the left sidebar${colors.reset}`);
  console.log(`${colors.white}4. Find your service account in the list${colors.reset}`);
  console.log(`${colors.white}5. Click the pencil icon to edit permissions${colors.reset}`);
  console.log(`${colors.white}6. Click "ADD ANOTHER ROLE"${colors.reset}`);
  console.log(`${colors.white}7. Search for "Firebase Authentication Admin" and select it${colors.reset}`);
  console.log(`${colors.white}8. Click "SAVE"${colors.reset}`);
  console.log(`\n${colors.white}Alternatively, you can use the Firebase CLI:${colors.reset}`);
  console.log(`${colors.white}$ firebase projects:open permissions${colors.reset}`);
}

// Print guide on how to add Firestore permissions
function printFirestorePermissionsGuide() {
  console.log(`\n${colors.bright}${colors.cyan}📋 How to add Firestore permissions:${colors.reset}`);
  console.log(`${colors.white}1. Go to the Google Cloud Console: ${colors.blue}https://console.cloud.google.com/${colors.reset}`);
  console.log(`${colors.white}2. Select your project${colors.reset}`);
  console.log(`${colors.white}3. Go to "IAM & Admin" > "IAM" in the left sidebar${colors.reset}`);
  console.log(`${colors.white}4. Find your service account in the list${colors.reset}`);
  console.log(`${colors.white}5. Click the pencil icon to edit permissions${colors.reset}`);
  console.log(`${colors.white}6. Click "ADD ANOTHER ROLE"${colors.reset}`);
  console.log(`${colors.white}7. Search for "Cloud Datastore User" and select it${colors.reset}`);
  console.log(`${colors.white}8. Click "SAVE"${colors.reset}`);
  console.log(`\n${colors.white}Alternatively, you can use the Firebase CLI:${colors.reset}`);
  console.log(`${colors.white}$ firebase projects:open permissions${colors.reset}`);
}

// Main function
async function main() {
  console.log(`${colors.bright}${colors.cyan}🔥 Firebase Permissions Check (Environment Variables)${colors.reset}`);
  console.log(`${colors.cyan}===============================================${colors.reset}`);
  
  const serviceAccountResult = checkServiceAccountEnv();
  if (!serviceAccountResult || !serviceAccountResult.valid) {
    console.log(`\n${colors.red}❌ Service account check failed. Cannot proceed with other checks.${colors.reset}`);
    process.exit(1);
  }
  
  const firebaseInitOk = initializeFirebase(serviceAccountResult.serviceAccount);
  if (!firebaseInitOk) {
    console.log(`\n${colors.red}❌ Firebase initialization failed. Cannot proceed with other checks.${colors.reset}`);
    process.exit(1);
  }
  
  // Run all checks
  const authOk = await checkAuthPermissions();
  const firestoreOk = await checkFirestorePermissions();
  const firestoreWriteOk = await checkFirestoreWrite();
  const userCreationOk = await checkUserCreation();
  
  console.log(`\n${colors.cyan}===============================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}📋 Summary:${colors.reset}`);
  console.log(`${colors.white}- Service Account: ${serviceAccountResult.valid ? colors.green + '✅' : colors.red + '❌'}${colors.reset}`);
  console.log(`${colors.white}- Firebase Auth Permissions: ${authOk ? colors.green + '✅' : colors.red + '❌'}${colors.reset}`);
  console.log(`${colors.white}- Firestore Read Permissions: ${firestoreOk ? colors.green + '✅' : colors.red + '❌'}${colors.reset}`);
  console.log(`${colors.white}- Firestore Write Permissions: ${firestoreWriteOk ? colors.green + '✅' : colors.red + '❌'}${colors.reset}`);
  console.log(`${colors.white}- Firebase Auth User Creation: ${userCreationOk ? colors.green + '✅' : colors.red + '❌'}${colors.reset}`);
  
  if (authOk && firestoreOk && firestoreWriteOk && userCreationOk) {
    console.log(`\n${colors.green}✅ Your Firebase project has all the necessary permissions for migration!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}❌ Some permissions are missing. Please fix the issues above before proceeding with migration.${colors.reset}`);
    
    console.log(`\n${colors.bright}${colors.cyan}📋 Required Permissions for Migration:${colors.reset}`);
    console.log(`${colors.white}1. Firebase Authentication Admin - For user management${colors.reset}`);
    console.log(`${colors.white}2. Cloud Datastore User - For Firestore access${colors.reset}`);
    
    console.log(`\n${colors.bright}${colors.cyan}📋 How to generate a new service account with proper permissions:${colors.reset}`);
    console.log(`${colors.white}1. Go to the Firebase Console: ${colors.blue}https://console.firebase.google.com/${colors.reset}`);
    console.log(`${colors.white}2. Select your project${colors.reset}`);
    console.log(`${colors.white}3. Go to Project Settings > Service accounts${colors.reset}`);
    console.log(`${colors.white}4. Click "Generate new private key" under "Firebase Admin SDK"${colors.reset}`);
    console.log(`${colors.white}5. Save the JSON file securely${colors.reset}`);
    console.log(`${colors.white}6. Add the contents of the JSON file to your .env.local file as:${colors.reset}`);
    console.log(`   ${colors.yellow}FIREBASE_SERVICE_ACCOUNT_KEY_DEV='{"type":"service_account",...}'${colors.reset}`);
    console.log(`${colors.white}7. Make sure to add the required roles to this service account using the guides above${colors.reset}`);
  }
}

main().catch(console.error).finally(() => process.exit(0));

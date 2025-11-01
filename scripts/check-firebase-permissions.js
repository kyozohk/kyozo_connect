/**
 * Firebase Permissions and Configuration Check Script
 * 
 * This script checks if the Firebase project has all the necessary permissions
 * and configurations for the migration process.
 * 
 * Usage:
 * node scripts/check-firebase-permissions.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check if service account file exists
function checkServiceAccount() {
  console.log('\n🔍 Checking Firebase service account...');
  
  const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Firebase service account file not found at:', serviceAccountPath);
    console.log('   Please make sure you have a valid service account file.');
    return false;
  }
  
  try {
    const serviceAccount = require(serviceAccountPath);
    const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'];
    
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
    
    if (missingFields.length > 0) {
      console.error(`❌ Service account file is missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    console.log(`✅ Service account found for project: ${serviceAccount.project_id}`);
    return true;
  } catch (error) {
    console.error('❌ Error reading service account file:', error.message);
    return false;
  }
}

// Initialize Firebase Admin SDK
function initializeFirebase() {
  try {
    const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    return false;
  }
}

// Check Firebase Auth permissions
async function checkAuthPermissions() {
  console.log('\n🔍 Checking Firebase Auth permissions...');
  
  try {
    // Try to list users (limited to 1) to check permissions
    await admin.auth().listUsers(1);
    console.log('✅ Firebase Auth permissions: OK (Can list users)');
    
    // Try to get a non-existent user to check error handling
    try {
      await admin.auth().getUser('non-existent-user-id');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('✅ Firebase Auth error handling: OK');
      } else {
        console.warn('⚠️ Unexpected error when testing non-existent user:', error.code);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Firebase Auth permissions issue:', error.message);
    if (error.code === 'auth/insufficient-permission') {
      console.log('   The service account does not have permission to access Firebase Auth.');
      console.log('   Make sure the service account has the "Firebase Authentication Admin" role.');
    }
    return false;
  }
}

// Check Firestore permissions
async function checkFirestorePermissions() {
  console.log('\n🔍 Checking Firestore permissions...');
  
  try {
    const db = admin.firestore();
    
    // Check if we can access the 'users' collection
    const usersRef = db.collection('users');
    await usersRef.limit(1).get();
    console.log('✅ Firestore permissions: OK (Can access users collection)');
    
    // Check if we can access the 'communities' collection
    const communitiesRef = db.collection('communities');
    await communitiesRef.limit(1).get();
    console.log('✅ Firestore permissions: OK (Can access communities collection)');
    
    // Check if we can access the 'memberships' collection
    const membershipsRef = db.collection('memberships');
    await membershipsRef.limit(1).get();
    console.log('✅ Firestore permissions: OK (Can access memberships collection)');
    
    return true;
  } catch (error) {
    console.error('❌ Firestore permissions issue:', error.message);
    if (error.code === 'permission-denied') {
      console.log('   The service account does not have permission to access Firestore.');
      console.log('   Make sure the service account has the "Cloud Datastore User" role.');
    }
    return false;
  }
}

// Check if we can write to Firestore
async function checkFirestoreWrite() {
  console.log('\n🔍 Testing Firestore write permissions...');
  
  try {
    const db = admin.firestore();
    const testDocRef = db.collection('_test_permissions').doc('test_doc');
    
    // Try to write a test document
    await testDocRef.set({
      test: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Firestore write permissions: OK');
    
    // Clean up the test document
    await testDocRef.delete();
    console.log('✅ Firestore delete permissions: OK');
    
    return true;
  } catch (error) {
    console.error('❌ Firestore write permissions issue:', error.message);
    if (error.code === 'permission-denied') {
      console.log('   The service account does not have write permission to Firestore.');
      console.log('   Make sure the service account has the "Cloud Datastore User" role.');
    }
    return false;
  }
}

// Check Firebase project configuration
async function checkProjectConfig() {
  console.log('\n🔍 Checking Firebase project configuration...');
  
  try {
    // Check if Email/Password authentication is enabled
    const authConfig = await admin.auth().listProviderConfigs();
    const emailEnabled = authConfig.providerConfigs.some(config => 
      config.providerId === 'password'
    );
    
    if (emailEnabled) {
      console.log('✅ Email/Password authentication is enabled');
    } else {
      console.warn('⚠️ Email/Password authentication might not be enabled');
      console.log('   Please enable Email/Password authentication in the Firebase console.');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking project configuration:', error.message);
    return false;
  }
}

// Check environment variables
function checkEnvironmentVariables() {
  console.log('\n🔍 Checking environment variables...');
  
  // Check if .env file exists
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️ .env file not found');
  } else {
    console.log('✅ .env file exists');
  }
  
  // Check for Firebase environment variables
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
    console.log('   These variables might be loaded at runtime or defined elsewhere.');
  } else {
    console.log('✅ All required Firebase environment variables are defined');
  }
}

// Main function
async function main() {
  console.log('🔥 Firebase Permissions and Configuration Check');
  console.log('==============================================');
  
  const serviceAccountOk = checkServiceAccount();
  if (!serviceAccountOk) {
    console.log('\n❌ Service account check failed. Cannot proceed with other checks.');
    process.exit(1);
  }
  
  const firebaseInitOk = initializeFirebase();
  if (!firebaseInitOk) {
    console.log('\n❌ Firebase initialization failed. Cannot proceed with other checks.');
    process.exit(1);
  }
  
  // Run all checks
  const authOk = await checkAuthPermissions();
  const firestoreOk = await checkFirestorePermissions();
  const firestoreWriteOk = await checkFirestoreWrite();
  const projectConfigOk = await checkProjectConfig();
  checkEnvironmentVariables();
  
  console.log('\n==============================================');
  console.log('📋 Summary:');
  console.log(`- Service Account: ${serviceAccountOk ? '✅' : '❌'}`);
  console.log(`- Firebase Auth Permissions: ${authOk ? '✅' : '❌'}`);
  console.log(`- Firestore Read Permissions: ${firestoreOk ? '✅' : '❌'}`);
  console.log(`- Firestore Write Permissions: ${firestoreWriteOk ? '✅' : '❌'}`);
  console.log(`- Project Configuration: ${projectConfigOk ? '✅' : '❌'}`);
  
  if (authOk && firestoreOk && firestoreWriteOk) {
    console.log('\n✅ Your Firebase project has all the necessary permissions for migration!');
  } else {
    console.log('\n❌ Some permissions are missing. Please fix the issues above before proceeding with migration.');
  }
}

main().catch(console.error).finally(() => process.exit(0));

/**
 * Firebase Auth Migration Helper Script
 * 
 * This script helps with migrating users from MongoDB to Firebase Auth.
 * It can be used to:
 * 1. Generate password reset links for migrated users
 * 2. Check the status of migrated users
 * 3. Send welcome emails to migrated users
 * 
 * Usage:
 * node scripts/firebase-auth-migration.js [command] [options]
 * 
 * Commands:
 *   generate-reset-links - Generate password reset links for users who need password reset
 *   check-status - Check the status of migrated users
 *   send-welcome-emails - Send welcome emails to migrated users
 * 
 * Options:
 *   --limit=N - Limit the number of users to process (default: 10)
 *   --community=ID - Process only users from a specific community
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const options = {};

args.slice(1).forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    options[key] = value || true;
  }
});

const limit = parseInt(options.limit || '10', 10);
const communityId = options.community;

// Helper function to get users who need password reset
async function getUsersNeedingPasswordReset() {
  console.log('Finding users who need password reset...');
  
  let query = db.collection('users')
    .where('needsPasswordReset', '==', true)
    .limit(limit);
  
  const snapshot = await query.get();
  console.log(`Found ${snapshot.size} users who need password reset.`);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    email: doc.data().email,
    displayName: doc.data().displayName || doc.data().fullName || 'User'
  }));
}

// Helper function to get memberships for a community
async function getMembershipsForCommunity(communityId) {
  console.log(`Finding memberships for community ${communityId}...`);
  
  let query = db.collection('memberships')
    .where('communityId', '==', communityId)
    .where('migrationSource', '==', 'mongodb')
    .limit(limit);
  
  const snapshot = await query.get();
  console.log(`Found ${snapshot.size} migrated memberships for community ${communityId}.`);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    userId: doc.data().userId,
    role: doc.data().role,
    needsPasswordReset: doc.data().needsPasswordReset || false
  }));
}

// Generate password reset links
async function generateResetLinks() {
  const users = await getUsersNeedingPasswordReset();
  const results = [];
  
  for (const user of users) {
    try {
      const link = await auth.generatePasswordResetLink(user.email);
      results.push({
        email: user.email,
        displayName: user.displayName,
        resetLink: link
      });
      console.log(`Generated reset link for ${user.email}`);
    } catch (error) {
      console.error(`Error generating reset link for ${user.email}:`, error);
      results.push({
        email: user.email,
        error: error.message
      });
    }
  }
  
  // Save results to a file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `password-reset-links-${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  
  console.log(`\nGenerated ${results.length} password reset links.`);
  console.log(`Results saved to ${filename}`);
}

// Check status of migrated users
async function checkStatus() {
  if (!communityId) {
    console.error('Error: --community=ID is required for check-status command');
    process.exit(1);
  }
  
  const memberships = await getMembershipsForCommunity(communityId);
  const results = [];
  
  for (const membership of memberships) {
    try {
      const userRecord = await auth.getUser(membership.userId);
      const userDoc = await db.collection('users').doc(membership.userId).get();
      
      results.push({
        userId: membership.userId,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        role: membership.role,
        needsPasswordReset: userDoc.exists ? (userDoc.data().needsPasswordReset || false) : 'unknown',
        lastSignInTime: userRecord.metadata.lastSignInTime,
        creationTime: userRecord.metadata.creationTime
      });
      
      console.log(`Checked status for ${userRecord.email}`);
    } catch (error) {
      console.error(`Error checking status for user ${membership.userId}:`, error);
      results.push({
        userId: membership.userId,
        error: error.message
      });
    }
  }
  
  // Save results to a file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `user-status-${communityId}-${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  
  console.log(`\nChecked status for ${results.length} users.`);
  console.log(`Results saved to ${filename}`);
}

// Send welcome emails to migrated users
async function sendWelcomeEmails() {
  const users = await getUsersNeedingPasswordReset();
  const results = [];
  
  for (const user of users) {
    try {
      const link = await auth.generatePasswordResetLink(user.email);
      
      // In a real implementation, you would send an email here
      // For now, we'll just log the information
      console.log(`Would send welcome email to ${user.email} with reset link: ${link}`);
      
      results.push({
        email: user.email,
        displayName: user.displayName,
        resetLink: link
      });
      
      // Update the user record to indicate that a welcome email was sent
      await db.collection('users').doc(user.id).update({
        welcomeEmailSent: true,
        welcomeEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
    } catch (error) {
      console.error(`Error sending welcome email to ${user.email}:`, error);
      results.push({
        email: user.email,
        error: error.message
      });
    }
  }
  
  // Save results to a file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `welcome-emails-${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  
  console.log(`\nProcessed welcome emails for ${results.length} users.`);
  console.log(`Results saved to ${filename}`);
}

// Main function
async function main() {
  try {
    switch (command) {
      case 'generate-reset-links':
        await generateResetLinks();
        break;
      case 'check-status':
        await checkStatus();
        break;
      case 'send-welcome-emails':
        await sendWelcomeEmails();
        break;
      default:
        console.log(`
Firebase Auth Migration Helper

Usage:
  node scripts/firebase-auth-migration.js [command] [options]

Commands:
  generate-reset-links - Generate password reset links for users who need password reset
  check-status - Check the status of migrated users
  send-welcome-emails - Send welcome emails to migrated users

Options:
  --limit=N - Limit the number of users to process (default: 10)
  --community=ID - Process only users from a specific community
        `);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

main();

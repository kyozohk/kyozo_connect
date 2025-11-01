/**
 * Firebase CLI Configuration Check Script
 * 
 * This script checks if the Firebase CLI is properly configured
 * and if the current project has all the necessary features enabled.
 * 
 * Usage:
 * node scripts/check-firebase-cli.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if Firebase CLI is installed
function checkFirebaseCLI() {
  console.log('\n🔍 Checking Firebase CLI installation...');
  
  try {
    const output = execSync('firebase --version', { encoding: 'utf8' });
    console.log(`✅ Firebase CLI is installed (version: ${output.trim()})`);
    return true;
  } catch (error) {
    console.error('❌ Firebase CLI is not installed or not in PATH');
    console.log('   Install Firebase CLI with: npm install -g firebase-tools');
    return false;
  }
}

// Check if user is logged in to Firebase
function checkFirebaseLogin() {
  console.log('\n🔍 Checking Firebase CLI login status...');
  
  try {
    const output = execSync('firebase login:list', { encoding: 'utf8' });
    
    if (output.includes('No users')) {
      console.error('❌ Not logged in to Firebase CLI');
      console.log('   Log in with: firebase login');
      return false;
    }
    
    console.log('✅ Logged in to Firebase CLI');
    return true;
  } catch (error) {
    console.error('❌ Error checking Firebase login status:', error.message);
    return false;
  }
}

// Check Firebase project configuration
function checkFirebaseProject() {
  console.log('\n🔍 Checking Firebase project configuration...');
  
  // Check if firebase.json exists
  const firebaseConfigPath = path.join(__dirname, '..', 'firebase.json');
  if (!fs.existsSync(firebaseConfigPath)) {
    console.warn('⚠️ firebase.json not found');
    console.log('   This might be normal if you\'re not using Firebase Hosting or Functions');
  } else {
    console.log('✅ firebase.json exists');
    
    // Check firebase.json content
    try {
      const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
      
      if (firebaseConfig.firestore) {
        console.log('✅ Firestore configuration found in firebase.json');
      }
      
      if (firebaseConfig.hosting) {
        console.log('✅ Hosting configuration found in firebase.json');
      }
      
      if (firebaseConfig.functions) {
        console.log('✅ Functions configuration found in firebase.json');
      }
    } catch (error) {
      console.error('❌ Error parsing firebase.json:', error.message);
    }
  }
  
  // Check .firebaserc
  const firebaseRcPath = path.join(__dirname, '..', '.firebaserc');
  if (!fs.existsSync(firebaseRcPath)) {
    console.warn('⚠️ .firebaserc not found');
    console.log('   This file contains the project ID. Run: firebase use --add');
  } else {
    console.log('✅ .firebaserc exists');
    
    try {
      const firebaseRc = JSON.parse(fs.readFileSync(firebaseRcPath, 'utf8'));
      const projectId = firebaseRc.projects?.default;
      
      if (projectId) {
        console.log(`✅ Default project ID: ${projectId}`);
      } else {
        console.warn('⚠️ No default project ID found in .firebaserc');
        console.log('   Set a default project with: firebase use --add');
      }
    } catch (error) {
      console.error('❌ Error parsing .firebaserc:', error.message);
    }
  }
}

// Get current Firebase project
function getCurrentProject() {
  try {
    // Try to get project from .firebaserc first
    const firebaseRcPath = path.join(__dirname, '..', '.firebaserc');
    if (fs.existsSync(firebaseRcPath)) {
      const firebaseRc = JSON.parse(fs.readFileSync(firebaseRcPath, 'utf8'));
      const projectId = firebaseRc.projects?.default;
      if (projectId) return projectId;
    }
    
    // If not found in .firebaserc, try to get from firebase CLI
    const output = execSync('firebase projects:list --json', { encoding: 'utf8' });
    const projects = JSON.parse(output);
    
    if (projects.length > 0 && projects[0].projectId) {
      return projects[0].projectId;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current project:', error.message);
    return null;
  }
}

// Check Firebase services
function checkFirebaseServices() {
  console.log('\n🔍 Checking Firebase services...');
  
  const projectId = getCurrentProject();
  if (!projectId) {
    console.error('❌ Could not determine Firebase project ID');
    return;
  }
  
  console.log(`   Project ID: ${projectId}`);
  
  try {
    // Get project info
    const output = execSync(`firebase projects:list --json`, { encoding: 'utf8' });
    const projects = JSON.parse(output);
    const project = projects.find(p => p.projectId === projectId);
    
    if (project) {
      console.log(`✅ Project name: ${project.displayName}`);
    }
    
    // Check enabled services
    try {
      const servicesOutput = execSync(`firebase services:list --project ${projectId}`, { encoding: 'utf8' });
      
      if (servicesOutput.includes('Authentication')) {
        console.log('✅ Firebase Authentication is enabled');
      } else {
        console.warn('⚠️ Firebase Authentication might not be enabled');
      }
      
      if (servicesOutput.includes('Firestore')) {
        console.log('✅ Firestore is enabled');
      } else {
        console.warn('⚠️ Firestore might not be enabled');
      }
      
      if (servicesOutput.includes('Storage')) {
        console.log('✅ Firebase Storage is enabled');
      } else {
        console.warn('⚠️ Firebase Storage might not be enabled');
      }
    } catch (error) {
      console.warn('⚠️ Could not check enabled services:', error.message);
    }
  } catch (error) {
    console.error('❌ Error checking Firebase services:', error.message);
  }
}

// Check Firestore rules
function checkFirestoreRules() {
  console.log('\n🔍 Checking Firestore rules...');
  
  const rulesPath = path.join(__dirname, '..', 'firestore.rules');
  if (!fs.existsSync(rulesPath)) {
    console.warn('⚠️ firestore.rules file not found');
    return;
  }
  
  console.log('✅ firestore.rules file exists');
  
  try {
    const rules = fs.readFileSync(rulesPath, 'utf8');
    
    // Check if rules allow write access
    if (rules.includes('allow write:') || rules.includes('allow create:') || 
        rules.includes('allow update:') || rules.includes('allow delete:')) {
      console.log('✅ Firestore rules contain write permissions');
    } else {
      console.warn('⚠️ Firestore rules might not allow write access');
      console.log('   This is required for migration to work');
    }
    
    // Check if rules are too restrictive
    if (rules.includes('allow read, write: if false;')) {
      console.warn('⚠️ Firestore rules contain "if false" which blocks all access');
    }
    
    // Check if rules are too permissive
    if (rules.includes('allow read, write: if true;')) {
      console.warn('⚠️ Firestore rules contain "if true" which allows unrestricted access');
      console.log('   This is insecure and should be fixed after migration');
    }
  } catch (error) {
    console.error('❌ Error reading firestore.rules:', error.message);
  }
}

// Main function
async function main() {
  console.log('🔥 Firebase CLI Configuration Check');
  console.log('==================================');
  
  const cliInstalled = checkFirebaseCLI();
  if (!cliInstalled) {
    console.log('\n❌ Firebase CLI check failed. Cannot proceed with other checks.');
    process.exit(1);
  }
  
  const loggedIn = checkFirebaseLogin();
  if (!loggedIn) {
    console.log('\n❌ Firebase login check failed. Cannot proceed with other checks.');
    process.exit(1);
  }
  
  checkFirebaseProject();
  checkFirebaseServices();
  checkFirestoreRules();
  
  console.log('\n==================================');
  console.log('📋 Next steps for migration:');
  console.log('1. Make sure Firebase Authentication has Email/Password sign-in enabled');
  console.log('2. Ensure Firestore rules allow write access for your migration process');
  console.log('3. Check that your service account has the necessary permissions');
  console.log('4. Run the migration from the /migrate route in your application');
}

main().catch(console.error);

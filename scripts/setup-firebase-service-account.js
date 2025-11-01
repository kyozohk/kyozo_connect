#!/usr/bin/env node

/**
 * Firebase Service Account Setup Script
 * 
 * This script helps users set up their Firebase service account for migration.
 * It guides them through the process of creating a service account and adding it to their .env.local file.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Print a colored message
function colorPrint(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Print a section header
function printHeader(title) {
  console.log('\n' + '='.repeat(80));
  colorPrint(colors.bright + colors.fg.cyan, title);
  console.log('='.repeat(80));
}

// Check if .env.local exists
function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  return fs.existsSync(envPath);
}

// Check if service account is already set
function checkServiceAccountSet() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  return envContent.includes('FIREBASE_SERVICE_ACCOUNT_KEY_DEV=');
}

// Add service account to .env.local
function addServiceAccountToEnv(serviceAccountJson) {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envExists = fs.existsSync(envPath);
  
  let envContent = '';
  if (envExists) {
    envContent = fs.readFileSync(envPath, 'utf8');
    
    // Remove existing service account if present
    envContent = envContent.replace(/FIREBASE_SERVICE_ACCOUNT_KEY_DEV=.*(\r?\n|$)/g, '');
    
    // Add a newline if the file doesn't end with one
    if (!envContent.endsWith('\n')) {
      envContent += '\n';
    }
  }
  
  // Add the new service account
  envContent += `FIREBASE_SERVICE_ACCOUNT_KEY_DEV='${serviceAccountJson}'\n`;
  
  fs.writeFileSync(envPath, envContent);
  colorPrint(colors.fg.green, `✅ Service account added to ${envPath}`);
}

// Main function
async function main() {
  printHeader('Firebase Service Account Setup');
  
  colorPrint(colors.fg.yellow, 'This script will help you set up your Firebase service account for migration.');
  console.log('\nBefore continuing, make sure you have:');
  console.log('1. Created a Firebase project');
  console.log('2. Generated a service account key from the Firebase console');
  console.log('   (Project Settings > Service accounts > Firebase Admin SDK > Generate new private key)');
  
  rl.question('\nDo you want to continue? (y/n): ', (answer) => {
    if (answer.toLowerCase() !== 'y') {
      colorPrint(colors.fg.red, 'Setup cancelled.');
      rl.close();
      return;
    }
    
    const envExists = checkEnvFile();
    const serviceAccountSet = checkServiceAccountSet();
    
    if (serviceAccountSet) {
      colorPrint(colors.fg.yellow, '⚠️ A Firebase service account is already set in your .env.local file.');
      rl.question('Do you want to replace it? (y/n): ', (answer) => {
        if (answer.toLowerCase() !== 'y') {
          colorPrint(colors.fg.red, 'Setup cancelled.');
          rl.close();
          return;
        }
        
        promptForServiceAccount();
      });
    } else {
      if (!envExists) {
        colorPrint(colors.fg.yellow, '⚠️ No .env.local file found. A new one will be created.');
      }
      
      promptForServiceAccount();
    }
  });
}

// Prompt for service account JSON
function promptForServiceAccount() {
  colorPrint(colors.fg.cyan, '\nPlease paste your Firebase service account JSON below:');
  colorPrint(colors.fg.yellow, '(Press Enter, paste the JSON, then press Enter again, followed by Ctrl+D on a new line to finish)');
  
  let serviceAccountJson = '';
  
  process.stdin.on('data', (chunk) => {
    serviceAccountJson += chunk;
  });
  
  process.stdin.on('end', () => {
    try {
      // Trim whitespace and validate JSON
      serviceAccountJson = serviceAccountJson.trim();
      const parsedJson = JSON.parse(serviceAccountJson);
      
      // Check required fields
      const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
      const missingFields = requiredFields.filter(field => !parsedJson[field]);
      
      if (missingFields.length > 0) {
        colorPrint(colors.fg.red, `❌ Invalid service account JSON. Missing required fields: ${missingFields.join(', ')}`);
        process.exit(1);
      }
      
      // Add to .env.local
      addServiceAccountToEnv(serviceAccountJson);
      
      colorPrint(colors.fg.green, '\n✅ Firebase service account setup complete!');
      colorPrint(colors.fg.cyan, `\nProject ID: ${parsedJson.project_id}`);
      colorPrint(colors.fg.cyan, `Client Email: ${parsedJson.client_email}`);
      
      colorPrint(colors.fg.yellow, '\nNext steps:');
      console.log('1. Restart your development server');
      console.log('2. Go to the /test-firebase page to verify your service account');
      console.log('3. Go to the /migrate page to start migration');
      
    } catch (error) {
      colorPrint(colors.fg.red, `❌ Invalid JSON format: ${error.message}`);
      process.exit(1);
    }
  });
  
  // Switch back to line mode
  process.stdin.resume();
  process.stdin.setRawMode(false);
}

main();

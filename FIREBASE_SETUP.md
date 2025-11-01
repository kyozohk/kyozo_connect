# Firebase Setup for Kyozo Connect

This guide will help you set up Firebase for the Kyozo Connect application, specifically for the migration feature.

## Prerequisites

- A Firebase project (create one at [firebase.google.com](https://firebase.google.com))
- Firebase CLI installed (`npm install -g firebase-tools`)
- Node.js and npm/pnpm installed

## Setup Steps

### 1. Create a Firebase Service Account

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service accounts
4. Click on "Firebase Admin SDK"
5. Click "Generate new private key"
6. Save the JSON file securely

### 2. Add the Service Account to Your Environment

#### Option 1: Using the Setup Script (Recommended)

We've created a script to help you set up your Firebase service account:

```bash
node scripts/setup-firebase-service-account.js
```

Follow the prompts to add your service account to the `.env.local` file.

#### Option 2: Manual Setup

1. Create or edit the `.env.local` file in the root of the project
2. Add the following line, replacing `{YOUR_SERVICE_ACCOUNT_JSON}` with the contents of the JSON file you downloaded:

```
FIREBASE_SERVICE_ACCOUNT_KEY_DEV='{YOUR_SERVICE_ACCOUNT_JSON}'
```

Make sure to keep the single quotes around the JSON.

### 3. Verify Your Setup

1. Start the development server:

```bash
pnpm dev
```

2. Navigate to `/test-firebase` in your browser
3. Click "Test Firebase Admin SDK" to verify your service account is working

### 4. Set Up Firebase Authentication

1. Go to the Firebase Console > Authentication
2. Click on "Sign-in method"
3. Enable "Email/Password" authentication

### 5. Set Up Firestore

1. Go to the Firebase Console > Firestore Database
2. Click "Create database" if you haven't already
3. Choose "Start in production mode" and select a location

### 6. Set Up Firebase Storage (Optional)

1. Go to the Firebase Console > Storage
2. Click "Get started" if you haven't already
3. Choose "Start in production mode" and select a location

## Troubleshooting

### Service Account Permissions

If you're having issues with permissions, make sure your service account has the following roles:

- Firebase Authentication Admin
- Cloud Datastore User
- Storage Admin (if using Firebase Storage)

You can add these roles in the Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to IAM & Admin > IAM
4. Find your service account and click the edit button
5. Add the required roles

### Common Errors

#### "Firebase service account environment variable not set"

Make sure you've added the service account to your `.env.local` file as described above.

#### "Firebase service account has insufficient permissions"

Your service account doesn't have the necessary permissions. Follow the steps in the "Service Account Permissions" section above.

#### "Firebase service account JSON is invalid"

Make sure you've copied the entire JSON file correctly, including all curly braces and quotes.

## Migration Process

Once your Firebase setup is complete, you can use the migration feature:

1. Navigate to `/migrate` in your browser
2. Select a community to migrate
3. Click the export button
4. The system will check Firebase permissions
5. If checks pass, it will show the export preview
6. Confirm to start the migration

After migration:
- Users will be created in Firebase Auth
- User profiles will be stored in Firestore
- Memberships will be created with proper roles
- Messages will be migrated to the community's messages collection

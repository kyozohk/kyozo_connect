#!/bin/bash

# Check Migration Readiness Script
# This script runs both Firebase permission and CLI checks
# to ensure the system is ready for migration

echo "🔄 Checking Firebase Migration Readiness"
echo "========================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if the scripts exist
if [ ! -f "$(dirname "$0")/check-firebase-permissions.js" ]; then
    echo "❌ check-firebase-permissions.js script not found"
    exit 1
fi

if [ ! -f "$(dirname "$0")/check-firebase-cli.js" ]; then
    echo "❌ check-firebase-cli.js script not found"
    exit 1
fi

# Run the Firebase CLI check
echo "🔍 Running Firebase CLI check..."
node "$(dirname "$0")/check-firebase-cli.js"
CLI_RESULT=$?

echo
echo "========================================"
echo

# Run the Firebase permissions check
echo "🔍 Running Firebase permissions check..."
node "$(dirname "$0")/check-firebase-permissions.js"
PERMISSIONS_RESULT=$?

echo
echo "========================================"
echo "📋 Final Migration Readiness Report:"

if [ $CLI_RESULT -eq 0 ] && [ $PERMISSIONS_RESULT -eq 0 ]; then
    echo "✅ Your system appears to be ready for migration!"
    echo "   You can now proceed with the migration from the /migrate route."
else
    echo "❌ Some checks failed. Please fix the issues above before proceeding with migration."
    echo "   Review the output for specific instructions on what needs to be fixed."
fi

echo
echo "📝 Additional recommendations:"
echo "1. Make a backup of your MongoDB data before migration"
echo "2. Test the migration with a small subset of data first"
echo "3. Verify the migrated data in Firebase after migration"
echo "4. Set up proper security rules in Firestore after migration"
echo

exit $(( CLI_RESULT + PERMISSIONS_RESULT ))

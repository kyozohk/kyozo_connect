 merett # Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Future Migration Plan: MongoDB to Firestore

This document outlines the strategy for migrating the application's data from MongoDB to a more scalable, multi-tenant architecture using Firestore.

### 1. Linking Authentication to Database IDs

- **Current State**: The logged-in Firebase Auth user (`uid`) is distinct from the MongoDB `users` documents, which are linked via a `firebaseUid` field. For example, the current community owner in Firebase Auth has a `uid` of `x3cikshkoUb0i8LIfqfKf2n3G272`, while the corresponding owner in the `users` collection is identified by `firebaseUid: "0bPyQlkTMpRmmQpvVJimBYgb6SC2"`.
- **Objective**: To simplify this, the primary ID for users in Firestore should become the Firebase Auth `uid`.

### 2. Assessment of Current MongoDB Structure

- **Strengths**: Clear relational links using `ObjectId` and efficient member lookups for small communities via the embedded `usersList`.
- **Weaknesses for Multi-Tenancy**:
    - **Scalability**: The `usersList` embedded in each community document is limited by MongoDB's 16MB document size, which will not scale for large communities.
    - **Query Inefficiency**: The app currently fetches all communities and filters them on the server, which is inefficient.
    - **Complex Role Management**: The `communityHandles` array complicates role determination.

### 3. Proposed Firestore Schema for Scalability

To support a multi-tenant model where any user can create and manage communities, we will use a dedicated `memberships` collection.

- **`users` collection**:
  - The document ID will be the user's Firebase Auth `uid`.
  - e.g., `users/{firebaseAuthUid}`

- **`communities` collection**:
  - A top-level collection to hold community data.
  - The `usersList` and `communityHandles` arrays will be removed.
  - e.g., `communities/{communityId}`

- **`memberships` collection**:
  - This "join table" connects users to communities and defines their role.
  - **Structure**:
    - `communityId`: (string) Reference to a document in the `communities` collection.
    - `userId`: (string) Reference to a document in the `users` collection (the Firebase Auth `uid`).
    - `role`: (string) Can be "owner", "admin", or "member".
    - `joinedAt`: (timestamp)

- **`messages` collection**:
  - Messages will be stored in a subcollection under each community.
  - e.g., `communities/{communityId}/messages/{messageId}`

This structure is highly scalable and simplifies queries for fetching members, communities, and roles efficiently.


now let us land the user in a dashboard which has a side bar with following route icon nav item

1. Analytics - Defatul route, show the cards for summary of Total Communities, Total Mmbers, Total Messages
2. Migrate - where we will move our current landing route /
3. Firebase - where will move our current /fire route
4. Subscription - where we will keep credit card info
5. Settings - for timezone, etc
6. Team - where will invite other team members

at the bottom of show the user icon, below it user name or email and below that logout icon and text

Side bar could be made thinner or full width
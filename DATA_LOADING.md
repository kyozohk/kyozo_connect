# Data Loading Patterns in Kyozo Connect

This document explains how data is loaded throughout the application, focusing on the server-side data fetching patterns and client-side rendering strategies.

## Server Components Data Loading

The application uses Next.js 15's server components to fetch data directly on the server before rendering. This approach provides several benefits:

- Improved performance by eliminating client-side data fetching waterfalls
- Better SEO as content is rendered on the server
- Reduced client-side JavaScript bundle size

### Dynamic Route Parameters

In Next.js 15+, route parameters are delivered asynchronously and must be awaited before use:

```typescript
export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  // Await params if it's a promise
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;
  
  // Now use the slug to fetch data
  // ...
}
```

### Data Sources

The application supports dual data sources:

1. **MongoDB** (Legacy)
   - Used for the original data structure
   - Accessed via `getDb()` from `@/lib/mongodb`

2. **Firebase Firestore** (New)
   - Used for the new multi-tenant architecture
   - Accessed via `getAdminDb()` from `@/lib/firebase-admin`

### Server Actions

Server-side data fetching is implemented using Next.js server actions in the following files:

- `/src/app/actions.ts` - MongoDB data fetching
- `/src/app/fire/actions.ts` - Firestore data fetching

These actions are marked with `'use server'` directive and can be called from both server and client components.

## Key Data Loading Patterns

### Community Data Loading

Communities are loaded using different patterns depending on the data source:

#### From Firestore:

```typescript
// In src/app/fire/actions.ts
export async function getFirestoreCommunities(): Promise<Community[]> {
  const adminDb = await getAdminDb();
  const communitiesSnapshot = await adminDb.collection('communities').orderBy('name').get();
  
  // Process and return communities...
}
```

#### From MongoDB:

```typescript
// In src/app/actions.ts
export async function getCommunities(): Promise<Community[]> {
  const db = await getDb();
  const communities = await db.collection('communities').find({}).sort({ name: 1 }).toArray();
  
  // Process and return communities...
}
```

### Member Data Loading

Members are loaded differently based on the data source:

#### From Firestore:

Members are stored in a separate `memberships` collection and joined with user data from Firebase Auth:

```typescript
export async function getFirestoreMembers(communityId: string): Promise<Member[]> {
  const adminDb = await getAdminDb();
  const adminAuth = await getAdminAuth();
  
  // Get memberships for the community
  const membersSnapshot = await adminDb.collection('memberships')
    .where('communityId', '==', communityId).get();
  
  // For each membership, fetch the user data from Firebase Auth
  const memberPromises = membersSnapshot.docs.map(async (doc) => {
    const membership = doc.data();
    const userRecord = await adminAuth.getUser(membership.userId);
    
    // Combine membership and user data
    // ...
  });
  
  return Promise.all(memberPromises);
}
```

#### From MongoDB:

Members are embedded in the community document as `usersList` and joined with user data:

```typescript
export async function getMembers(communityId: string): Promise<Member[]> {
  const db = await getDb();
  const community = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });
  
  // Extract user IDs from the embedded usersList
  const userIds = community.usersList.map(item => item.user);
  
  // Fetch user documents
  const users = await db.collection('users').find({ _id: { $in: userIds } }).toArray();
  
  // Map to Member type
  // ...
}
```

### Message Data Loading

Messages are loaded with different patterns:

#### From Firestore:

Messages are stored as a subcollection under each community:

```typescript
export async function getFirestoreMessagesForMember(communityId: string, memberId: string): Promise<Message[]> {
  const adminDb = await getAdminDb();
  
  // Get messages from the subcollection
  const messagesSnapshot = await adminDb.collection('communities')
    .doc(communityId)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();
  
  // Process messages and fetch sender information
  // ...
}
```

#### From MongoDB:

Messages are stored in a separate collection with references to communities and channels:

```typescript
export async function getMessages(communityId: string, memberId: string): Promise<Message[]> {
  const db = await getDb();
  
  // Find channels for this community
  const channels = await db.collection('channels')
    .find({ community: new ObjectId(communityId) })
    .toArray();
  
  const channelIds = channels.map(channel => channel._id);
  
  // Find messages for these channels
  const messages = await db.collection('messages')
    .find({ 
      channel: { $in: channelIds },
      ...(memberId ? { sender: new ObjectId(memberId) } : {})
    })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  
  // Process and return messages
  // ...
}
```

## Client-Side Data Rendering

The application uses a hybrid approach:

1. **Initial Data Loading**: Server components fetch initial data
2. **Client Interactions**: Client components handle user interactions and updates

### Client Components

Client components are marked with `'use client'` directive and typically receive initial data from server components:

```typescript
'use client';

export function MemberListClient({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers);
  // Client-side logic...
}
```

### Dynamic Route Updates

When navigating between routes, the application uses URL parameters to maintain state:

```typescript
const handleSelectMember = useCallback((member: Member | null) => {
  setSelectedMember(member);
  const newSearchParams = new URLSearchParams();
  if (selectedCommunityId) {
    newSearchParams.set('communityId', selectedCommunityId);
  }
  if (member?.id) {
    newSearchParams.set('memberId', member.id);
  }
  router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
}, [selectedCommunityId, pathname, router]);
```

## Firebase Admin Initialization

Firebase Admin SDK is initialized once per environment and cached for reuse:

```typescript
// In src/lib/firebase-admin.ts
const adminApps = new Map<string, admin.app.App>();

function getAdminApp() {
  const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
  return initializeAdminApp(env);
}

export async function getAdminDb() {
  return getAdminApp().firestore();
}

export async function getAdminAuth() {
  return getAdminApp().auth();
}
```

## Migration Strategy

The application supports both MongoDB and Firestore simultaneously, allowing for a gradual migration:

1. Data can be exported from MongoDB using the migration tools
2. The exported data is transformed to match the new Firestore schema
3. The transformed data is imported into Firestore
4. The application can switch between data sources based on configuration

This dual-database approach enables testing the new architecture while maintaining the existing functionality.

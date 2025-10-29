
'use client';

import { 
    doc, 
    deleteDoc, 
    collection, 
    query, 
    where, 
    getDocs, 
    writeBatch,
    Firestore 
} from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError } from '@/firebase/errors';
import type { SecurityRuleContext } from '@/firebase/errors';

async function deleteCollection(collectionRef: any, batchSize: number) {
    const q = query(collectionRef.limit(batchSize));
    
    return new Promise((resolve, reject) => {
        deleteQueryBatch(q, resolve).catch(reject);
    });

    async function deleteQueryBatch(q: any, resolve: (value: unknown) => void) {
        const snapshot = await getDocs(q);

        if (snapshot.size === 0) {
            return resolve(0);
        }

        const batch = writeBatch(collectionRef.firestore);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        process.nextTick(() => {
            deleteQueryBatch(q, resolve);
        });
    }
}

export function deleteCommunity(firestore: Firestore, communityId: string) {
    const communityRef = doc(firestore, 'communities', communityId);

    // This is an optimistic client-side delete. 
    // We don't await here. We catch permission errors and let the UI update.
    deleteDoc(communityRef)
      .catch(async (serverError) => {
        // Create the rich, contextual error asynchronously.
        const permissionError = new FirestorePermissionError({
          path: communityRef.path,
          operation: 'delete',
          // No resource data on delete
        } satisfies SecurityRuleContext);

        // Emit the error with the global error emitter
        errorEmitter.emit('permission-error', permissionError);
      });
      
    // Note: Deleting subcollections and related memberships from the client is
    // not secure or reliable. This should be handled by a Cloud Function triggered 
    // by the deletion of the community document. For this prototype, we only
    // handle the primary document deletion and its associated error.
}

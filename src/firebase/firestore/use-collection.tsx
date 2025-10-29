'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, Query, DocumentData, QuerySnapshot, FirestoreError } from 'firebase/firestore';
import { FirestorePermissionError, errorEmitter, type SecurityRuleContext } from '@/firebase/errors';

export function useCollection<T>(query: Query<DocumentData> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!query) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(docs);
        setLoading(false);
      },
      (err: FirestoreError) => {
        if (err.code === 'permission-denied') {
           const customError = new FirestorePermissionError({
            // @ts-ignore-next-line
            path: query.path, // This is not standard but often works
            operation: 'list',
          }, err);
          errorEmitter.emit('permission-error', customError);
        }
        console.error("Error fetching collection:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]); // The hook should re-run if the query object itself changes.

  return { data, loading, error };
}

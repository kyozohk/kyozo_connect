'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, DocumentReference, DocumentData, DocumentSnapshot, FirestoreError } from 'firebase/firestore';
import { FirestorePermissionError, errorEmitter, type SecurityRuleContext } from '@/firebase/errors';

export function useDoc<T>(ref: DocumentReference<DocumentData> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err: FirestoreError) => {
        if (err.code === 'permission-denied') {
          const customError = new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
          }, err);
          errorEmitter.emit('permission-error', customError);
        }
        console.error("Error fetching document:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]); // Re-run if the document reference changes.

  return { data, loading, error };
}

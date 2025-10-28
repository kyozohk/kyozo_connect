'use client';
import React, { useState, useEffect } from 'react';
import { initializeFirebase, FirebaseProvider } from '@/firebase';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebaseInstances, setFirebaseInstances] = useState<{
    app: any;
    auth: any;
    firestore: any;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const instances = initializeFirebase();
      setFirebaseInstances(instances);
    }
  }, []);

  if (!firebaseInstances) {
    return null; // or a loading spinner
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseInstances.app}
      auth={firebaseInstances.auth}
      firestore={firebaseInstances.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}

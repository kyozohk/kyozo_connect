'use client';
import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useAuth, useFirestore, useDoc } from '@/firebase';
import { AppUser } from '@/types';

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // Force refresh the token to ensure it's fresh
        const idToken = await firebaseUser.getIdToken(true); 
        try {
          // Make the API call to set the session cookie
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          // Set the user state *after* the session is successfully created
          setUser(firebaseUser);
        } catch (error) {
          console.error("Failed to create session cookie:", error);
          setUser(null); // Log out user if session creation fails
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  const userDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, loading: profileLoading } = useDoc<any>(userDocRef);

  const memoizedUser = useMemo(() => {
    if (!user) return null;
    return {
      ...user,
      ...userProfile,
    } as AppUser;
  }, [user, userProfile]);

  return { user: memoizedUser, loading: loading || profileLoading, auth };
}

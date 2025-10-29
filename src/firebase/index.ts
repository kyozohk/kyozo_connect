
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

import { FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore } from './provider';
import { FirebaseClientProvider } from './client-provider';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useUser } from './auth/use-user';
import { FirestorePermissionError, errorEmitter, FirebaseErrorListener } from './errors';


const firebaseConfig = {
  apiKey: "AIzaSyDdxqpBRVLlBQ_qVAJ7vqZopy-ynPHEUBo",
  authDomain: "kyozo-7f801.firebaseapp.com",
  projectId: "kyozo-7f801",
  storageBucket: "kyozo-7f801.appspot.com",
  messagingSenderId: "782676535922",
  appId: "1:782676535922:web:ca7c53b90f4224658830eb",
  measurementId: "G-8FE7VM59C0"
};

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      firestore = getFirestore(app);
    } else {
      app = getApp();
      auth = getAuth(app);
      firestore = getFirestore(app);
    }
  }
  return { app, auth, firestore };
}


export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useCollection,
  useDoc,
  useUser,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
  FirestorePermissionError,
  errorEmitter,
  FirebaseErrorListener,
};

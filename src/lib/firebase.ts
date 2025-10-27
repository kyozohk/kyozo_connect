import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDdxqpBRVLlBQ_qVAJ7vqZopy-ynPHEUBo",
  authDomain: "kyozo-7f801.firebaseapp.com",
  projectId: "kyozo-7f801",
  storageBucket: "kyozo-7f801.appspot.com",
  messagingSenderId: "782676535922",
  appId: "1:782676535922:web:ca7c53b90f4224658830eb",
  measurementId: "G-8FE7VM59C0"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

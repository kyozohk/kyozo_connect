import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDGB-sGpL90AgDPrcX8YCIVK4QmMDJgDlc",
  authDomain: "kyozo-prod.firebaseapp.com",
  projectId: "kyozo-prod",
  storageBucket: "kyozo-prod.appspot.com",
  messagingSenderId: "480316724826",
  appId: "1:480316724826:web:db8edb5d275ef023f8ea63",
  measurementId: "G-V1EPVV2594"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };

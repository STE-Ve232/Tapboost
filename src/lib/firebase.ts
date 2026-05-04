
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if we have at least an API key before initializing to avoid crashing during build
const isConfigValid = !!firebaseConfig.apiKey;

const app = getApps().length > 0 
  ? getApp() 
  : (isConfigValid ? initializeApp(firebaseConfig) : null);

// Initialize services only if app is valid
const db = app ? getFirestore(app) : null as any;
const auth = app ? getAuth(app) : null as any;

export { app, db, auth };

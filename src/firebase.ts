import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, connectAuthEmulator, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDiPg91GBfcbVqkvty-wU9WwgEpaK5rsqY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "instakeysupply.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "instakeysuply",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "instakeysuply.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "560696702143",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:560696702143:web:f345e7b0ba4453eda3020a",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-1CDJTHTVXB"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export { app };

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Configure auth for better mobile support
if (typeof window !== 'undefined') {
  // Set persistence to LOCAL for better mobile experience
  setPersistence(auth, browserLocalPersistence);
  
  // Log auth domain for debugging
  console.log('Firebase Auth Domain:', firebaseConfig.authDomain);
  console.log('Current Domain:', window.location.hostname);
} 
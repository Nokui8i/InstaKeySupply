import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Service account configuration from environment variables
const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || "instakeysuply",
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || "",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
};

// Debug environment variables
console.log('Firebase Admin SDK Environment Check:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT SET');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET');

// Initialize Firebase Admin SDK
let adminDb: any;
let adminAuth: any;

try {
  if (!getApps().length) {
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: 'instakeysuply',
      storageBucket: 'instakeysuply.firebasestorage.app'
    });
    console.log('Firebase Admin SDK initialized successfully');
    
    // Initialize services after app initialization
    adminDb = getFirestore(app);
    adminAuth = getAuth(app);
  } else {
    // Use existing app
    adminDb = getFirestore();
    adminAuth = getAuth();
  }
} catch (error) {
  console.error('Firebase Admin SDK initialization error:', error);
  // Fallback initialization
  try {
    adminDb = getFirestore();
    adminAuth = getAuth();
  } catch (fallbackError) {
    console.error('Firebase Admin SDK fallback initialization failed:', fallbackError);
  }
}

export { adminDb, adminAuth };

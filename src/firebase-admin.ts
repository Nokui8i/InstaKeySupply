// Use Firebase client SDK for server-side operations
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { ServiceAccount } from 'firebase-admin';

let adminDb: any = null;
let adminAuth: any = null;
let isInitialized = false;

function initializeFirebaseAdmin() {
  if (isInitialized) {
    return { adminDb, adminAuth };
  }

  try {
    // Get credentials from environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID || 'instakeysuply';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    
    // Process private key - handle \n characters
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    console.log('Using Firebase credentials from environment:');
    console.log('Project ID:', projectId);
    console.log('Client Email:', clientEmail);
    console.log('Private Key Length:', privateKey.length);

    // Service account configuration from environment
    const serviceAccount: ServiceAccount = {
      projectId: projectId,
      privateKey: privateKey,
      clientEmail: clientEmail,
    };

    if (!getApps().length) {
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId,
        storageBucket: 'instakeysuply.firebasestorage.app'
      });
      console.log('Firebase Admin SDK initialized successfully');
      
      adminDb = getFirestore(app);
      adminAuth = getAuth(app);
    } else {
      adminDb = getFirestore();
      adminAuth = getAuth();
    }
    
    isInitialized = true;
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
  }
  
  return { adminDb, adminAuth };
}

// Initialize immediately
const { adminDb: db, adminAuth: auth } = initializeFirebaseAdmin();

// Export the initialized instances
export { db as adminDb, auth as adminAuth };

// For backward compatibility
export async function getAdminDb() {
  return adminDb;
}

export async function getAdminAuth() {
  return adminAuth;
}

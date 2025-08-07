// Dynamic import to prevent build-time initialization
let adminDb: any = null;
let adminAuth: any = null;
let isInitialized = false;

async function initializeFirebaseAdmin() {
  if (isInitialized) {
    return { adminDb, adminAuth };
  }

  try {
    // Dynamic imports to prevent build-time execution
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const { getAuth } = await import('firebase-admin/auth');

    // Service account configuration from environment variables
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || "instakeysuply",
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || "",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    };

    if (!getApps().length) {
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: 'instakeysuply',
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

// Export async functions that ensure initialization
export async function getAdminDb() {
  if (!adminDb) {
    await initializeFirebaseAdmin();
  }
  return adminDb;
}

export async function getAdminAuth() {
  if (!adminAuth) {
    await initializeFirebaseAdmin();
  }
  return adminAuth;
}

// For backward compatibility (will be null until initialized)
export { adminDb, adminAuth };

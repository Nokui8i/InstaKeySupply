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

    // Debug environment variables
    console.log('Firebase Admin SDK Environment Check:');
    console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET');
    console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT SET');
    console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET');

    // Process private key - handle both \n and actual newlines
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    // Service account configuration from environment variables
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || "instakeysuply",
      privateKey: privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    };

    console.log('Service Account Config:', {
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
      privateKeyLength: serviceAccount.privateKey.length,
      privateKeyStarts: serviceAccount.privateKey.substring(0, 50),
      privateKeyEnds: serviceAccount.privateKey.substring(serviceAccount.privateKey.length - 50)
    });

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

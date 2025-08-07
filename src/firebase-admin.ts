import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Service account configuration from environment variables
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID || 'instakeysuply',
  private_key_id: 'your-private-key-id',
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  client_email: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@instakeysuply.iam.gserviceaccount.com',
  client_id: 'your-client-id',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40instakeysuply.iam.gserviceaccount.com`
};

// Initialize Firebase Admin SDK
if (!getApps().length) {
  const app = initializeApp({
    credential: cert(serviceAccount as any),
    projectId: 'instakeysuply',
    storageBucket: 'instakeysuply.firebasestorage.app'
  });
  console.log('Firebase Admin SDK initialized successfully');
}

const adminDb = getFirestore();

// Export Firestore instance
export { adminDb };

// Helper functions for Firestore operations
export async function addOrder(orderData: any) {
  try {
    const orderRef = adminDb.collection('orders').doc();
    await orderRef.set({
      ...orderData,
      id: orderRef.id,
      createdAt: new Date()
    });
    console.log('Order added successfully:', orderRef.id);
    return orderRef.id;
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
}

export async function getOrderBySessionId(sessionId: string) {
  try {
    const querySnapshot = await adminDb.collection('orders')
      .where('stripeSessionId', '==', sessionId)
      .get();
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
}

// For backward compatibility
export async function getAdminDb() {
  return adminDb;
}

export async function getAdminAuth() {
  return null; // Not needed for basic operations
}

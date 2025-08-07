import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Service account credentials from environment variables
const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || "instakeysuply",
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || "",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@instakeysuply.iam.gserviceaccount.com"
};

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: 'instakeysuply',
      storageBucket: 'instakeysuply.firebasestorage.app'
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
  }
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
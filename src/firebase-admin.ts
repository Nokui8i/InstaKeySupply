import * as admin from 'firebase-admin';
// Import service account credentials
const serviceAccount = require('../firebase-admin-setup/serviceAccountKey.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: 'instakeysuply',
      storageBucket: 'instakeysuply.firebasestorage.app'
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
  }
}

const adminDb = admin.firestore();

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
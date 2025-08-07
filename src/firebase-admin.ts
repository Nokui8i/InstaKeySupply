// Use Firebase client SDK for server-side operations
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDiPg91GBfcbVqkvty-wU9WwgEpaK5rsqY",
  authDomain: "instakeysuply.firebaseapp.com",
  projectId: "instakeysuply",
  storageBucket: "instakeysuply.firebasestorage.app",
  messagingSenderId: "560696702143",
  appId: "1:560696702143:web:f345e7b0ba4453eda3020a",
  measurementId: "G-1CDJTHTVXB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('Firebase client SDK initialized successfully');

// Export Firestore instance
export const adminDb = db;

// Helper functions for Firestore operations
export async function addOrder(orderData: any) {
  try {
    const ordersRef = collection(db, 'orders');
    const orderDoc = doc(ordersRef);
    await setDoc(orderDoc, {
      ...orderData,
      id: orderDoc.id,
      createdAt: new Date()
    });
    console.log('Order added successfully:', orderDoc.id);
    return orderDoc.id;
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
}

export async function getOrderBySessionId(sessionId: string) {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('stripeSessionId', '==', sessionId));
    const querySnapshot = await getDocs(q);
    
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
  return db;
}

export async function getAdminAuth() {
  return null; // Not needed for client SDK
}

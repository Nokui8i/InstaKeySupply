import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Import service account credentials
const serviceAccount = {
  type: "service_account",
  project_id: "instakeysuply",
  private_key_id: "75482fa80da4dd388edcdea152c8bc1f011061a",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCq9/jxTUGjt7Kw\nFr4tfLEMea/Cq8YAhLOIJ6hNZ5VpOPM0CY08D7QJZJ//6AWjbOLUKapdp/roQOdJ\ndMkWFwyycxUJBQd2eo4aoDTQ9peAmehbBtl7JFsyShMF4n7DFDUTRG6mv5l3U3J4\nFyosWxc0FE9VkwUBAmy63EF0zT+GqBKqXNYtA/jhCO1Z0o+7e/skSwgJc1tfIOQ2\nU4H+UTFDPN+WCCCuUbIaTRLCUH7APQOwnXM8SAmYmt9cOLpNtrTSwavCvBx4vUGB\nSnNcn7nJZeBJYGGuJJB2Z9eZB3ryr5UJHal2PoOtTJvES8UqaNP3SeP+1bmGQsGR\nnfKQUJkHAgMBAAECggEACfF1CXegRyjCXCpech/L3jlfhvddgx80n8kKqUHKdz2o\nK1EY5TLWmis/gO8aENie0o7/yQWheot3yBZiMYYyp1g5E3a26eWTySmjGLoWspSA\n5nZeBKLnKOQU+iUjkS3mLlIvC0SeZMm2IRTbz4uWrGE4AfaUdmwRLcbsiaH8PVUF\ntx4Tlo6SGQO05S3w0+UqWBS+PYzysnhhaD2XX+R9MJEx7U41UIrLxfusmHg8eXfe\nD4GDLHjLpXM3NJ449L3uiHzVJGQbCrdlfVzNuTPemnlTFVZu4U46OtzJEVwaaP0v\nxOOx+CtHTWRK7+KzUolwlO0lTtFK1uBZ5VDtjNV9DQKBgQDSb+wi4v8OJ1uLGi2U\nHbgs+gqVMUjRrT99oqDGBljp2TnOGQyfYHDPUOWjc4XpXbeZRdlF7boFeAlI/U5P\nZ6FisstnLYsWU1gjhxnSlaOYJSeKHKRGwmzVwbhgHpU69EnrMoONCn1H2XoIJkep\nrbwkSCsyXZtQBPKuU8z5QbM9OwKBgQDP/GTDxOu4Nh0nFXEys+VwYsyIlhAgFUeZ\nyEFI2UA9q+AKxYuZkU4KqgICl1/lOwFMxathh2DoIu3C2GOC6aaMBtFRfz7UuXb4\nHMKjqjthZE6ezY+GxaC5DeE1Cs5qgMqyMfuLJtw8a6SdE1gmjaZUyPaUne4rTIIY\nTRu0PmRGpQKBgGOeymnljhr0NNkQJn2U6CiaokHol/FzE7h1MaktPhBOXpgbsacN\nb7olMOEFAmLsk8sCjw4UsVh/b93W1KiwhW0E+Ve57rs97166SVYwssaG6EXwszAw\nQHedApy2Pa0wEoI+Ypp1WcOWx7dt78T60zNV2uU3/RuPjBdM4p8pJCIbAoGBAKVY\njK8KLS9cbd61cDGTzNKE6P+o9Rbcc/iwuB33ANhGfK1zkOC8IKPftgtjVkxBlW34\nM6AsZQEHS6e8KZhYshveC6hTlZq9+vOSwbYlTmHFwa8D0pedI4Iao7Bsb99BlmMF\n02kzsqCiHtL1Hv4/XD1JKqbJyx9HCqHRIzYu5781AoGAH+CxvyBjTpZtQh9Te+8v\nWxX2/hSeOF4JHyEGrI1otzceLtE04uGXIy709qMiG58jYaa2nmoDkeaYNoGxFgKt\nJlTaPpZMENHMjqnbly+mqACxoieP5Zq/Q+Hmen+n9Cpm9JDDlC+Nehhx++9THtdT\nGUuti7ZNCklFnhweLFxb/1U=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@instakeysuply.iam.gserviceaccount.com",
  client_id: "107708912281498643487",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40instakeysuply.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
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
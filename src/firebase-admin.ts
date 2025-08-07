import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = require('../firebase-admin-setup/serviceAccountKey.json');

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://instakeysuply.firebaseio.com`
  });
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();

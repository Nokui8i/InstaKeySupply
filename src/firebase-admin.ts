import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as path from 'path';

// Get the absolute path to the service account key
const serviceAccountPath = path.join(process.cwd(), 'firebase-admin-setup', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: 'instakeysuply'
  });
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();

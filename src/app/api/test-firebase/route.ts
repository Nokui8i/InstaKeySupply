import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '../../../firebase-admin';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== FIREBASE ADMIN SDK DEBUG ===');
    console.log('Environment variables:');
    console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET');
    console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET');
    console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 'NOT SET');
    
    // Test service account credentials first
    console.log('Testing service account credentials...');
    
    // Get Firebase Admin SDK instance
    const adminDb = await getAdminDb();
    if (!adminDb) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    
    console.log('Admin SDK initialized, testing Firestore connection...');
    
    // Try a simple operation first
    console.log('Attempting to list collections...');
    const collections = await adminDb.listCollections();
    console.log('Collections listed successfully:', collections.length, 'collections found');
    
    // Try to access Firestore
    const testDoc = await adminDb.collection('test').doc('connection').get();
    
    console.log('Firebase Admin SDK connection successful!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Firebase Admin SDK is working correctly',
      timestamp: new Date().toISOString(),
      docExists: testDoc.exists,
      collectionsCount: collections.length,
      envCheck: {
        projectId: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET',
        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 'NOT SET'
      }
    });
    
  } catch (error) {
    console.error('=== FIREBASE ADMIN SDK ERROR ===');
    console.error('Firebase Admin SDK test failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString(),
      envCheck: {
        projectId: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET',
        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 'NOT SET'
      }
    }, { status: 500 });
  }
}

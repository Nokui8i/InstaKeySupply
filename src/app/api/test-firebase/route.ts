import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '../../../firebase-admin';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firebase Admin SDK connection...');
    
    // Get Firebase Admin SDK instance
    const adminDb = await getAdminDb();
    if (!adminDb) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    
    // Try to access Firestore
    const testDoc = await adminDb.collection('test').doc('connection').get();
    
    console.log('Firebase Admin SDK connection successful!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Firebase Admin SDK is working correctly',
      timestamp: new Date().toISOString(),
      docExists: testDoc.exists
    });
    
  } catch (error) {
    console.error('Firebase Admin SDK test failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

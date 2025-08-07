import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firebase Admin SDK connection...');
    
    // Try to access Firestore
    const testDoc = await adminDb.collection('test').doc('connection').get();
    
    console.log('Firebase Admin SDK connection successful!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Firebase Admin SDK is working correctly',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Firebase Admin SDK test failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

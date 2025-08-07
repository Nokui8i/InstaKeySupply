import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../firebase-admin';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== FIREBASE CLIENT SDK TEST ===');
    console.log('Testing Firebase client SDK connection...');
    
    // Test basic Firestore connection
    console.log('Firebase client SDK initialized, testing connection...');
    
    // Try a simple operation
    console.log('Attempting to list collections...');
    const collections = await adminDb.listCollections();
    console.log('Collections listed successfully:', collections.length, 'collections found');
    
    // Try to access a test document
    const testDoc = await adminDb.collection('test').doc('connection').get();
    
    console.log('Firebase client SDK connection successful!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Firebase client SDK is working correctly',
      timestamp: new Date().toISOString(),
      docExists: testDoc.exists,
      collectionsCount: collections.length
    });
    
  } catch (error) {
    console.error('=== FIREBASE CLIENT SDK ERROR ===');
    console.error('Firebase client SDK test failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

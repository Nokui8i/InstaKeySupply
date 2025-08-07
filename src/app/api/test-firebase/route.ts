import { adminDb } from '../../../firebase-admin';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Starting Firebase Admin SDK test...');
    
    // Create a test document in orders collection
    const testOrderRef = adminDb.collection('orders').doc('test-' + Date.now());
    await testOrderRef.set({
      test: true,
      createdAt: new Date(),
      message: 'Test order document'
    });
    console.log('Test document created successfully');
    
    // Read the test document back
    const testDoc = await testOrderRef.get();
    console.log('Test document read successfully');
    
    // Delete the test document
    await testOrderRef.delete();
    console.log('Test document deleted successfully');
    
    return Response.json({
      success: true,
      message: 'Firebase Admin SDK connection successful - Write/Read/Delete test passed',
      timestamp: new Date().toISOString(),
      testData: testDoc.data(),
      hasAdminDb: true,
      isFirestoreConnected: true
    });
  } catch (error: any) {
    console.error('Firebase Admin SDK test failed:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString(),
      hasAdminDb: !!adminDb,
      isFirestoreConnected: false
    }, { status: 500 });
  }
}
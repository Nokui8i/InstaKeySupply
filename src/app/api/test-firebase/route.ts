import { adminDb } from '../../../firebase-admin';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Starting Firebase Admin SDK test...');
    console.log('adminDb instance:', !!adminDb);
    
    // Test basic Firestore connection using 'orders' collection
    console.log('Attempting to access orders collection...');
    const ordersRef = adminDb.collection('orders');
    console.log('Orders collection reference created');
    
    const ordersSnapshot = await ordersRef.get();
    console.log('Successfully retrieved orders snapshot');
    
    return Response.json({
      success: true,
      message: 'Firebase Admin SDK connection successful',
      timestamp: new Date().toISOString(),
      ordersCount: ordersSnapshot.size,
      hasAdminDb: !!adminDb,
      isFirestoreConnected: true
    });
  } catch (error: any) {
    console.error('Firebase Admin SDK test failed:', error);
    console.error('Error stack:', error.stack);
    console.error('adminDb instance exists:', !!adminDb);
    
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
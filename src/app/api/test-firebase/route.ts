import { adminDb } from '../../../firebase-admin';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Testing Firebase Admin SDK connection...');
    
    // Test basic Firestore connection using 'orders' collection
    const ordersSnapshot = await adminDb.collection('orders').get();
    console.log('Firebase Admin SDK test successful');
    
    return Response.json({
      success: true,
      message: 'Firebase Admin SDK connection successful',
      timestamp: new Date().toISOString(),
      ordersCount: ordersSnapshot.size
    });
  } catch (error: any) {
    console.error('Firebase Admin SDK test failed:', error);
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

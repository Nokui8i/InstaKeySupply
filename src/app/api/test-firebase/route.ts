import { adminDb } from '../../../firebase-admin';
import { doc, getDoc } from 'firebase/firestore';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Testing Firebase Client SDK connection...');
    
    // Test basic Firestore connection
    const testDocRef = doc(adminDb, 'test', 'connection');
    const testDocSnap = await getDoc(testDocRef);
    console.log('Firebase Client SDK test successful');
    
    return Response.json({
      success: true,
      message: 'Firebase Client SDK connection successful',
      timestamp: new Date().toISOString(),
      docExists: testDocSnap.exists()
    });
  } catch (error: any) {
    console.error('Firebase Client SDK test failed:', error);
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

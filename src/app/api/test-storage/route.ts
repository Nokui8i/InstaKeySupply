import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Firebase Storage upload...');
    
    // Create a simple test file
    const testContent = 'This is a test file for email campaigns';
    const testBuffer = Buffer.from(testContent, 'utf8');
    
    // Try to upload to email-campaigns folder
    const testRef = ref(storage, `email-campaigns/test-${Date.now()}.txt`);
    
    console.log('📤 Attempting upload...');
    await uploadBytes(testRef, testBuffer);
    console.log('✅ Upload successful!');
    
    const downloadUrl = await getDownloadURL(testRef);
    console.log('🔗 Download URL:', downloadUrl);
    
    return NextResponse.json({
      success: true,
      message: 'Storage upload test successful',
      downloadUrl: downloadUrl
    });
    
  } catch (error: any) {
    console.error('❌ Storage test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
} 
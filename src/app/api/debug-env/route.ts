import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const envVars = {
    message: 'Detailed environment variable debug',
    OWNER_EMAIL: {
      exists: !!process.env.OWNER_EMAIL,
      value: process.env.OWNER_EMAIL || 'NOT_FOUND',
      length: process.env.OWNER_EMAIL?.length || 0
    },
    OWNER_EMAIL_PASS: {
      exists: !!process.env.OWNER_EMAIL_PASS,
      value: process.env.OWNER_EMAIL_PASS ? '***HIDDEN***' : 'NOT_FOUND',
      length: process.env.OWNER_EMAIL_PASS?.length || 0
    },
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('EMAIL') || key.includes('FIREBASE') || key.includes('STRIPE')
    ),
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd()
  };

  return NextResponse.json(envVars);
} 
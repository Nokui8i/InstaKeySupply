import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Environment variables test',
    OWNER_EMAIL: process.env.OWNER_EMAIL ? 'SET' : 'NOT SET',
    OWNER_EMAIL_PASS: process.env.OWNER_EMAIL_PASS ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT SET',
    allEnvVars: Object.keys(process.env).filter(key => key.includes('EMAIL') || key.includes('FIREBASE'))
  });
} 
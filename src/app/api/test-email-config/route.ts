import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    email: process.env.OWNER_EMAIL ? 'SET' : 'NOT_SET',
    password: process.env.OWNER_EMAIL_PASS ? 'SET' : 'NOT_SET',
    emailValue: process.env.OWNER_EMAIL || 'NOT_SET'
  });
} 
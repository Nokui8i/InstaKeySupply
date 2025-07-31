import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envExists = existsSync(envPath);
    
    let envContent = '';
    if (envExists) {
      try {
        envContent = readFileSync(envPath, 'utf8');
      } catch (readError) {
        envContent = `Error reading file: ${readError}`;
      }
    }

    return NextResponse.json({
      message: 'Environment file check',
      envFileExists: envExists,
      envFilePath: envPath,
      envFileContent: envContent,
      cwd: process.cwd(),
      hasOwnerEmail: envContent.includes('OWNER_EMAIL'),
      hasOwnerEmailPass: envContent.includes('OWNER_EMAIL_PASS')
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      cwd: process.cwd()
    });
  }
} 
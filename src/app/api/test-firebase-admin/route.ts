import { NextResponse } from 'next/server';
import { testFirebaseServiceAccount } from '@/app/actions/migration-check';

export async function GET() {
  try {
    const result = await testFirebaseServiceAccount();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing Firebase service account:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error testing Firebase service account: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

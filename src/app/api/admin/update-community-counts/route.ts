import { NextRequest, NextResponse } from 'next/server';
import { updateCommunityCounts } from '@/app/fire/migrations/update-community-counts';

export async function POST(request: NextRequest) {
  try {
    // In a production app, you would add authentication and authorization here
    // to ensure only admins can run this migration
    
    const result = await updateCommunityCounts();
    
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update community counts' },
      { status: 500 }
    );
  }
}

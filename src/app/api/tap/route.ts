export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { incrementUserPoints, getUserProfile } from '@/lib/db-utils';

export async function POST(request: NextRequest) {
  const authResult = await authenticateUser(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await getUserProfile(authResult.userId);
    const tapPower = profile?.tapPower || 0.001;
    
    // Each tap adds 1 point and use user's current tapPower
    await incrementUserPoints(authResult.userId, 1, tapPower);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tap API error:', error);
    return NextResponse.json({ message: 'Tap sync failed' }, { status: 500 });
  }
}

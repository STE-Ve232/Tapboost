
import { NextResponse, type NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { incrementUserPoints } from '@/lib/db-utils';

export async function POST(request: NextRequest) {
  const authResult = await authenticateUser(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Each tap adds 1 point and $0.001
    await incrementUserPoints(authResult.userId, 1, 0.001);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Tap sync failed' }, { status: 500 });
  }
}

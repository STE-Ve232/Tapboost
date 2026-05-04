
export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { getUserProfile } from '@/lib/db-utils';

export async function GET(request: NextRequest) {
  const authResult = await authenticateUser(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    const userData = await getUserProfile(authResult.userId);
    return NextResponse.json(userData);
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

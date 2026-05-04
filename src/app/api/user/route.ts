export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { getUserProfile } from '@/lib/db-utils';
import { rateLimiter } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const rateLimitResult = await rateLimiter.limit(ip);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { message: 'Too many requests' },
      { status: 429 }
    );
  }

  const authResult = await authenticateUser(request);
  if (!authResult.authenticated) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const userData = await getUserProfile(authResult.userId);
    if (!userData) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      username: userData.username,
      points: userData.points,
      avatarUrl: userData.avatarUrl,
      joinDate: userData.createdAt,
      tier: userData.membershipTier
    });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
export const dynamic = 'auto';

import { NextResponse, type NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { getUserProfile } from '@/lib/db-utils';
import { rateLimiter } from '@/lib/rate-limiter';
import { UserProfile } from '@/types/user';

export async function GET(request: NextRequest) {
  // Rate limiting
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const rateLimitResult = await rateLimiter.limit(ip);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': rateLimitResult.retryAfter.toString() } }
    );
  }

  // Authentication
  const authResult = await authenticateUser(request);
  if (!authResult.authenticated) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  const userId = authResult.userId;

  try {
    // Fetch user data from database
    const userData: UserProfile | null = await getUserProfile(userId);

    if (!userData) {
      return NextResponse.json(
        { message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Sanitize data before sending to client
    const responseData = {
      username: userData.username,
      points: userData.loyaltyPoints,
      avatarUrl: userData.avatarUrl || 'https://placehold.co/150x150.png',
      // Add other non-sensitive profile data as needed
      joinDate: userData.createdAt,
      tier: userData.membershipTier
    };

    // Set cache headers (adjust based on your needs)
    const cacheHeaders = {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
    };

    return NextResponse.json(responseData, { headers: cacheHeaders });

  } catch (error) {
    // Log detailed error for internal monitoring
    console.error('Error in /api/user GET handler:', error);
    // await logErrorToMonitoringSystem(error, { userId, endpoint: '/api/user' });

    // Return appropriate error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { 
        message: 'An unexpected error occurred while fetching user data.',
        errorDetails: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
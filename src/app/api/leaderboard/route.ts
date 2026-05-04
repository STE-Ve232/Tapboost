
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getLeaderboardData } from '@/lib/db-utils';

export async function GET() {
  try {
    const data = await getLeaderboardData();
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ message: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { getUserProfile, upgradeUserTapPower, recordTransaction } from '@/lib/db-utils';

const UPGRADES = [
  { level: 1, power: 0.001, cost: 0 },
  { level: 2, power: 0.005, cost: 2.0 },
  { level: 3, power: 0.010, cost: 5.0 },
  { level: 4, power: 0.025, cost: 15.0 },
  { level: 5, power: 0.050, cost: 35.0 },
  { level: 6, power: 0.100, cost: 75.0 },
];

export async function POST(request: NextRequest) {
  const authResult = await authenticateUser(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await getUserProfile(authResult.userId);
    if (!profile) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const currentLevel = profile.tapLevel || 1;
    const nextUpgrade = UPGRADES.find(u => u.level === currentLevel + 1);

    if (!nextUpgrade) {
      return NextResponse.json({ message: 'Max level reached' }, { status: 400 });
    }

    if (profile.earnings < nextUpgrade.cost) {
      return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
    }

    await upgradeUserTapPower(authResult.userId, nextUpgrade.cost, nextUpgrade.level, nextUpgrade.power);
    
    await recordTransaction({
      userId: authResult.userId,
      type: 'UPGRADE',
      amount: nextUpgrade.cost,
      status: 'COMPLETED',
      method: 'BALANCE'
    });

    return NextResponse.json({ 
      success: true, 
      message: `Upgraded to Level ${nextUpgrade.level}!`,
      newPower: nextUpgrade.power
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    return NextResponse.json({ message: 'Failed to process upgrade' }, { status: 500 });
  }
}

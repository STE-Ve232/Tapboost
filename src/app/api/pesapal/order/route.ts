export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { getUserProfile } from '@/lib/db-utils';
import { submitOrder, registerIPN } from '@/lib/pesapal-service';

const UPGRADES = [
  { level: 1, power: 0.300, cost: 0 },
  { level: 2, power: 0.500, cost: 2.0 },
  { level: 3, power: 0.600, cost: 5.0 },
  { level: 4, power: 0.700, cost: 15.0 },
  { level: 5, power: 0.900, cost: 35.0 },
  { level: 6, power: 1.100, cost: 75.0 },
];

const CONVERSION_RATES: Record<string, number> = {
  USD: 1,
  KES: 130,
  UGX: 3700,
  TZS: 2600,
  RWF: 1250,
};

export async function POST(request: NextRequest) {
  const authResult = await authenticateUser(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { currency: preferredCurrency } = await request.json();
    const profile = await getUserProfile(authResult.userId);
    if (!profile) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const nextLevel = (profile.tapLevel || 1) + 1;
    const upgrade = UPGRADES.find(u => u.level === nextLevel);

    if (!upgrade) return NextResponse.json({ message: 'Max level reached' }, { status: 400 });

    const ipnUrl = `${request.nextUrl.origin}/api/pesapal/ipn`;
    const ipnId = await registerIPN(ipnUrl);

    if (!ipnId) return NextResponse.json({ message: 'Failed to register PesaPal IPN' }, { status: 500 });

    const currencyCode = preferredCurrency || 'USD';
    const rate = CONVERSION_RATES[currencyCode] || 1;
    const localizedAmount = upgrade.cost * rate;

    const orderData = {
      id: `upgrade_${authResult.userId}_${nextLevel}_${Date.now()}`,
      currency: currencyCode,
      amount: parseFloat(localizedAmount.toFixed(2)),
      description: `TapBoost Level ${nextLevel} Upgrade`,
      callback_url: `${request.nextUrl.origin}/`,
      notification_id: ipnId,
      billing_address: {
        email_address: authResult.userId + "@tapboost.app"
      }
    };

    const result = await submitOrder(orderData);

    if (result && result.redirect_url) {
      return NextResponse.json({ redirectUrl: result.redirect_url });
    } else {
      return NextResponse.json({ message: 'Failed to initiate PesaPal payment' }, { status: 500 });
    }
  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

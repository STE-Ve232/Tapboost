export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { getUserProfile } from '@/lib/db-utils';
import { submitOrder, registerIPN } from '@/lib/pesapal-service';
import { getExchangeRates } from '@/lib/currency-service';

const UPGRADES = [
  { level: 1, power: 0.300, cost: 0 },
  { level: 2, power: 0.500, cost: 2.0 },
  { level: 3, power: 0.600, cost: 5.0 },
  { level: 4, power: 0.700, cost: 15.0 },
  { level: 5, power: 0.900, cost: 35.0 },
  { level: 6, power: 1.100, cost: 75.0 },
];

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

    // PesaPal V3 requires a registered IPN ID. 
    // We try to register the IPN for this specific domain.
    const ipnUrl = `${request.nextUrl.origin}/api/pesapal/ipn`;
    console.log(`Registering PesaPal IPN for: ${ipnUrl}`);
    const ipnId = await registerIPN(ipnUrl);

    if (!ipnId) {
      console.error('Failed to register PesaPal IPN. Ensure Consumer Key/Secret are correct and the domain is allowed.');
      return NextResponse.json({ message: 'Failed to register PesaPal IPN. Check server logs.' }, { status: 500 });
    }

    const currencyCode = preferredCurrency || 'USD';
    const rates = await getExchangeRates();
    const rate = rates[currencyCode] || 1;
    const localizedAmount = upgrade.cost * rate;

    // Merchant reference format: upgrade_<userId>_<nextLevel>_<timestamp>
    const merchantReference = `up_${authResult.userId.slice(-6)}_${nextLevel}_${Date.now()}`;

    const orderData = {
      id: merchantReference,
      currency: currencyCode,
      amount: parseFloat(localizedAmount.toFixed(2)),
      description: `TapBoost Level ${nextLevel} Upgrade`,
      callback_url: `${request.nextUrl.origin}/`,
      notification_id: ipnId,
      billing_address: {
        email_address: `${authResult.userId}@tapboost.app`,
        first_name: profile.username || 'Tapper',
        last_name: 'User'
      }
    };

    console.log('Submitting PesaPal Order:', JSON.stringify(orderData, null, 2));
    const result = await submitOrder(orderData);

    if (result && result.redirect_url) {
      return NextResponse.json({ redirectUrl: result.redirect_url });
    } else {
      console.error('PesaPal Order Submission failed. Result:', result);
      return NextResponse.json({ message: 'PesaPal rejected the order. Check credentials and currency support.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('PesaPal Order API Error:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { getTransactionStatus } from '@/lib/pesapal-service';
import { upgradeUserTapPower, recordTransaction } from '@/lib/db-utils';

const UPGRADES = [
  { level: 1, power: 0.300, cost: 0 },
  { level: 2, power: 0.500, cost: 2.0 },
  { level: 3, power: 0.600, cost: 5.0 },
  { level: 4, power: 0.700, cost: 15.0 },
  { level: 5, power: 0.900, cost: 35.0 },
  { level: 6, power: 1.100, cost: 75.0 },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderTrackingId = searchParams.get('OrderTrackingId');
  const merchantReference = searchParams.get('OrderMerchantReference');

  if (!orderTrackingId || !merchantReference) {
    return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
  }

  try {
    const statusResult = await getTransactionStatus(orderTrackingId);
    
    // PesaPal status 1 means COMPLETED/SUCCESS
    if (statusResult && statusResult.payment_status_description === 'Completed') {
      // Reference format: upgrade_<userId>_<nextLevel>_<timestamp>
      const parts = merchantReference.split('_');
      if (parts[0] === 'upgrade' && parts.length >= 3) {
        const userId = parts[1];
        const nextLevel = parseInt(parts[2]);
        const upgrade = UPGRADES.find(u => u.level === nextLevel);

        if (upgrade) {
          await upgradeUserTapPower(userId, 0, nextLevel, upgrade.power);
          await recordTransaction({
            userId,
            type: 'UPGRADE',
            amount: upgrade.cost,
            status: 'COMPLETED',
            method: 'PESAPAL',
            transactionId: orderTrackingId
          });
          console.log(`Successfully upgraded user ${userId} to level ${nextLevel} via PesaPal`);
        }
      }
    }

    // PesaPal expects a 200 OK with specific JSON to acknowledge IPN
    return NextResponse.json({ 
      orderNotificationType: 'IPN',
      orderTrackingId,
      orderMerchantReference: merchantReference,
      status: 200 
    });
  } catch (error) {
    console.error('IPN processing error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

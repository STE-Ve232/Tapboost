export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { getUserProfile, deductUserEarnings, recordTransaction } from '@/lib/db-utils';
import { sendPesaPalPayout } from '@/lib/pesapal-service';

const MIN_WITHDRAWAL = 10.0; 

export async function POST(request: NextRequest) {
  const authResult = await authenticateUser(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { amount, recipient } = await request.json();

    if (!amount || !recipient || !recipient.accountNumber || !recipient.bankCode || !recipient.firstName || !recipient.lastName) {
      return NextResponse.json({ message: 'Missing required payout details for the recipient.' }, { status: 400 });
    }
    
    if (isNaN(amount) || amount < MIN_WITHDRAWAL) {
      return NextResponse.json({ message: `Minimum withdrawal amount is $${MIN_WITHDRAWAL}.` }, { status: 400 });
    }

    const profile = await getUserProfile(authResult.userId);
    if (!profile) {
      return NextResponse.json({ message: 'User profile not found.' }, { status: 404 });
    }

    if (profile.earnings < amount) {
      return NextResponse.json({ message: 'Insufficient balance for this withdrawal.' }, { status: 400 });
    }

    const payoutResult = await sendPesaPalPayout(amount, recipient);

    if (!payoutResult.success) {
      return NextResponse.json({ message: payoutResult.message || 'Payout initiation failed with the payment provider.' }, { status: 500 });
    }
    
    await deductUserEarnings(authResult.userId, amount);
    
    await recordTransaction({
      userId: authResult.userId,
      type: 'WITHDRAWAL',
      amount: amount,
      status: 'PENDING',
      method: 'PESAPAL_BANK',
      transactionId: payoutResult.transactionId
    });

    return NextResponse.json({ 
      success: true, 
      message: `Withdrawal request for $${amount} to ${recipient.firstName} ${recipient.lastName} has been submitted successfully. It may take 1-3 business days to process.`
    });

  } catch (error) {
    console.error('PesaPal Payout Route Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred during the payout process.' }, { status: 500 });
  }
}

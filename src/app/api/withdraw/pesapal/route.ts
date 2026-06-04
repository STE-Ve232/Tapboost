export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { getUserProfile, incrementUserPoints, recordTransaction } from '@/lib/db-utils';
import { sendPesaPalPayout } from '@/lib/pesapal-service';

const MIN_WITHDRAWAL = 10.0;

// Helper to validate the recipient details based on payout type
const isRecipientValid = (recipient: any, payoutType: string) => {
  if (!recipient || !recipient.firstName || !recipient.lastName) {
    return false;
  }
  if (payoutType === 'bank') {
    return recipient.accountNumber && recipient.bankCode;
  }
  if (payoutType === 'card') {
    return recipient.cardNumber && recipient.expiryMonth && recipient.expiryYear && recipient.cvv;
  }
  return false;
};

export async function POST(request: NextRequest) {
  const authResult = await authenticateUser(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { amount, payoutType, recipient } = await request.json();

    if (!payoutType || (payoutType !== 'bank' && payoutType !== 'card')) {
        return NextResponse.json({ message: 'Invalid payout type specified.' }, { status: 400 });
    }

    if (!amount || !recipient || !isRecipientValid(recipient, payoutType)) {
      return NextResponse.json({ message: 'Missing or invalid recipient payout details.' }, { status: 400 });
    }
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < MIN_WITHDRAWAL) {
      return NextResponse.json({ message: `Minimum withdrawal amount is $${MIN_WITHDRAWAL}.` }, { status: 400 });
    }

    const profile = await getUserProfile(authResult.userId);
    if (!profile) {
      return NextResponse.json({ message: 'User profile not found.' }, { status: 404 });
    }

    if (profile.earnings < numericAmount) {
      return NextResponse.json({ message: 'Insufficient balance for this withdrawal.' }, { status: 400 });
    }

    // The sendPesaPalPayout function is assumed to handle both types.
    const payoutResult = await sendPesaPalPayout(numericAmount, recipient, payoutType);

    if (!payoutResult.success) {
      return NextResponse.json({ message: payoutResult.message || 'Payout initiation failed.' }, { status: 500 });
    }
    
    // Deduct earnings by passing a negative value
    await incrementUserPoints(authResult.userId, 0, -numericAmount);
    
    await recordTransaction({
      userId: authResult.userId,
      type: 'WITHDRAWAL',
      amount: numericAmount,
      status: 'PENDING',
      method: payoutType === 'bank' ? 'PESAPAL_BANK' : 'PESAPAL_CARD',
      transactionId: payoutResult.transactionId
    });

    return NextResponse.json({ 
      success: true, 
      message: `Withdrawal request for $${numericAmount} has been submitted successfully. It may take 1-3 business days to process.`
    });

  } catch (error) {
    console.error('PesaPal Payout Route Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

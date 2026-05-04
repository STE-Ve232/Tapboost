export const dynamic = 'force-dynamic';
import { NextResponse, type NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { checkUserBalance, recordTransaction } from '@/lib/db-utils';
import { initiatePayPalPayout } from '@/lib/paypal-service';
import { rateLimiter } from '@/lib/rate-limiter';
import { sendWithdrawalEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { email, amount, currency = 'USD', twoFactorCode } = body;

    // Input validation
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: 'Invalid PayPal email address provided.' },
        { status: 400 }
      );
    }

    if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { message: 'Invalid withdrawal amount.' },
        { status: 400 }
      );
    }

    // Validate 2FA if required
    if (process.env.REQUIRE_2FA === 'true') {
      if (!twoFactorCode) {
        return NextResponse.json(
          { message: 'Two-factor authentication code is required' },
          { status: 400 }
        );
      }
      // Verify 2FA code here
    }

    // Check minimum withdrawal amount
    const MIN_WITHDRAWAL = 5.0;
    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { message: `Minimum withdrawal amount is $${MIN_WITHDRAWAL.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Check maximum withdrawal amount
    const MAX_WITHDRAWAL = 10000.0;
    if (amount > MAX_WITHDRAWAL) {
      return NextResponse.json(
        { message: `Maximum withdrawal amount is $${MAX_WITHDRAWAL.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Check user balance
    const hasSufficientBalance = await checkUserBalance(userId, amount);
    if (!hasSufficientBalance) {
      return NextResponse.json(
        { message: 'Insufficient balance for withdrawal.' },
        { status: 400 }
      );
    }

    // Initiate PayPal payout
    const payoutResult = await initiatePayPalPayout({
      userId,
      recipientEmail: email,
      amount,
      currency,
      ipAddress: ip
    });

    if (!payoutResult.success) {
      return NextResponse.json(
        { 
          message: payoutResult.message || 'PayPal withdrawal failed',
          paypalError: payoutResult.errorDetails
        },
        { status: 400 }
      );
    }

    // Record transaction in database
    await recordTransaction({
      userId,
      type: 'WITHDRAWAL',
      method: 'PAYPAL',
      amount,
      currency,
      recipient: email,
      transactionId: payoutResult.payoutId,
      status: (payoutResult.status as any) || 'PENDING',
      fee: payoutResult.fee
    });

    // Send confirmation email
    await sendWithdrawalEmail({
      userId,
      email,
      amount,
      currency,
      method: 'PayPal',
      transactionId: payoutResult.payoutId
    });

    return NextResponse.json({
      message: `Withdrawal of ${amount.toFixed(2)} ${currency} to PayPal account ${email} has been initiated.`,
      payoutId: payoutResult.payoutId,
      status: payoutResult.status,
      estimatedCompletion: 'Typically completes within 1 business day'
    });

  } catch (error) {
    console.error('Error in /api/withdraw/paypal POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    
    return NextResponse.json(
      { 
        message: 'An unexpected error occurred during PayPal withdrawal.',
        errorDetails: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

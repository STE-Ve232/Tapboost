
export const dynamic = 'force-dynamic';
import { NextResponse, type NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { checkUserBalance, recordTransaction } from '@/lib/db-utils';
import { initiatePayPalPayout } from '@/lib/paypal-service';
import { rateLimiter } from '@/lib/rate-limiter';
import { sendWithdrawalEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  // 1. Network Security: Rate limiting
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const rateLimitResult = await rateLimiter.limit(ip);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': rateLimitResult.retryAfter.toString() } }
    );
  }

  // 2. Authentication
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

    // 3. Application Security: Strict Input validation
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

    // 4. Authorization: Check user balance (Server-side source of truth)
    const MIN_WITHDRAWAL = 5.0;
    const MAX_WITHDRAWAL = 10000.0;
    
    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { message: `Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}` },
        { status: 400 }
      );
    }

    if (amount > MAX_WITHDRAWAL) {
      return NextResponse.json(
        { message: 'Amount exceeds single transaction limit.' },
        { status: 400 }
      );
    }

    const hasSufficientBalance = await checkUserBalance(userId, amount);
    if (!hasSufficientBalance) {
      return NextResponse.json(
        { message: 'Insufficient balance for this withdrawal.' },
        { status: 400 }
      );
    }

    // 5. External API Interaction
    const payoutResult = await initiatePayPalPayout({
      userId,
      recipientEmail: email,
      amount,
      currency,
    });

    if (!payoutResult.success) {
      return NextResponse.json(
        { message: payoutResult.message || 'PayPal withdrawal failed' },
        { status: 400 }
      );
    }

    // 6. Data Security: Record transaction
    await recordTransaction({
      userId,
      type: 'WITHDRAWAL',
      method: 'PAYPAL',
      amount,
      currency,
      recipient: email,
      transactionId: payoutResult.payoutId,
      status: 'COMPLETED',
    });

    // 7. Monitoring: Notify user
    await sendWithdrawalEmail({
      userId,
      email,
      amount,
      currency,
      method: 'PayPal',
      transactionId: payoutResult.payoutId
    });

    return NextResponse.json({
      message: `Withdrawal of $${amount.toFixed(2)} to ${email} initiated successfully.`,
      payoutId: payoutResult.payoutId,
    });

  } catch (error) {
    console.error('PayPal Withdrawal Error:', error);
    return NextResponse.json(
      { message: 'An internal error occurred while processing your withdrawal.' },
      { status: 500 }
    );
  }
}

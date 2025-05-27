import { NextResponse, type NextRequest } from 'next/server';
import { validateWalletAddress } from '@/lib/blockchain-utils';
import { checkUserBalance, recordTransaction } from '@/lib/db-utils';
import { createWithdrawal } from '@/lib/exchange-service';
import { authenticateUser } from '@/lib/auth-utils';
import { rateLimiter } from '@/lib/rate-limiter';

// Supported cryptocurrencies
const SUPPORTED_ASSETS = ['BTC', 'ETH', 'USDT', 'USDC'];

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
    const { walletAddress, amount, asset, twoFactorCode } = body;

    // Input validation
    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { message: 'Invalid crypto wallet address provided.' },
        { status: 400 }
      );
    }

    if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { message: 'Invalid withdrawal amount.' },
        { status: 400 }
      );
    }

    if (!asset || !SUPPORTED_ASSETS.includes(asset)) {
      return NextResponse.json(
        { message: `Unsupported cryptocurrency. Supported assets: ${SUPPORTED_ASSETS.join(', ')}` },
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

    // Wallet address validation
    const isValidWallet = await validateWalletAddress(walletAddress, asset);
    if (!isValidWallet) {
      return NextResponse.json(
        { message: 'Invalid wallet address for the specified cryptocurrency.' },
        { status: 400 }
      );
    }

    // Check minimum withdrawal amount (varies by asset)
    const MIN_WITHDRAWAL = {
      BTC: 0.0005,
      ETH: 0.005,
      USDT: 5,
      USDC: 5
    };

    if (amount < MIN_WITHDRAWAL[asset]) {
      return NextResponse.json(
        { message: `Minimum withdrawal amount is ${MIN_WITHDRAWAL[asset]} ${asset}` },
        { status: 400 }
      );
    }

    // Check user balance
    const hasSufficientBalance = await checkUserBalance(userId, amount, asset);
    if (!hasSufficientBalance) {
      return NextResponse.json(
        { message: 'Insufficient balance for withdrawal.' },
        { status: 400 }
      );
    }

    // Check withdrawal limits
    const dailyLimit = 10000; // Example $10,000 daily limit
    const monthlyLimit = 50000; // Example $50,000 monthly limit
    // Implement checks against these limits here

    // Create withdrawal with exchange service
    const withdrawalResult = await createWithdrawal({
      userId,
      walletAddress,
      amount,
      asset,
      ipAddress: ip
    });

    if (!withdrawalResult.success) {
      return NextResponse.json(
        { message: withdrawalResult.message || 'Withdrawal failed' },
        { status: 400 }
      );
    }

    // Record transaction in database
    await recordTransaction({
      userId,
      type: 'WITHDRAWAL',
      asset,
      amount,
      address: walletAddress,
      txHash: withdrawalResult.txHash,
      status: 'PENDING',
      fee: withdrawalResult.fee
    });

    // Send confirmation email
    // await sendWithdrawalConfirmationEmail(userId, amount, asset);

    return NextResponse.json({
      message: `Withdrawal of ${amount} ${asset} to ${walletAddress} has been initiated.`,
      transactionId: withdrawalResult.txHash,
      estimatedCompletion: '10-30 minutes' // Varies by blockchain
    });

  } catch (error) {
    console.error('Error in /api/withdraw/crypto POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    
    // Log detailed error for internal monitoring
    // await logErrorToMonitoringSystem(error, { userId, endpoint: '/api/withdraw/crypto' });

    return NextResponse.json(
      { 
        message: 'An unexpected error occurred during crypto withdrawal.',
        errorDetails: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
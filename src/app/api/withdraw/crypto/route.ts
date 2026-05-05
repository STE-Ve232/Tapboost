
export const dynamic = 'force-dynamic';
import { NextResponse, type NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { checkUserBalance, recordTransaction, incrementUserPoints } from '@/lib/db-utils';
import { validateWalletAddress } from '@/lib/blockchain-utils';
import { rateLimiter } from '@/lib/rate-limiter';
import { createWalletClient, http, parseUnits, erc20Abi, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';

const TOKENS = {
  USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
  USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
};

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const rateLimit = await rateLimiter.limit(ip);
  if (!rateLimit.success) return NextResponse.json({ message: 'Too many requests' }, { status: 429 });

  const authResult = await authenticateUser(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const userId = authResult.userId;
  const privateKey = process.env.TREASURY_PRIVATE_KEY;

  if (!privateKey) {
    return NextResponse.json({ message: 'Payout system not configured' }, { status: 500 });
  }

  try {
    const { walletAddress, amount, asset = 'USDT' } = await request.json();

    // 1. Input Validation
    if (!await validateWalletAddress(walletAddress)) {
      return NextResponse.json({ message: 'Invalid MiniPay/Celo wallet address' }, { status: 400 });
    }

    if (amount < 5.0) {
      return NextResponse.json({ message: 'Minimum withdrawal is $5.00' }, { status: 400 });
    }

    // 2. Authorization (Server-side balance check)
    const hasBalance = await checkUserBalance(userId, amount);
    if (!hasBalance) {
      return NextResponse.json({ message: 'Insufficient earnings' }, { status: 400 });
    }

    const tokenAddress = TOKENS[asset as keyof typeof TOKENS] as Hex;
    if (!tokenAddress) {
      return NextResponse.json({ message: 'Unsupported asset selected' }, { status: 400 });
    }

    // 3. Execution (Server-side ONLY)
    const account = privateKeyToAccount(privateKey as Hex);
    const client = createWalletClient({
      account,
      chain: celo,
      transport: http()
    });

    const decimals = asset === 'cUSD' ? 18 : 6;
    const hash = await client.writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [walletAddress as Hex, parseUnits(amount.toString(), decimals)],
    });

    // 4. Persistence & Audit
    await incrementUserPoints(userId, 0, -amount);
    await recordTransaction({
      userId,
      type: 'WITHDRAWAL',
      asset,
      amount,
      address: walletAddress,
      txHash: hash,
      status: 'COMPLETED'
    });

    return NextResponse.json({
      message: `Successfully withdrawn $${amount.toFixed(2)} to ${walletAddress}`,
      txHash: hash
    });

  } catch (error: any) {
    console.error('Blockchain/Security Error:', error);
    return NextResponse.json({ message: 'Transaction failed. Please contact support.' }, { status: 500 });
  }
}

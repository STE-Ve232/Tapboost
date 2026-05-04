
import { NextResponse, type NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { checkUserBalance, recordTransaction, incrementUserPoints } from '@/lib/db-utils';
import { createWalletClient, http, parseUnits, erc20Abi, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';

const TOKENS = {
  USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
  USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
};

export async function POST(request: NextRequest) {
  const authResult = await authenticateUser(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const userId = authResult.userId;
  const privateKey = process.env.TREASURY_PRIVATE_KEY;

  if (!privateKey) {
    return NextResponse.json({ message: 'Payout system not configured (Missing Treasury Key)' }, { status: 500 });
  }

  try {
    const { walletAddress, amount, asset = 'USDT' } = await request.json();

    if (amount < 5.0) {
      return NextResponse.json({ message: 'Minimum withdrawal is $5.00' }, { status: 400 });
    }

    const hasBalance = await checkUserBalance(userId, amount);
    if (!hasBalance) {
      return NextResponse.json({ message: 'Insufficient earnings' }, { status: 400 });
    }

    const tokenAddress = TOKENS[asset as keyof typeof TOKENS] as Hex;
    if (!tokenAddress) {
      return NextResponse.json({ message: 'Unsupported asset' }, { status: 400 });
    }

    // Initialize Blockchain Client
    const account = privateKeyToAccount(privateKey as Hex);
    const client = createWalletClient({
      account,
      chain: celo,
      transport: http()
    });

    // Execute real transaction
    // Note: decimals vary (USDC: 6, USDT: 6, cUSD: 18)
    const decimals = asset === 'cUSD' ? 18 : 6;
    const hash = await client.writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [walletAddress as Hex, parseUnits(amount.toString(), decimals)],
    });

    // Update DB
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
      message: `Successfully withdrawn $${amount} to ${walletAddress}`,
      txHash: hash
    });

  } catch (error: any) {
    console.error('Blockchain error:', error);
    return NextResponse.json({ message: error.message || 'Withdrawal failed' }, { status: 500 });
  }
}

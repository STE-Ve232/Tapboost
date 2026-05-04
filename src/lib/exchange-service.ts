
interface WithdrawalParams {
  userId: string;
  walletAddress: string;
  amount: number;
  asset: string;
  ipAddress?: string;
}

export async function createWithdrawal(params: WithdrawalParams) {
  // Mock exchange API call
  return {
    success: true,
    txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    fee: params.amount * 0.01,
    message: 'Withdrawal processed by mock exchange',
  };
}

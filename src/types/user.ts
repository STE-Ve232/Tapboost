export interface UserProfile {
  username: string;
  loyaltyPoints: number;
  points: number;
  earnings: number;
  avatarUrl?: string;
  createdAt: string;
  membershipTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  tapLevel: number;
  tapPower: number;
}

export interface Transaction {
  userId: string;
  type: 'WITHDRAWAL' | 'DEPOSIT' | 'EARN' | 'UPGRADE';
  method?: string;
  asset?: string;
  amount: number;
  currency?: string;
  address?: string;
  recipient?: string;
  txHash?: string;
  transactionId?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  fee?: number;
}

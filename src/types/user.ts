
export interface UserProfile {
  username: string;
  loyaltyPoints: number;
  points: number;
  avatarUrl?: string;
  createdAt: string;
  membershipTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export interface Transaction {
  userId: string;
  type: 'WITHDRAWAL' | 'DEPOSIT' | 'EARN';
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

export interface UserProfile {
  username: string;
  loyaltyPoints: number;
  points: number;
  earnings: number; // Stored as USD base
  avatarUrl?: string;
  createdAt: string;
  membershipTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  tapLevel: number;
  tapPower: number;
  currency?: string; // e.g., 'USD', 'KES', 'UGX', 'TZS', 'RWF'
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

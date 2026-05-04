import { UserProfile, Transaction } from '@/types/user';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return {
    username: 'MiniPayUser',
    loyaltyPoints: 500,
    points: 500,
    avatarUrl: `https://picsum.photos/seed/${userId}/150/150`,
    createdAt: new Date().toISOString(),
    membershipTier: 'Gold',
  };
}

export async function checkUserBalance(userId: string, amount: number, asset: string): Promise<boolean> {
  // Mock balance check
  return true;
}

export async function recordTransaction(transaction: Partial<Transaction>): Promise<void> {
  console.log('Transaction recorded in mock DB:', transaction);
}

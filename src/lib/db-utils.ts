import { UserProfile, Transaction } from '@/types/user';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return {
    username: 'DemoUser',
    loyaltyPoints: 1250,
    points: 1250,
    avatarUrl: 'https://picsum.photos/seed/user1/150/150',
    createdAt: new Date().toISOString(),
    membershipTier: 'Gold',
  };
}

export async function checkUserBalance(userId: string, amount: number, asset: string): Promise<boolean> {
  return true;
}

export async function recordTransaction(transaction: Partial<Transaction>): Promise<void> {
  console.log('Transaction recorded:', transaction);
}
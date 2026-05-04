
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { UserProfile, Transaction } from '@/types/user';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const newUser: UserProfile = {
      username: `User_${userId.slice(-4)}`,
      loyaltyPoints: 0,
      points: 0,
      earnings: 0,
      avatarUrl: `https://picsum.photos/seed/${userId}/150/150`,
      createdAt: new Date().toISOString(),
      membershipTier: 'Bronze',
    };
    await setDoc(userRef, newUser);
    return newUser;
  }

  return userSnap.data() as UserProfile;
}

export async function incrementUserPoints(userId: string, points: number, earnings: number) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    points: increment(points),
    earnings: increment(earnings)
  });
}

export async function checkUserBalance(userId: string, amount: number): Promise<boolean> {
  const profile = await getUserProfile(userId);
  return (profile?.earnings || 0) >= amount;
}

export async function recordTransaction(transaction: Partial<Transaction>): Promise<void> {
  const txRef = doc(collection(db, 'transactions'));
  await setDoc(txRef, {
    ...transaction,
    timestamp: new Date().toISOString()
  });
}

export async function getLeaderboardData(): Promise<any[]> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('earnings', 'desc'), limit(10));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    name: doc.data().username,
    earnings: doc.data().earnings || 0
  }));
}

import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { UserProfile, Transaction } from '@/types/user';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db || !userId) return null;
  
  const userRef = doc(db, 'users', userId);
  try {
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
        tapLevel: 1,
        tapPower: 0.300,
        currency: 'USD'
      };
      await setDoc(userRef, newUser);
      return newUser;
    }

    const data = userSnap.data();
    return {
      ...data,
      tapLevel: data.tapLevel || 1,
      tapPower: data.tapPower || 0.300,
      earnings: data.earnings || 0,
      points: data.points || 0,
      currency: data.currency || 'USD'
    } as UserProfile;
  } catch (error) {
    console.error("Firestore getDoc error:", error);
    return null;
  }
}

export async function updateUserCurrency(userId: string, currency: string) {
  if (!db || !userId) return;
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { currency });
}

export async function incrementUserPoints(userId: string, points: number, earnings: number) {
  if (!db || !userId) return;
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    points: increment(points),
    earnings: increment(earnings)
  });
}

export async function upgradeUserTapPower(userId: string, cost: number, newLevel: number, newPower: number) {
  if (!db || !userId) return;
  const userRef = doc(db, 'users', userId);
  
  const updates: any = {
    tapLevel: newLevel,
    tapPower: newPower
  };
  
  if (cost > 0) {
    updates.earnings = increment(-cost);
  }
  
  await updateDoc(userRef, updates);
}

export async function checkUserBalance(userId: string, amount: number): Promise<boolean> {
  const profile = await getUserProfile(userId);
  return (profile?.earnings || 0) >= amount;
}

export async function recordTransaction(transaction: Partial<Transaction>): Promise<void> {
  if (!db) return;
  const txRef = doc(collection(db, 'transactions'));
  await setDoc(txRef, {
    ...transaction,
    timestamp: new Date().toISOString()
  });
}

export async function getLeaderboardData(): Promise<any[]> {
  if (!db) return [];
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('earnings', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      name: doc.data().username,
      earnings: doc.data().earnings || 0
    }));
  } catch (e) {
    console.error("Error fetching leaderboard:", e);
    return [];
  }
}

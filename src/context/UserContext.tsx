
"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Define a type for the user data object
interface UserProfile {
  // Add properties that you expect in your user data
  // For example:
  earnings: number;
  points: number;
  tapLevel: number;
  tapPower: number;
  currency: string;
  // Add any other fields from your user profile
}

interface UserContextType {
  user: User | null;
  userData: UserProfile | null;
  loading: boolean;
  error: any;
  refreshUserData: () => Promise<UserProfile | null>; // Updated return type
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  const fetchProfile = useCallback(async (uid: string): Promise<UserProfile | null> => {
    try {
      const response = await fetch('/api/user', {
        headers: { 'x-user-id': uid }
      });
      if (response.ok) {
        const data: UserProfile = await response.json();
        setUserData(data);
        return data;
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err);
    }
    return null;
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 5000);

    if (!auth) {
      setLoading(false);
      clearTimeout(timeout);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(timeout);
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [fetchProfile, loading]);

  const refreshUserData = useCallback(async (): Promise<UserProfile | null> => {
    if (user) {
      return await fetchProfile(user.uid);
    }
    return null;
  }, [user, fetchProfile]);

  return (
    <UserContext.Provider value={{ user, userData, loading, error, refreshUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;

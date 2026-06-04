
"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface UserProfile {
  earnings: number;
  points: number;
  tapLevel: number;
  tapPower: number;
  currency: string;
}

interface UserContextType {
  user: User | null;
  userData: UserProfile | null;
  loading: boolean;
  error: any;
  refreshUserData: () => Promise<UserProfile | null>;
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
      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }
      const data: UserProfile = await response.json();
      setUserData(data);
      return data;
    } catch (err) {
      console.error("Error in fetchProfile:", err);
      setError(err);
      // Do not set user data to null, to prevent balance wipe on transient network errors.
      return null;
    }
  }, []);

  useEffect(() => {
    // This effect runs once to set up the auth listener.
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // When a user is authenticated, fetch their profile.
        // If we don't have data yet, it's the initial load.
        if (!userData) {
          setLoading(true);
        }
        await fetchProfile(currentUser.uid);
        setLoading(false);
      } else {
        // No user, clear all data and stop loading.
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchProfile]); // Dependency is stable and correct.

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

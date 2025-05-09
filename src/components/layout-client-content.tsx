
"use client";

import { useState, useEffect, ReactNode } from 'react';
import { UserProvider } from '@/context/UserContext';
import { Toaster } from "@/components/ui/toaster";
import ServiceWorkerRegistrar from '@/components/service-worker-registrar';

export default function LayoutClientContent({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/user'); // Ensure this API route exists or handle its absence
        if (!response.ok) {
          if (response.status === 404) {
            console.warn("User API endpoint /api/user not found or no user data. Proceeding with null user.");
            setUserData(null);
          } else {
            throw new Error(`Failed to fetch user data: ${response.statusText}`);
          }
        } else {
          const data = await response.json();
          setUserData(data);
        }
      } catch (err: any) {
        console.error("Error fetching user data:", err.message);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <UserProvider userData={userData} loading={loading} error={error}>
      {children}
      <Toaster />
      <ServiceWorkerRegistrar />
    </UserProvider>
  );
}

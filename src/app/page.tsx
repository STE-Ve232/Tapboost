
"use client";

import TapToEarn from '@/components/tap-to-earn';
import AuthForm from '@/components/auth-form';
import { useUser } from '@/context/UserContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-[400px] w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-start w-full p-4">
      {!user ? <AuthForm /> : <TapToEarn />}
    </main>
  );
}

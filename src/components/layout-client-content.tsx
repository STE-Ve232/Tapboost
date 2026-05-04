
"use client";

import { ReactNode } from 'react';
import { UserProvider } from '@/context/UserContext';
import { Toaster } from "@/components/ui/toaster";
import ServiceWorkerRegistrar from '@/components/service-worker-registrar';
import { Web3Provider } from '@/components/web3-provider';

export default function LayoutClientContent({ children }: { children: ReactNode }) {
  return (
    <Web3Provider>
      <UserProvider>
        {children}
        <Toaster />
        <ServiceWorkerRegistrar />
      </UserProvider>
    </Web3Provider>
  );
}

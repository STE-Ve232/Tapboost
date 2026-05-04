"use client";

import { useEffect, useState, ReactNode } from "react";
import { WagmiProvider, useConnect, useConnectors } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/wagmi-config";

const queryClient = new QueryClient();

function AutoConnect() {
  const connectors = useConnectors();
  const { connect } = useConnect();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    // We only want to attempt connection once
    if (hasAttempted || connectors.length === 0) return;

    const attemptConnect = async () => {
      try {
        // MiniPay injects an 'injected' connector. 
        // We prioritize it, otherwise use the first available.
        const connector = connectors.find((c) => c.id === 'injected') || connectors[0];
        await connect({ connector });
        console.log("Successfully auto-connected to wallet");
      } catch (err) {
        console.error("Auto-connect failed:", err);
      } finally {
        setHasAttempted(true);
      }
    };

    // Small delay to ensure provider injection in some environments
    const timer = setTimeout(attemptConnect, 500);
    return () => clearTimeout(timer);
  }, [connectors, connect, hasAttempted]);

  return null;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AutoConnect />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

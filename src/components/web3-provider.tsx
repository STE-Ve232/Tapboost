
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
    // Check for window.ethereum to ensure we are in a wallet environment like MiniPay
    if (typeof window === "undefined") return;

    if (hasAttempted || connectors.length === 0) return;

    const attemptConnect = async () => {
      try {
        // Prefer the injected connector for MiniPay
        const connector = connectors.find((c) => c.id === 'injected') || connectors[0];
        await connect({ connector });
      } catch (err) {
        console.error("MiniPay auto-connect failed:", err);
      }
      setHasAttempted(true);
    };

    attemptConnect();
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

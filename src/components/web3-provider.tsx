"use client";

import { useEffect, useState, ReactNode, useRef } from "react";
import { WagmiProvider, useConnect, useConnectors, useAccount } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/wagmi-config";

const queryClient = new QueryClient();

function AutoConnect() {
  const connectors = useConnectors();
  const { connect } = useConnect();
  const { isConnected, isConnecting } = useAccount();
  const [hasAttempted, setHasAttempted] = useState(false);
  const connectionAttemptedRef = useRef(false);

  useEffect(() => {
    // Avoid running if already connected, connecting, or if we've already tried in this session
    if (isConnected || isConnecting || hasAttempted || connectionAttemptedRef.current || connectors.length === 0) {
      return;
    }

    const attemptConnect = async () => {
      // Set ref immediately to prevent race conditions during HMR
      connectionAttemptedRef.current = true;
      
      try {
        // MiniPay injects an 'injected' connector. 
        // We prioritize it for the seamless Mini App experience.
        const connector = connectors.find((c) => c.id === 'injected') || connectors[0];
        
        await connect({ connector });
        console.log("Successfully auto-connected to wallet");
      } catch (err: any) {
        // Silent catch for common "User rejected" or "Request already pending" errors
        if (err.code === 4001) {
          console.log("Wallet connection was declined by the user.");
        } else {
          console.warn("Auto-connect attempt completed with status:", err.message);
        }
      } finally {
        setHasAttempted(true);
      }
    };

    // Small delay to ensure provider injection (especially important for MiniPay/Mobile)
    const timer = setTimeout(attemptConnect, 1000);
    return () => clearTimeout(timer);
  }, [connectors, connect, isConnected, isConnecting, hasAttempted]);

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

"use client";

import React from 'react';
import { useUser } from '@/context/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';

interface UserProfileProps {
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ className }) => {
  const { userData, loading, error: userError } = useUser();
  const { address, isConnected, isConnecting } = useAccount();
  const defaultAvatar = 'https://picsum.photos/seed/avatar/150/150';

  // MiniPay detection helper
  const isMiniPay = typeof window !== 'undefined' && (window as any).ethereum?.isMiniPay;

  return (
    <div className={cn("flex flex-col space-y-4 p-4 border rounded-lg shadow-sm bg-card", className)}>
      <div className="flex items-center space-x-4">
        {loading ? (
          <>
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex flex-col space-y-2">
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-16 h-3" />
            </div>
          </>
        ) : userError ? (
          <div className="text-destructive text-xs">Profile Error</div>
        ) : userData ? (
          <>
            <img
              src={userData.avatarUrl || defaultAvatar}
              alt={`${userData.username}'s avatar`}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm font-semibold truncate">{userData.username}</h2>
              <p className="text-muted-foreground text-[10px]">Points: {userData.points}</p>
            </div>
          </>
        ) : null}
      </div>
      
      <div className="pt-2 border-t">
        <div className="flex items-center space-x-2 text-xs mb-1">
          <Wallet className="h-3 w-3 text-primary" />
          <span className="font-medium">Wallet Status:</span>
        </div>
        
        {isConnecting ? (
          <div className="flex items-center space-x-1 animate-pulse">
            <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
            <span className="text-[10px] text-muted-foreground">Connecting...</span>
          </div>
        ) : isConnected && address ? (
          <div className="mt-1">
            <p className="text-[10px] font-mono bg-muted p-1 rounded break-all">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
            <p className="text-[9px] text-green-500 font-bold mt-1 uppercase tracking-wider flex items-center">
              <CheckCircle2 className="h-2 w-2 mr-1" />
              {isMiniPay ? 'MiniPay Active' : 'Celo Connected'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] text-destructive flex items-center font-medium">
              <AlertCircle className="h-3 w-3 mr-1" />
              Not connected
            </span>
            <p className="text-[9px] text-muted-foreground leading-tight">
              Please open this app inside the MiniPay wallet to enable blockchain rewards.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;


"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';

import LeaderboardCard from '@/components/leaderboard-card';
import { Coins, Users, Gift, Send, MousePointerClick, Wallet } from 'lucide-react';

export default function TapToEarn() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  
  const [taps, setTaps] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [referrals, setReferrals] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState('');
  const [cryptoAsset, setCryptoAsset] = useState('USDT');

  // Load User Data from Firestore
  const loadUserData = useCallback(async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setTaps(data.points || 0);
        setEarnings(data.earnings || 0);
      }
    } catch (err) {
      console.error("Failed to load user:", err);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard'); // You'll need to create this simple GET endpoint
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    loadUserData();
    loadLeaderboard();
  }, [loadUserData, loadLeaderboard]);

  useEffect(() => {
    if (isConnected && address) {
      setCryptoWalletAddress(address);
    }
  }, [isConnected, address]);

  const handleTap = async () => {
    // Optimistic UI
    setTaps(prev => prev + 1);
    setEarnings(prev => prev + 0.001);

    try {
      await fetch('/api/tap', { method: 'POST' });
    } catch (err) {
      toast({ title: "Sync Error", description: "Couldn't save your tap.", variant: "destructive" });
    }
  };

  const handleWithdraw = async () => {
    if (earnings < 5.0) {
      toast({ title: "Withdrawal Error", description: "Minimum $5.00 required.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/withdraw/crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletAddress: cryptoWalletAddress, 
          amount: earnings, 
          asset: cryptoAsset 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({ title: "Success!", description: result.message });
        loadUserData(); // Refresh balance
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Failed to process payout.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <Card className="w-full max-w-md text-center rounded-2xl shadow-xl border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center justify-center">
            <Coins className="w-8 h-8 mr-2 text-primary" /> TapBoost
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-xl border">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div className="text-left">
                <span className="text-muted-foreground block text-xs uppercase font-bold">Total Taps</span>
                <span className="text-lg font-semibold">{taps}</span>
              </div>
              <div className="text-left">
                <span className="text-muted-foreground block text-xs uppercase font-bold">Referrals</span>
                <span className="text-lg font-semibold">{referrals}</span>
              </div>
            </div>
            <div className="text-center pt-2 border-t">
               <span className="text-muted-foreground block text-xs uppercase font-bold mb-1">Your Earnings (Real USD)</span>
               <span className="text-3xl font-black text-primary">${earnings.toFixed(3)}</span>
            </div>
          </div>

          <Button onClick={handleTap} size="lg" className="w-full h-16 text-lg font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all">
            <MousePointerClick className="mr-2 h-6 w-6" /> TAP TO EARN
          </Button>

          <div className="space-y-3 pt-6 border-t mt-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Withdraw to MiniPay</h3>
              {isConnected && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center">
                  <Wallet className="h-2 w-2 mr-1" /> Ready
                </span>
              )}
            </div>

            <Select onValueChange={(value) => setCryptoAsset(value)} defaultValue="USDT">
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select Asset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USDT">Tether (USDT)</SelectItem>
                <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                <SelectItem value="cUSD">Celo Dollar (cUSD)</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Your Celo/MiniPay Address"
              value={cryptoWalletAddress}
              onChange={(e) => setCryptoWalletAddress(e.target.value)}
              className="h-10 text-xs font-mono"
            />

            <Button
              onClick={handleWithdraw}
              disabled={isLoading || earnings < 5.0 || !cryptoWalletAddress}
              className="w-full h-12 font-bold"
            >
              {isLoading ? 'Processing Blockchain...' : <><Send className="mr-2 h-4 w-4" /> Withdraw Earnings</>}
            </Button>
            
            {earnings < 5.0 && (
              <p className="text-[10px] text-center text-muted-foreground italic">
                Keep tapping! Minimum withdrawal is $5.00
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <LeaderboardCard leaderboard={leaderboard} isLoading={false} />
    </div>
  );
}

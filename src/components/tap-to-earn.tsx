"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAccount } from 'wagmi';

import LeaderboardCard from '@/components/leaderboard-card';
import NotificationAlert from '@/components/notification-alert';
import { Coins, Users, Gift, Send, MousePointerClick, Wallet } from 'lucide-react';

interface LeaderboardEntry {
  name: string;
  earnings: number;
}

const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: "Steve", earnings: 10.50 },
        { name: "Rihana", earnings: 8.20 },
        { name: "Juliet", earnings: 6.80 },
        { name: "Odiwuor", earnings: 5.50 },
        { name: "Eve", earnings: 4.20 },
      ]);
    }, 500);
  });
};

export default function TapToEarn() {
  const { address, isConnected } = useAccount();
  const [taps, setTaps] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [referrals, setReferrals] = useState(0);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState('');
  const [cryptoAsset, setCryptoAsset] = useState<'BTC' | 'ETH' | 'USDT' | 'USDC'>('USDT');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'paypal' | 'crypto'>('crypto');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true);
      const data = await fetchLeaderboard();
      setLeaderboard(data);
      setIsLoading(false);
    };
    loadLeaderboard();
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      setCryptoWalletAddress(address);
    }
  }, [isConnected, address]);

  const showAppNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleTap = () => {
    setTaps(prev => prev + 1);
    setEarnings(prev => prev + 0.001); 
    showAppNotification('Tap earned +$0.001!');
  };

  const handleReferral = () => {
    setReferrals(prev => prev + 1);
    setEarnings(prev => prev + 0.05);
    showAppNotification('Referral bonus +$0.05 earned!');
  };

  const claimDailyBonus = () => {
    if (!dailyBonusClaimed) {
      setEarnings(prev => prev + 0.20);
      setDailyBonusClaimed(true);
      showAppNotification('Daily bonus +$0.20 claimed!');
      setTimeout(() => setDailyBonusClaimed(false), 24 * 60 * 60 * 1000);
    }
  };

  const handleWithdraw = async () => {
    if (earnings < 5.0) {
      showAppNotification('Minimum $5.00 earnings required to withdraw.', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      let endpoint = '';
      let payload: any = {};
      const withdrawalAmount = earnings;

      if (withdrawalMethod === 'paypal') {
        endpoint = '/api/withdraw/paypal';
        payload = { email: paypalEmail, amount: withdrawalAmount };
      } else {
        endpoint = '/api/withdraw/crypto';
        payload = { walletAddress: cryptoWalletAddress, amount: withdrawalAmount, asset: cryptoAsset };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        showAppNotification(result.message || 'Withdrawal requested successfully!', 'success');
        setEarnings(0); 
      } else {
        showAppNotification(result.message || 'Withdrawal request failed.', 'error');
      }
    } catch (error) {
      showAppNotification('An error occurred during withdrawal.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const isWithdrawButtonDisabled = isLoading || earnings < 5.0 || (withdrawalMethod === 'paypal' && !paypalEmail) || (withdrawalMethod === 'crypto' && !cryptoWalletAddress);

  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <Card className="w-full max-w-md text-center rounded-2xl shadow-xl border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center justify-center">
            <Coins className="w-8 h-8 mr-2 text-primary" /> TapBoost
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <NotificationAlert message={notification.message} type={notification.type} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-muted/50 p-4 rounded-xl border">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div className="text-left">
                <span className="text-muted-foreground block text-xs uppercase font-bold">Taps</span>
                <span className="text-lg font-semibold">{taps}</span>
              </div>
              <div className="text-left">
                <span className="text-muted-foreground block text-xs uppercase font-bold">Referrals</span>
                <span className="text-lg font-semibold">{referrals}</span>
              </div>
            </div>
            <div className="text-center pt-2 border-t">
               <span className="text-muted-foreground block text-xs uppercase font-bold mb-1">Total Earnings</span>
               <span className="text-3xl font-black text-primary">${earnings.toFixed(3)}</span>
            </div>
          </div>

          <div className="grid gap-3">
            <Button onClick={handleTap} size="lg" className="h-14 text-lg font-bold shadow-md hover:shadow-lg transition-all">
              <MousePointerClick className="mr-2 h-6 w-6" /> TAP & EARN ($0.001)
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleReferral} className="h-12 text-xs sm:text-sm">
                <Users className="mr-2 h-4 w-4 text-secondary" /> Refer ($0.05)
              </Button>
              <Button variant="outline" onClick={claimDailyBonus} disabled={dailyBonusClaimed} className="h-12 text-xs sm:text-sm">
                <Gift className="mr-2 h-4 w-4 text-accent" /> {dailyBonusClaimed ? 'Claimed' : 'Bonus ($0.20)'}
              </Button>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t mt-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Withdrawal</h3>
              {isConnected && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center">
                  <Wallet className="h-2 w-2 mr-1" /> MiniPay Active
                </span>
              )}
            </div>

            <Select onValueChange={(value: "paypal" | "crypto") => setWithdrawalMethod(value)} defaultValue="crypto">
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crypto">Crypto (Celo/MiniPay)</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
              </SelectContent>
            </Select>

            {withdrawalMethod === 'crypto' && (
              <>
                <Select onValueChange={(value: "USDT" | "USDC" | "BTC" | "ETH") => setCryptoAsset(value)} defaultValue="USDT">
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select Asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDT">Tether (USDT)</SelectItem>
                    <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Wallet Address"
                  value={cryptoWalletAddress}
                  onChange={(e) => setCryptoWalletAddress(e.target.value)}
                  className="h-10 text-xs font-mono"
                  readOnly={isConnected}
                />
                {!isConnected && (
                  <p className="text-[10px] text-amber-600 font-medium">
                    * For auto-withdrawal, open this app inside MiniPay.
                  </p>
                )}
              </>
            )}

            {withdrawalMethod === 'paypal' && (
              <Input
                type="email"
                placeholder="PayPal Email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="h-10"
              />
            )}

            <Button
              variant="default"
              onClick={handleWithdraw}
              disabled={isWithdrawButtonDisabled}
              className="w-full h-12 font-bold"
            >
              {isLoading ? 'Processing...' : <><Send className="mr-2 h-4 w-4" /> Request Payout</>}
            </Button>
            {earnings < 5.0 && (
              <p className="text-[10px] text-center text-muted-foreground italic">
                Minimum withdrawal amount is $5.00
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <LeaderboardCard leaderboard={leaderboard} isLoading={isLoading && leaderboard.length === 0} />
    </div>
  );
}

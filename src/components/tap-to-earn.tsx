"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/UserContext';
import { auth as firebaseAuth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import LeaderboardCard from '@/components/leaderboard-card';
import { Coins, LogOut, Send, MousePointerClick, Wallet, Zap, TrendingUp, CreditCard, Globe } from 'lucide-react';

const UPGRADES = [
  { level: 1, power: 0.300, cost: 0 },
  { level: 2, power: 0.500, cost: 2.0 },
  { level: 3, power: 0.600, cost: 5.0 },
  { level: 4, power: 0.700, cost: 15.0 },
  { level: 5, power: 0.900, cost: 35.0 },
  { level: 6, power: 1.100, cost: 75.0 },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', rate: 1 },
  { code: 'KES', symbol: 'KSh', rate: 130 },
  { code: 'UGX', symbol: 'USh', rate: 3700 },
  { code: 'TZS', symbol: 'TSh', rate: 2600 },
  { code: 'RWF', symbol: 'RF', rate: 1250 },
];

export default function TapToEarn() {
  const { address, isConnected } = useAccount();
  const { user, userData, refreshUserData } = useUser();
  const { toast } = useToast();
  
  const [localTaps, setLocalTaps] = useState(0);
  const [localEarnings, setLocalEarnings] = useState(0);
  const [localTapPower, setLocalTapPower] = useState(0.300);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState('');
  const [cryptoAsset, setCryptoAsset] = useState('USDT');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  useEffect(() => {
    if (userData) {
      setLocalTaps(userData.points || 0);
      setLocalEarnings(userData.earnings || 0);
      setLocalTapPower(userData.tapPower || 0.300);
      setSelectedCurrency(userData.currency || 'USD');
    }
  }, [userData]);

  const currencyInfo = useMemo(() => 
    CURRENCIES.find(c => c.code === selectedCurrency) || CURRENCIES[0],
    [selectedCurrency]
  );

  const formatValue = (usdValue: number) => {
    const converted = usdValue * currencyInfo.rate;
    return `${currencyInfo.symbol} ${converted.toLocaleString(undefined, { minimumFractionDigits: currencyInfo.code === 'USD' ? 3 : 0, maximumFractionDigits: currencyInfo.code === 'USD' ? 3 : 0 })}`;
  };

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (isConnected && address) {
      setCryptoWalletAddress(address);
    }
  }, [isConnected, address]);

  const handleCurrencyChange = async (newCurrency: string) => {
    if (!user) return;
    setSelectedCurrency(newCurrency);
    try {
      await fetch('/api/user/update-currency', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify({ currency: newCurrency })
      });
      await refreshUserData();
    } catch (err) {
      toast({ title: "Error", description: "Failed to update currency preference." });
    }
  };

  const handleTap = async () => {
    if (!user) return;
    setLocalTaps(prev => prev + 1);
    setLocalEarnings(prev => prev + localTapPower);
    try {
      await fetch('/api/tap', { 
        method: 'POST',
        headers: { 'x-user-id': user.uid }
      });
    } catch (err) {
      toast({ title: "Sync Error", description: "Couldn't save your tap.", variant: "destructive" });
    }
  };

  const handleBuyUpgradeWithBalance = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'x-user-id': user.uid }
      });
      const result = await response.json();
      if (response.ok) {
        toast({ title: "Success!", description: result.message });
        await refreshUserData();
      } else {
        toast({ title: "Upgrade Failed", description: result.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Network Error", description: "Failed to process upgrade.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyUpgradeWithPesaPal = async () => {
    if (!user || !userData) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/pesapal/order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify({ currency: selectedCurrency })
      });
      
      const result = await response.json();
      
      if (response.ok && result.redirectUrl) {
        toast({ title: "Redirecting", description: "Sending you to PesaPal..." });
        window.location.href = result.redirectUrl;
      } else {
        toast({ title: "Purchase Error", description: result.message || "Failed to initiate payment.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Purchase Error", description: "Network error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;
    if (localEarnings < 5.0) {
      toast({ title: "Withdrawal Error", description: "Minimum $5.00 required.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/withdraw/crypto', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid
        },
        body: JSON.stringify({ 
          walletAddress: cryptoWalletAddress, 
          amount: localEarnings, 
          asset: cryptoAsset 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({ title: "Success!", description: result.message });
        await refreshUserData();
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Failed to process payout.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!firebaseAuth) return;
    await signOut(firebaseAuth);
    toast({ title: "Logged out", description: "Come back soon!" });
  };

  const currentLevel = userData?.tapLevel || 1;
  const nextUpgrade = UPGRADES.find(u => u.level === currentLevel + 1);

  return (
    <div className="flex flex-col items-center w-full space-y-6 pb-20">
      <div className="w-full max-w-md flex justify-between items-center px-2">
        <div className="flex items-center space-x-2">
          <div className="bg-primary/10 p-2 rounded-lg">
             <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[10px] font-bold">Lvl {currentLevel} ({formatValue(localTapPower)}/tap)</span>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-[80px] h-8 text-[10px] border-none bg-muted/50">
              <Globe className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Cur" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(c => (
                <SelectItem key={c.code} value={c.code} className="text-[10px]">{c.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive h-8 text-[10px]">
            <LogOut className="w-3 h-3 mr-1" /> Logout
          </Button>
        </div>
      </div>

      <Card className="w-full max-w-md text-center rounded-2xl shadow-xl border-t-4 border-t-primary overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold flex items-center justify-center">
            <Coins className="w-8 h-8 mr-2 text-primary" /> TapBoost
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-xl border">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div className="text-left">
                <span className="text-muted-foreground block text-xs uppercase font-bold">Total Taps</span>
                <span className="text-lg font-semibold">{localTaps}</span>
              </div>
              <div className="text-left">
                <span className="text-muted-foreground block text-xs uppercase font-bold">User</span>
                <span className="text-lg font-semibold truncate block w-full">
                  {user?.displayName || 'Tapper'}
                </span>
              </div>
            </div>
            <div className="text-center pt-2 border-t">
               <span className="text-muted-foreground block text-xs uppercase font-bold mb-1">Your Earnings</span>
               <span className="text-4xl font-black text-primary">{formatValue(localEarnings)}</span>
            </div>
          </div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button onClick={handleTap} size="lg" className="w-full h-24 text-2xl font-black shadow-lg hover:scale-[1.02] transition-all bg-primary hover:bg-primary/90 rounded-2xl flex-col">
              <MousePointerClick className="mb-1 h-8 w-8" />
              <span>TAP TO EARN</span>
              <span className="text-[10px] font-normal opacity-80">+{formatValue(localTapPower)} / tap</span>
            </Button>
          </motion.div>

          <Tabs defaultValue="withdraw" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="withdraw"><Wallet className="w-4 h-4 mr-2" /> Wallet</TabsTrigger>
              <TabsTrigger value="upgrade"><TrendingUp className="w-4 h-4 mr-2" /> Boost</TabsTrigger>
            </TabsList>
            
            <TabsContent value="withdraw" className="space-y-4 text-left">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Withdraw to MiniPay</h3>
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
                disabled={isLoading || localEarnings < 5.0 || !cryptoWalletAddress}
                className="w-full h-12 font-bold rounded-xl"
              >
                {isLoading ? 'Processing...' : <><Send className="mr-2 h-4 w-4" /> Withdraw Earnings</>}
              </Button>
              
              <p className="text-[10px] text-center text-muted-foreground italic">
                Min. withdrawal: $5.00 ({formatValue(5)})
              </p>
            </TabsContent>

            <TabsContent value="upgrade" className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-left">
                <h4 className="font-bold text-sm mb-1 flex items-center">
                  <Zap className="w-4 h-4 mr-1 text-primary" /> Next Level Boost
                </h4>
                {nextUpgrade ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-3">
                      Upgrade to Level {nextUpgrade.level} to earn <span className="font-bold text-primary">{formatValue(nextUpgrade.power)}</span> per tap.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white dark:bg-black/20 p-3 rounded-lg border">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-muted-foreground font-bold leading-tight">Use Balance</span>
                          <span className="text-lg font-black">{formatValue(nextUpgrade.cost)}</span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={handleBuyUpgradeWithBalance}
                          disabled={isLoading || localEarnings < nextUpgrade.cost}
                          className="font-bold h-9"
                        >
                          Buy with Earnings
                        </Button>
                      </div>

                      <div className="flex justify-between items-center bg-accent/10 p-3 rounded-lg border border-accent/20">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-accent-foreground font-bold leading-tight">Direct Purchase</span>
                          <span className="text-lg font-black text-accent-foreground">{formatValue(nextUpgrade.cost)}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={handleBuyUpgradeWithPesaPal}
                          disabled={isLoading}
                          className="font-bold h-9 bg-accent text-accent-foreground hover:bg-accent/90"
                        >
                          <CreditCard className="w-4 h-4 mr-1" /> Pay via PesaPal
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground italic">You've reached the maximum tap level!</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <LeaderboardCard leaderboard={leaderboard} isLoading={false} />
    </div>
  );
}

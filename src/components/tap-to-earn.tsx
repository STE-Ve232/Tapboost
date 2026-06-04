"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/UserContext';
import { auth as firebaseAuth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getExchangeRates, CURRENCIES, ExchangeRates } from '@/lib/currency-service';

import LeaderboardCard from '@/components/leaderboard-card';
import { Banknote, Coins, LogOut, Send, MousePointerClick, Wallet, Zap, TrendingUp, CreditCard, Globe } from 'lucide-react';

const UPGRADES = [
  { level: 1, power: 0.300, cost: 0 },
  { level: 2, power: 0.500, cost: 2.0 },
  { level: 3, power: 0.600, cost: 5.0 },
  { level: 4, power: 0.700, cost: 15.0 },
  { level: 5, power: 0.900, cost: 35.0 },
  { level: 6, power: 1.100, cost: 75.0 },
];

const MIN_PESAPAL_WITHDRAWAL_USD = 10.0;
const MIN_CRYPTO_WITHDRAWAL_USD = 5.0;

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
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutType, setPayoutType] = useState('bank');

  const [bankRecipient, setBankRecipient] = useState({ firstName: '', lastName: '', accountNumber: '', bankCode: '' });
  const [cardRecipient, setCardRecipient] = useState({ firstName: '', lastName: '', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' });

  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({ USD: 1 });

  useEffect(() => {
    async function loadRates() {
      const rates = await getExchangeRates();
      setExchangeRates(rates);
    }
    loadRates();
  }, []);

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

  const currentRate = useMemo(() => 
    exchangeRates[selectedCurrency] || 1,
    [exchangeRates, selectedCurrency]
  );

  const formatValue = (usdValue: number) => {
    const converted = usdValue * currentRate;
    return `${currencyInfo.symbol} ${converted.toLocaleString(undefined, { 
      minimumFractionDigits: selectedCurrency === 'USD' ? 3 : 2, 
      maximumFractionDigits: selectedCurrency === 'USD' ? 3 : 2 
    })}`;
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
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.uid },
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
      await fetch('/api/tap', { method: 'POST', headers: { 'x-user-id': user.uid } });
    } catch (err) {
      toast({ title: "Sync Error", description: "Couldn't save your tap.", variant: "destructive" });
    }
  };
  
  const handleBuyUpgradeWithPesaPal = async () => {
    if (!user || !userData) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/pesapal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.uid },
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

  const handleCryptoWithdraw = async () => {
    if (!user || !cryptoWalletAddress) return;

    setIsLoading(true);
    await refreshUserData(); // Refresh to get the latest server state first.

    // Re-check minimums against the fresh data.
    if (localEarnings < MIN_CRYPTO_WITHDRAWAL_USD) {
      toast({ 
        title: "Withdrawal Error", 
        description: `Your confirmed balance is below the minimum of ${formatValue(MIN_CRYPTO_WITHDRAWAL_USD)}.`, 
        variant: "destructive" 
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/withdraw/crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.uid },
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
      toast({ title: "Network Error", description: "Failed to process crypto payout.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePesaPalWithdraw = async () => {
    if (!user || !currentRate) return;
    
    setIsLoading(true);
    await refreshUserData(); // THE FIX: Refresh to get the latest server state first.

    const amountInLocalCurrency = parseFloat(payoutAmount);

    if (isNaN(amountInLocalCurrency) || amountInLocalCurrency <= 0) {
      toast({ title: "Validation Error", description: "Please enter a valid amount.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const amountInUSD = amountInLocalCurrency / currentRate;

    // Check against the freshly updated localEarnings.
    if (localEarnings < amountInUSD) {
      toast({ title: "Insufficient Balance", description: "Your confirmed balance is less than the requested withdrawal amount.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (amountInUSD < MIN_PESAPAL_WITHDRAWAL_USD) {
      toast({ 
        title: "Amount Too Low", 
        description: `The minimum withdrawal amount is ${formatValue(MIN_PESAPAL_WITHDRAWAL_USD)}.`, 
        variant: "destructive" 
      });
      setIsLoading(false);
      return;
    }

    try {
        const payload = {
            amount: amountInUSD,
            payoutType,
            recipient: payoutType === 'bank' ? bankRecipient : cardRecipient,
        };
        const response = await fetch('/api/withdraw/pesapal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': user.uid },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (response.ok) {
            toast({ title: 'Payout Submitted', description: result.message });
            setPayoutAmount('');
            await refreshUserData();
        } else {
            toast({ title: 'Payout Failed', description: result.message, variant: 'destructive' });
        }
    } catch (error) {
        toast({ title: 'Network Error', description: 'Failed to submit payout request.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!firebaseAuth) return;
    await signOut(firebaseAuth);
    toast({ title: "Logged out", description: "Come back soon!" });
  };

  const isPesapalWithdrawDisabled = () => {
    if (isLoading || !payoutAmount || parseFloat(payoutAmount) <= 0) return true;
    if (payoutType === 'bank') {
      return !bankRecipient.accountNumber || !bankRecipient.bankCode || !bankRecipient.firstName || !bankRecipient.lastName;
    }
    if (payoutType === 'card') {
      return !cardRecipient.cardNumber || !cardRecipient.expiryMonth || !cardRecipient.expiryYear || !cardRecipient.cvv || !cardRecipient.firstName || !cardRecipient.lastName;
    }
    return true;
  };

  const currentLevel = userData?.tapLevel || 1;

  return (
    <div className="flex flex-col items-center w-full space-y-6 pb-20">
      <div className="w-full max-w-md flex justify-between items-center px-2">
        <div className="flex items-center space-x-2">
          <div className="bg-primary/10 p-2 rounded-lg"><Zap className="w-4 h-4 text-primary" /></div>
          <span className="text-[10px] font-bold">Lvl {currentLevel} ({formatValue(localTapPower)}/tap)</span>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-[80px] h-8 text-[10px] border-none bg-muted/50">
              <Globe className="w-3 h-3 mr-1" /><SelectValue placeholder="Cur" />
            </SelectTrigger>
            <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.code} value={c.code} className="text-[10px]">{c.code}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive h-8 text-[10px]">
            <LogOut className="w-3 h-3 mr-1" /> Logout
          </Button>
        </div>
      </div>

      <Card className="w-full max-w-md text-center rounded-2xl shadow-xl border-t-4 border-t-primary overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold flex items-center justify-center"><Coins className="w-8 h-8 mr-2 text-primary" /> TapBoost</CardTitle>
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
                <span className="text-lg font-semibold truncate block w-full">{user?.displayName || 'Tapper'}</span>
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

          <Tabs defaultValue="main-withdraw" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="main-withdraw"><Wallet className="w-4 h-4 mr-2" /> Wallet</TabsTrigger>
              <TabsTrigger value="main-upgrade"><TrendingUp className="w-4 h-4 mr-2" /> Boost</TabsTrigger>
            </TabsList>
            <TabsContent value="main-withdraw">
                <Tabs defaultValue="crypto" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="crypto">MiniPay (Crypto)</TabsTrigger>
                        <TabsTrigger value="pesapal">Bank/Card</TabsTrigger>
                    </TabsList>
                    <TabsContent value="crypto" className="space-y-4 text-left">
                        <Select onValueChange={setCryptoAsset} defaultValue="USDT">
                            <SelectTrigger className="h-10"><SelectValue placeholder="Select Asset" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USDT">Tether (USDT)</SelectItem>
                                <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                                <SelectItem value="cUSD">Celo Dollar (cUSD)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input placeholder="Your Celo/MiniPay Address" value={cryptoWalletAddress} onChange={(e) => setCryptoWalletAddress(e.target.value)} className="h-10 text-xs font-mono" />
                        <Button onClick={handleCryptoWithdraw} disabled={isLoading || !cryptoWalletAddress} className="w-full h-12 font-bold rounded-xl">
                            {isLoading ? 'Checking...' : <><Send className="mr-2 h-4 w-4" /> Withdraw Full Balance</>}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground italic">Min. withdrawal: {formatValue(MIN_CRYPTO_WITHDRAWAL_USD)}</p>
                    </TabsContent>
                    <TabsContent value="pesapal" className="space-y-2 text-left">
                        <Input placeholder={`Amount to Withdraw (${currencyInfo.symbol})`} type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} />
                        <Tabs defaultValue="bank" onValueChange={setPayoutType} className="w-full pt-2">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="bank">To Bank</TabsTrigger>
                                <TabsTrigger value="card">To Card</TabsTrigger>
                            </TabsList>
                            <TabsContent value="bank" className="space-y-2 pt-2">
                                <div className="grid grid-cols-2 gap-2">
                                   <Input placeholder="First Name" value={bankRecipient.firstName} onChange={e => setBankRecipient({...bankRecipient, firstName: e.target.value})} />
                                   <Input placeholder="Last Name" value={bankRecipient.lastName} onChange={e => setBankRecipient({...bankRecipient, lastName: e.target.value})} />
                                </div>
                                <Input placeholder="Account Number" value={bankRecipient.accountNumber} onChange={e => setBankRecipient({...bankRecipient, accountNumber: e.target.value})} />
                                <Input placeholder="Bank Code (e.g., 254003)" value={bankRecipient.bankCode} onChange={e => setBankRecipient({...bankRecipient, bankCode: e.target.value})} />
                            </TabsContent>
                            <TabsContent value="card" className="space-y-2 pt-2">
                                <div className="grid grid-cols-2 gap-2">
                                   <Input placeholder="First Name" value={cardRecipient.firstName} onChange={e => setCardRecipient({...cardRecipient, firstName: e.target.value})} />
                                   <Input placeholder="Last Name" value={cardRecipient.lastName} onChange={e => setCardRecipient({...cardRecipient, lastName: e.target.value})} />
                                </div>
                                <Input placeholder="Card Number" value={cardRecipient.cardNumber} onChange={e => setCardRecipient({...cardRecipient, cardNumber: e.target.value})} />
                                <div className="grid grid-cols-3 gap-2">
                                    <Input placeholder="MM" value={cardRecipient.expiryMonth} onChange={e => setCardRecipient({...cardRecipient, expiryMonth: e.target.value})} />
                                    <Input placeholder="YY" value={cardRecipient.expiryYear} onChange={e => setCardRecipient({...cardRecipient, expiryYear: e.target.value})} />
                                    <Input placeholder="CVV" value={cardRecipient.cvv} onChange={e => setCardRecipient({...cardRecipient, cvv: e.target.value})} />
                                </div>
                            </TabsContent>
                        </Tabs>
                        <div className="pt-2">
                            <Button onClick={handlePesaPalWithdraw} disabled={isPesapalWithdrawDisabled()} className="w-full h-12 font-bold rounded-xl bg-green-600 hover:bg-green-700">
                                {isLoading ? 'Verifying...' : <><Banknote className="mr-2 h-4 w-4" /> Withdraw</>}
                            </Button>
                            <p className="text-[10px] text-center text-muted-foreground italic pt-2">Min. withdrawal: {formatValue(MIN_PESAPAL_WITHDRAWAL_USD)}. Funds arrive in 1-3 business days.</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <LeaderboardCard leaderboard={leaderboard} isLoading={false} />
    </div>
  );
}

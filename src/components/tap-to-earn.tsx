"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import LeaderboardCard from '@/components/leaderboard-card';
import NotificationAlert from '@/components/notification-alert';
import { Coins, Users, Gift, Send, MousePointerClick } from 'lucide-react';

interface LeaderboardEntry {
  name: string;
  earnings: number;
}

const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  // Mock API call as in the original script
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: "Alice", earnings: 10.50 },
        { name: "Bob", earnings: 8.20 },
        { name: "Charlie", earnings: 6.80 },
        { name: "David", earnings: 5.50 },
        { name: "Eve", earnings: 4.20 },
      ]);
    }, 500);
  });
};

export default function TapToEarn() {
  const [taps, setTaps] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [referrals, setReferrals] = useState(0);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true);
      const data = await fetchLeaderboard();
      setLeaderboard(data);
      setIsLoading(false);
    };
    loadLeaderboard();
  }, []);

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
    setEarnings(prev => prev + 0.005);
    showAppNotification('Referral bonus +$0.005 earned!');
  };

  const claimDailyBonus = () => {
    if (!dailyBonusClaimed) {
      setEarnings(prev => prev + 0.02);
      setDailyBonusClaimed(true);
      showAppNotification('Daily bonus +$0.02 claimed!');
      // Reset bonus availability after 24 hours (simplified)
      setTimeout(() => setDailyBonusClaimed(false), 24 * 60 * 60 * 1000);
    }
  };

  const handleWithdraw = () => {
    if (earnings >= 5.0 && paypalEmail) {
      setIsLoading(true);
      setTimeout(() => {
        setEarnings(0);
        setIsLoading(false);
        showAppNotification(`Withdrawal of $${(earnings).toFixed(2)} requested to ${paypalEmail}`);
        setPaypalEmail(''); // Clear email after request
      }, 1000);
    } else {
      let errorMessage = '';
      if (earnings < 5.0) errorMessage += 'Minimum $5.00 earnings required. ';
      if (!paypalEmail) errorMessage += 'Valid PayPal email required.';
      showAppNotification(errorMessage.trim(), 'error');
    }
  };

  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <Card className="w-full max-w-[95%] sm:max-w-md md:max-w-lg lg:max-w-xl text-center rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-2xl font-bold sm:text-3xl md:text-4xl flex items-center justify-center">
            <Coins className="w-8 h-8 mr-2 sm:w-10 sm:h-10 md:w-12 md:h-12" /> TapBoost
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-3 sm:p-4 md:p-6">
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <NotificationAlert message={notification.message} type={notification.type} />
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Your Stats</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm sm:text-base md:text-lg">
              <p><span className="font-medium">Taps:</span> {taps}</p>
              <p><span className="font-medium">Referrals:</span> {referrals}</p>
              <p className="font-semibold text-primary col-span-1 sm:col-span-3 text-xl">Earnings: ${earnings.toFixed(3)}</p>
            </div>
          </Card>

          <motion.div whileTap={{ scale: 0.95 }} className="w-full">
            <Button
              onClick={handleTap}
              disabled={isLoading}
              className="w-full py-3 text-base sm:text-lg"
              aria-label="Tap to earn $0.001"
            >
              <MousePointerClick className="mr-2 h-5 w-5" /> Tap & Earn ($0.001)
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.95 }} className="w-full">
            <Button
              variant="secondary"
              onClick={handleReferral}
              disabled={isLoading}
              className="w-full py-3 text-base sm:text-lg"
              aria-label="Refer a friend to earn $0.005"
            >
              <Users className="mr-2 h-5 w-5" /> Refer & Earn ($0.005)
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.95 }} className="w-full">
            <Button
              onClick={claimDailyBonus}
              disabled={dailyBonusClaimed || isLoading}
              className="w-full py-3 text-base sm:text-lg btn-bonus"
              aria-label={dailyBonusClaimed ? "Daily bonus already claimed" : "Claim $0.02 daily bonus"}
            >
              <Gift className="mr-2 h-5 w-5" /> {dailyBonusClaimed ? 'Bonus Claimed Today' : 'Claim $0.02 Bonus'}
            </Button>
          </motion.div>

          <div className="space-y-2 pt-4 border-t mt-4">
            <h3 className="text-lg font-semibold text-muted-foreground">Withdraw Earnings</h3>
            <Input
              type="email"
              placeholder="Enter PayPal Email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              disabled={isLoading}
              className="text-base"
              aria-label="PayPal email for withdrawal"
            />
            <motion.div whileTap={{ scale: 0.95 }} className="w-full">
            <Button
              variant="destructive"
              onClick={handleWithdraw}
              disabled={earnings < 5.0 || !paypalEmail || isLoading}
              className="w-full py-3 text-base sm:text-lg"
              aria-label="Withdraw earnings to PayPal"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                <><Send className="mr-2 h-5 w-5" /> Withdraw to PayPal</>
              )}
            </Button>
            </motion.div>
            { (earnings < 5.0 || !paypalEmail) && <p className="text-xs text-muted-foreground mt-1">Minimum $5.00 to withdraw. PayPal email required.</p>}
          </div>
        </CardContent>
      </Card>

      <LeaderboardCard leaderboard={leaderboard} isLoading={isLoading} />
    </div>
  );
}

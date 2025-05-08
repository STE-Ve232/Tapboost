"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, UserCircle2 } from 'lucide-react';

interface LeaderboardEntry {
  name: string;
  earnings: number;
}

interface LeaderboardCardProps {
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
}

export default function LeaderboardCard({ leaderboard, isLoading }: LeaderboardCardProps) {
  const sortedLeaderboard = [...leaderboard].sort((a, b) => b.earnings - a.earnings);

  return (
    <Card className="w-full max-w-[95%] sm:max-w-md md:max-w-lg lg:max-w-xl text-center rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-bold sm:text-2xl md:text-3xl flex items-center justify-center">
          <Trophy className="mr-2 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" /> Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-2 rounded-md bg-muted/50">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {sortedLeaderboard.length > 0 ? sortedLeaderboard.map((player, index) => (
              <li
                key={index}
                className={`flex items-center justify-between p-2 sm:p-3 rounded-lg transition-colors ${
                  index === 0 ? 'bg-yellow-100 dark:bg-yellow-800/30' : 
                  index === 1 ? 'bg-gray-100 dark:bg-gray-700/30' :
                  index === 2 ? 'bg-orange-100 dark:bg-orange-800/30' :
                  'bg-muted/30 hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center">
                  <span className={`font-semibold mr-2 text-sm sm:text-base ${
                    index < 3 ? 'text-lg' : ''
                  } w-6 text-center`}>
                    {index === 0 && <Trophy className="inline-block h-5 w-5 text-yellow-500" />}
                    {index === 1 && <Trophy className="inline-block h-5 w-5 text-gray-500" />}
                    {index === 2 && <Trophy className="inline-block h-5 w-5 text-orange-500" />}
                    {index >= 3 && `${index + 1}.`}
                  </span>
                  <UserCircle2 className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-sm sm:text-base md:text-lg">{player.name}</span>
                </div>
                <span className="font-semibold text-sm sm:text-base md:text-lg text-primary">
                  ${player.earnings.toFixed(2)}
                </span>
              </li>
            )) : (
              <p className="text-muted-foreground">No leaderboard data available yet.</p>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

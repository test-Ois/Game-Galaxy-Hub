// ============================================================
// Leaderboard Page — Rankings & Achievements
// ============================================================

"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Star,
  Crown,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ACHIEVEMENTS_LIST } from "@/lib/game/constants";
import { RANK_THRESHOLDS } from "@/lib/game/types";
import { cn } from "@/lib/utils";

// Sample leaderboard data (will be replaced with API data later)
const sampleLeaderboard = [
  { rank: 1, name: "GrandMaster_Q", xp: 5200, wins: 342, rankTitle: "Grandmaster" },
  { rank: 2, name: "StrategyKing", xp: 3800, wins: 256, rankTitle: "Master" },
  { rank: 3, name: "AISlayer", xp: 2100, wins: 178, rankTitle: "Master" },
  { rank: 4, name: "TicTacPro", xp: 1500, wins: 134, rankTitle: "Diamond" },
  { rank: 5, name: "GridWizard", xp: 980, wins: 98, rankTitle: "Platinum" },
  { rank: 6, name: "MoveFirst", xp: 750, wins: 76, rankTitle: "Platinum" },
  { rank: 7, name: "Thinker42", xp: 450, wins: 54, rankTitle: "Gold" },
  { rank: 8, name: "NewChallenger", xp: 180, wins: 22, rankTitle: "Silver" },
];

const rankIcons: Record<string, React.ReactNode> = {
  Grandmaster: <Crown className="h-4 w-4 text-purple-400" />,
  Master: <Shield className="h-4 w-4 text-red-400" />,
  Diamond: <Star className="h-4 w-4 text-cyan-400" />,
  Platinum: <Medal className="h-4 w-4 text-teal-400" />,
  Gold: <Medal className="h-4 w-4 text-amber-400" />,
  Silver: <Medal className="h-4 w-4 text-gray-400" />,
  Bronze: <Medal className="h-4 w-4 text-orange-700" />,
};

export default function LeaderboardPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">
            Global rankings, achievements, and progression
          </p>
        </div>

        {/* Rank System */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Ranking System</h2>
          <div className="flex flex-wrap gap-2">
            {RANK_THRESHOLDS.map((rank) => (
              <div
                key={rank.name}
                className="glass rounded-xl px-4 py-2.5 flex items-center gap-2"
              >
                {rankIcons[rank.name]}
                <span className="text-sm font-medium">{rank.name}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {rank.minXP}+ XP
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Top Players</h2>
            <Badge variant="secondary" className="text-xs">
              All Time
            </Badge>
          </div>

          <div className="space-y-2">
            {sampleLeaderboard.map((player, i) => (
              <motion.div
                key={player.rank}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-colors",
                  player.rank <= 3
                    ? "bg-primary/5 hover:bg-primary/10"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                      player.rank === 1
                        ? "bg-amber-500/15 text-amber-500"
                        : player.rank === 2
                          ? "bg-gray-400/15 text-gray-400"
                          : player.rank === 3
                            ? "bg-orange-600/15 text-orange-600"
                            : "bg-muted text-muted-foreground"
                    )}
                  >
                    {player.rank <= 3 ? (
                      <Trophy className="h-4 w-4" />
                    ) : (
                      player.rank
                    )}
                  </div>

                  {/* Player Info */}
                  <div>
                    <p className="text-sm font-semibold">{player.name}</p>
                    <div className="flex items-center gap-1.5">
                      {rankIcons[player.rankTitle]}
                      <span className="text-xs text-muted-foreground">
                        {player.rankTitle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums">
                    {player.xp.toLocaleString()} XP
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {player.wins} wins
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Achievements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACHIEVEMENTS_LIST.map((achievement, i) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {achievement.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    +{achievement.xpReward} XP
                  </Badge>
                </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

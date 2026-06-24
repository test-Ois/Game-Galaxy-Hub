// ============================================================
// Dashboard Page — Match History & Statistics
// ============================================================

"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  Percent,
  Clock,
  Gamepad2,
  Swords,
  Bot,
  Users,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { useGameStore } from "@/store/gameStore";
import { formatRelativeTime } from "@/shared/services/utils";
import { cn } from "@/shared/services/utils";

export default function DashboardPage() {
  const matchHistory = useGameStore((s) => s.matchHistory);
  const scores = useGameStore((s) => s.scores);

  const totalGames = scores.O + scores.X + scores.D;
  const winRate = totalGames > 0 ? Math.round((scores.O / totalGames) * 100) : 0;
  const avgDuration =
    matchHistory.length > 0
      ? Math.round(
          matchHistory.reduce((sum, m) => sum + m.duration, 0) /
            matchHistory.length
        )
      : 0;

  const stats = [
    {
      label: "Total Games",
      value: totalGames,
      icon: Gamepad2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Wins",
      value: scores.O,
      icon: Trophy,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Losses",
      value: scores.X,
      icon: Target,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "Draws",
      value: scores.D,
      icon: Swords,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      icon: Percent,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Avg Duration",
      value: `${avgDuration}s`,
      icon: Clock,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-6rem)] sm:min-h-[calc(100vh-8rem)] px-3 sm:px-4 py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-5 sm:space-y-6 md:space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your performance and match history
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-center"
            >
              <div
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-2",
                  stat.bg
                )}
              >
                <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.color)} />
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Win Rate Visual */}
        {totalGames > 0 && (
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Performance</h2>
            <div className="flex gap-1 h-4 rounded-full overflow-hidden">
              {scores.O > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(scores.O / totalGames) * 100}%`,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-emerald-500 rounded-l-full"
                />
              )}
              {scores.D > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(scores.D / totalGames) * 100}%`,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  className="bg-amber-500"
                />
              )}
              {scores.X > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(scores.X / totalGames) * 100}%`,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="bg-red-500 rounded-r-full"
                />
              )}
            </div>
            <div className="flex justify-between mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Wins {scores.O}
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Draws {scores.D}
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Losses {scores.X}
              </span>
            </div>
          </div>
        )}

        {/* Match History */}
        <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Matches</h2>
            <Badge variant="secondary" className="text-xs">
              {matchHistory.length} games
            </Badge>
          </div>

          {matchHistory.length === 0 ? (
            <div className="text-center py-12">
              <Gamepad2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No matches yet</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Play a game to see your history here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {matchHistory.slice(0, 20).map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-muted/50 transition-colors gap-2 sm:gap-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center",
                        match.winner === "O"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : match.winner === "X"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-amber-500/10 text-amber-500"
                      )}
                    >
                      {match.winner === "draw" ? (
                        <Swords className="h-4 w-4" />
                      ) : match.winner === "O" ? (
                        <Trophy className="h-4 w-4" />
                      ) : (
                        <Target className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {match.winner === "O"
                          ? "Victory"
                          : match.winner === "X"
                            ? "Defeat"
                            : "Draw"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {match.mode === "pvai" ? (
                          <span className="flex items-center gap-1">
                            <Bot className="h-3 w-3" />
                            vs AI ({match.difficulty})
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            PvP
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right pl-12 sm:pl-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {match.boardSize}×{match.boardSize} ·{" "}
                      {match.moves.length} moves · {match.duration}s
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {formatRelativeTime(match.date)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

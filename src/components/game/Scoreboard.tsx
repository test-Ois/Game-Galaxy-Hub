// ============================================================
// Scoreboard — Scores, Series Progress, Turn Indicator
// ============================================================

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Clock, Hash } from "lucide-react";
import { useGameStore } from "@/stores/gameStore";
import { useGameTimer } from "@/hooks/useTimer";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export function Scoreboard() {
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const scores = useGameStore((s) => s.scores);
  const seriesWins = useGameStore((s) => s.seriesWins);
  const seriesTarget = useGameStore((s) => s.seriesTarget);
  const moveCount = useGameStore((s) => s.moveCount);
  const mode = useGameStore((s) => s.mode);
  const isAIThinking = useGameStore((s) => s.isAIThinking);

  const { elapsed, start, stop, reset } = useGameTimer();

  // Start/stop timer based on game state
  useEffect(() => {
    if (!isGameOver) {
      reset();
      start();
    } else {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameOver]);

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      {/* Turn Indicator */}
      <div className="glass rounded-2xl p-3">
        <div className="flex items-center justify-between">
          {/* Current Turn */}
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPlayer}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-lg",
                  currentPlayer === "O"
                    ? "bg-game-o/15 text-game-o"
                    : "bg-game-x/15 text-game-x"
                )}
              >
                {currentPlayer}
              </motion.div>
            </AnimatePresence>
            <div>
              <p className="text-sm font-semibold">
                {isGameOver
                  ? "Game Over"
                  : isAIThinking
                    ? "AI Thinking..."
                    : `${currentPlayer === "O" ? (mode === "pvai" ? "Your" : "Player O's") : mode === "pvai" ? "AI's" : "Player X's"} Turn`}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {moveCount} moves
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(elapsed)}
                </span>
              </div>
            </div>
          </div>

          {/* Series Score */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 font-mono">
                <span className={cn(
                  "text-base font-bold",
                  "text-game-o"
                )}>
                  {seriesWins.O}
                </span>
                <span className="text-muted-foreground">-</span>
                <span className={cn(
                  "text-base font-bold",
                  "text-game-x"
                )}>
                  {seriesWins.X}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Series Progress Bar */}
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: seriesTarget * 2 - 1 }).map((_, i) => {
            const isOWin = i < seriesWins.O;
            const isXWin = i >= seriesTarget * 2 - 1 - seriesWins.X;
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 h-1 rounded-full transition-all duration-300",
                  isOWin
                    ? "bg-game-o"
                    : isXWin
                      ? "bg-game-x"
                      : "bg-muted"
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-3 gap-2">
        <ScoreCard
          label={mode === "pvai" ? "You (O)" : "Player O"}
          value={scores.O}
          icon={<User className="h-3.5 w-3.5" />}
          color="text-game-o"
        />
        <ScoreCard
          label="Draws"
          value={scores.D}
          icon={<span className="text-xs">⚡</span>}
          color="text-muted-foreground"
        />
        <ScoreCard
          label={mode === "pvai" ? "AI (X)" : "Player X"}
          value={scores.X}
          icon={mode === "pvai" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
          color="text-game-x"
        />
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <div className={cn("flex items-center justify-center gap-1.5 mb-1", color)}>
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn("text-2xl font-bold tabular-nums", color)}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

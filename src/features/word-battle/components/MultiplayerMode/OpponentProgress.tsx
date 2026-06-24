"use client";

import { motion } from "framer-motion";
import { cn } from "@/shared/services/utils";

interface OpponentProgressProps {
  playerName: string;
  attemptsUsed: number;
  maxAttempts?: number;
  solved: boolean;
  failed: boolean;
  isOpponent?: boolean;
}

const MAX = 6;

export function OpponentProgress({
  playerName,
  attemptsUsed,
  maxAttempts = MAX,
  solved,
  failed,
  isOpponent = true,
}: OpponentProgressProps) {
  const pct = Math.min((attemptsUsed / maxAttempts) * 100, 100);

  const statusColor = solved
    ? "text-emerald-400"
    : failed
    ? "text-rose-400"
    : "text-amber-400";

  const barColor = solved
    ? "from-emerald-500 to-emerald-400"
    : failed
    ? "from-rose-500 to-rose-400"
    : "from-amber-500 to-primary";

  const statusLabel = solved ? "Solved! ✓" : failed ? "Failed ✗" : `${attemptsUsed}/${maxAttempts}`;

  return (
    <div
      className={cn(
        "glass rounded-xl border p-3 space-y-2",
        isOpponent ? "border-border/30" : "border-primary/30 bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-bold truncate max-w-[120px]",
            isOpponent ? "text-foreground" : "text-primary"
          )}
        >
          {isOpponent ? "🎯 " : "👤 "}
          {playerName}
        </span>
        <span className={cn("text-xs font-extrabold", statusColor)}>
          {statusLabel}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Attempt dots */}
      <div className="flex gap-1">
        {Array.from({ length: maxAttempts }, (_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-1.5 rounded-full transition-all",
              i < attemptsUsed
                ? solved && i === attemptsUsed - 1
                  ? "bg-emerald-500"
                  : failed
                  ? "bg-rose-500"
                  : "bg-amber-500"
                : "bg-muted/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Game Cell Component — Individual Board Cell
// ============================================================

"use client";

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import type { CellValue } from "@/lib/game/types";
import { cn } from "@/lib/utils";

interface CellProps {
  index: number;
  value: CellValue;
  isWinCell: boolean;
  isDisabled: boolean;
  boardSize: number;
  onCellClick: (index: number) => void;
}

// ─── X and O Marks ─────────────────────────────────────────

function XMark() {
  return (
    <svg viewBox="0 0 100 100" className="w-[55%] h-[55%]">
      <motion.line
        x1="20" y1="20" x2="80" y2="80"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />
      <motion.line
        x1="80" y1="20" x2="20" y2="80"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.25, ease: "easeOut", delay: 0.1 }}
      />
    </svg>
  );
}

function OMark() {
  return (
    <svg viewBox="0 0 100 100" className="w-[55%] h-[55%]">
      <motion.circle
        cx="50" cy="50" r="30"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
    </svg>
  );
}

// ─── Cell Component ─────────────────────────────────────────

export const Cell = memo(function Cell({
  index,
  value,
  isWinCell,
  isDisabled,
  boardSize,
  onCellClick,
}: CellProps) {
  const handleClick = useCallback(() => {
    if (!isDisabled && value === null) {
      onCellClick(index);
    }
  }, [index, value, isDisabled, onCellClick]);

  const cellSize = boardSize <= 3 ? "text-5xl sm:text-6xl" : boardSize === 4 ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl";

  return (
    <motion.button
      onClick={handleClick}
      disabled={isDisabled || value !== null}
      className={cn(
        "relative aspect-square rounded-2xl font-bold flex items-center justify-center",
        "transition-all duration-200 outline-none",
        "border border-border/50",
        cellSize,

        // Empty cell
        value === null && !isDisabled && [
          "cursor-pointer",
          "bg-card/60 hover:bg-card",
          "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
          "hover:scale-[1.03] active:scale-[0.97]",
        ],

        // Filled cell
        value !== null && "cursor-default bg-card/40",

        // Mark colors
        value === "X" && "text-game-x",
        value === "O" && "text-game-o",

        // Win cell
        isWinCell && [
          "animate-pulse-glow border-primary/50 bg-primary/10",
          "shadow-lg shadow-primary/20",
        ],

        // Disabled
        isDisabled && value === null && "cursor-not-allowed opacity-50",
      )}
      whileTap={value === null && !isDisabled ? { scale: 0.93 } : undefined}
      role="gridcell"
      aria-label={
        value ? `Cell ${index + 1}: ${value}` : `Cell ${index + 1}: empty`
      }
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-foreground/[0.03] to-transparent pointer-events-none" />

      {/* Mark */}
      {value && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 15,
          }}
          className="relative z-10"
        >
          {value === "X" ? <XMark /> : <OMark />}
        </motion.div>
      )}

      {/* Hover indicator for empty cells */}
      {value === null && !isDisabled && (
        <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
        </div>
      )}
    </motion.button>
  );
});

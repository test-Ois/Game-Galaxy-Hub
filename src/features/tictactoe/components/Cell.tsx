// ============================================================
// Game Cell Component — Individual Board Cell
// ============================================================

"use client";

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import type { CellValue } from "@/shared/types/game";
import { cn } from "@/shared/services/utils";

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
        "relative aspect-square rounded-xl sm:rounded-[1.5rem] font-bold flex items-center justify-center",
        "transition-all duration-300 outline-none",
        "border border-border/40 shadow-sm",
        cellSize,

        // Empty cell
        value === null && !isDisabled && [
          "cursor-pointer",
          "bg-card/40 hover:bg-card/90",
          "hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10",
          "hover:scale-[1.04]",
        ],

        // Filled cell
        value !== null && "cursor-default bg-card/65 dark:bg-card/30 shadow-inner",

        // Mark colors with premium neon glow shadows
        value === "X" && "text-game-x drop-shadow-[0_0_12px_rgba(244,63,94,0.45)]",
        value === "O" && "text-game-o drop-shadow-[0_0_12px_rgba(59,130,246,0.45)]",

        // Win cell with intense neon glow highlights
        isWinCell && [
          "border-primary bg-primary/20",
          "shadow-[0_0_25px_var(--game-glow)] z-10",
        ],

        // Disabled
        isDisabled && value === null && "cursor-not-allowed opacity-40",
      )}
      animate={isWinCell ? { scale: [1, 1.05, 1], rotate: [0, 0.5, -0.5, 0] } : {}}
      transition={isWinCell ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : {}}
      whileTap={value === null && !isDisabled ? { scale: 0.94 } : undefined}
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
          className="relative z-10 w-full h-full flex items-center justify-center"
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

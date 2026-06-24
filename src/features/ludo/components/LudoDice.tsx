// ============================================================
// LudoDice Component — Glassmorphic 3D Rolling Dice
// ============================================================

"use client";

import { motion } from "framer-motion";
import { cn } from "@/shared/services/utils";
import { COLOR_HEX } from "../constants/coordinates";
import type { LudoColor } from "@/shared/types/game";

interface LudoDiceProps {
  activeColor: LudoColor;
  diceRoll: number | null;
  tempDiceRoll: number | null;
  hasRolled: boolean;
  isRolling: boolean;
  isAnimating: boolean;
  isMyTurn: boolean;
  onRoll: () => void;
  isCompact?: boolean;
}

export function LudoDice({
  activeColor,
  diceRoll,
  tempDiceRoll,
  hasRolled,
  isRolling,
  isAnimating,
  isMyTurn,
  onRoll,
  isCompact = false,
}: LudoDiceProps) {
  const activeHex = COLOR_HEX[activeColor] || "#EF4444";
  const diceVal = tempDiceRoll !== null ? tempDiceRoll : diceRoll;

  const dotsMap: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const activeDots = diceVal !== null ? dotsMap[diceVal] || [] : [];
  const diceSizeClass = isCompact ? "h-9 w-9 border" : "h-15 w-15 rounded-2xl border-2";
  const gapClass = isCompact ? "gap-0.5 w-5 h-5 p-0" : "grid-cols-3 grid-rows-3 gap-1.5 w-8 h-8 p-0.5";

  return (
    <div style={{ perspective: "1000px" }} className="flex items-center justify-center shrink-0">
      <motion.div
        onClick={() => {
          if (!isMyTurn || hasRolled || isRolling || isAnimating) return;
          onRoll();
        }}
        animate={
          isRolling
            ? {
                rotateX: [0, 180, 360, 540, 720],
                rotateY: [0, 90, 270, 450, 720],
                rotateZ: [0, 180, 360, 540, 720],
                scale: [1, 1.25, 0.85, 1.15, 1],
                z: [0, 50, -30, 20, 0],
              }
            : isMyTurn && !hasRolled && !isAnimating
            ? {
                scale: [1, 1.06, 1],
                boxShadow: [
                  `0 0 8px ${activeHex}44`,
                  `0 0 20px ${activeHex}cc`,
                  `0 0 8px ${activeHex}44`,
                ],
              }
            : {}
        }
        transition={
          isRolling
            ? { duration: 0.7, ease: "easeInOut" }
            : isMyTurn && !hasRolled && !isAnimating
            ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" }
            : {}
        }
        style={{
          borderBottomWidth: isCompact ? "2px" : "4px",
          borderBottomColor: activeHex,
          filter: isRolling ? "blur(1.2px)" : "none",
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "rounded-xl bg-white border-slate-300 flex items-center justify-center shadow-lg select-none transition-all",
          isMyTurn && !hasRolled && !isRolling && !isAnimating
            ? "cursor-pointer border-primary animate-bounce animate-duration-1000"
            : "text-foreground cursor-default",
          diceSizeClass
        )}
      >
        {diceVal === null ? (
          <div className={cn("font-extrabold text-muted-foreground/60 select-none", isCompact ? "text-[10px]" : "text-xl")}>
            ?
          </div>
        ) : (
          <div className={cn("grid grid-cols-3 grid-rows-3", gapClass)}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-200 bg-slate-900",
                  activeDots.includes(i) ? "opacity-100 scale-100" : "opacity-0 scale-50"
                )}
                style={{
                  width: isCompact ? "4px" : "6px",
                  height: isCompact ? "4px" : "6px",
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

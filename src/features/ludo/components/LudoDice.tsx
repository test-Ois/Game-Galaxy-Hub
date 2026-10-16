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
  const diceSizeClass = isCompact ? "h-10 w-10 border" : "h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20 rounded-[1.2rem] border-2";
  const gapClass = isCompact ? "gap-0.5 w-6 h-6 p-0" : "grid-cols-3 grid-rows-3 gap-2 w-10 h-10 sm:w-12 sm:h-12 p-1";

  return (
    <div style={{ perspective: "1000px" }} className="relative z-10 flex items-center justify-center shrink-0 overflow-visible p-1">
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
          borderBottomWidth: isCompact ? "3px" : "6px",
          borderBottomColor: activeHex,
          filter: isRolling ? "blur(1.2px)" : "none",
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative z-10 rounded-[1.15rem] bg-gradient-to-br from-white via-slate-50 to-slate-200 border-white/90 flex items-center justify-center shadow-[inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-5px_7px_rgba(15,23,42,0.12),0_8px_18px_rgba(0,0,0,0.38)] select-none transition-all ring-1 ring-black/10",
          isMyTurn && !hasRolled && !isRolling && !isAnimating
            ? "cursor-pointer border-primary animate-bounce animate-duration-1000"
            : "text-foreground cursor-default",
          diceSizeClass
        )}
      >
        {diceVal === null ? (
          <div className={cn("font-black text-muted-foreground/60 select-none drop-shadow-sm", isCompact ? "text-[10px]" : "text-2xl")}>
            ?
          </div>
        ) : (
          <div className={cn("grid grid-cols-3 grid-rows-3", gapClass)}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-200 bg-gradient-to-br from-slate-900 to-slate-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_1px_1px_rgba(0,0,0,0.3)]",
                  activeDots.includes(i) ? "opacity-100 scale-100" : "opacity-0 scale-50"
                )}
                style={{
                  width: isCompact ? "4px" : "clamp(7px, 2.2vw, 11px)",
                  height: isCompact ? "4px" : "clamp(7px, 2.2vw, 11px)",
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

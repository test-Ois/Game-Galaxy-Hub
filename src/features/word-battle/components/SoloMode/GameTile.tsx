"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/services/utils";
import { LetterState } from "../../types/word-battle";

interface GameTileProps {
  char: string;
  state: LetterState;
  delay?: number;
  animate?: boolean;
  shake?: boolean;
  isCurrentRow?: boolean;
  position: number;
}

const STATE_CLASSES: Record<LetterState, string> = {
  empty: "bg-transparent border-border/40 text-foreground",
  tbd: "bg-transparent border-primary/60 text-foreground scale-105",
  correct:
    "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_16px_rgba(16,185,129,0.55)]",
  present:
    "bg-amber-500 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]",
  absent:
    "bg-muted/50 border-transparent text-muted-foreground opacity-60",
};

export function GameTile({
  char,
  state,
  delay = 0,
  animate = false,
  shake = false,
}: GameTileProps) {
  const shouldFlip = animate && (state === "correct" || state === "present" || state === "absent");

  return (
    <motion.div
      animate={
        shake
          ? { x: [0, -8, 8, -6, 6, -4, 4, 0] }
          : undefined
      }
      transition={shake ? { duration: 0.4 } : undefined}
      className="relative w-full aspect-square"
      style={{ perspective: "250px" }}
    >
      <motion.div
        initial={shouldFlip ? { rotateX: 0 } : false}
        animate={shouldFlip ? { rotateX: [0, -90, 0] } : undefined}
        transition={
          shouldFlip
            ? {
                duration: 0.5,
                delay,
                times: [0, 0.5, 1],
                ease: "easeInOut",
              }
            : undefined
        }
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-lg border-2 text-lg sm:text-xl font-black select-none transition-colors duration-150",
          STATE_CLASSES[state]
        )}
      >
        <AnimatePresence mode="popLayout">
          {char && (
            <motion.span
              key={char}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              {char}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

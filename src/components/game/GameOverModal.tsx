// ============================================================
// Game Over Modal — Win/Draw/Series Announcement
// ============================================================

"use client";

import { useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Trophy,
  Handshake,
  RotateCcw,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/stores/gameStore";
import { useSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";

export function GameOverModal() {
  const isGameOver = useGameStore((s) => s.isGameOver);
  const winResult = useGameStore((s) => s.winResult);
  const isSeriesComplete = useGameStore((s) => s.isSeriesComplete);
  const seriesWinner = useGameStore((s) => s.seriesWinner);
  const mode = useGameStore((s) => s.mode);
  const resetRound = useGameStore((s) => s.resetRound);
  const resetAll = useGameStore((s) => s.resetAll);

  const { playWin, playDraw } = useSound();
  const hasPlayed = useRef(false);

  const isDraw = isGameOver && !winResult;
  const winner = winResult?.winner;

  // Fire confetti and sound on game over
  useEffect(() => {
    if (!isGameOver || hasPlayed.current) return;
    hasPlayed.current = true;

    if (winner) {
      playWin();
      // Confetti burst
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    } else {
      playDraw();
    }
  }, [isGameOver, winner, playWin, playDraw]);

  // Reset the ref when game resets
  useEffect(() => {
    if (!isGameOver) {
      hasPlayed.current = false;
    }
  }, [isGameOver]);

  const handleNewGame = useCallback(() => {
    if (isSeriesComplete) {
      resetAll();
    } else {
      resetRound();
    }
  }, [isSeriesComplete, resetAll, resetRound]);

  const getWinnerLabel = () => {
    if (!winner) return "";
    if (mode === "pvai") {
      return winner === "O" ? "You Win!" : "AI Wins!";
    }
    return `Player ${winner} Wins!`;
  };

  return (
    <AnimatePresence>
      {isGameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
            onClick={handleNewGame}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative glass-strong rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className={cn(
                "mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-5",
                isDraw
                  ? "bg-muted"
                  : isSeriesComplete
                    ? "bg-gradient-to-br from-amber-400 to-orange-500"
                    : "bg-gradient-to-br from-primary to-primary/60"
              )}
            >
              {isDraw ? (
                <Handshake className="h-10 w-10 text-muted-foreground" />
              ) : isSeriesComplete ? (
                <Crown className="h-10 w-10 text-white" />
              ) : (
                <Trophy className="h-10 w-10 text-primary-foreground" />
              )}
            </motion.div>

            {/* Title */}
            {isSeriesComplete ? (
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent animate-gradient"
              >
                Series Champion!
              </motion.h2>
            ) : null}

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={cn(
                "font-bold mb-6",
                isSeriesComplete ? "text-lg text-muted-foreground" : "text-2xl",
                isDraw && "text-muted-foreground",
                winner === "O" && !isSeriesComplete && "text-game-o",
                winner === "X" && !isSeriesComplete && "text-game-x",
              )}
            >
              {isDraw
                ? "It's a Draw!"
                : isSeriesComplete
                  ? `${mode === "pvai" ? (seriesWinner === "O" ? "You" : "AI") : `Player ${seriesWinner}`} won the series!`
                  : getWinnerLabel()}
            </motion.p>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex gap-3"
            >
              <Button
                onClick={handleNewGame}
                className="flex-1 h-12 rounded-xl gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
              >
                <RotateCcw className="h-4 w-4" />
                {isSeriesComplete ? "New Series" : "Next Round"}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

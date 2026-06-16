// ============================================================
// Play Page — Main Game Experience
// ============================================================

"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Board } from "@/components/game/Board";
import { GameControls } from "@/components/game/GameControls";
import { Scoreboard } from "@/components/game/Scoreboard";
import { GameOverModal } from "@/components/game/GameOverModal";
import { useGameStore } from "@/stores/gameStore";
import { useSound } from "@/hooks/useSound";

export default function PlayPage() {
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const mode = useGameStore((s) => s.mode);
  const board = useGameStore((s) => s.board);
  const triggerAIMove = useGameStore((s) => s.triggerAIMove);
  const { playMove, playAIMove } = useSound();

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    if (mode === "pvai" && currentPlayer === "X" && !isGameOver) {
      triggerAIMove();
    }
  }, [currentPlayer, mode, isGameOver, triggerAIMove]);

  // Play sound on move (track board changes)
  useEffect(() => {
    const moveCount = board.filter((c) => c !== null).length;
    if (moveCount === 0) return;

    // Determine who just moved
    const lastPlayer = moveCount % 2 === 1 ? "O" : "X";
    if (mode === "pvai" && lastPlayer === "X") {
      playAIMove();
    } else {
      playMove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  return (
    <>
      <div className="min-h-[calc(100vh-6rem)] sm:min-h-[calc(100vh-8rem)] flex items-center justify-center px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[95vw] sm:max-w-lg space-y-3 sm:space-y-4 md:space-y-6"
        >
          {/* Page Title */}
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "pvai" ? "Player vs AI" : "Player vs Player"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "pvai"
                ? "Challenge the AI and prove your strategy"
                : "Play with a friend on the same device"}
            </p>
          </div>

          {/* Scoreboard */}
          <Scoreboard />

          {/* Game Board */}
          <div className="flex justify-center my-2 sm:my-4">
            <Board />
          </div>

          {/* Controls */}
          <GameControls />
        </motion.div>
      </div>

      {/* Game Over Modal */}
      <GameOverModal />
    </>
  );
}

// ============================================================
// Game Board Component — Grid + Win Line Overlay
// ============================================================

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Cell } from "@/components/game/Cell";
import { useGameStore } from "@/stores/gameStore";
import { getWinLineCoords } from "@/lib/game/engine";

export function Board() {
  const board = useGameStore((s) => s.board);
  const boardSize = useGameStore((s) => s.boardSize);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const winResult = useGameStore((s) => s.winResult);
  const isAIThinking = useGameStore((s) => s.isAIThinking);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const mode = useGameStore((s) => s.mode);
  const makeMove = useGameStore((s) => s.makeMove);

  const winCells = useMemo(
    () => new Set(winResult?.pattern || []),
    [winResult]
  );

  const winLineCoords = useMemo(
    () =>
      winResult ? getWinLineCoords(winResult.pattern, boardSize) : null,
    [winResult, boardSize]
  );

  // Disable cells when AI is thinking or game is over
  const isDisabled =
    isGameOver ||
    (mode === "pvai" && currentPlayer === "X") ||
    isAIThinking;

  const gridCols =
    boardSize === 3
      ? "grid-cols-3"
      : boardSize === 4
        ? "grid-cols-4"
        : "grid-cols-5";

  const boardWidth =
    boardSize === 3
      ? "w-[min(85vw,420px)]"
      : boardSize === 4
        ? "w-[min(90vw,480px)]"
        : "w-[min(92vw,520px)]";

  return (
    <div className={`relative ${boardWidth} mx-auto`}>
      {/* Board grid */}
      <motion.div
        className={`grid ${gridCols} gap-2 sm:gap-3`}
        role="grid"
        aria-label="Tic Tac Toe game board"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {board.map((value, index) => (
          <Cell
            key={`${boardSize}-${index}`}
            index={index}
            value={value}
            isWinCell={winCells.has(index)}
            isDisabled={isDisabled}
            boardSize={boardSize}
            onCellClick={makeMove}
          />
        ))}
      </motion.div>

      {/* Win line SVG overlay */}
      {winLineCoords && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-20 win-line-svg"
          viewBox="0 0 300 300"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            x1={winLineCoords.x1}
            y1={winLineCoords.y1}
            x2={winLineCoords.x2}
            y2={winLineCoords.y2}
            className="stroke-primary"
            strokeWidth="6"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 8px var(--primary))" }}
          />
        </svg>
      )}

      {/* AI thinking overlay */}
      {isAIThinking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-30 rounded-2xl flex items-center justify-center bg-background/30 backdrop-blur-[2px]"
        >
          <div className="flex items-center gap-2 glass rounded-full px-5 py-2.5">
            <div className="flex gap-1">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
              />
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              AI thinking
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { GameBoard } from "./GameBoard";
import { Keyboard } from "../Shared/Keyboard";
import { ResultScreen } from "../Shared/ResultScreen";
import { useWordBattle } from "../../hooks/useWordBattle";
import { isValidWord } from "../../lib/words/dictionary";
import { useRouter } from "next/navigation";

const REVEAL_DELAY_PER_TILE = 100; // ms

export function SoloGame() {
  const router = useRouter();
  const {
    status,
    secretWord,
    guesses,
    currentGuess,
    keyboardStatuses,
    onChar,
    onDelete,
    onEnter,
    startSoloGame,
  } = useWordBattle();

  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [revealedRows, setRevealedRows] = useState<Set<number>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Track which rows have been revealed (for tile flip animation control)
  useEffect(() => {
    if (guesses.length > 0) {
      const lastRow = guesses.length - 1;
      if (!revealedRows.has(lastRow)) {
        setIsAnimating(true);
        const wordLen = secretWord.length;
        const totalDelay = wordLen * REVEAL_DELAY_PER_TILE + 500;

        setTimeout(() => {
          setRevealedRows((prev) => new Set([...prev, lastRow]));
          setIsAnimating(false);
        }, totalDelay);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guesses.length]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1800);
  }, []);

  const triggerShake = useCallback((row: number) => {
    setShakeRow(row);
    setTimeout(() => setShakeRow(null), 500);
  }, []);

  const handleEnter = useCallback(() => {
    if (isAnimating) return;
    if (status !== "playing") return;

    if (currentGuess.length < secretWord.length) {
      showToast(`Word must be ${secretWord.length} letters`);
      triggerShake(guesses.length);
      return;
    }

    if (!isValidWord(currentGuess)) {
      showToast("Not in word list");
      triggerShake(guesses.length);
      return;
    }

    onEnter();
  }, [isAnimating, status, currentGuess, secretWord.length, guesses.length, showToast, triggerShake, onEnter]);

  const handleChar = useCallback(
    (char: string) => {
      if (isAnimating || status !== "playing") return;
      onChar(char);
    },
    [isAnimating, status, onChar]
  );

  const handleDelete = useCallback(() => {
    if (isAnimating || status !== "playing") return;
    onDelete();
  }, [isAnimating, status, onDelete]);

  const handlePlayAgain = useCallback(() => {
    setRevealedRows(new Set());
    setShakeRow(null);
    setToastMsg(null);
    setIsAnimating(false);
    startSoloGame();
  }, [startSoloGame]);

  const handleHome = useCallback(() => {
    router.push("/play/wordbattle");
  }, [router]);

  return (
    <div className="relative flex flex-col items-center gap-4 sm:gap-5 w-full">
      {/* Toast notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground/95 text-background text-sm font-bold shadow-2xl"
          >
            <AlertTriangle className="h-4 w-4" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Board */}
      <div className="w-full" style={{ maxWidth: `${Math.min(secretWord.length * 52 + (secretWord.length - 1) * 8, 380)}px` }}>
        <GameBoard
          secretWord={secretWord}
          guesses={guesses}
          currentGuess={currentGuess}
          shakeRow={shakeRow}
          revealedRows={revealedRows}
        />
      </div>

      {/* Keyboard */}
      <div className="w-full max-w-lg">
        <Keyboard
          onChar={handleChar}
          onDelete={handleDelete}
          onEnter={handleEnter}
          statuses={keyboardStatuses}
        />
      </div>

      {/* Result Screen overlay */}
      {(status === "victory" || status === "defeat") && (
        <ResultScreen
          status={status}
          secretWord={secretWord}
          attempts={guesses.length}
          maxAttempts={6}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
          message={
            status === "victory"
              ? "Excellent work!"
              : `Better luck next time!`
          }
        />
      )}
    </div>
  );
}

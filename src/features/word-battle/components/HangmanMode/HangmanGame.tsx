"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { HangmanDrawing } from "./HangmanDrawing";
import { HangmanLetterBoard } from "./HangmanLetterBoard";
import { ResultScreen } from "../Shared/ResultScreen";
import { ConfettiEffect } from "../Shared/ConfettiEffect";
import { useHangman } from "../../hooks/useHangman";
import { cn } from "@/shared/services/utils";

export function HangmanGame() {
  const router = useRouter();
  const {
    status,
    secretWord,
    category,
    lives,
    maxLives,
    livesLost,
    guessedLetters,
    revealedWord,
    guessLetter,
    startGame,
  } = useHangman();

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (status !== "playing") return;
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key) && !guessedLetters.includes(key)) {
        guessLetter(key);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [status, guessedLetters, guessLetter]);

  const handlePlayAgain = useCallback(() => {
    startGame();
  }, [startGame]);

  const handleHome = useCallback(() => {
    router.push("/play/wordbattle");
  }, [router]);

  return (
    <div className="relative w-full flex flex-col items-center gap-4 sm:gap-5">
      <ConfettiEffect trigger={status === "victory"} />

      {/* Category badge */}
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-border/30">
        <Tag className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-bold uppercase tracking-widest text-primary">
          {category || "Word"}
        </span>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
        {/* Hangman Drawing */}
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "w-full max-w-[200px] sm:max-w-[220px] rounded-2xl p-4 glass border transition-all",
              livesLost >= 5
                ? "border-rose-500/50 bg-rose-500/5"
                : livesLost >= 3
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-border/30"
            )}
          >
            <HangmanDrawing livesLost={livesLost} />
          </div>

          {/* Lives */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {Array.from({ length: maxLives }, (_, i) => (
              <motion.div
                key={i}
                animate={
                  i === maxLives - livesLost
                    ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }
                    : {}
                }
                transition={{ duration: 0.4 }}
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-all",
                    i < lives
                      ? "text-rose-500 fill-rose-500"
                      : "text-muted-foreground/20 fill-muted-foreground/10"
                  )}
                />
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {lives} / {maxLives} lives remaining
          </p>
        </div>

        {/* Word Display */}
        <div className="flex flex-col items-center gap-5">
          {/* Word slots */}
          <div className="flex flex-wrap justify-center gap-2">
            {secretWord.split("").map((char, i) => {
              const isRevealed = guessedLetters.includes(char);
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <AnimatePresence>
                    {isRevealed ? (
                      <motion.span
                        key="letter"
                        initial={{ opacity: 0, y: -12, scale: 0.6 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="text-2xl sm:text-3xl font-black text-foreground"
                      >
                        {char}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="blank"
                        className="text-2xl sm:text-3xl font-black text-transparent"
                      >
                        {char}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <div
                    className={cn(
                      "h-0.5 w-7 sm:w-8 rounded-full transition-colors",
                      isRevealed ? "bg-primary" : "bg-border"
                    )}
                  />
                </div>
              );
            })}
          </div>

          {/* Wrong letters display */}
          {guessedLetters.filter((l) => !secretWord.includes(l)).length > 0 && (
            <div className="text-center space-y-1">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Wrong guesses
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {guessedLetters
                  .filter((l) => !secretWord.includes(l))
                  .map((l) => (
                    <span
                      key={l}
                      className="text-sm font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-md px-1.5 py-0.5"
                    >
                      {l}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Letter Board */}
          <HangmanLetterBoard
            guessedLetters={guessedLetters}
            secretWord={secretWord}
            onGuess={guessLetter}
            disabled={status !== "playing"}
          />
        </div>
      </div>

      {/* Result Screen */}
      {(status === "victory" || status === "defeat") && (
        <ResultScreen
          status={status}
          secretWord={secretWord}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
          message={
            status === "victory"
              ? `You got it in ${maxLives - lives + 1} wrong guesses!`
              : "The word slipped away!"
          }
        />
      )}
    </div>
  );
}

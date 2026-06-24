"use client";

import { motion } from "framer-motion";
import { cn } from "@/shared/services/utils";

interface HangmanLetterBoardProps {
  guessedLetters: string[];
  secretWord: string;
  onGuess: (letter: string) => void;
  disabled?: boolean;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function HangmanLetterBoard({
  guessedLetters,
  secretWord,
  onGuess,
  disabled = false,
}: HangmanLetterBoardProps) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 max-w-xs sm:max-w-sm mx-auto">
      {ALPHABET.map((letter, i) => {
        const wasGuessed = guessedLetters.includes(letter);
        const isCorrect = wasGuessed && secretWord.includes(letter);
        const isWrong = wasGuessed && !secretWord.includes(letter);

        return (
          <motion.button
            key={letter}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.015, type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => onGuess(letter)}
            disabled={wasGuessed || disabled}
            className={cn(
              "w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-extrabold text-sm transition-all duration-150 border select-none",
              isCorrect
                ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)] cursor-default"
                : isWrong
                ? "bg-muted/30 border-transparent text-muted-foreground/40 opacity-40 cursor-default"
                : "bg-card/60 border-border/50 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-110 hover:shadow-md active:scale-95"
            )}
            aria-label={`Guess letter ${letter}`}
            aria-pressed={wasGuessed}
          >
            {letter}
          </motion.button>
        );
      })}
    </div>
  );
}
